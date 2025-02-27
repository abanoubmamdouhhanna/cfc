import { asyncHandler } from "../../../utils/errorHandling.js";
import { nanoid } from "nanoid";
import cartModel from "../../../../DB/models/Cart.model.js";
import couponModel from "../../../../DB/models/Coupon.model.js";
import orderModel from "../../../../DB/models/Order.model.js";
import mealModel from "../../../../DB/models/meal.model.js";
import Stripe from "stripe";
import locationModel from "../../../../DB/models/CFClocation.model.js";
import paypalClient from "../../../utils/paypalService.js";
import paypal from "@paypal/checkout-server-sdk";
import {
  clearAllCartItems,
  clearSelectedItems,
} from "../../cart/controller/cart.controller.js";
import {
  payWithEwallet,
  rewardCustomer,
} from "../../../utils/wallet rewards.js";
import { processInvoice } from "../../../utils/invoiceService.js";
import { ApiFeatures } from "../../../utils/apiFeatures.js";

// Create Order

export const createOrder = asyncHandler(async (req, res, next) => {
  const {
    address,
    city,
    state,
    phone,
    couponName,
    paymentType,
    meals: reqMeals,
  } = req.body;
  const { locationId } = req.params;

  // Validate Location
  const location = await locationModel.findById(locationId).lean();
  if (!location) return next(new Error("Invalid location ID", { cause: 400 }));

  const existingOrder = await orderModel
    .findOne({
      userId: req.user._id,
      status: "Pending",
      paymentType: { $in: ["Card", "Paypal"] }, // Check for both payment types
    })
    .lean();

  if (existingOrder) {
    return res.status(400).json({
      status: "error",
      message: "You already have a pending payment. Please complete it first.",
      paymentUrl:
        existingOrder.paymentType === "Card"
          ? `https://checkout.stripe.com/pay/${existingOrder.stripeSessionId}`
          : existingOrder.paypalCheckoutUrl, // Use PayPal URL if payment type is PayPal
      orderId: existingOrder._id,
    });
  }

  // Validate Coupon
  let coupon = null;
  if (couponName) {
    coupon = await couponModel
      .findOne({
        name: couponName.toUpperCase(),
        usedBy: { $nin: [req.user._id] },
        isDeleted: false,
      })
      .lean();

    if (!coupon || Date.now() > coupon.expire.getTime()) {
      return next(new Error("Invalid or expired coupon", { cause: 400 }));
    }
  }

  // Get cart meals if no meals are provided
  let meals = reqMeals || [];
  if (!meals.length) {
    const cart = await cartModel.findOne({ createdBy: req.user._id }).lean();
    if (!cart || !cart.meals.length)
      return next(new Error("Empty cart", { cause: 400 }));
    meals = cart.meals;
    req.body.isCart = true;
  }

  // Process Meals & Calculate Total Price
  let sumTotal = 0;
  const finalMealList = [];
  const mealIds = [];

  for (const meal of meals) {
    const checkMeal = await mealModel.findById(meal.mealId).lean();
    if (!checkMeal || checkMeal.isDeleted)
      return next(new Error(`Invalid meal in order`, { cause: 400 }));

    mealIds.push(meal.mealId);
    const processedMeal = {
      mealId: meal.mealId,
      title: checkMeal.title,
      unitPrice: checkMeal.finalPrice,
      description: checkMeal.description,
      quantity: meal.quantity,
      finalPrice: checkMeal.finalPrice * meal.quantity,
    };

    finalMealList.push(processedMeal);
    sumTotal += processedMeal.finalPrice;
  }

  // Apply Discount & Tax
  const discount = coupon ? (sumTotal * coupon.amount) / 100 : 0;
  const finalPrice = parseFloat((sumTotal - discount).toFixed(2));
  const tax = parseFloat((finalPrice * (location.taxRate / 100)).toFixed(2));
  const totalPrice = parseFloat((finalPrice + tax).toFixed(2));

  // Create Order with "Pending" Status
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
    discount,
    finalPrice,
    tax,
    totalPrice,
    paymentType,
    customId,
    status: "Pending",
  });

  if (!order) return next(new Error("Failed to place order", { cause: 500 }));

  // Mark coupon as used (Run in background)
  if (coupon) {
    couponModel
      .updateOne({ _id: coupon._id }, { $addToSet: { usedBy: req.user._id } })
      .exec();
  }

  // Clear cart (Run in background)
  req.body.isCart
    ? clearAllCartItems(req.user._id)
    : clearSelectedItems(mealIds, req.user._id);

  let response = {
    status: "success",
    message: "Order placed successfully",
    orderId: order._id,
    order,
  };

  // // Payment Handling**
  if (paymentType === "Card") {
    const stripe = new Stripe(process.env.STRIPE_KEY);
    let stripeCouponId = null;

    // Calculate total meals price before tax
    const totalMealsPrice = order.meals.reduce(
      (sum, meal) => sum + meal.unitPrice * meal.quantity,
      0
    );

    // Apply discount only to meals (if coupon exists)
    let discountAmount = 0;
    if (coupon) {
      discountAmount = (totalMealsPrice * coupon.amount) / 100; // Percentage discount on meals only
    }

    if (coupon) {
      const stripeCoupon = await stripe.coupons.create({
        amount_off: Math.round(discountAmount * 100), // Convert to cents
        currency: "USD",
        duration: "once",
      });
      stripeCouponId = stripeCoupon.id;
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      cancel_url: `${req.protocol}://${
        req.headers.host
      }/order/stripePayment/cancel?orderId=${order._id.toString()}`,
      success_url: `${req.protocol}://${
        req.headers.host
      }/order/stripePayment/success?orderId=${order._id.toString()}&session_id={CHECKOUT_SESSION_ID}`,
      customer_email: req.user.email,
      metadata: { orderId: order._id.toString() },
      line_items: [
        // Add meal items
        ...order.meals.map((meal) => ({
          price_data: {
            currency: "USD",
            product_data: { name: meal.title },
            unit_amount: Math.round(meal.unitPrice * 100),
          },
          quantity: meal.quantity,
        })),
        // Add tax separately
        {
          price_data: {
            currency: "USD",
            product_data: { name: "Tax" },
            unit_amount: Math.round(order.tax * 100), // Tax applied after discount
          },
          quantity: 1,
        },
      ],
      discounts: stripeCouponId ? [{ coupon: stripeCouponId }] : [],
    });

    order.stripeSessionId = session.id; // Save Stripe session ID inside order
    await order.save();

    response.paymentUrl = session.url; // Send Payment URL
  }

  // Wallet Payment Handling**
  if (paymentType === "Wallet") {
    await payWithEwallet(req.user._id, order.totalPrice);
    processInvoice(order, req.user);
    order.status = "Processing";
    await order.save();
    response.message =
      "Order will be prepared successfully. Paid with your CFC wallet";
  }

  // Paypal Payment Handling**
  if (paymentType === "Paypal") {
    rewardCustomer(req.user._id, order._id, order.totalPrice);
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: order._id.toString(),
          amount: {
            currency_code: "USD",
            value: parseFloat(totalPrice).toFixed(2), //Ensure two decimal places
          },
        },
      ],
      application_context: {
        brand_name: "Crunchy Fried Chicken",
        user_action: "PAY_NOW",
        return_url: `${req.protocol}://${
          req.headers.host
        }/order/paypalPayment/success?orderId=${order._id.toString()}`,
        cancel_url: `${req.protocol}://${
          req.headers.host
        }/order/paypalPayment/cancel?orderId=${order._id.toString()}`,
      },
    });

    try {
      const createOrder = await paypalClient.execute(request);
      const approveLink = createOrder.result.links.find(
        (link) => link.rel === "approve"
      )?.href;

      if (!approveLink) {
        return next(
          new Error("PayPal approval link not found", { cause: 500 })
        );
      }
      order.paypalCheckoutUrl = approveLink; // Save Stripe session ID inside order
      await order.save();

      response.paymentUrl = approveLink;
    } catch (error) {
      return next(
        new Error("PayPal payment initialization failed", { cause: 500 })
      );
    }
  }

  res.status(201).json(response);
});

//====================================================================================================================//
//cancel order
export const CancelOrder = asyncHandler(async (req, res, next) => {
  const { orderId } = req.params;
  const { reason } = req.body;

  // Find the order by ID and user
  const order = await orderModel.findOne({
    _id: orderId,
    userId: req.user._id,
  });
  if (!order) {
    return next(
      new Error(
        "Invalid order ID or you don't have permission to cancel this order.",
        { cause: 404 }
      )
    );
  }

  // Ensure the order is still cancellable
  if (order.status !== "Pending") {
    return next(
      new Error("Order cannot be canceled at this stage.", { cause: 400 })
    );
  }

  // Delete invoice from Cloudinary if exists
  if (order.invoicePublicId) {
    try {
      await cloudinary.uploader.destroy(order.invoicePublicId, {
        resource_type: "raw",
      });
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
    return next(
      new Error("Failed to cancel your order. Please try again.", {
        cause: 400,
      })
    );
  }

  // Remove user from the "usedBy" list of the coupon, if applicable
  if (order.couponId) {
    await couponModel.updateOne(
      { _id: order.couponId },
      { $pull: { usedBy: req.user._id } }
    );
  }

  return res
    .status(200)
    .json({ status: "success", message: "Order canceled successfully." });
});

//====================================================================================================================//
//orderd delivered
export const deliveredOrder = asyncHandler(async (req, res, next) => {
  const { orderId } = req.params;

  // Find and update the order in one step
  const order = await orderModel.findOne({
    _id: orderId,
    locationId: req.user.locationId,
  });

  if (!order) {
    return next(new Error(`Invalid order ID: ${orderId}`, { cause: 404 }));
  }

  // Check if the order is already in a final state
  if (
    ["Completed", "Cancelled", "Rejected", "Pending"].includes(order.status)
  ) {
    return next(
      new Error(
        `Order with ID ${orderId} cannot be delivered as it is ${order.status}.`,
        { cause: 400 }
      )
    );
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
//get all order
export const getAllOrders = asyncHandler(async (req, res, next) => {
  const apiObject = new ApiFeatures(orderModel.find(), req.query)
    .paginate()
    .filter()
    .sort()
    .select();
  const orders = await apiObject.mongooseQuery;
  return res.status(200).json({
    status: "success",
    message: `All Orders `,
    count: orders.length,
    result: orders,
  });
});
//====================================================================================================================//
//get location logged in orders

export const getLocationOrders = asyncHandler(async (req, res, next) => {
  if (!req.user || !req.user.locationId) {
    return next(new Error(`Location ID not found`, { cause: 404 }));
  }
  const { locationId } = req.user;
  const apiObject = new ApiFeatures(orderModel.find({ locationId }), req.query)
    .paginate()
    .filter()
    .sort()
    .select();
  const orders = await apiObject.mongooseQuery;
  return res.status(200).json({
    status: "success",
    message: `All Orders `,
    count: orders.length,
    result: orders,
  });
});
//====================================================================================================================//
//paypal success

export const paypalSuccess = asyncHandler(async (req, res, next) => {
  const { orderId, token, PayerID } = req.query; // Extract query params

  if (!orderId || !token || !PayerID) {
    return next(new Error("Invalid PayPal payment details", { cause: 400 }));
  }

  try {
    // Capture PayPal Payment
    const request = new paypal.orders.OrdersCaptureRequest(token);
    request.requestBody({});
    const capture = await paypalClient.execute(request);

    // Log PayPal response
    console.log(
      "PayPal Capture Response:",
      JSON.stringify(capture.result, null, 2)
    );

    // Ensure payment was successful
    if (capture.result.status !== "COMPLETED") {
      return next(
        new Error(
          `PayPal payment not completed. Status: ${capture.result.status}`,
          { cause: 400 }
        )
      );
    }

    // Log user data
    console.log("User Data:", req.user);

    // Ensure `req.user` is available before using `_id`
    if (!req.user || !req.user._id) {
      console.error("Error: req.user is undefined or missing _id");
      return next(new Error("User authentication required", { cause: 401 }));
    }

    // Fetch order from database
    const order = await orderModel.findOne({
      _id: orderId,
      userId: req.user._id,
    });

    // Handle case where order is not found
    if (!order) {
      console.error(
        `Error: Order not found. orderId=${orderId}, userId=${req.user._id}`
      );
      return next(new Error("Order not found", { cause: 404 }));
    }

    // Log order data
    console.log("Order Data:", order);

    // Process invoice & reward customer
    processInvoice(order, req.user);

    // Ensure `order._id` exists before using it
    if (order._id) {
      rewardCustomer(req.user._id, order._id, order.totalPrice);
    } else {
      console.warn("Warning: Order ID is missing, skipping rewardCustomer");
    }
    // Update order status
    const updatedOrder = await orderModel.findByIdAndUpdate(
      orderId,
      {
        status: "Processing",
        $unset: { paypalCheckoutUrl: 1 },
      },
      { new: true }
    );

    return res.status(200).json({
      status: "success",
      message: "PayPal payment was accepted",
      orderId,
      updatedOrder,
    });

    // res.redirect(`${process.env.FRONTEND_URL}/payment-success?orderId=${orderId}`);
  } catch (error) {
    console.error("PayPal Capture Error:", error);
    return next(
      new Error(`PayPal payment capture failed: ${error.message}`, {
        cause: 500,
      })
    );
  }
});

//====================================================================================================================//
//paypal cancel

export const paypalCancel = asyncHandler(async (req, res, next) => {
  try {
    const { orderId } = req.query; // Extract orderId from query params

    if (!orderId) {
      return next(new Error("Order ID is required", { cause: 400 }));
    }

    // Find the order
    const order = await orderModel.findById(orderId);
    if (!order) {
      return next(new Error("Order not found", { cause: 404 }));
    }

    // Check if the order is already canceled
    if (order.status === "Cancelled") {
      return res.status(200).json({
        status: "cancelled",
        message: "Order was already canceled.",
        orderId,
        order,
      });
    }

    // Update order status to "Cancelled"
    const updatedOrder = await orderModel.findByIdAndUpdate(
      orderId,
      {
        status: "Cancelled",
        $unset: { paypalCheckoutUrl: 1 },
      },
      { new: true }
    );

    // Prepare response data
    const responseData = {
      status: "cancelled",
      message: "PayPal payment was canceled. You can retry anytime.",
      orderId,
      updatedOrder,
    };

    // API Response (for JSON requests)
    if (req.headers.accept?.includes("application/json")) {
      return res.status(200).json(responseData);
    }

    // Redirect for browser requests
    // return res.redirect(`${process.env.FRONTEND_URL}/payment-cancel?orderId=${orderId}`);
  } catch (error) {
    console.error("PayPal Cancel Error:", error);
    return next(new Error("Failed to cancel PayPal payment", { cause: 500 }));
  }
});

//====================================================================================================================//
//Strip Payment Success

const stripe = new Stripe(process.env.STRIPE_KEY);

export const stripeSuccess = asyncHandler(async (req, res, next) => {
  const { orderId, session_id } = req.query;

  if (!orderId || !session_id) {
    return next(new Error("Missing orderId or session_id", { cause: 400 }));
  }

  //Verify the Stripe session
  const session = await stripe.checkout.sessions.retrieve(session_id);
  if (!session || session.payment_status !== "paid") {
    return next(new Error("Stripe payment not completed", { cause: 400 }));
  }

  //Find and update the order status
  const order = await orderModel.findById(orderId);
  if (!order) return next(new Error("Order not found", { cause: 404 }));
  processInvoice(order, req.user);

  // Update order status
  const updatedOrder = await orderModel.findByIdAndUpdate(
    orderId,
    {
      status: "Processing",
      $unset: { stripeSessionId: 1 },
    },
    { new: true }
  );

  //Redirect to frontend success page (if it's a browser request)
  if (req.headers.accept?.includes("text/html")) {
    return res.redirect(
      `${process.env.FRONTEND_URL}/payment-success?orderId=${orderId}`
    );
  }

  //Return JSON response for API calls
  res.status(200).json({
    status: "success",
    message: "Stripe payment successful! Your order is being prepared.",
    orderId,
    updatedOrder,
  });
});
//====================================================================================================================//
//Strip Payment Cancel
export const stripeCancel = asyncHandler(async (req, res, next) => {
  const { orderId } = req.query;

  if (!orderId) return next(new Error("Order ID is missing", { cause: 400 }));

  //Find the order in the database
  const order = await orderModel.findById(orderId);
  if (!order) return next(new Error("Order not found", { cause: 404 }));

  // Update order status
  const updatedOrder = await orderModel.findByIdAndUpdate(
    orderId,
    {
      status: "Cancelled",
      $unset: { stripeSessionId: 1 },
    },
    { new: true }
  );

  //Handle browser & API responses
  if (req.headers.accept?.includes("text/html")) {
    return res.redirect(
      `${process.env.FRONTEND_URL}/payment-cancel?orderId=${orderId}`
    );
  }

  res.status(200).json({
    status: "cancelled",
    message: "Stripe payment was canceled. You can retry anytime.",
    orderId,
    updatedOrder,
  });
});
