import { Router } from "express";
import { isValid } from "../../middlewares/validation.middleware.js";
import { allowedTypesMap, fileUpload } from "../../utils/multerCloudinary.js";
import * as couponController from "./controller/coupon.controller.js";
import { auth } from "../../middlewares/auth.middleware.js";
import {
  createCouponSchema,
  deleteCouponSchema,
  headersSchema,
  updateCouponSchema,
} from "./controller/coupon.validation.js";

const router = Router();

//create coupon
router.post(
  "/createCoupon",
  isValid(headersSchema, true),
  auth(["superAdmin"]),
  fileUpload(2, allowedTypesMap).single("couponImage"),
  isValid(createCouponSchema),
  couponController.createCoupon
);

//get coupons
router.get("/getCoupons", couponController.getCoupons);

//update coupon
router.put(
  "/updateCoupon/:couponId",
  isValid(headersSchema, true),
  auth(["superAdmin"]),
  fileUpload(2, allowedTypesMap).single("couponImage"),
  isValid(updateCouponSchema),
  couponController.updateCoupon
);

//delete coupon
router.delete(
  "/deleteCoupon/:couponId",
  isValid(headersSchema, true),
  auth(["superAdmin"]),
  isValid(deleteCouponSchema),
  couponController.deleteCoupon
);

export default router;
