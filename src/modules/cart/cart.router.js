import { Router } from "express";
import * as cartController from "./controller/cart.controller.js";
import { auth } from "../../middlewares/auth.middleware.js";
import { isValid } from "../../middlewares/validation.middleware.js";
import {
  addToCartSchema,
  headersSchema,
} from "./controller/cart.validation.js";

const router = Router();

//get cart
router.get(
  "/",
  isValid(headersSchema, true),
  auth(["superAdmin", "admin", "user"]),
  cartController.getCart
);

//create cart
router.post(
  "/addToCart",
  isValid(headersSchema, true),
  auth(["superAdmin", "admin", "user"]),
  isValid(addToCartSchema),
  cartController.addToCart
);

//add Standalone Extra
router.post(
  "/addStandaloneExtra",
  isValid(headersSchema, true),
  auth(["superAdmin", "admin", "user"]),
  // isValid(addStandaloneExtraSchema),
  cartController.addStandaloneExtra
);

//clear cart
router.patch(
  "/clearCart",
  isValid(headersSchema, true),
  auth(["superAdmin", "admin", "user"]),
  cartController.clearCart
);

//clear cart Item
router.patch(
  "/clearCartItem",
  isValid(headersSchema, true),
  auth(["superAdmin", "admin", "user"]),
  cartController.clearCartItem
);

export default router;
