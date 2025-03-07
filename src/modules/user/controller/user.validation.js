import joi from "joi";
import { generalFeilds } from "../../../middlewares/validation.middleware.js";

// Headers schema with detailed error messages
export const headersSchema = generalFeilds.headers.messages({
  "any.required": "Authorization headers are required",
  "string.empty": "Authorization token cannot be empty",
  "string.base": "Authorization must be a string"
});

// Update user schema with comprehensive field-specific messages
export const updateUserSchema = joi
  .object({
    email: generalFeilds.email,
    phone: generalFeilds.USAphone.messages({
      "string.pattern.base": "Please provide a valid phone number",
      "string.empty": "Phone number cannot be empty",
      "string.base": "Phone number must be a string"
    }),
    firstName: generalFeilds.firstName,
    lastName: generalFeilds.lastName
  })
  .required()
  .messages({
    "object.base": "User data must be an object",
    "object.empty": "User data cannot be empty",
    "object.min": "At least one field is required for update"
  })
  .min(1);

// Change password schema with detailed validation messages
export const changePasswordSchema = joi
  .object({
    oldPassword: generalFeilds.password.required().messages({
      "string.empty": "Current password is required",
      "string.min": "Current password must be at least 8 characters long",
      "string.pattern.base": "Current password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
      "any.required": "Current password is required",
      "string.base": "Current password must be a string"
    }),
    newPassword: generalFeilds.password
      .invalid(joi.ref("oldPassword"))
      .messages({
        "string.empty": "New password is required",
        "string.min": "New password must be at least 8 characters long",
        "string.pattern.base": "New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
        "any.invalid": "New password must be different from the current password",
        "string.base": "New password must be a string"
      }),
    cPassword: joi.string()
      .valid(joi.ref("newPassword"))
      .required()
      .messages({
        "any.only": "Password confirmation must match new password",
        "string.empty": "Password confirmation is required",
        "any.required": "Password confirmation is required",
        "string.base": "Password confirmation must be a string"
      })
  })
  .required()
  .messages({
    "object.base": "Password change data must be an object",
    "object.empty": "Password change data cannot be empty"
  });