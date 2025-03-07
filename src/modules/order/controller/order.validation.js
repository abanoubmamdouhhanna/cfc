import joi from "joi";
import { generalFeilds } from "../../../middlewares/validation.middleware.js";

// Define payment types as constants for better maintenance
const PAYMENT_TYPES = {
  CARD: "Card",
  PAYPAL: "Paypal",
  WALLET: "Wallet"
};

// Headers validation
export const headersSchema = generalFeilds.headers;

// Meal item schema - extracted for reusability and clarity
const mealItemSchema = joi.object({
  mealId: generalFeilds.id,
  quantity: joi.number().integer().min(1).required()
    .messages({
      "number.base": "Quantity must be a number",
      "number.integer": "Quantity must be an integer",
      "number.min": "Quantity must be at least 1"
    }),
  flavor: joi.string().trim().optional()
    .messages({
      "string.base": "Flavor must be a text value"
    })
});

// Create order validation schema
export const createOrderSchema = joi.object({
  locationId: generalFeilds.id,
  couponId: generalFeilds.optionalId,
  couponName: generalFeilds.name.uppercase(),
  
  // Address information - grouped for clarity
  address: joi.string().trim().required()
    .messages({
      "string.empty": "Address cannot be empty",
      "any.required": "Address is required"
    }),
  city: joi.string().trim().required()
    .messages({
      "string.empty": "City cannot be empty",
      "any.required": "City is required"
    }),
  state: joi.string().trim().required()
    .messages({
      "string.empty": "State cannot be empty",
      "any.required": "State is required"
    }),
  
  // Order details
  orderTime: generalFeilds.orderTime,
  orderDate: generalFeilds.ordertDate,
  phone: generalFeilds.USAphone.required(),
  
  // Payment information
  paymentType: joi.string().valid(...Object.values(PAYMENT_TYPES)).required()
    .messages({
      "any.only": `Payment type must be one of the following: ${Object.values(PAYMENT_TYPES).join(", ")}`,
      "any.required": "Payment type is required"
    }),
  
  // Order items
  meals: joi.array().items(mealItemSchema).min(1).required()
    .messages({
      "array.base": "Meals must be provided as a list",
      "array.min": "At least one meal must be ordered",
      "any.required": "Meals are required to create an order"
    })
}).required();

// Cancel order validation schema
export const cancelOrderSchema = joi.object({
  orderId: generalFeilds.id,
  reason: joi.string().trim().min(5).max(1000).required()
    .messages({
      "string.min": "Cancellation reason must be at least 5 characters",
      "string.max": "Cancellation reason cannot exceed 1000 characters",
      "any.required": "Cancellation reason is required"
    })
}).required();

// Delivered order validation schema
export const deliveredOrderSchema = joi.object({
  orderId: generalFeilds.id
}).required();

// Export payment types for reuse in other modules
export const VALID_PAYMENT_TYPES = PAYMENT_TYPES;