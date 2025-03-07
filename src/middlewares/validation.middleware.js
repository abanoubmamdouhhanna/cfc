import joi from "joi";
import { Types } from "mongoose";
const checkObjectId = (value, helper) => {
  return Types.ObjectId.isValid(value)
    ? true
    : helper.message("Invalid ObjectId");
};
export const generalFeilds = {
  id: joi.string().custom(checkObjectId).required(),
  optionalId: joi.string().custom(checkObjectId),

  firstName: joi.string().min(3).max(20).messages({
    "any.required": "firstName is required",
    "string.empty": "firstName cant't be empty",
    "string.base": "firstName should be a type of string!",
    "string.min": "firstName should be at least 3 characters!",
    "string.max": "firstName should be less than 20 characters!",
  }),
  lastName: joi.string().min(3).max(20).messages({
    "any.required": "lastName is required",
    "string.empty": "lastName cant't be empty",
    "string.base": "lastName should be a type of string!",
    "string.min": "lastName should be at least 3 characters!",
    "string.max": "lastName should be less than 20 characters!",
  }),
  name: joi.string().min(3).max(200).messages({
    "any.required": "name is required",
    "string.empty": "name cant't be empty",
    "string.base": "name should be a type of string!",
    "string.min": "name should be at least 3 characters!",
    "string.max": "name should be less than 200 characters!",
  }),
  email: joi
    .string()
    .email({ minDomainSegments: 2, tlds: { allow: ["com", "net"] } })
    .messages({
      "string.email": "Email must be valid!!",
      "string.empty": "Email is not allowed to be empty",
    }),
  password: joi
    .string()
    .regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/)
    .messages({
      "string.pattern.base":
        "password must be at least eight characters long, with at least one letter and one number",
    }),

  cPassword: joi.string().messages({
    "any.only": "The confirmation password must be the same as the password",
  }),
   USAphone: joi
    .string()
    .pattern(/^(\+1)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/)
    .messages({ "string.pattern.base": "please Enter a valid phone Number" }),
    mealName: joi.string().min(2).max(50).messages({
      "any.required": "Meal name is required",
      "string.empty": "Meal name cant't be empty",
      "string.base": "Meal name should be a type of string!",
      "string.min": "Meal name should be at least 3 characters!",
      "string.max": "Meal name should be less than 50 characters!",
    }),
    description: joi.string().min(10).messages({
      "any.required": "description is required",
      "string.empty": "description cant't be empty",
      "string.base": "description should be a type of string!",
      "string.min": "description should be at least 10 characters!",
    }),
    price: joi.number().positive().min(1).messages({
      "any.required": "Price is required",
      "number.base": "Price must be number",
      "number.min": " must be greater than or equal to 1",
      "number.positive": "must be positive number",
    }),
    discont: joi.number().positive().min(1).messages({
      "any.required": "Discount is required",
      "number.base": "Discount must be number",
      "number.min": " must be greater than or equal to 1",
      "number.positive": "must be positive number",
    }),
    quantity: joi.number().integer().positive().min(1).messages({
      "any.required": "Quantity is required",
      "number.base": "Quantity must be number",
      "number.min": " must be greater than or equal to 1",
      "number.positive": "must be positive number",
      "number.integer": "must be an integer number",
    }),
  otp: joi
    .string()
    .alphanum()
    .length(8)
    .required()
    .messages({ "string.length": "Invalid OTP code" }),
    postalCode: joi.string()
  .pattern(/^\d{5}(-\d{4})?$/)
  .message("Postal code must be 5 digits or 9 digits with a hyphen (e.g., 12345 or 12345-6789)"),
    
    validStates:[
      "Alabama",
      "Alaska",
      "Arizona",
      "Arkansas",
      "California",
      "Colorado",
      "Connecticut",
      "Delaware",
      "Florida",
      "Georgia",
      "Hawaii",
      "Idaho",
      "Illinois",
      "Indiana",
      "Iowa",
      "Kansas",
      "Kentucky",
      "Louisiana",
      "Maine",
      "Maryland",
      "Massachusetts",
      "Michigan",
      "Minnesota",
      "Mississippi",
      "Missouri",
      "Montana",
      "Nebraska",
      "Nevada",
      "New Hampshire",
      "New Jersey",
      "New Mexico",
      "New York",
      "North Carolina",
      "North Dakota",
      "Ohio",
      "Oklahoma",
      "Oregon",
      "Pennsylvania",
      "Rhode Island",
      "South Carolina",
      "South Dakota",
      "Tennessee",
      "Texas",
      "Utah",
      "Vermont",
      "Virginia",
      "Washington",
      "West Virginia",
      "Wisconsin",
      "Wyoming",
    ],

    ordertDate: joi
    .date()
    .min(new Date().toISOString().split("T")[0])
    .messages({
      "date.base": "Order date must be a valid date.",
      "date.greater": "Order date must be today or in the future.",
      "any.required": "Order date is required.",
    })
    .required(),

  orderTime: joi 
    .string()
    .custom((value, helpers) => {
      const validTimes = ["09:30", "09:45"];
      const minutes = ["00", "15", "30", "45"];
      
      for (let hour = 10; hour <= 20; hour++) {
        for (const min of minutes) {
          // Skip adding "20:45" to match the original logic
          if (hour === 20 && min === "45") continue;
          validTimes.push(`${hour.toString().padStart(2, "0")}:${min}`);
        }
      }
      if (!validTimes.includes(value)) {
        return helpers.message(
          `Invalid Order time. Please select a time from 09:30 to 20:30 in 15-minute intervals.`
        );
      }
      return value;
    })
    .required()
    .messages({
      "any.required": "Order time is required.",
    }),

    file: joi.object({
      size: joi.number().positive().required(),
      path: joi.string().required(),
      filename: joi.string().required(),
      destination: joi.string().required(),
      mimetype: joi.string().required(),
      encoding: joi.string().required(),
      originalname: joi.string().required(),
      fieldname: joi.string().required(),
    }),
    
  headers: joi.object({
    authorization: joi
      .string()
      .regex(/^([a-zA-Z0-9_=]+)\.([a-zA-Z0-9_=]+)\.([a-zA-Z0-9_\-\+\/=]*)/)
      .required(),
  }),
};

////  Validation   ///////////////
export const isValid = (joiSchema, considerHeaders = false) => {
  return (req, res, next) => {
    let copyReq = {
      ...req.body,
      ...req.params,
      ...req.query,
    };
    if (req.headers?.authorization && considerHeaders) {
      copyReq = { authorization: req.headers.authorization };
    }
    if (req.files || req.file) {
      copyReq.file = req.files || req.file;
    }

    const { error } = joiSchema.validate(copyReq, { abortEarly: false });
    if (error) {
      return res
        .status(422)
        .json({
          message: "Validation Error",
          status_code: 422,
          Error: error.message,
        });
    } else {
      return next();
    }
  };
};



