import joi from "joi";
import { generalFeilds } from "../../../middlewares/validation.middleware.js";

export const headersSchema = generalFeilds.headers;

export const addMealSchema = joi
  .object({
    categoryId: generalFeilds.id,
    subcategoryId: generalFeilds.id,
    title: generalFeilds.mealName.required(),
    description: generalFeilds.description.required(),
    price: generalFeilds.price.required(),
    discount: generalFeilds.discont,
    flavor: joi.array().items(joi.string().trim()).min(1).messages({
      'array.min': 'At least one flavor must be provided',
      'array.base': 'Flavor must be an array'
    }),
    size: joi.array().items(joi.string().trim()).messages({
      'array.base': 'Size must be an array'
    }),
    file: generalFeilds.file.required(),
  })
  .required();

export const updateMealSchema = joi
  .object({
    mealId: generalFeilds.id,
    categoryId: generalFeilds.id,
    subcategoryId: generalFeilds.id,
    title: generalFeilds.mealName,
    description: generalFeilds.description,
    price: generalFeilds.price,
    discount: generalFeilds.discont,
    flavor: joi.array().items(joi.string().trim()).messages({
      'array.base': 'Flavor must be an array'
    }),
    size: joi.array().items(joi.string().trim()).messages({
      'array.base': 'Size must be an array'
    }),
    file: generalFeilds.file,
  })
  .required()
  .min(2) // Requires at least one field to update besides mealId
  .messages({
    'object.min': 'At least one field must be provided for update'
  });


export const deleteMealSchema = joi
  .object({
    mealId: generalFeilds.id,
    categoryId: generalFeilds.id,
    subcategoryId: generalFeilds.id,
  })
  .required();