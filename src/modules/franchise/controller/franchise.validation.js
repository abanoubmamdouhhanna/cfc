import joi from "joi";
import { generalFeilds } from "../../../middlewares/validation.middleware.js";

// Export headers schema from generalFields
export const headersSchema = generalFeilds.headers;

// Reusable schema components to maintain consistency and reduce duplication
const stringArraySchema = joi.array().items(joi.string().trim());
const processImageSchema = joi.array().items(generalFeilds.file).min(1).max(20);

// Main schema for adding a franchise
export const addFranchiseSchema = joi
  .object({
    welcomeText: joi.string().trim().required()
      .messages({
        'string.empty': 'Welcome text cannot be empty',
        'any.required': 'Welcome text is required'
      }),
    
    whyChooseCFC: stringArraySchema.required()
      .messages({
        'array.base': 'Why choose CFC must be an array',
        'any.required': 'Why choose CFC points are required'
      }),
    
    benfits: stringArraySchema.required()
      .messages({
        'array.base': 'Benefits must be an array',
        'any.required': 'Benefits are required'
      }),
    
    processText: stringArraySchema.required()
      .messages({
        'array.base': 'Process text must be an array',
        'any.required': 'Process text is required'
      }),
    
    file: joi.object({
      processImage: processImageSchema.required()
        .messages({
          'array.min': 'At least one process image is required',
          'array.max': 'Cannot upload more than 20 process images',
          'any.required': 'Process images are required'
        }),
    }).required(),
  })
  .required();

// Schema for updating a franchise - Reuses patterns from add schema
export const updateFranchiseSchema = joi
  .object({
    franchiseId: generalFeilds.id,
    
    welcomeText: joi.string().trim()
      .messages({
        'string.empty': 'Welcome text cannot be empty'
      }),
    
    whyChooseCFC: stringArraySchema
      .messages({
        'array.base': 'Why choose CFC must be an array'
      }),
    
    benfits: stringArraySchema
      .messages({
        'array.base': 'Benefits must be an array'
      }),
    
    processText: stringArraySchema
      .messages({
        'array.base': 'Process text must be an array'
      }),
    
    file: joi.object({
      processImage: processImageSchema
        .messages({
          'array.min': 'At least one process image is required',
          'array.max': 'Cannot upload more than 20 process images'
        }),
    }),
  })
  .required();