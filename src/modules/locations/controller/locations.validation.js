import joi from "joi";
import { generalFeilds } from "../../../middlewares/validation.middleware.js";

export const headersSchema = generalFeilds.headers;

export const adddLocationSchema = joi
  .object({
    file: generalFeilds.file.required()
      .messages({
        'any.required': 'Location image file is required'
      }),
    title: joi.string().required().trim()
      .messages({
        'string.empty': 'Location title is required',
        'any.required': 'Location title is required'
      }),
    address: joi.string().required().trim()
      .messages({
        'string.empty': 'Location address is required',
        'any.required': 'Location address is required'
      }),
    hours: joi.string().required().trim()
      .messages({
        'string.empty': 'Operating hours are required',
        'any.required': 'Operating hours are required'
      }),
    locationURL: joi.string().required().uri()
      .messages({
        'string.empty': 'Location URL is required',
        'string.uri': 'Location URL must be a valid URL',
        'any.required': 'Location URL is required'
      }),
    phone: generalFeilds.USAphone
      .messages({
        'string.pattern.base': 'Phone number must be a valid US phone number'
      }),
    taxRate: joi.number().min(0).max(100).default(7)
      .messages({
        'number.min': 'Tax rate cannot be less than 0%',
        'number.max': 'Tax rate cannot be more than 100%',
        'number.base': 'Tax rate must be a number'
      }),
  })
  .required();

export const updateLocationSchema = joi
  .object({
    locationId: generalFeilds.id
      .messages({
        'string.pattern.base': 'Invalid location ID format',
        'any.required': 'Location ID is required'
      }),
    file: generalFeilds.file,
    title: joi.string().trim(),
    address: joi.string().trim(),
    hours: joi.string().trim(),
    locationURL: joi.string().uri()
      .messages({
        'string.uri': 'Location URL must be a valid URL'
      }),
    phone: generalFeilds.USAphone
      .messages({
        'string.pattern.base': 'Phone number must be a valid US phone number'
      }),
    taxRate: joi.number().min(0).max(100)
      .messages({
        'number.min': 'Tax rate cannot be less than 0%',
        'number.max': 'Tax rate cannot be more than 100%',
        'number.base': 'Tax rate must be a number'
      }),
  })
  .required();

export const deleteLocationSchema = joi
  .object({
    locationId: generalFeilds.id
      .messages({
        'string.pattern.base': 'Invalid location ID format',
        'any.required': 'Location ID is required'
      }),
  })
  .required();