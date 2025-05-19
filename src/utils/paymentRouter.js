import express from "express";
import Stripe from "stripe";
import orderModel from "../../DB/models/Order.model.js";
import { processInvoice } from "./invoiceService.js";
import { rewardCustomer } from "./wallet rewards.js";
import { sendOrderNotification } from "./orderNotification.js";

const paymentRouter = express.Router();
const stripe = new Stripe(process.env.STRIPE_KEY);

// Enum-like constants for order status
const OrderStatus = {
  PENDING: "Pending",
  PROCESSING: "Processing",
  CANCELLED: "Cancelled",
  PAID: "paid",
};

// Stripe Webhook Route — must be BEFORE express.json()
paymentRouter.post(
  "/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("❌ Missing Stripe webhook secret.");
      return res.status(500).send("Server configuration error.");
    }

    let event;

    // Verify Stripe signature
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      console.log(`📦 Handling event ${event.id} of type ${event.type}`);
    } catch (err) {
      console.error("❌ Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle supported event types
    try {
      switch (event.type) {
        case "checkout.session.completed":
        case "checkout.session.expired": {
          const session = event.data.object;
          const orderId = session?.metadata?.orderId;

          if (!orderId) {
            console.error("⚠️ Missing orderId in session metadata.");
            return res.status(400).send("Invalid session data.");
          }

          const order = await orderModel.findById(orderId);
          processInvoice(order, req.user);

          if (!order) {
            console.error(`❌ Order not found: ${orderId}`);
            return res.status(404).send("Order not found.");
          }
          if (order._id) {
            rewardCustomer(req.user._id, order._id, order.totalPrice);
          }

          if (
            event.type === "checkout.session.completed" &&
            order.status === OrderStatus.PENDING
          ) {
            order.status = OrderStatus.PROCESSING;
            order.paymentStatus = OrderStatus.PAID;
            order.stripeSessionUrl = null;
            order.paidAt = new Date();
            await order.save();
            console.log(`✅ Order ${orderId} marked as Processing.`);
          }
          const io = req.app.get("io");
          if (!io) throw new Error("Socket.IO instance not found");
          sendOrderNotification(io, order);

          if (
            event.type === "checkout.session.expired" &&
            order.status === OrderStatus.PENDING
          ) {
            order.status = OrderStatus.CANCELLED;
            await order.save();
            console.log(`❌ Order ${orderId} expired and marked as Cancelled.`);
          }

          break;
        }

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      // Respond to Stripe to confirm receipt
      res.status(200).json({ received: true });
    } catch (error) {
      console.error("⚠️ Webhook Processing Error:", error);
      res.status(500).send("Internal Server Error");
    }
  }
);

export default paymentRouter;
