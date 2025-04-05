import joi from "joi";
import { generalFeilds } from "../../../middlewares/validation.middleware.js";

export const headersSchema = generalFeilds.headers;


export const wishlistSchema = joi
  .object({
    mealId: generalFeilds.id,
  })
  .required();
