import joi from "joi";
import { generalFeilds } from "../../../middlewares/validation.middleware.js";

export const headersSchema = generalFeilds.headers;

export const adddCareerSchema = joi
  .object({
    whyCFC: joi.string().required(),
    coreValues: joi
      .array()
      .items({
        coreTile: joi.string(),
        coredescription: joi.string(),
      })
      .required(),
    benefits: joi.array().items(joi.string()).required(),
  })
  .required();

export const updateCareerSchema = joi
  .object({
    careerId:generalFeilds.id,
    whyCFC: joi.string(),
    coreValues: joi.array().items({
      coreTile: joi.string(),
      coredescription: joi.string(),
    }),
    benefits: joi.array().items(joi.string()),
  })
  .required();
