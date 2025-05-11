import paypal from "@paypal/checkout-server-sdk";
import paypalClient from "./paypalService.js";
import { asyncHandler } from "./errorHandling.js";
import orderModel from "../../DB/models/Order.model.js";
import { processInvoice } from "./invoiceService.js";
import { sendOrderNotification } from "./orderNotification.js";
import { rewardCustomer } from "./wallet rewards.js";

// PayPal Webhook Handler
export const paypalWebhook = asyncHandler(async (req, res, next) => {
  try {
    // Get the PayPal-Transmission-Id header
    const transmissionId = req.headers["paypal-transmission-id"];
    const transmissionTime = req.headers["paypal-transmission-time"];
    const transmissionSig = req.headers["paypal-transmission-sig"];
    const certUrl = req.headers["paypal-cert-url"];
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;

    // Verify webhook signature
    const webhookEvent = req.body;

    // Verify the webhook signature using PayPal SDK
    const verifyWebhookSignature = new paypal.notifications.WebhookEventVerify();
    const verifyRequest = new paypal.notifications.WebhookEventVerifyRequest();
    verifyRequest.requestBody({
      transmission_id: transmissionId,
      transmission_time: transmissionTime,
      cert_url: certUrl,
      webhook_id: webhookId,
      webhook_event: webhookEvent,
      transmission_sig: transmissionSig,
    });

    try {
      await paypalClient.execute(verifyRequest);
    } catch (error) {
      console.error("Webhook signature verification failed:", error);
      return res.status(400).json({ error: "Invalid webhook signature" });
    }

    // Handle different event types
    const eventType = webhookEvent.event_type;
    const resource = webhookEvent.resource;

    switch (eventType) {
      case "PAYMENT.CAPTURE.COMPLETED":
        await handlePaymentCompleted(req, res, next, resource);
        break;

      case "PAYMENT.CAPTURE.DENIED":
        await handlePaymentDenied(req, res, next, resource);
        break;

      case "PAYMENT.CAPTURE.REFUNDED":
        await handlePaymentRefunded(req, res, next, resource);
        break;

      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("PayPal Webhook Error:", error);
    return next(new Error("Webhook processing failed", { cause: 500 }));
  }
});

// Helper functions to handle different PayPal events
async function handlePaymentCompleted(req, res, next, resource) {
  try {
    const orderId = resource.reference_id || resource.custom_id;
    const order = await orderModel.findById(orderId);

    if (!order) {
      return next(new Error(`Order not found`, { cause: 404 }));
    }

    if (order.paymentStatus === "paid") {
      return next(
        new Error("Payment already processed for this order.", { cause: 400 })
      );
    }

    // Process invoice & reward customer
    processInvoice(order, { _id: order.userId }); // Pass user object with _id

    // Reward customer
    rewardCustomer(order.userId, order._id, order.totalPrice);

    // Update order status
    const updatedOrder = await orderModel.findByIdAndUpdate(
      order._id,
      {
        status: "Processing",
        paymentStatus: "paid",
        $unset: { paypalCheckoutUrl: 1 },
      },
      { new: true }
    );

    // Send notification
    const io = req.app.get("io"); // Get io instance from app
    if (io) {
      sendOrderNotification(io, updatedOrder);
    }

    console.log(`Successfully processed payment for order: ${orderId}`);
  } catch (error) {
    console.error("Error handling payment completed:", error);
    throw error;
  }
}

async function handlePaymentDenied(req, res, next, resource) {
  try {
    const orderId = resource.reference_id || resource.custom_id;
    const order = await orderModel.findById(orderId);

    if (!order) {
      return next(new Error(`Order not found`, { cause: 404 }));
    }

    await orderModel.findByIdAndUpdate(
      order._id,
      {
        status: "Cancelled",
        paymentStatus: "failed",
        $unset: { paypalCheckoutUrl: 1 },
      },
      { new: true }
    );

    console.log(`Payment denied for order: ${orderId}`);
  } catch (error) {
    console.error("Error handling payment denied:", error);
    throw error;
  }
}

async function handlePaymentRefunded(req, res, next, resource) {
  try {
    const orderId = resource.reference_id || resource.custom_id;
    const order = await orderModel.findById(orderId);

    if (!order) {
      return next(new Error(`Order not found`, { cause: 404 }));
    }

    await orderModel.findByIdAndUpdate(
      order._id,
      {
        status: "Refunded",
        paymentStatus: "refunded",
      },
      { new: true }
    );

    console.log(`Payment refunded for order: ${orderId}`);
  } catch (error) {
    console.error("Error handling payment refunded:", error);
    throw error;
  }
}
