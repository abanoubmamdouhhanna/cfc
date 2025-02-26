import express from "express";
import Stripe from "stripe";
import orderModel from "../../DB/models/Order.model.js";

const paymentRouter = express.Router();
const stripe = new Stripe(process.env.STRIPE_KEY);

// Stripe Webhook Route (Must Use express.raw())
paymentRouter.post(
  "/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];

    try {
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      // Handle successful payments
      if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const orderId = session.metadata.orderId; // Get order ID from metadata

        // Update order status to "Processing"
        const order = await orderModel.findById(orderId);
        if (order && order.status === "Pending") {
          order.status = "Processing"; // Confirmed payment
          await order.save();
          console.log(`Order ${orderId} is now Processing.`);
        }
      }

      res.status(200).json({ received: true });
    } catch (error) {
      console.error("Stripe Webhook Error:", error);
      res.status(400).send(`Webhook Error: ${error.message}`);
    }
  }
);

export default paymentRouter;
