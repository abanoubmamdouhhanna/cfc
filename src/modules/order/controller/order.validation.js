import joi from "joi";
import { generalFeilds } from "../../../middlewares/validation.middleware.js";

// Define payment types as constants for better maintenance
const PAYMENT_TYPES = {
  CARD: "Card",
  PAYPAL: "PayPal",
  WALLET: "Wallet",
};

// Headers validation
export const headersSchema = generalFeilds.headers;

// Meal item schema - extracted for reusability and clarity
const mealItemSchema = joi
  .object({
    mealId: generalFeilds.id.required(), // Make sure mealId is required
    quantity: joi.number().integer().min(1).required().messages({
      "number.base": "Quantity must be a number",
      "number.integer": "Quantity must be an integer",
      "number.min": "Quantity must be at least 1",
      "any.required": "Quantity is required", // Added required message
    }),
    flavor: joi.string().trim().optional().messages({
      // Keep flavor if needed
      "string.base": "Flavor must be a text value",
    }),

     isCombo: joi.boolean().default("false"), // Backend determines this from mealId

    // Updated sauces, drinks, and sides: Array of objects containing only the ID
    sauces: joi
      .array()
      .items(
        joi.object({
          id: generalFeilds.id.required(), // Only require the ID
        })
      )
      .optional(), // Make arrays optional if a meal might not have them

    drinks: joi
      .array()
      .items(
        joi.object({
          id: generalFeilds.id.required(), // Only require the ID
        })
      )
      .optional(),

    sides: joi
      .array()
      .items(
        joi.object({
          id: generalFeilds.id.required(), // Only require the ID
        })
      )
      .optional(),
  })
  .messages({
    "object.unknown": "Unknown field found in meal item: {#key}", // Optional: Add strictness
  });

// Create order validation schema (referencing the updated mealItemSchema)
export const createOrderSchema = joi
  .object({
    locationId: generalFeilds.id.required(), // locationId should be required in path params, maybe not body? Adjust if needed.
    couponName: joi.string().trim().uppercase().optional(), // couponName is usually optional
   state: joi.string().trim().required().messages({
      "string.empty": "State cannot be empty",
      "any.required": "State is required",
    }),

    // Order details
    orderTime: generalFeilds.orderTime.required(), // Assuming orderTime is required
    orderDate: generalFeilds.ordertDate.required(), // Assuming orderDate is required
    phone: generalFeilds.USAphone.required(),

    // Payment information
    paymentType: joi
      .string()
      .valid(...Object.values(PAYMENT_TYPES))
      .required()
      .messages({
        "any.only": `Payment type must be one of the following: ${Object.values(
          PAYMENT_TYPES
        ).join(", ")}`,
        "any.required": "Payment type is required",
      }),

    // Order items - referencing the modified mealItemSchema
    meals: joi.array().items(mealItemSchema).min(1).messages({
      "array.base": "Meals must be provided as a list",
      "array.min": "At least one meal must be ordered",
      "any.required": "Meals are required to create an order",
    }),
  })
  .required();
// Cancel order validation schema
export const cancelOrderSchema = joi
  .object({
    orderId: generalFeilds.id,
    reason: joi.string().trim().min(5).max(1000).required().messages({
      "string.min": "Cancellation reason must be at least 5 characters",
      "string.max": "Cancellation reason cannot exceed 1000 characters",
      "any.required": "Cancellation reason is required",
    }),
  })
  .required();

// Delivered order validation schema
export const deliveredOrderSchema = joi
  .object({
    orderId: generalFeilds.id,
  })
  .required();

// Export payment types for reuse in other modules
export const VALID_PAYMENT_TYPES = PAYMENT_TYPES;
