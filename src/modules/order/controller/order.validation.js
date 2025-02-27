import joi from "joi";
import { generalFeilds } from "../../../middlewares/validation.middleware.js";

export const headersSchema = generalFeilds.headers;

export const createOrderSchema = joi
  .object({
    locationId:generalFeilds.id,
    couponId:generalFeilds.optionalId,
    couponName: generalFeilds.name.uppercase(),
    address: joi.string(),
    city: joi.string(),
    state: joi.string(),
    phone:generalFeilds.USAphone.required(),
    paymentType: joi.string().valid("Card", "Paypal", "Wallet").messages({
      "any.only": "Payment type must be one of the following: Card, Paypal, or Wallet."
    }),
    meals: joi.array(),
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
