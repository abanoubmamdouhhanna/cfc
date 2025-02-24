import joi from "joi";
import { generalFeilds } from "../../../middlewares/validation.middleware.js";

export const headersSchema = generalFeilds.headers;
export const addJobSchema = joi
  .object({
    hireId: generalFeilds.id.required(),
    firstName: joi.string().min(3).max(20).required(),
    middleName: joi.string().min(1).max(20).required(),
    lastName: joi.string().min(3).max(20).required(),
    address: joi.string().required(),
    city: joi.string().required(),
    state: joi.string().required(),
    postalCode: joi.number().required(),
    email:generalFeilds.email.required(),
    phone: joi.string().required(),
    ssn: joi.string().required(),
    dateAvialabe: joi.date().required(),
    desiredPay: joi.number().required(),
    position: joi.string().required(),
    employmentDesired: joi
      .string()
      .valid("fullTime", "partTime", "seasonal")
      .required(),

    USCitizen: joi.boolean().required(),
    allowToWork: joi.boolean(),
    everWorkedForEmployer: joi.boolean().required(),
    ifWorked: joi.string().allow(null, ""),
    areConvicted: joi.boolean().required(),
    ifConvicted: joi.string().allow(null, ""),

    highSchool: joi.string().required(),
    eduCity: joi.string().required(),
    eduState: joi.string().required(),
    from: joi.date().required(),
    to: joi.date().required(),
    graduate: joi.boolean(),
    diploma: joi.string().required(),

    college: joi.string().required(),
    collegeCity: joi.string().required(),
    collegeState: joi.string().required(),
    collegeFrom: joi.date().required(),
    collegeTo: joi.date().required(),
    collegeGraduate: joi.boolean(),
    degree: joi.string().required(),
    file: generalFeilds.file,
  })
  .required();

export const deleteJobSchema = joi
  .object({
    jobId: generalFeilds.id.required(),
  })
  .required();
