import joi from "joi";
import { generalFeilds } from "../../../middlewares/validation.middleware.js";

export const headersSchema = generalFeilds.headers;

export const createCategorySchema = joi
  .object({
    name: generalFeilds.name.required(),
    file: generalFeilds.file.required(),

    
  })
  .required();

export const updateCategorySchema = joi
  .object({
    categoryId: generalFeilds.id,
    name: generalFeilds.name,
    status: joi
      .string()
      .valid("available", "not available")
      .default("available"),
      file: generalFeilds.file,

  })
  .required();

export const deleteCategorySchema = joi
  .object({
    categoryId: generalFeilds.id,
  })
  .required();
