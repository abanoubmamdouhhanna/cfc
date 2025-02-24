import { nanoid } from "nanoid";
import cartModel from "../../../../DB/models/Cart.model.js";
import couponModel from "../../../../DB/models/Coupon.model.js";
import orderModel from "../../../../DB/models/Order.model.js";
import mealModel from "../../../../DB/models/meal.model.js";
import { asyncHandler } from "../../../utils/errorHandling.js";
import {
  clearAllCartItems,
  clearSelectedItems,
} from "../../cart/controller/cart.controller.js";
import { fileURLToPath } from "url";
import path from "path";
import cloudinary from "../../../utils/cloudinary.js";
import { unlink } from "fs";
import sendEmail from "../../../utils/Emails/sendEmail.js";
import payment from "../../../utils/payment.js";
import Stripe from "stripe";
import locationModel from "../../../../DB/models/CFClocation.model.js";
import { createInvoice } from "../../../utils/invoice.js";

// Create Order
export const createOrder = asyncHandler(async (req, res, next) => {
  const { address, phone, couponName, paymentType } = req.body;
  const { locationId } = req.params;

  // Validate coupon
  let coupon = null;
  if (couponName) {
    coupon = await couponModel.findOne({
      name: couponName.toUpperCase(),
      usedBy: { $nin: req.user._id },
      isDeleted: false,
    });

    if (!coupon || Date.now() > coupon.expire.getTime()) {
      return next(new Error("Invalid or expired coupon", { cause: 400 }));
    }
  }

  // Get cart meals if no meals provided in request
  let meals = req.body.meals || [];
  if (!meals.length) {
    const cart = await cartModel.findOne({ createdBy: req.user._id });
    if (!cart || !cart.meals.length) {
      return next(new Error("Empty cart", { cause: 400 }));
    }
    meals = cart.meals;
    req.body.isCart = true;
  }

  // Process meals and calculate total price
  let sumTotal = 0;
  const finalMealList = [];
  const mealIds = [];

  for (let meal of meals) {
    const checkMeal = await mealModel.findOne({ _id: meal.mealId, isDeleted: false });
    if (!checkMeal) {
      return next(new Error(`Invalid meal in order`, { cause: 400 }));
    }

    mealIds.push(meal.mealId);
    meal = req.body.isCart ? meal.toObject() : meal;
    meal.name = checkMeal.name;
    meal.unitPrice = checkMeal.finalPrice;
    meal.description = checkMeal.description;
    meal.finalPrice = meal.unitPrice * meal.quantity;

    finalMealList.push(meal);
    sumTotal += meal.finalPrice;
  }

  // Apply coupon discount
  const discount = coupon ? (sumTotal * coupon.amount) / 100 : 0;
  const finalPrice = parseFloat((sumTotal - discount).toFixed(2));

  // Create Order
  const customId = nanoid();
  const order = await orderModel.create({
    userId: req.user._id,
    address,
    phone,
    meals: finalMealList,
    couponId: coupon?._id,
    finalPrice,
    paymentType,
    customId,
  });

  if (!order) {
    return next(new Error("Failed to place order", { cause: 500 }));
  }

  // Mark coupon as used
  if (coupon) {
    await couponModel.updateOne({ _id: coupon._id }, { $addToSet: { usedBy: req.user._id } });
  }

  // Clear cart
  req.body.isCart ? await clearAllCartItems(req.user._id) : await clearSelectedItems(mealIds, req.user._id);

  // Get location details
  const location = await locationModel.findById(locationId);

  // Generate invoice
  const invoiceData = {
    shipping: {
      name: `${req.user.firstName} ${req.user.lastName}`,
      address: order.address,
      city: location.title,
      state: location.title,
      country: "USA",
      postal_code: 94111,
    },
    items: order.meals,
    subtotal: sumTotal,
    discount: coupon ? `${coupon.amount}%` : "0%",
    invoice_nr: order._id,
    finalPrice: order.finalPrice,
    date: order.createdAt,
  };

  if (process.env.MOOD === "DEV") {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const pdfPath = path.join(__dirname, `../../../../src/invoices/invoice${invoiceData.invoice_nr}.pdf`);

    createInvoice(invoiceData, pdfPath);

    // Upload invoice to Cloudinary
    const uploadedInvoice = await cloudinary.uploader.upload(pdfPath, {
      folder: `${process.env.APP_NAME}/order/invoice/${customId}`,
      public_id: `${customId}Invoice`,
      resource_type: "raw",
    });

    if (uploadedInvoice) {
      order.invoice = uploadedInvoice.secure_url;
      order.invoicePublicId = `${process.env.APP_NAME}/order/invoice/${customId}/${customId}Invoice`;
      await order.save();

      unlink(pdfPath, (err) => {
        if (err) console.log("Error deleting file:", err);
      });
    }

    // Send invoice via email
    await sendEmail({
      to: req.user.email,
      subject: "Order Invoice",
      attachments: [{ path: uploadedInvoice.secure_url, contentType: "application/pdf" }],
    });
  } else {
    const pdfPath = `/tmp/invoice${invoiceData.invoice_nr}.pdf`;
    createInvoice(invoiceData, pdfPath);
  }

  // Handle payment
  if (paymentType === "Card" && order.status === "Pending") {
    const stripe = new Stripe(process.env.STRIPE_KEY);
    let stripeCouponId = null;

    if (coupon) {
      const stripeCoupon = await stripe.coupons.create({
        percent_off: coupon.amount,
        duration: "once",
      });
      stripeCouponId = stripeCoupon.id;
    }

    const session = await payment({
      stripe,
      payment_method_types: ["card"],
      mode: "payment",
      cancel_ur: `${req.protocol}://${
        req.headers.host
      }/order/payment/cancel?orderId=${order._id.toString()}`,
      customer_email: req.user.email,
      metadata: {
        orderId: order._id.toString(),
      },
      line_items: order.meals.map((meal) => {
        return {
          price_data: {
            currency: "USD",
            meal_data: { name: meal.name },
            unit_amount: meal.unitPrice * 100,
          },
          quantity: meal.quantity,
        };
      }),
      discounts:req.body.couponId? [{ coupon:  req.body.couponId }]:[],
    });
    order.status = "Processing";
    await order.save();


    return res.status(201).json({
      status: "success",
      message: "Order will be prepared successfully",
      paymentUrl: session.url,
      orderId: order._id,
    });
  } else if (order.status === "Completed") {
    return next(new Error("This order has already been picked up", { cause: 400 }));
  } else {
    order.status = "Prepared";
    await order.save();

    return res.status(201).json({
      status: "success",
      message: "Order placed successfully",
      order,
    });
  }
});

//====================================================================================================================//
//cancel order
export const CancelOrder = asyncHandler(async (req, res, next) => {
  const { orderId } = req.params;
  const { reason } = req.body;

  // Find the order by ID and user
  const order = await orderModel.findOne({ _id: orderId, userId: req.user._id });
  if (!order) {
    return next(new Error("Invalid order ID or you don't have permission to cancel this order.", { cause: 404 }));
  }

  // Ensure the order is still cancellable
  if (order.status !== "Pending") {
    return next(new Error("Order cannot be canceled at this stage.", { cause: 400 }));
  }

  // Delete invoice from Cloudinary if exists
  if (order.invoicePublicId) {
    try {
      await cloudinary.uploader.destroy(order.invoicePublicId, { resource_type: "raw" });
    } catch (error) {
      console.error("Error deleting invoice:", error);
    }
  }

  // Cancel the order and remove invoice reference
  const cancelOrder = await orderModel.updateOne(
    { _id: orderId, userId: req.user._id },
    { status: "Cancelled", reason, $unset: { invoice: 1 } }
  );

  if (!cancelOrder.matchedCount) {
    return next(new Error("Failed to cancel your order. Please try again.", { cause: 400 }));
  }

  // Remove user from the "usedBy" list of the coupon, if applicable
  if (order.couponId) {
    await couponModel.updateOne({ _id: order.couponId }, { $pull: { usedBy: req.user._id } });
  }

  return res.status(200).json({ status: "success", message: "Order canceled successfully." });
});


//====================================================================================================================//
//orderd delivered
export const deliveredOrder = asyncHandler(async (req, res, next) => {
  const { orderId } = req.params;

  // Find and update the order in one step
  const order = await orderModel.findOne({ _id: orderId });

  if (!order) {
    return next(new Error(`Invalid order ID: ${orderId}`, { cause: 404 }));
  }

  // Check if the order is already in a final state
  if (["Completed", "Cancelled", "Rejected"].includes(order.status)) {
    return next(new Error(`Order with ID ${orderId} cannot be delivered as it is already ${order.status}.`, { cause: 400 }));
  }

  // Mark the order as delivered
  const updatedOrder = await orderModel.findOneAndUpdate(
    { _id: orderId },
    { status: "Completed", updatedBy: req.user._id },
    { new: true } // Return the updated document
  );

  return res.status(200).json({
    status: "success",
    message: `Order ${orderId} has been marked as delivered successfully.`,
    result: updatedOrder,
  });
});
