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
    flavor: joi.array().items(joi.string()), // Ensure it's an array
    size: joi.array().items(joi.string()), // Ensure it's an array
    file: generalFeilds.file.required(),
  })
  .required();

export const updateMealSchema = joi
  .object({
    mealId: generalFeilds.id,
    title: generalFeilds.mealName,
    description: generalFeilds.description,
    flavor: joi.array().items(joi.string().min(1)), // Ensure it's an array
    size: joi.array().items(joi.string()), // Ensure it's an array
    price: generalFeilds.price,
    discount: generalFeilds.discont,
    categoryId: generalFeilds.id,
    subcategoryId: generalFeilds.id,
    file: generalFeilds.file,
  })
  .required();

export const wishlistSchema = joi
  .object({
    categoryId: generalFeilds.id,
    subcategoryId: generalFeilds.id,
    mealId: generalFeilds.id,
  })
  .required();

export const deleteMealSchema = joi
  .object({
    categoryId: generalFeilds.id,
    subcategoryId: generalFeilds.id,
    mealId: generalFeilds.id,
  })
  .required();
