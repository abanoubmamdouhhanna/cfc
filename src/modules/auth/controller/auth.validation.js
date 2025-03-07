import joi from 'joi';
import { generalFeilds } from '../../../middlewares/validation.middleware.js';

// Common message templates for better error handling
const errorMessages = {
  required: '{#label} is required',
  email: '{#label} must be a valid email address',
  password: '{#label} must be at least 8 characters and include uppercase, lowercase, number and special character',
  phone: '{#label} must be a valid phone number',
  match: '{#label} must match the password'
};

// Define authentication related schemas
export const headersSchema = generalFeilds.headers;

// User registration schema
export const authRegisterSchema = joi.object({
  email: generalFeilds.email
    .required()
    .messages({
      'string.empty': errorMessages.required,
      'string.email': errorMessages.email,
      'any.required': errorMessages.required
    }),

  firstName: generalFeilds.firstName
    .required()
    .messages({
      'string.empty': errorMessages.required,
      'any.required': errorMessages.required
    }),

  lastName: generalFeilds.lastName
    .required()
    .messages({
      'string.empty': errorMessages.required,
      'any.required': errorMessages.required
    }),

  password: generalFeilds.password
    .required()
    .messages({
      'string.empty': errorMessages.required,
      'string.pattern.base': errorMessages.password,
      'any.required': errorMessages.required
    }),

  cPassword: generalFeilds.cPassword
    .valid(joi.ref("password"))
    .required()
    .messages({
      'string.empty': errorMessages.required,
      'any.only': errorMessages.match,
      'any.required': errorMessages.required
    }),

  phone: generalFeilds.USAphone
    .required()
    .messages({
      'string.empty': errorMessages.required,
      'string.pattern.base': errorMessages.phone,
      'any.required': errorMessages.required
    }),
}).required();

// Admin creation schema
export const addAdminSchema = joi.object({
  locationId: generalFeilds.id
    .optional()
    .messages({
      'string.pattern.base': 'Invalid location ID format'
    }),
    
  email: generalFeilds.email
    .required()
    .messages({
      'string.empty': errorMessages.required,
      'string.email': errorMessages.email,
      'any.required': errorMessages.required
    }),

  firstName: generalFeilds.firstName
    .required()
    .messages({
      'string.empty': errorMessages.required,
      'any.required': errorMessages.required
    }),

  lastName: generalFeilds.lastName
    .required()
    .messages({
      'string.empty': errorMessages.required,
      'any.required': errorMessages.required
    }),

  password: generalFeilds.password
    .required()
    .messages({
      'string.empty': errorMessages.required,
      'string.pattern.base': errorMessages.password,
      'any.required': errorMessages.required
    }),

  cPassword: generalFeilds.cPassword
    .valid(joi.ref("password"))
    .required()
    .messages({
      'string.empty': errorMessages.required,
      'any.only': errorMessages.match,
      'any.required': errorMessages.required
    }),

  phone: generalFeilds.USAphone
    .required()
    .messages({
      'string.empty': errorMessages.required,
      'string.pattern.base': errorMessages.phone,
      'any.required': errorMessages.required
    }),
}).required();

// User login schema
export const logInSchema = joi.object({
  email: generalFeilds.email
    .required()
    .messages({
      'string.empty': errorMessages.required,
      'string.email': errorMessages.email,
      'any.required': errorMessages.required
    }),

  password: generalFeilds.password
    .required()
    .messages({
      'string.empty': errorMessages.required,
      'any.required': errorMessages.required
    }),
}).required();

// Account reactivation schema
export const reActivateAccSchema = joi.object({
  email: generalFeilds.email
    .required()
    .messages({
      'string.empty': errorMessages.required,
      'string.email': errorMessages.email,
      'any.required': errorMessages.required
    }),
}).required();

// Password recovery schema
export const forgetPasswordSchema = joi.object({
  email: generalFeilds.email
    .required()
    .messages({
      'string.empty': errorMessages.required,
      'string.email': errorMessages.email,
      'any.required': errorMessages.required
    }),
}).required();

// Reset password with OTP schema
export const resetPasswordOTPSchema = joi.object({
  userEmail: generalFeilds.email
    .required()
    .messages({
      'string.empty': errorMessages.required,
      'string.email': errorMessages.email,
      'any.required': errorMessages.required
    }),
    
  password: generalFeilds.password
    .required()
    .messages({
      'string.empty': errorMessages.required,
      'string.pattern.base': errorMessages.password,
      'any.required': errorMessages.required
    }),
    
  otp: generalFeilds.otp
    .required()
    .messages({
      'string.empty': errorMessages.required,
      'string.pattern.base': 'Invalid OTP format',
      'any.required': errorMessages.required
    }),
}).required();