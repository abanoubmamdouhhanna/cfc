import joi from "joi";
import { generalFeilds } from "../../../middlewares/validation.middleware.js";

export const headersSchema = generalFeilds.headers;

export const addToCartSchema=joi.object(
    {
        mealId:generalFeilds.id,
        quantity:generalFeilds.quantity.required()
    }
).required()