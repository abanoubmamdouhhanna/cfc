import joi from "joi";
import { generalFeilds } from "../../../middlewares/validation.middleware.js";

export const headersSchema = generalFeilds.headers;

export const updateUserSchema = joi
  .object({
    email:generalFeilds.email,
    phone: generalFeilds.phone,
    firstName: generalFeilds.firstName,
    lastName: generalFeilds.lastName,
  })
  .required();

export const changePasswordSchema = joi
  .object({
    oldPassword: generalFeilds.password,
    newPassword: generalFeilds.password.invalid(joi.ref("oldPassword")),
    cPassword: joi.string().valid(joi.ref("newPassword")).required(),
  })
  .required();
