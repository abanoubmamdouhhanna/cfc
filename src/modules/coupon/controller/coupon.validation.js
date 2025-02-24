import joi from "joi";
import { generalFeilds } from "../../../middlewares/validation.middleware.js";

export const headersSchema = generalFeilds.headers;

export const createCouponSchema = joi
  .object({
    name: generalFeilds.name.uppercase().required(),
    amount: joi.number().positive().min(1).max(100).required(),
    expire: joi.date().greater(Date.now()).required(),
    file: generalFeilds.file,
  })
  .required();

export const updateCouponSchema = joi
  .object({
    couponId: generalFeilds.id,
    name: generalFeilds.name.uppercase(),
    amount: joi.number().positive().min(1).max(100),
    expire: joi.date().greater(Date.now()),
    file: generalFeilds.file,
  })
  .required();

export const deleteCouponSchema = joi
  .object({
    couponId: generalFeilds.id,
  })
  .required();
