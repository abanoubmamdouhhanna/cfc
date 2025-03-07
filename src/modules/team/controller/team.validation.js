import joi from "joi";
import { generalFeilds } from "../../../middlewares/validation.middleware.js";

export const headersSchema = generalFeilds.headers;

export const addTeamSchema = joi
  .object({
    diversity: joi.string().trim().required().messages({
      'string.empty': 'Diversity field cannot be empty',
      'any.required': 'Diversity field is required'
    }),
    name: joi.array().items(
      joi.string().trim().messages({
        'string.empty': 'Name items cannot be empty strings'
      })
    ).min(1).required().messages({
      'array.min': 'At least one name is required',
      'any.required': 'Names array is required'
    }),
    title: joi.array().items(
      joi.string().trim().messages({
        'string.empty': 'Title items cannot be empty strings'
      })
    ).min(1).required().messages({
      'array.min': 'At least one title is required',
      'any.required': 'Titles array is required'
    }),
    file: joi.object({
      memberImage: joi
        .array()
        .items(generalFeilds.file)
        .min(1)
        .max(20)
        .required()
        .messages({
          'array.min': 'At least one member image is required',
          'array.max': 'Maximum of 20 member images allowed',
          'any.required': 'Member images are required'
        }),
    }).required().messages({
      'any.required': 'File object is required'
    }),
  })
  .required();

export const updateTeamSchema = joi
  .object({
    teamId: generalFeilds.id,
    diversity: joi.string().trim().messages({
      'string.empty': 'Diversity field cannot be empty'
    }),
    name: joi.array().items(
      joi.string().trim().messages({
        'string.empty': 'Name items cannot be empty strings'
      })
    ).min(1).messages({
      'array.min': 'At least one name is required'
    }),
    title: joi.array().items(
      joi.string().trim().messages({
        'string.empty': 'Title items cannot be empty strings'
      })
    ).min(1).messages({
      'array.min': 'At least one title is required'
    }),
    file: joi.object({
      memberImage: joi
        .array()
        .items(generalFeilds.file)
        .min(1)
        .max(20)
        .messages({
          'array.min': 'At least one member image is required',
          'array.max': 'Maximum of 20 member images allowed'
        }),
    }),
  })
  .required();