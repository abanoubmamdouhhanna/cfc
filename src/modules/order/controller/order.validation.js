import joi from "joi";
import { generalFeilds } from "../../../middlewares/validation.middleware.js";

export const headersSchema = generalFeilds.headers;

export const createOrderSchema = joi
  .object({
    locationId:generalFeilds.id,
    couponId:generalFeilds.optionalId,
    couponName: generalFeilds.name.uppercase(),
    address: joi.string(),
    phone: joi.array().items(generalFeilds.phone),
    paymentType: joi.string(),
    meals: joi.array().required(),
  })
  .required();

export const cancelOrderSchema = joi
  .object({
    orderId: generalFeilds.id,
    reason: joi.string().min(5).max(1000),
  })
  .required();

export const deliveredOrderSchema = joi
  .object({
    orderId: generalFeilds.id,
  })
  .required();
