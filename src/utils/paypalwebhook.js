import paypal from "@paypal/checkout-server-sdk";
import paypalClient from "./paypalService.js";
import { asyncHandler } from "./errorHandling.js";
import orderModel from "../../DB/models/Order.model.js";
import { processInvoice } from "./invoiceService.js";
import { sendOrderNotification } from "./orderNotification.js";
import { rewardCustomer } from "./wallet rewards.js";

// PayPal Webhook Handler
export const paypalWebhook = asyncHandler(async (req, res, next) => {
  // Validate required headers
  const requiredHeaders = [
    'paypal-transmission-id',
    'paypal-transmission-time',
    'paypal-transmission-sig',
    'paypal-cert-url'
  ];
  
  for (const header of requiredHeaders) {
    if (!req.headers[header]) {
      return res.status(400).json({ error: `Missing required header: ${header}` });
    }
  }

  const webhookEvent = req.body;
  if (!webhookEvent.event_type || !webhookEvent.resource) {
    return res.status(400).json({ error: 'Invalid webhook event data' });
  }

  try {
    // Verify webhook signature
    const verifyRequest = new paypal.notifications.WebhookEventVerifyRequest();
    verifyRequest.requestBody({
      transmission_id: req.headers['paypal-transmission-id'],
      transmission_time: req.headers['paypal-transmission-time'],
      cert_url: req.headers['paypal-cert-url'],
      webhook_id: process.env.PAYPAL_WEBHOOK_ID,
      webhook_event: webhookEvent,
      transmission_sig: req.headers['paypal-transmission-sig'],
    });

    const response = await paypalClient.execute(verifyRequest);
    if (response.verification_status !== 'SUCCESS') {
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    // Handle event
    switch (webhookEvent.event_type) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        await handlePaymentCompleted(req, res, next, webhookEvent.resource);
        break;
      case 'PAYMENT.CAPTURE.DENIED':
        await handlePaymentDenied(req, res, next, webhookEvent.resource);
        break;
      case 'PAYMENT.CAPTURE.REFUNDED':
        await handlePaymentRefunded(req, res, next, webhookEvent.resource);
        break;
      default:
        console.log(`Unhandled event type: ${webhookEvent.event_type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('PayPal Webhook Error:', error);
    return next(new Error('Webhook processing failed', { cause: 500 }));
  }
});

// Improved handler functions with better error handling
async function handlePaymentCompleted(req, res, next, resource) {
  const orderId = resource.reference_id || resource.custom_id;
  if (!orderId) {
    return next(new Error('Missing order reference', { cause: 400 }));
  }

  const session = await orderModel.startSession();
  session.startTransaction();

  try {
    const order = await orderModel.findById(orderId).session(session);
    if (!order) {
      await session.abortTransaction();
      return next(new Error(`Order not found`, { cause: 404 }));
    }

    if (order.paymentStatus === 'paid') {
      await session.abortTransaction();
      return next(new Error('Payment already processed', { cause: 400 }));
    }

    // Process all operations in transaction
    await Promise.all([
      processInvoice(order, { _id: order.userId }),
      rewardCustomer(order.userId, order._id, order.totalPrice),
      orderModel.findByIdAndUpdate(
        order._id,
        {
          status: 'Processing',
          paymentStatus: 'paid',
          $unset: { paypalCheckoutUrl: 1 },
        },
        { new: true, session }
      )
    ]);

    await session.commitTransaction();

    // Send notification after transaction succeeds
    const io = req.app.get('io');
    if (io) {
      sendOrderNotification(io, order);
    }

    console.log(`Payment completed for order: ${orderId}`);
  } catch (error) {
    await session.abortTransaction();
    console.error('Payment completion error:', error);
    throw error;
  } finally {
    session.endSession();
  }
}

