import joi from "joi";
import { generalFeilds } from "../../../middlewares/validation.middleware.js";

export const headersSchema = generalFeilds.headers;

export const addFranchiseSchema = joi
  .object({
    welcomeText: joi.string().required(),
    whyChooseCFC: joi.array().items(joi.string()).required(),
    benfits: joi.array().items(joi.string()).required(),

    processText: joi.array().items(joi.string()).required(),

    file: joi.object({
      processImage: joi
        .array()
        .items(generalFeilds.file)
        .min(1)
        .max(20)
        .required(),
    }),
  })
  .required();

export const updateFranchiseSchema = joi
  .object({
    franchiseId: generalFeilds.id,
    welcomeText: joi.string(),
    whyChooseCFC: joi.array().items(joi.string()),
    benfits: joi.array().items(joi.string()),

    processText: joi.array().items(joi.string()),

    file: joi.object({
      processImage: joi
        .array()
        .items(generalFeilds.file)
        .min(1)
        .max(20)
    }),
  })
  .required();
