import joi from "joi";
import { generalFeilds } from "../../../middlewares/validation.middleware.js";

export const headersSchema = generalFeilds.headers;

export const addTeamSchema = joi
  .object({
    diversity: joi.string().required(),
    name: joi.array().items(joi.string()).required(),
    title: joi.array().items(joi.string()).required(),
        file: joi.object({
          memberImage: joi
            .array()
            .items(generalFeilds.file)
            .min(1)
            .max(20)
            .required(),
        }).required(),

  })
  .required();

export const updateTeamSchema = joi
  .object({

    teamId:generalFeilds.id,
    diversity: joi.string(),
    name: joi.array().items(joi.string()),
    title: joi.array().items(joi.string()),
        file: joi.object({
          memberImage: joi
            .array()
            .items(generalFeilds.file)
            .min(1)
            .max(20)
        }),


  })
  .required();
