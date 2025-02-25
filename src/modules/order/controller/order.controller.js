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
import Stripe from "stripe";
import locationModel from "../../../../DB/models/CFClocation.model.js";
import { createInvoice } from "../../../utils/invoice.js";
import { capitalizeWords } from "../../../utils/capitalize.js";
import { payWithEwallet, rewardCustomer } from "../../../utils/wallet rewards.js";

// Create Order
export const createOrder = asyncHandler(async (req, res, next) => {
  const { address,city,state, phone, couponName, paymentType, meals: reqMeals } = req.body;
  const { locationId } = req.params;

  // Validate location
  const location = await locationModel.findById(locationId);
  if (!location) {
    return next(new Error("Invalid location ID", { cause: 400 }));
  }

  // Validate coupon
  let coupon = null;
  if (couponName) {
    coupon = await couponModel.findOne({
      name: couponName.toUpperCase(),
      usedBy: { $nin: [req.user._id] },
      isDeleted: false,
    });

    if (!coupon || Date.now() > coupon.expire.getTime()) {
      return next(new Error("Invalid or expired coupon", { cause: 400 }));
    }
  }

  // Get cart meals if no meals are provided
  let meals = reqMeals || [];
  if (!meals.length) {
    const cart = await cartModel.findOne({ createdBy: req.user._id });
    if (!cart || !cart.meals.length) {
      return next(new Error("Empty cart", { cause: 400 }));
    }
    meals = cart.meals;
    req.body.isCart = true;
  }

  // Process meals & calculate total price
  let sumTotal = 0;
  const finalMealList = [];
  const mealIds = [];

  for (const meal of meals) {
    const checkMeal = await mealModel.findById(meal.mealId);
    if (!checkMeal || checkMeal.isDeleted) {
      return next(new Error(`Invalid meal in order`, { cause: 400 }));
    }

    mealIds.push(meal.mealId);
    const processedMeal = {
      mealId: meal.mealId,
      title: checkMeal.title,
      unitPrice: checkMeal.finalPrice,
      description: checkMeal.description,
      quantity: meal.quantity,
      finalPrice: checkMeal.finalPrice * meal.quantity,
    };
console.log({A:processedMeal.title});

    finalMealList.push(processedMeal);
    sumTotal += processedMeal.finalPrice;
  }

  // Apply coupon discount
  const discount = coupon ? (sumTotal * coupon.amount) / 100 : 0;
  const finalPrice = parseFloat((sumTotal - discount).toFixed(2));

  // Apply tax
  const tax = parseFloat((finalPrice * (location.taxRate / 100)).toFixed(2));
  const totalPrice = parseFloat((finalPrice + tax).toFixed(2));

  // Create Order
  const customId = nanoid();
  const order = await orderModel.create({
    locationId,
    userId: req.user._id,
    address,
    city,
    state,
    phone,
    meals: finalMealList,
    couponId: coupon?._id,
    finalPrice,
    tax,
    totalPrice,
    paymentType,
    customId,
    status: "Pending", // Ensure default status is set
  });

  if (!order) {
    return next(new Error("Failed to place order", { cause: 500 }));
  }

  // Mark coupon as used
  if (coupon) {
    await couponModel.updateOne({ _id: coupon._id }, { $addToSet: { usedBy: req.user._id } });
  }

  // Clear cart
  req.body.isCart
    ? await clearAllCartItems(req.user._id)
    : await clearSelectedItems(mealIds, req.user._id);

// Generate invoice
const invoiceData = {
  shipping: {
    name:capitalizeWords(`${req.user.firstName} ${req.user.lastName}`),
    address: order.address,
    city: order.city,
    state: order.state,
    phone: order.phone,
    country: "USA",
    postal_code: 94111,
  },
  items: order.meals,
  subtotal: sumTotal,
  discount: coupon ? `${coupon.amount}%` : "0%",
  invoice_nr: order._id,
  finalPrice: order.finalPrice,
  taxRate: location.taxRate,
  locationUrl:location.locationURL,
  locationTitle:location.title,
  tax: order.tax,
  totalPrice: order.totalPrice,
  date: order.createdAt,
};

// Define invoice path
let pdfPath;

if (process.env.MOOD === "DEV") {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  pdfPath = path.join(__dirname, `../../../../src/invoices/invoice_${invoiceData.invoice_nr}.pdf`);
} else {
  pdfPath = `/tmp/invoice_${invoiceData.invoice_nr}.pdf`; // Use a temporary directory in production
}

// Create Invoice PDF
await createInvoice(invoiceData, pdfPath);

// Upload invoice to Cloudinary
try {
  const uploadedInvoice = await cloudinary.uploader.upload(pdfPath, {
    folder: `${process.env.APP_NAME}/Order/${customId}/invoice`,
    public_id: `${customId}Invoice`,
    resource_type: "raw",
  });

  if (uploadedInvoice?.secure_url) {
    order.invoice = uploadedInvoice.secure_url;
    order.invoicePublicId = `${process.env.APP_NAME}/Order/${customId}/invoice/${customId}Invoice`;
    await order.save();

    // Delete local invoice file
    unlink(pdfPath, (err) => {
      if (err) console.error("Error deleting invoice file:", err);
    });

    // Send invoice via email
    await sendEmail({
      to: req.user.email,
      subject: "Order Invoice",
      attachments: [{ path: uploadedInvoice.secure_url, contentType: "application/pdf" }],
    });

  } else {
    console.error("Invoice upload failed: No secure_url returned.");
  }

} catch (error) {
  console.error("Cloudinary Upload Error:", error);
}


  // Handle payment
  if (paymentType === "Card" && order.status === "Pending") {
    const stripe = new Stripe(process.env.STRIPE_KEY);
    let stripeCouponId = null;

    // Create a Stripe coupon if a discount is applied
    if (coupon) {
      const stripeCoupon = await stripe.coupons.create({
        percent_off: coupon.amount,
        duration: "once",
      });
      stripeCouponId = stripeCoupon.id;
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      cancel_url: `${req.protocol}://${req.headers.host}/order/payment/cancel?orderId=${order._id.toString()}`,
      success_url: `${req.protocol}://${req.headers.host}/order/payment/success?orderId=${order._id.toString()}`,
      customer_email: req.user.email,
      metadata: {
        orderId: order._id.toString(),
      },
      line_items: order.meals.map((meal) => ({
        price_data: {
          currency: "USD",
          product_data: { name: meal.title }, // Fixed name reference
          unit_amount: meal.unitPrice * 100, // Convert to cents
        },
        quantity: meal.quantity,
      })),
      discounts: stripeCouponId ? [{ coupon: stripeCouponId }] : [],
    });

    order.status = "Processing";
    await order.save();

    await rewardCustomer(req.user._id, order._id, order.totalPrice);

    return res.status(201).json({
      status: "success",
      message: "Order will be prepared successfully. paid with your card",
      paymentUrl: session.url,
      orderId: order._id,
      order: order,

    });
  }

  if (paymentType === "Wallet" && order.status === "Pending") {
    await payWithEwallet(req.user._id, order.totalPrice);
    order.status = "Processing";
    await order.save();

   return res.status(201).json({
      status: "success",
      message: "Order will be prepared successfully. paid with your CFC wallet",
      order,
    });
  }

  // Check if the order has already been completed
  if (order.status === "Completed") {
    return next(new Error("This order has already been picked up", { cause: 400 }));
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
//====================================================================================================================//
//get order with status Processing
export const getOrder =asyncHandler(async(req,res,next)=>
{
  const orders= await orderModel.find({status:"Processing"})
  return res.status(200).json({
    status: "success",
    message: `Orders with status Processing.`,
    count:orders.length,
    result: orders,
  });
})
//====================================================================================================================//
//get all order
export const getAllOrders =asyncHandler(async(req,res,next)=>
  {
    const orders= await orderModel.find({})
    return res.status(200).json({
      status: "success",
      message: `All Orders `,
      count:orders.length,
      result: orders,
    });
  })
  