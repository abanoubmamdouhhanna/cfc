import { Router } from "express";
import * as wishlistController from "./controller/wishlist.controller.js";
import { isValid } from "../../middlewares/validation.middleware.js";
import { auth } from "../../middlewares/auth.middleware.js";
import {
  headersSchema,
  wishlistSchema,
} from "./controller/wishlist.validation.js";
const router = Router();

//wishlist
router.patch(
  "/:mealId",
  isValid(headersSchema, true),
  auth(["user"]),
  isValid(wishlistSchema),
  wishlistController.wishlist
);
//wishlist
router.get(
  "/getWishlist",
  isValid(headersSchema, true),
  auth(["user"]),
  wishlistController.getWishlist
);

//remove From wishlist
router.patch(
  "/remove/:mealId",
  isValid(headersSchema, true),
  auth(["user"]),
  isValid(wishlistSchema),
  wishlistController.removeFromWishlist
);

export default router;
