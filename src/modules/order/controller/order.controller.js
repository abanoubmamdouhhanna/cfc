import { asyncHandler } from "../../../utils/errorHandling.js";
import { nanoid } from "nanoid";
import cartModel from "../../../../DB/models/Cart.model.js";
import couponModel from "../../../../DB/models/Coupon.model.js";
import orderModel from "../../../../DB/models/Order.model.js";
import mealModel from "../../../../DB/models/Meal.model.js";
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
import { capitalizeWords } from "../../../utils/capitalize.js";
import { sendOrderNotification } from "../../../utils/orderNotification.js";
import sauceOptionModel from "../../../../DB/models/Sauce.model.js";
import drinkOptionModel from "../../../../DB/models/Drink.model.js";
import sideOptionModel from "../../../../DB/models/Side.model.js";

// Create Order
export const createOrder = asyncHandler(async (req, res, next) => {
  const {
    address,
    city,
    state,
    phone,
    couponName,
    orderTime,
    orderDate,
    paymentType,
    meals: reqMeals,
  } = req.body;
  const { locationId } = req.params;

  // --- Start: Validation (Keep existing validation) ---
  const location = await locationModel.findById(locationId).lean();
  if (!location) return next(new Error("Invalid location ID", { cause: 400 }));

  const existingOrder = await orderModel
    .findOne({
      userId: req.user._id,
      status: "Pending",
      paymentType: { $in: ["Card", "PayPal"] },
    })
    .lean();

  if (existingOrder) {
    return res.status(400).json({
      status: "error",
      message: "You already have a pending payment. Please complete it first.",
      paymentUrl:
        existingOrder.paymentType === "Card"
          ? existingOrder.stripeSessionurl
          : existingOrder.paypalCheckoutUrl,
      orderId: existingOrder._id,
    });
  }

  const date = new Date(orderDate);
  if (isNaN(date.getTime())) {
    return next(
      new Error(
        "Invalid order date. Please provide a valid date in 'YYYY-MM-DD' format.",
        { cause: 422 }
      )
    );
  }
  if (date < new Date().setHours(0, 0, 0, 0)) {
    return next(
      new Error("order date must be today or in the future.", {
        cause: 400,
      })
    );
  }
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    const [selectedHour, selectedMinute] = orderTime.split(":").map(Number);
    const orderDateTime = new Date();
    orderDateTime.setHours(selectedHour, selectedMinute, 0, 0);

    if (orderDateTime <= now) {
      return next(
        new Error(
          `Invalid appointment time. Please select a time later than the current moment (${now.getHours()}:${now
            .getMinutes()
            .toString()
            .padStart(2, "0")}).`,
          { cause: 400 }
        )
      );
    }
  }

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

  let meals = reqMeals || [];
  let isCart = false; // Flag to track if meals came from the cart
  if (!meals.length) {
    const cart = await cartModel.findOne({ createdBy: req.user._id }).lean();
    if (!cart || !cart.meals.length)
      return next(new Error("Empty cart", { cause: 400 }));
    meals = cart.meals;
    isCart = true;
  }

  // --- Start: Process Meals & Calculate Total Price (MODIFIED SECTION) ---
  let sumTotal = 0; // Will include base meal prices + paid extras
  const finalMealList = [];
  const mealIds = []; // For cart clearing

  for (const meal of meals) {
    const checkMeal = await mealModel.findById(meal.mealId).lean();
    if (!checkMeal || checkMeal.isDeleted)
      return next(
        new Error(`Invalid meal in order: ${meal.mealId}`, { cause: 400 })
      );

    mealIds.push(meal.mealId);

    let mealBasePrice = meal.isCombo
      ? checkMeal.finalComboPrice * meal.quantity
      : checkMeal.finalPrice * meal.quantity;
    let extrasPrice = 0; // Price ONLY for PAID extras (second sauce/drink/side onwards)
    const processedSauces = [];
    const processedDrinks = [];
    const processedSides = [];
    const freeSaucesCount = meal.quantity;
    const freeDrinksCount = meal.quantity;
    const freeSidesCount = meal.quantity;

    // --- Process Sauces ---
    if (meal.sauces && Array.isArray(meal.sauces)) {
      for (const [index, sauce] of meal.sauces.entries()) {
        if (!sauce || typeof sauce !== "object" || !sauce.id) {
          console.warn(
            `Invalid sauce structure received for meal ${checkMeal.title}:`,
            sauce
          );
          continue;
        }
        const sauceDetail = await sauceOptionModel.findById(sauce.id).lean();
        if (!sauceDetail || !sauceDetail.isAvailable) {
          console.warn(
            `Sauce option ${sauce.id} not found or unavailable for meal ${checkMeal.title}`
          );
          continue;
        }

        let saucePrice = sauceDetail.price; // Start with the actual price

        // ** NEW LOGIC:  Free sauces up to meal quantity **
        if (index < freeSaucesCount) {
          saucePrice = 0; // Make it free
        } else {
          extrasPrice += saucePrice; // Charge for extra sauces
        }

        processedSauces.push({
          sauceId: sauceDetail._id,
          name: sauceDetail.name,
          price: saucePrice, // Store the price charged
        });
      }
    }

    // --- Process Drinks ---
    if (meal.drinks && Array.isArray(meal.drinks)) {
      for (const [index, drink] of meal.drinks.entries()) {
        if (!drink || typeof drink !== "object" || !drink.id) {
          console.warn(
            `Invalid drink structure received for meal ${checkMeal.title}:`,
            drink
          );
          continue;
        }
        const drinkDetail = await drinkOptionModel.findById(drink.id).lean();
        if (!drinkDetail || !drinkDetail.isAvailable) {
          console.warn(
            `Drink option ${drink.id} not found or unavailable for meal ${checkMeal.title}`
          );
          continue;
        }

        let drinkPrice = drinkDetail.price; // Start with the actual price

        // ** NEW LOGIC: Free drinks up to meal quantity **
        if (index < freeDrinksCount) {
          drinkPrice = 0;
        } else {
          extrasPrice += drinkPrice;
        }

        processedDrinks.push({
          drinkId: drinkDetail._id,
          name: drinkDetail.name,
          price: drinkPrice,
        });
      }
    }

    // --- Process Sides ---
    if (meal.sides && Array.isArray(meal.sides)) {
      for (const [index, side] of meal.sides.entries()) {
        if (!side || typeof side !== "object" || !side.id) {
          console.warn(
            `Invalid side structure received for meal ${checkMeal.title}:`,
            side
          );
          continue;
        }
        const sideDetail = await sideOptionModel.findById(side.id).lean();
        if (!sideDetail || !sideDetail.isAvailable) {
          console.warn(
            `Side option ${side.id} not found or unavailable for meal ${checkMeal.title}`
          );
          continue;
        }

        let sidePrice = sideDetail.price; // Start with the actual price
        // ** NEW LOGIC: Free sides up to meal quantity **
        if (index < freeSidesCount) {
          sidePrice = 0;
        } else {
          extrasPrice += sidePrice;
        }

        processedSides.push({
          sideId: sideDetail._id,
          name: sideDetail.name,
          price: sidePrice,
        });
      }
    }

    // Calculate final price for this meal item (base + PAID extras)
    const finalMealItemPrice = mealBasePrice + extrasPrice;

    finalMealList.push({
      mealId: meal.mealId,
      title: checkMeal.title,
      unitPrice: meal.isCombo
        ? checkMeal.finalComboPrice
        : checkMeal.finalPrice,
      description: checkMeal.description,
      quantity: meal.quantity,
      isCombo: checkMeal.isCombo || false,
      sauces: processedSauces,
      drinks: processedDrinks,
      sides: processedSides,
      finalPrice: finalMealItemPrice, // Base price + only PAID extras
    });

    sumTotal += finalMealItemPrice; // Add this item's total cost (base + paid extras) to the order sum
  }
  // --- End: Process Meals ---

  // --- Calculations (Discount, Tax, TotalPrice) ---
  const discount = coupon ? (sumTotal * coupon.amount) / 100 : 0;
  const finalPrice = parseFloat((sumTotal - discount).toFixed(2));
  const tax = parseFloat((finalPrice * (location.taxRate / 100)).toFixed(2));
  const totalPrice = parseFloat((finalPrice + tax).toFixed(2));

  // --- Create Order ---
  // Order creation remains the same, saving finalMealList which has the correct prices.
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
    orderTime,
    orderDate,
    customId,
    status: "Pending",
    paymentStatus: "pending",
  });

  if (!order) return next(new Error("Failed to place order", { cause: 500 }));

  // --- Post-Order Actions (Coupon, Cart Clearing) ---
  // Remain the same.
  if (coupon) {
    couponModel
      .updateOne({ _id: coupon._id }, { $addToSet: { usedBy: req.user._id } })
      .exec();
  }
  //clear cart
  if (isCart) {
    clearAllCartItems(req.user._id);
  }

  // --- Prepare Response ---
  // Remains the same.
  let response = {
    status: "success",
    message: "Order placed successfully. Proceed to payment if applicable.",
    orderId: order._id,
    order: order.toObject(),
  };

  // --- Payment Handling (Stripe, Wallet, PayPal) ---
  // The payment handling logic should also remain the same.
  // Stripe line items are calculated based on the final `mealItem.finalPrice` which correctly
  // includes only paid extras.
  // PayPal uses `order.totalPrice` which is also calculated correctly.
  // Wallet uses `order.totalPrice`.

  // ** Card (Stripe) Payment **
  if (paymentType === "Card") {
    const stripe = new Stripe(process.env.STRIPE_KEY);
    let stripeCouponId = null;
    let stripeDiscountAmount = 0;
    if (coupon) {
      stripeDiscountAmount = Math.round(discount * 100);
      try {
        const stripeCoupon = await stripe.coupons.create({
          amount_off: stripeDiscountAmount,
          currency: "USD",
          duration: "once",
          name: `Order Discount (${coupon.amount}%)`,
        });
        stripeCouponId = stripeCoupon.id;
      } catch (couponError) {
        console.error("Failed to create Stripe coupon:", couponError);
      }
    }

    const line_items = [];
    order.meals.forEach((mealItem) => {
      // Calculate total cents for the line item FOR STRIPE
      // Base meal price * quantity
      let itemTotalCents = Math.round(
        mealItem.unitPrice * mealItem.quantity * 100
      );
      // Add cost of PAID extras only
      mealItem.sauces.forEach((s) => {
        if (s.price > 0) itemTotalCents += Math.round(s.price * 100);
      });
      mealItem.drinks.forEach((d) => {
        if (s.price > 0) itemTotalCents += Math.round(s.price * 100);
      });
      mealItem.sides.forEach((s) => {
        if (s.price > 0) itemTotalCents += Math.round(s.price * 100);
      });

      line_items.push({
        price_data: {
          currency: "USD",
          product_data: {
            name:
              `${mealItem.title} (Qty: ${mealItem.quantity})` +
              (mealItem.isCombo ? " [Combo]" : ""),
            description: `Includes selected sauces, drinks, and sides (first ${mealItem.quantity} of each type are free).`, // Updated description
          },
          // IMPORTANT: Stripe's unit_amount should represent the final calculated price for the line
          // including paid extras, consistent with `mealItem.finalPrice`
          // The previous calculation `mealItemTotalCents` was slightly off. Let's use the saved finalPrice.
          unit_amount: Math.round(mealItem.finalPrice * 100), // Use the calculated finalPrice for the item
        },
        quantity: 1, // Quantity is 1 because unit_amount reflects the total for the line (incl. meal quantity)
      });
    });

    if (order.tax > 0) {
      line_items.push({
        price_data: {
          currency: "USD",
          product_data: { name: "Tax" },
          unit_amount: Math.round(order.tax * 100),
        },
        quantity: 1,
      });
    }

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        cancel_url: `${req.protocol}://${
          req.headers.host
        }/order/stripePayment/cancel?orderId=${order._id.toString()}`,
        // success_url: `${req.protocol}://${
        //   req.headers.host
        // }/order/stripePayment/success?orderId=${order._id.toString()}&session_id={CHECKOUT_SESSION_ID}`,




        // success_url: `${frontendURL}/order/stripePayment/success?orderId=${order._id.toString()}&session_id=${CHECKOUT_SESSION_ID}`,
        success_url: `https://cfc-helmy.vercel.app/order/success/${order._id.toString()}/{CHECKOUT_SESSION_ID}`,



        customer_email: req.user.email,
        metadata: { orderId: order._id.toString() },
        line_items: line_items,
        discounts: stripeCouponId ? [{ coupon: stripeCouponId }] : [],
      });

      order.stripeSessionurl = session.url;
      await order.save();
      response.paymentUrl = session.url;
    } catch (stripeError) {
      console.error("Stripe session creation failed:", stripeError);
      return next(
        new Error("Payment session creation failed. Please try again.", {
          cause: 500,
        })
      );
    }
  }

  // ** Wallet Payment **
  if (paymentType === "Wallet") {
    try {
      await payWithEwallet(req.user._id, order.totalPrice);
      processInvoice(order, req.user);
      order.status = "Processing";
      order.paymentStatus = "paid";
      await order.save();
      response.message =
        "Order placed and paid successfully with your CFC wallet. It's being prepared!";
      const io = req.app.get("io");
      if (io) {
        sendOrderNotification(io, order.toObject());
      } else {
        console.warn(
          "Socket.IO instance not found, cannot send real-time order notification."
        );
      }
    } catch (walletError) {
      return next(
        new Error(walletError.message || "Wallet payment failed.", {
          cause: 400,
        })
      );
    }
  }

  // ** PayPal Payment **
  if (paymentType === "PayPal") {
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: order.customId,
          amount: {
            currency_code: "USD",
            value: parseFloat(order.totalPrice).toFixed(2),
            breakdown: {
              item_total: {
                currency_code: "USD",
                value: parseFloat(order.finalPrice).toFixed(2),
              },
              tax_total: {
                currency_code: "USD",
                value: parseFloat(order.tax).toFixed(2),
              },
            },
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
      const paypalOrder = await paypalClient.execute(request);
      const approveLink = paypalOrder.result.links.find(
        (link) => link.rel === "approve"
      )?.href;

      if (!approveLink) {
        return next(
          new Error("PayPal approval link not found", { cause: 500 })
        );
      }
      order.paypalCheckoutUrl = approveLink;
      await order.save();
      response.paymentUrl = approveLink;
    } catch (error) {
      console.error("PayPal order creation failed:", error.message);
      return next(
        new Error("PayPal payment initialization failed", { cause: 500 })
      );
    }
  }

  // --- Send Final Response ---
  res.status(paymentType === "Wallet" ? 200 : 201).json(response);
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
//get sp order
export const getOrder = asyncHandler(async (req, res, next) => {
  const order = await orderModel
    .findOne({ _id: req.params.orderId })
    .select(
      "address city state phone meals discount tax totalPrice status paymentType"
    )
    .populate({
      path: "userId",
      select: "firstName lastName",
    })
    .populate({
      path: "locationId",
      select: "title",
    });

  if (!order) {
    return next(new Error(`Order not found`, { cause: 404 }));
  }

  return res.status(200).json({
    status: "success",
    message: `Order`,
    OrderDetails: {
      title: order.locationId?.title || "N/A",
      fullName: capitalizeWords(
        `${order.userId?.firstName || ""} ${order.userId?.lastName || ""}`
      ).trim(),
      address: order.address,
      city: order.city,
      state: order.state,
      phone: order.phone,
      meals: order.meals,
      discount: order.discount,
      tax: order.tax,
      totalPrice: order.totalPrice,
      status: order.status,
      paymentType: order.paymentType,
    },
  });
});
//====================================================================================================================//
//get user orders

export const getUserOrders = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    return next(new Error(`please login first`, { cause: 404 }));
  }
  const apiObject = new ApiFeatures(
    orderModel.find({ userId: req.user._id }),
    req.query
  )
    .paginate()
    .filter()
    .sort()
    .select();
  const orders = await apiObject.mongooseQuery;
  return res.status(200).json({
    status: "success",
    message: `All user Orders `,
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

    // Ensure `req.user` is available before using `_id`
    if (!req.user || !req.user._id) {
      return next(new Error("User authentication required", { cause: 401 }));
    }

    // Fetch order from database
    const order = await orderModel.findOne({
      _id: orderId,
      userId: req.user._id,
    });

    // Handle case where order is not found
    if (!order) {
      return next(
        new Error(
          `Order not found.  orderId=${orderId}, userId=${req.user._id}`,
          { cause: 404 }
        )
      );
    }
    if (order.paymentStatus === "paid") {
      return next(
        new Error("Payment already processed for this order.", { cause: 400 })
      );
    }
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
        paymentStatus: "paid",
        $unset: { paypalCheckoutUrl: 1 },
      },
      { new: true }
    );
    const io = req.app.get("io");
    if (!io) throw new Error("Socket.IO instance not found");
    sendOrderNotification(io, order);
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
  if (order.paymentStatus === "paid") {
    return next(
      new Error("Payment already processed for this order.", { cause: 400 })
    );
  }
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
      paymentStatus: "paid", // Mark as paid
      $unset: { stripeSessionurl: 1 },
    },
    { new: true }
  );
  const io = req.app.get("io");
  if (!io) throw new Error("Socket.IO instance not found");
  sendOrderNotification(io, order);

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
      $unset: { stripeSessionurl: 1 },
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
