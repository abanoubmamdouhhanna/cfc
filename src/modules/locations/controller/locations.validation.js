import joi from "joi";
import { generalFeilds } from "../../../middlewares/validation.middleware.js";

export const headersSchema = generalFeilds.headers;

export const adddLocationSchema = joi
  .object({
    file: generalFeilds.file.required(),
    title: joi.string().required(),
    address: joi.string().required(),
    hours: joi.string().required(),
    locationURL: joi.string().required(),
    phone: generalFeilds.USAphone,
    taxRate: joi.number().min(0).max(100).default(7),
  })
  .required();

export const updateLocationSchema = joi
  .object({
    locationId: generalFeilds.id,
    file: generalFeilds.file,
    title: joi.string(),
    address: joi.string(),
    hours: joi.string(),
    locationURL: joi.string(),
    phone: generalFeilds.USAphone,
    taxRate: joi.number().min(0).max(100).default(7),
  })
  .required();

export const deleteLocationSchema = joi
  .object({
    locationId: generalFeilds.id,
  })
  .required();
