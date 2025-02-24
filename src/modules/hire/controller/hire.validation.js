import joi from "joi";
import { generalFeilds } from "../../../middlewares/validation.middleware.js";

export const headersSchema = generalFeilds.headers;
const hireTypes=["fullTime", "partTime", "seasonal"]
export const addHireSchema = joi
  .object({
    title: joi.string().required(),
    address: joi.string().required(),
    type: joi.string().valid(...hireTypes).required(),
    description: joi.string().required(),
  })
  .required();
export const updateHireSchema = joi
  .object({
    hireId: generalFeilds.id.required(),
    title: joi.string(),
    address: joi.string(),
    type: joi.string().valid(...hireTypes),
    description: joi.string(),
  })
  .required();

export const deleteHireSchema = joi
  .object({
    hireId: generalFeilds.id.required(),
  })
  .required();
