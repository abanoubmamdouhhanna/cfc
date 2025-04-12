import joi from "joi";
import { generalFeilds } from "../../../middlewares/validation.middleware.js";

export const headersSchema = generalFeilds.headers;

// Create reusable schema for core values
const coreValueSchema = joi.object({
  coreTile: joi.string().trim().required().messages({
    'string.empty': 'Core title is required',
    'any.required': 'Core title is required'
  }),
  coredescription: joi.string().trim().required().messages({
    'string.empty': 'Core description is required',
    'any.required': 'Core description is required'
  })
});

// Create reusable schema for benefits
const benefitSchema = joi.string().trim().required();

// Base career schema with shared fields
const baseCareerSchema = {
  whyCFC: joi.string().trim().required().messages({
    'string.empty': 'Why CFC field is required',
    'any.required': 'Why CFC field is required'
  }),
  coreValues: joi
    .array()
    .items(coreValueSchema)
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one core value is required',
      'any.required': 'Core values are required'
    }),
  benefits: joi
    .array()
    .items(benefitSchema)
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one benefit is required',
      'any.required': 'Benefits are required'
    })
};

// Add career schema
export const updateCareerSchema = joi
  .object({
    ...baseCareerSchema
  })
  .required();

