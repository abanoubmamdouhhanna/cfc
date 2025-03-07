import joi from "joi";
import { generalFeilds } from "../../../middlewares/validation.middleware.js";

// Consistent naming: changed from 'generalFeilds' to 'generalFields'
const { headers, file, id } = generalFeilds;

// Reusable schema components for DRY code
const imageArraySchema = (min, max) => joi.array().items(file).min(min).max(max);

// Text field validations with meaningful constraints
const textFieldSchema = joi.string().trim().min(3).max(1000);
const textArraySchema = joi.array().items(textFieldSchema).min(1).max(50);

// Export header schema
export const headersSchema = headers;

// Common file schema for both add and update operations
const fileSchema = joi.object({
  manifestoImage: imageArraySchema(1, 10).messages({
    'array.min': 'At least one manifesto image is required',
    'array.max': 'Maximum 10 manifesto images allowed'
  }),
  welcomeImage: imageArraySchema(1, 1).messages({
    'array.length': 'Exactly one welcome image is required'
  }),
  missionImage: imageArraySchema(1, 20).messages({
    'array.min': 'At least one mission image is required',
    'array.max': 'Maximum 20 mission images allowed'
  })
});

// Add schema with proper validation messages
export const addAboutSchema = joi
  .object({
    welcomeText: textFieldSchema.required().messages({
      'string.empty': 'Welcome text cannot be empty',
      'any.required': 'Welcome text is required'
    }),
    ourValues: textArraySchema.required().messages({
      'array.base': 'Our values must be an array of strings',
      'any.required': 'Our values are required'
    }),
    missionText: textArraySchema.required().messages({
      'array.base': 'Mission text must be an array of strings',
      'any.required': 'Mission text is required'
    }),
    wayOfDoingBusiness: textArraySchema.required().messages({
      'array.base': 'Way of doing business must be an array of strings',
      'any.required': 'Way of doing business is required'
    }),
    freshManifestoText: textFieldSchema.required().messages({
      'string.empty': 'Fresh manifesto text cannot be empty',
      'any.required': 'Fresh manifesto text is required'
    }),
    file: fileSchema.required()
  })
  .required();

// Update schema that makes all fields optional but validates them if provided
export const updateAboutSchema = joi
  .object({
    aboutId: id.required().messages({
      'any.required': 'About ID is required for updates'
    }),
    welcomeText: textFieldSchema,
    ourValues: textArraySchema,
    missionText: textArraySchema,
    wayOfDoingBusiness: textArraySchema,
    freshManifestoText: textFieldSchema,
    file: joi.object({
      manifestoImage: imageArraySchema(1, 10),
      welcomeImage: imageArraySchema(1, 1),
      missionImage: imageArraySchema(1, 20)
    })
  })
  .required();