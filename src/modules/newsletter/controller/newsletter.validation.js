import joi from "joi";
import { generalFeilds } from "../../../middlewares/validation.middleware.js";

export const headersSchema = generalFeilds.headers;
export const addnewsLetterSchema = joi
  .object({
    location:joi.string().required(),
    email:generalFeilds.email.required()
  })
  .required();

export const deletenewsLetterSchema = joi
  .object({
    newsLetterId: generalFeilds.id.required(),
  })
  .required();
