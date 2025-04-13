import joi from "joi";
import { generalFeilds } from "../../../middlewares/validation.middleware.js";

export const headersSchema = generalFeilds.headers;
export const addMealSchema = joi
  .object({
    title: generalFeilds.mealName.required(),
    description: generalFeilds.description.required(),
    price: generalFeilds.price.required(),
    compoPrice: generalFeilds.price.required(),
    discount: generalFeilds.discont,
    size: joi.array().items(joi.string().trim()).messages({
      'array.base': 'Size must be an array'
    }),
    file: generalFeilds.file.required(),
  })
  .required();

  export const updateMealSchema = joi
  .object({
    mealId: generalFeilds.id,
    title: generalFeilds.mealName,
    description: generalFeilds.description,
    price: generalFeilds.price,
    compoPrice: generalFeilds.price,
    discount: generalFeilds.discont,
    size: joi.array().items(joi.string().trim()).messages({
      'array.base': 'Size must be an array'
    }),
    file: generalFeilds.file,
  })
  .required()
  .min(2)
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