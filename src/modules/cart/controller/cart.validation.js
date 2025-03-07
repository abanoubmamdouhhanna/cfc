import joi from "joi";
import { generalFeilds } from "../../../middlewares/validation.middleware.js";

export const headersSchema = generalFeilds.headers;

export const addToCartSchema = joi
  .object({
    mealId: generalFeilds.id.required(),
    quantity: generalFeilds.quantity.required().positive().integer(),
  })
  .required()
  .messages({
    "object.base": "Request body must be an object",
    "object.unknown": "Unknown field in request body",
    "any.required": "Request body is required",
  });
