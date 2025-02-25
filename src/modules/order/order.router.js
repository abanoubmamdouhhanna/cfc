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
  auth(["user","superAdmin"]),
  isValid(createOrderSchema),
  orderController.createOrder
);

//cancel order
router.patch(
  "/CancelOrder/:orderId",
  isValid(headersSchema, true),
  auth(["user","admin","superAdmin"]),
  isValid(cancelOrderSchema),
  orderController.CancelOrder
);

//orderd delivered
router.patch(
  "/:orderId/delivered",
  isValid(headersSchema, true),
  auth(["admin","superAdmin"]),
  isValid(deliveredOrderSchema),
  orderController.deliveredOrder
);

//get orders with status Processing
router.get("/getOrder",
  isValid(headersSchema, true),
  auth(["admin","superAdmin"]),
  orderController.getOrder
)

//get all orders 
router.get("/getAllOrders",
  isValid(headersSchema, true),
  auth(["admin","superAdmin"]),
  orderController.getAllOrders
)
export default router;
