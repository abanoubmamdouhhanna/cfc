import joi from "joi";
import { generalFeilds } from "../../../middlewares/validation.middleware.js";

export const headersSchema = generalFeilds.headers;
const types = [
  "Start your own CFC",
  "Suggest a CFC location",
  "Customer Service",
  "Food Quality",
  "General Feedback",
  "Online Orders",
  "Vendor Inquiries",
  "Donations & Sponsorship Inquiries",
];
export const addFeedbackSchema = joi
  .object({
    feedBackType: joi
      .string()
      .valid(...types)
      .required(),
    name: joi.string().required(),
    email: generalFeilds.email.required(),
    state: joi
      .string()
      .valid(...generalFeilds.validStates)
      .required()
      .default("North Carolina"),
    phone: generalFeilds.USAphone,
    message: joi.string().required(),
    newLocationAdress: joi.string(),
    city: joi.string(),
    postalCode: generalFeilds.postalCode,
  })
  .required();

export const deleteFeedbackSchema = joi
  .object({
    feedbackId: generalFeilds.id.required(),
  })
  .required();
