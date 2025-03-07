import joi from "joi";
import { generalFeilds } from "../../../middlewares/validation.middleware.js";

// Consistent export pattern with clear naming
export const headersSchema = generalFeilds.headers;

// Create schema with improved messages
export const createSubcategorySchema = joi
  .object({
    categoryId: generalFeilds.id
      .messages({
        "any.required": "Category ID is required",
        "string.empty": "Category ID cannot be empty"
      }),
    name: generalFeilds.name.required()
      .messages({
        "any.required": "Subcategory name is required",
        "string.empty": "Subcategory name cannot be empty"
      }),
    file: generalFeilds.file.required()
      .messages({
        "any.required": "File is required"
      }),
  })
  .required();

// Update schema with descriptive error messages
export const updateSubcategorySchema = joi
  .object({
    categoryId: generalFeilds.id
      .messages({
        "any.required": "Category ID is required",
        "string.empty": "Category ID cannot be empty"
      }),
    subcategoryId: generalFeilds.id
      .messages({
        "any.required": "Subcategory ID is required",
        "string.empty": "Subcategory ID cannot be empty"
      }),
    name: generalFeilds.name
      .messages({
        "string.empty": "Subcategory name cannot be empty"
      }),
    file: generalFeilds.file,
  })
  .required();

// Delete schema with custom error messages
export const deleteSubcategorySchema = joi
  .object({ 
    categoryId: generalFeilds.id
      .messages({
        "any.required": "Category ID is required",
        "string.empty": "Category ID cannot be empty"
      }),
    subcategoryId: generalFeilds.id
      .messages({
        "any.required": "Subcategory ID is required",
        "string.empty": "Subcategory ID cannot be empty"
      }),
  })
  .required();