import joi from "joi";
import { generalFeilds } from "../../../middlewares/validation.middleware.js";

export const headersSchema = generalFeilds.headers;

export const createSubcategorySchema = joi
  .object({
    categoryId: generalFeilds.id,
    name: generalFeilds.name.required(),
    file: generalFeilds.file.required(),

  })
  .required();

export const updateSubcategorySchema = joi
  .object({
    categoryId: generalFeilds.id,
    subcategoryId: generalFeilds.id,
    name: generalFeilds.name,
    file: generalFeilds.file,

  })
  .required();
export const deleteSubcategorySchema = joi
  .object({ categoryId: generalFeilds.id, subCategoryId: generalFeilds.id })
  .required();
