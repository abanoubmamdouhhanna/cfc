import joi from "joi";
import { generalFeilds } from "../../../middlewares/validation.middleware.js";

export const headersSchema = generalFeilds.headers;

// Define constants at the top for better maintainability
const FEEDBACK_TYPES = [
  "Start your own CFC",
  "Suggest a CFC location",
  "Customer Service",
  "Food Quality",
  "General Feedback",
  "Online Orders",
  "Vendor Inquiries",
  "Donations & Sponsorship Inquiries",
];

export const addFeedbackSchema = joi
  .object({
    feedBackType: joi
      .string()
      .valid(...FEEDBACK_TYPES)
      .required()
      .messages({
        'any.only': 'Feedback type must be one of the predefined types',
        'any.required': 'Feedback type is required'
      }),
    name: joi
      .string()
      .trim()
      .min(2)
      .max(100)
      .required()
      .messages({
        'string.min': 'Name must be at least 2 characters',
        'string.max': 'Name cannot exceed 100 characters',
        'any.required': 'Name is required'
      }),
    email: generalFeilds.email.required(),
    state: joi
      .string()
      .valid(...generalFeilds.validStates)
      .required()
      .default("North Carolina")
      .messages({
        'any.only': 'State must be a valid US state',
        'any.required': 'State is required'
      }),
    phone: generalFeilds.USAphone,
    message: joi
      .string()
      .trim()
      .min(10)
      .max(2000)
      .required()
      .messages({
        'string.min': 'Message must be at least 10 characters',
        'string.max': 'Message cannot exceed 2000 characters',
        'any.required': 'Message is required'
      }),
    newLocationAdress: joi
      .string()
      .trim()
      .max(200)
      .when('feedBackType', {
        is: 'Suggest a CFC location',
        then: joi.required(),
        otherwise: joi.optional()
      })
      .messages({
        'string.max': 'Address cannot exceed 200 characters',
        'any.required': 'New location address is required for location suggestions'
      }),
    city: joi
      .string()
      .trim()
      .max(100)
      .when('feedBackType', {
        is: 'Suggest a CFC location',
        then: joi.required(),
        otherwise: joi.optional()
      })
      .messages({
        'string.max': 'City cannot exceed 100 characters',
        'any.required': 'City is required for location suggestions'
      }),
    postalCode: generalFeilds.postalCode
      .when('feedBackType', {
        is: 'Suggest a CFC location',
        then: joi.required(),
        otherwise: joi.optional()
      })
      .messages({
        'any.required': 'Postal code is required for location suggestions'
      }),
  })
  .required();

export const deleteFeedbackSchema = joi
  .object({
    feedbackId: generalFeilds.id
      .required()
      .messages({
        'any.required': 'Feedback ID is required for deletion'
      }),
  })
  .required();