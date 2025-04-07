import joi from "joi";
import { generalFeilds } from "../../../middlewares/validation.middleware.js";

export const headersSchema = generalFeilds.headers;
export const addToCartSchema = joi
  .object({
    mealId: generalFeilds.id.required(),
    quantity: generalFeilds.quantity.required().positive().integer(),
    isCombo: joi.boolean().default(false),

    sauces: joi
      .array()
      .items(joi.object({ id: generalFeilds.id.required() }))
      .optional(),

    drinks: joi
      .array()
      .items(joi.object({ id: generalFeilds.id.required() }))
      .optional(),

    sides: joi
      .array()
      .items(joi.object({ id: generalFeilds.id.required() }))
      .optional(),
  })
  .required()
  .messages({
    "object.base": "Request body must be an object",
    "object.unknown": "Unknown field in request body",
    "any.required": "Request body is required",
  });
