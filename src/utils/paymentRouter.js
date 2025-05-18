// import express from "express";
// import Stripe from "stripe";
// import orderModel from "../../DB/models/Order.model.js";

// const paymentRouter = express.Router();
// const stripe = new Stripe(process.env.STRIPE_KEY);

// // Stripe Webhook Route (Must Use express.raw())
// paymentRouter.post(
//   "/stripe/webhook",
//   express.raw({ type: "application/json" }),
//   async (req, res) => {
//     const sig = req.headers["stripe-signature"];

//     try {
//       const event = stripe.webhooks.constructEvent(
//         req.body,
//         sig,
//         process.env.STRIPE_WEBHOOK_SECRET
//       );
//       if (!process.env.STRIPE_WEBHOOK_SECRET) {
//         console.error("Missing Stripe webhook secret.");
//         return res.status(500).send("Server configuration error.");
//       }
      
//       // Handle successful payments
//       if (event.type === "checkout.session.completed") {
//         const session = event.data.object;
//         const orderId = session.metadata.orderId; // Get order ID from metadata

//         // Update order status to "Processing"
//         const order = await orderModel.findById(orderId);
//         if (order && order.status === "Pending") {
//           order.status = "Processing"; // Confirmed payment
//           await order.save();
//           console.log(`Order ${orderId} is now Processing.`);
//         }
//       }

//       res.status(200).json({ received: true });
//     } catch (error) {
//       console.error("Stripe Webhook Error:", error);
//       res.status(400).send(`Webhook Error: ${error.message}`);
//     }
//   }
// );

// export default paymentRouter;
// import express from "express";
// import Stripe from "stripe";
// import orderModel from "../../DB/models/Order.model.js";

// const paymentRouter = express.Router();
// const stripe = new Stripe(process.env.STRIPE_KEY);

// // Stripe Webhook Route — must be defined BEFORE express.json()
// paymentRouter.post(
//   "/stripe/webhook",
//   express.raw({ type: "application/json" }),
//   async (req, res) => {
//     const sig = req.headers["stripe-signature"];
//     const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

//     if (!webhookSecret) {
//       console.error("❌ Missing Stripe webhook secret.");
//       return res.status(500).send("Server configuration error.");
//     }

//     let event;

//     try {
//       event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
//     } catch (err) {
//       console.error("❌ Stripe Webhook Signature Verification Failed:", err.message);
//       return res.status(400).send(`Webhook Error: ${err.message}`);
//     }

//     try {
//       const session = event.data.object;
//       const orderId = session?.metadata?.orderId;

//       if (!orderId) {
//         console.error("⚠️ Missing orderId in session metadata.");
//         return res.status(400).send("Invalid session data.");
//       }

//       switch (event.type) {
//         case "checkout.session.completed":
//           const order = await orderModel.findById(orderId);
//           if (order && order.status === "Pending") {
//             order.status = "Processing"; // or 'Paid'
//             order.paymentStatus="paid"
//             order.paymentSessionId = session.id;
//             order.paidAt = new Date();
//             await order.save();
//             console.log(`✅ Order ${orderId} marked as Processing.`);
//           }
//           break;

//         case "checkout.session.expired":
//           const expiredOrder = await orderModel.findById(orderId);
//           if (expiredOrder && expiredOrder.status === "Pending") {
//             expiredOrder.status = "Cancelled";
//             await expiredOrder.save();
//             console.log(`❌ Order ${orderId} expired and marked as Cancelled.`);
//           }
//           break;

//         default:
//           console.log(`ℹ️ Unhandled event type: ${event.type}`);
//       }

//       res.status(200).json({ received: true });
//     } catch (error) {
//       console.error("⚠️ Webhook Processing Error:", error);
//       res.status(500).send("Internal Server Error");
//     }
//   }
// );

// export default paymentRouter;




import express from "express";
import Stripe from "stripe";
import orderModel from "../../DB/models/Order.model.js";

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

          if (!order) {
            console.error(`❌ Order not found: ${orderId}`);
            return res.status(404).send("Order not found.");
          }

          if (event.type === "checkout.session.completed" && order.status === OrderStatus.PENDING) {
            order.status = OrderStatus.PROCESSING;
            order.paymentStatus = OrderStatus.PAID;
            order.paymentSessionId = session.id;
            order.paidAt = new Date();
            await order.save();
            console.log(`✅ Order ${orderId} marked as Processing.`);
          }

          if (event.type === "checkout.session.expired" && order.status === OrderStatus.PENDING) {
            order.status = OrderStatus.CANCELLED;
            await order.save();
            console.log(`❌ Order ${orderId} expired and marked as Cancelled.`);
          }

          break;
        }

        default:
          console.log(`ℹ️ Unhandled event type: ${event.type}`);
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
