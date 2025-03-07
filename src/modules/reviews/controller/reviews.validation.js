import joi from "joi";
import { generalFeilds } from "../../../middlewares/validation.middleware.js";

// Headers schema remains unchanged
export const headersSchema = generalFeilds.headers;

// Improved createReviewSchema with better error messages and validation
export const createReviewSchema = joi
  .object({
    mealId: generalFeilds.id.messages({
      'any.required': 'Meal ID is required',
      'string.empty': 'Meal ID cannot be empty'
    }),
    comment: joi.string().trim().min(2).max(5000).required().messages({
      'string.base': 'Comment must be a string',
      'string.empty': 'Comment cannot be empty',
      'string.min': 'Comment must be at least {#limit} characters long',
      'string.max': 'Comment cannot exceed {#limit} characters',
      'any.required': 'Comment is required'
    }),
    rating: joi.number().integer().min(1).max(5).required().messages({
      'number.base': 'Rating must be a number',
      'number.integer': 'Rating must be an integer',
      'number.min': 'Rating must be at least {#limit}',
      'number.max': 'Rating cannot exceed {#limit}',
      'any.required': 'Rating is required'
    })
  })
  .required();

// Improved updateReviewSchema with better validation
export const updateReviewSchema = joi
  .object({
    mealId: generalFeilds.id.messages({
      'any.required': 'Meal ID is required',
      'string.empty': 'Meal ID cannot be empty'
    }),
    reviewId: generalFeilds.id.messages({
      'any.required': 'Review ID is required',
      'string.empty': 'Review ID cannot be empty'
    }),
    comment: joi.string().trim().min(2).max(5000).messages({
      'string.base': 'Comment must be a string',
      'string.empty': 'Comment cannot be empty',
      'string.min': 'Comment must be at least {#limit} characters long',
      'string.max': 'Comment cannot exceed {#limit} characters'
    }),
    rating: joi.number().integer().min(1).max(5).messages({
      'number.base': 'Rating must be a number',
      'number.integer': 'Rating must be an integer',
      'number.min': 'Rating must be at least {#limit}',
      'number.max': 'Rating cannot exceed {#limit}'
    })
  })
  .required()
  .min(1) // Require at least one field to be present for updates
  .messages({
    'object.min': 'At least one field must be provided for update'
  });

// Improved deleteReviewSchema
export const deleteReviewSchema = joi
  .object({
    reviewId: generalFeilds.id.messages({
      'any.required': 'Review ID is required',
      'string.empty': 'Review ID cannot be empty'
    }),
  })
  .required();