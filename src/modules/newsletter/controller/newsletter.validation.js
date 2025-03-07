import joi from "joi";
import { generalFeilds } from "../../../middlewares/validation.middleware.js";

// Re-export headers schema for consistency
export const headersSchema = generalFeilds.headers;

// Enhanced newsletter subscription schema with better validation
export const addnewsLetterSchema = joi
  .object({
    location: joi.string().trim().min(2).max(100)
      .message({
        'string.empty': 'Location cannot be empty',
        'string.min': 'Location must be at least 2 characters long',
        'string.max': 'Location cannot exceed 100 characters'
      }).required(),
    email: generalFeilds.email.required()
  })
  .required();

// Enhanced newsletter deletion schema with improved validation
export const deletenewsLetterSchema = joi
  .object({
    newsLetterId: generalFeilds.id
      .required()
      .messages({
        'any.required': 'Newsletter ID is required',
        'string.empty': 'Newsletter ID cannot be empty'
      }),
  })
  .required();