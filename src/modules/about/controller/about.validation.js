import joi from "joi";
import { generalFeilds } from "../../../middlewares/validation.middleware.js";

export const headersSchema = generalFeilds.headers;

export const addAboutSchema = joi
  .object({
    welcomeText: joi.string().required(),
    ourValues: joi.array().items(joi.string()).required(),
    missionText: joi.array().items(joi.string()).required(),
    wayOfDoingBusiness: joi.array().items(joi.string()).required(),
    freshManifestoText: joi.string().required(),
      file: joi.object({
        manifestoImage: joi.array().items(generalFeilds.file).min(1).max(10).required(),
        welcomeImage: joi.array().items(generalFeilds.file).length(1).required(),
        missionImage: joi.array().items(generalFeilds.file).min(1).max(20).required(),
        }),
  })
  .required();

  
export const updateAboutSchema = joi
.object({
  aboutId:generalFeilds.id,
  welcomeText: joi.string(),
  ourValues: joi.array().items(joi.string()),
  missionText: joi.array().items(joi.string()),
  wayOfDoingBusiness: joi.array().items(joi.string()),
  freshManifestoText: joi.string(),
    file: joi.object({
      manifestoImage: joi.array().items(generalFeilds.file).min(1).max(10),
      welcomeImage: joi.array().items(generalFeilds.file).length(1),
      missionImage: joi.array().items(generalFeilds.file).min(1).max(20),
      }),
})
.required();
