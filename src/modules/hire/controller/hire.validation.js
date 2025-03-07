import joi from "joi";
import { generalFeilds } from "../../../middlewares/validation.middleware.js";

export const headersSchema = generalFeilds.headers;

// Define constants for reusability
const HIRE_TYPES = ["fullTime", "partTime", "seasonal"];

// Shared fields for reuse across schemas
const hireFields = {
  title: joi.string().trim().min(3).max(100),
  address: joi.string().trim().min(5),
  type: joi.string().valid(...HIRE_TYPES),
  description: joi.string().trim().min(10)
};

export const addHireSchema = joi
  .object({
    title: hireFields.title.required(),
    address: hireFields.address.required(),
    type: hireFields.type.required(),
    description: hireFields.description.required()
  })
  .required();

export const updateHireSchema = joi
  .object({
    hireId: generalFeilds.id,
    title: hireFields.title,
    address: hireFields.address,
    type: hireFields.type,
    description: hireFields.description
  })
  .required();

export const deleteHireSchema = joi
  .object({
    hireId: generalFeilds.id
  })
  .required();