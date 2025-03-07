import joi from "joi";
import { generalFeilds } from "../../../middlewares/validation.middleware.js";

export const headersSchema = generalFeilds.headers;
export const addJobSchema = joi
  .object({
    hireId: generalFeilds.id,
    // Personal information - group related fields
    firstName: joi.string().trim().min(3).max(20).required(),
    middleName: joi.string().trim().min(1).max(20).required(),
    lastName: joi.string().trim().min(3).max(20).required(),
    // Contact information - standardize validation
    email: generalFeilds.email.required(),
    phone: generalFeilds.USAphone.required().messages({
      "string.pattern.base":
        "Phone number must contain only digits, spaces, and the characters +, -, (, )",
    }),
    // Address information - better validation
    address: joi.string().trim().max(100).required(),
    city: joi.string().trim().max(50).required(),
    state: joi
      .string()
      .trim()
      .length(2)
      .required()
      .messages({ "string.length": "State must be a 2-letter code" }),
    postalCode: joi
      .string()
      .pattern(/^\d{5}(-\d{4})?$/)
      .required()
      .messages({
        "string.pattern.base":
          "Postal code must be in format 12345 or 12345-6789",
      }),
    // Identity information - add pattern for SSN
    ssn: joi
      .string()
      .pattern(/^\d{3}-\d{2}-\d{4}$/)
      .required()
      .messages({ "string.pattern.base": "SSN must be in format 123-45-6789" }),
    // Employment details
    dateAvialabe: joi
      .date()
      .min("now")
      .required()
      .messages({ "date.min": "Available date must be in the future" }),
    desiredPay: joi.number().positive().precision(2).required(),
    position: joi.string().trim().required(),
    employmentDesired: joi
      .string()
      .valid("fullTime", "partTime", "seasonal")
      .required(),
    // Legal status
    USCitizen: joi.boolean().required(),
    allowToWork: joi.boolean().when("USCitizen", {
      is: false,
      then: joi.boolean().required(),
      otherwise: joi.boolean().optional(),
    }),
    everWorkedForEmployer: joi.boolean().required(),
    ifWorked: joi
      .string()
      .trim()
      .max(200)
      .when("everWorkedForEmployer", {
        is: true,
        then: joi.string().required(),
        otherwise: joi.string().allow(null, ""),
      }),
    areConvicted: joi.boolean().required(),
    ifConvicted: joi
      .string()
      .trim()
      .max(500)
      .when("areConvicted", {
        is: true,
        then: joi.string().required(),
        otherwise: joi.string().allow(null, ""),
      }),
    // Education - High School
    highSchool: joi.string().trim().required(),
    eduCity: joi.string().trim().required(),
    eduState: joi
      .string()
      .trim()
      .length(2)
      .required()
      .messages({ "string.length": "State must be a 2-letter code" }),
    from: joi.date().required(),
    to: joi
      .date()
      .min(joi.ref("from"))
      .required()
      .messages({ "date.min": "End date must be after start date" }),
    graduate: joi.boolean().required(),
    diploma: joi.string().trim().required(),
    // Education - College
    college: joi.string().trim().required(),
    collegeCity: joi.string().trim().required(),
    collegeState: joi
      .string()
      .trim()
      .length(2)
      .required()
      .messages({ "string.length": "State must be a 2-letter code" }),
    collegeFrom: joi.date().required(),
    collegeTo: joi
      .date()
      .min(joi.ref("collegeFrom"))
      .required()
      .messages({ "date.min": "End date must be after start date" }),
    collegeGraduate: joi.boolean().required(),
    degree: joi.string().trim().required(),
    // File upload
    file: generalFeilds.file,
  })
  .required();

export const deleteJobSchema = joi
  .object({
    jobId: generalFeilds.id,
  })
  .required();
