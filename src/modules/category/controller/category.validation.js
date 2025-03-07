import joi from "joi";
import { generalFeilds } from "../../../middlewares/validation.middleware.js";

// Improved header schema - remains the same but with a descriptive comment
export const headersSchema = generalFeilds.headers;

// Improved create category schema with consistent formatting and better error messages
export const createCategorySchema = joi
  .object({
    name: generalFeilds.name
      .required()
      .messages({
        "any.required": "Category name is required",
        "string.empty": "Category name cannot be empty"
      }),
    file: generalFeilds.file
      .required()
      .messages({
        "any.required": "Category image file is required"
      })
  })
  .required();

// Improved update category schema with better validation and error messages
export const updateCategorySchema = joi
  .object({
    categoryId: generalFeilds.id,
    name: generalFeilds.name,
    status: joi
      .string()
      .valid("available", "not available")
      .default("available")
      .messages({
        "string.base": "Status must be a string",
        "any.only": "Status must be either 'available' or 'not available'"
      }),
    file: generalFeilds.file
  })
  .required()
  .min(1) // Ensure at least one field is provided for update
  .messages({
    "object.min": "At least one field must be provided to update"
  });

// Improved delete category schema with better error messages
export const deleteCategorySchema = joi
  .object({
    categoryId: generalFeilds.id
      .required()
      .messages({
        "any.required": "Category ID is required for deletion"
      })
  })
  .required();