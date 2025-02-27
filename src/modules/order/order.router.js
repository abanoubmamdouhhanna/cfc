import { Router } from "express";
import * as orderController from "./controller/order.controller.js";
import { auth } from "../../middlewares/auth.middleware.js";
import { isValid } from "../../middlewares/validation.middleware.js";
import {
  cancelOrderSchema,
  createOrderSchema,
  deliveredOrderSchema,
  headersSchema,
} from "./controller/order.validation.js";


const router = Router();

//create Order
router.post(
  "/createOrder/:locationId",
  isValid(headersSchema, true),
  auth(["user", "superAdmin"]),
  isValid(createOrderSchema),
  orderController.createOrder
);

//cancel order
router.patch(
  "/cancelOrder/:orderId",
  isValid(headersSchema, true),
  auth(["user", "admin", "superAdmin"]),
  isValid(cancelOrderSchema),
  orderController.CancelOrder
);

//orderd delivered
router.patch(
  "/delivered/:orderId",
  isValid(headersSchema, true),
  auth(["admin", "superAdmin"]),
  isValid(deliveredOrderSchema),
  orderController.deliveredOrder
);

//get all orders
router.get(
  "/getAllOrders",
  isValid(headersSchema, true),
  auth(["superAdmin"]),
  orderController.getAllOrders
);
//get order 
router.get(
  "/getOrder/:orderId",
  isValid(headersSchema, true),
  auth(["superAdmin","user"]),
  orderController.getOrder
);

//get location logged in orders
router.get(
  "/getLocationOrders",
  isValid(headersSchema, true),
  auth(["admin", "superAdmin"]),
  orderController.getLocationOrders
);

//PayPal Payment Success (Query: orderId, token, PayerID)
router.get(
  "/paypalPayment/success",
  isValid(headersSchema, true),
  auth(["user", "superAdmin"]),
  orderController.paypalSuccess
);

//PayPal Payment Cancel (Query: orderId)
router.get(
  "/paypalPayment/cancel",
  isValid(headersSchema, true),
  auth(["user", "superAdmin"]),
  orderController.paypalCancel
);

//Strip Payment Success
router.get(
  "/stripePayment/success",
  isValid(headersSchema, true),
  auth(["user", "superAdmin"]),
  orderController.stripeSuccess
);

//Strip Payment Cancel 
router.get(
  "/stripePayment/cancel",
  isValid(headersSchema, true),
  auth(["user", "superAdmin"]),
  orderController.stripeCancel
);

export default router;
