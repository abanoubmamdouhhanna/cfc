import joi from "joi";
import { generalFeilds } from "../../../middlewares/validation.middleware.js";

// Enhanced headers schema with better reuse
export const headersSchema = generalFeilds.headers;

// Improved create coupon schema with better validation messages
export const createCouponSchema = joi
  .object({
    name: generalFeilds.name
      .uppercase()
      .required()
      .messages({
        'string.empty': 'Coupon name cannot be empty',
        'any.required': 'Coupon name is required'
      }),
    amount: joi
      .number()
      .positive()
      .min(1)
      .max(100)
      .required()
      .messages({
        'number.base': 'Amount must be a number',
        'number.positive': 'Amount must be positive',
        'number.min': 'Amount must be at least 1%',
        'number.max': 'Amount cannot exceed 100%',
        'any.required': 'Discount amount is required'
      }),
    expire: joi
      .date()
      .greater(Date.now())
      .required()
      .messages({
        'date.base': 'Expiration must be a valid date',
        'date.greater': 'Expiration date must be in the future',
        'any.required': 'Expiration date is required'
      }),
    file: generalFeilds.file,
  })
  .required();

// Improved update coupon schema with consistent validation
export const updateCouponSchema = joi
  .object({
    couponId: generalFeilds.id
      .required()
      .messages({
        'any.required': 'Coupon ID is required'
      }),
    name: generalFeilds.name
      .uppercase()
      .messages({
        'string.empty': 'Coupon name cannot be empty'
      }),
    amount: joi
      .number()
      .positive()
      .min(1)
      .max(100)
      .messages({
        'number.base': 'Amount must be a number',
        'number.positive': 'Amount must be positive',
        'number.min': 'Amount must be at least 1%',
        'number.max': 'Amount cannot exceed 100%'
      }),
    expire: joi
      .date()
      .greater(Date.now())
      .messages({
        'date.base': 'Expiration must be a valid date',
        'date.greater': 'Expiration date must be in the future'
      }),
    file: generalFeilds.file,
  })
  .required();

// Improved delete coupon schema
export const deleteCouponSchema = joi
  .object({
    couponId: generalFeilds.id
      .required()
      .messages({
        'string.empty': 'Coupon ID cannot be empty',
        'any.required': 'Coupon ID is required'
      }),
  })
  .required();