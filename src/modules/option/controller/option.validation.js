import joi from "joi";
import { generalFeilds } from "../../../middlewares/validation.middleware.js";

// Common Headers
export const headersSchema = generalFeilds.headers;

// Shared schemas
const baseOptionSchema = {
  name: joi.string().trim().required().messages({
    "string.empty": "Name is required",
    "any.required": "Name is required",
  }),
  description: joi.string().trim().optional(),
  file: generalFeilds.file.required(),
  price: joi.number().min(0).required().messages({
    "number.base": "Price should be a number",
    "any.required": "Price is required",
    "number.min": "Price should be a positive value",
  }),
  isAvailable: joi.boolean().optional().default(true),
};

const updateBaseOptionSchema = {
  name: joi.string().trim().optional(),
  description: joi.string().trim().optional(),
  image: joi.string().uri().optional(),
  price: joi.number().min(0).optional().messages({
    "number.base": "Price should be a number",
    "number.min": "Price should be a positive value",
  }),
  isAvailable: joi.boolean().optional(),
};

// ID Validation
const idValidation = joi.object({
  optionId: generalFeilds.id.messages({
    "string.hex": "Invalid ID format",
    "string.length": "ID must be 24 characters long",
    "any.required": "ID is required",
  }),
});

// Side Option Schemas
export const createSideOptionSchema = joi.object(baseOptionSchema);
export const updateSideOptionSchema = joi.object(updateBaseOptionSchema);
export const getSideOptionSchema = idValidation;

// Drink Option Schemas
export const createDrinkOptionSchema = joi.object(baseOptionSchema);
export const updateDrinkOptionSchema = joi.object(updateBaseOptionSchema);
export const getDrinkOptionSchema = idValidation;

// Sauce Option Schemas
export const createSauceOptionSchema = joi.object(baseOptionSchema);
export const updateSauceOptionSchema = joi.object(updateBaseOptionSchema);
export const getSauceOptionSchema = idValidation;

// Bread Option Schemas (optional future usage)
export const createBreadOptionSchema = joi.object(baseOptionSchema);
export const updateBreadOptionSchema = joi.object(updateBaseOptionSchema);
export const getBreadOptionSchema = idValidation;
