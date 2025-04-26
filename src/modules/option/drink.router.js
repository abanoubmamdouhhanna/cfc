import { Router } from "express";
import * as optionController from "./controller/option.controller.js";
import { allowedTypesMap, fileUpload } from "../../utils/multerCloudinary.js";
import { isValid } from "../../middlewares/validation.middleware.js";
import { auth } from "../../middlewares/auth.middleware.js";
import { createDrinkOptionSchema, getDrinkOptionSchema, headersSchema, updateDrinkOptionSchema } from "./controller/option.validation.js";


const router = Router();

// Create drink option
router.post(
  "/createDrinkOption",
  isValid(headersSchema, true),
  auth(["superAdmin"]),
  fileUpload(5, allowedTypesMap).single("drinkOptionImage"),
  isValid(createDrinkOptionSchema),
  optionController.createDrinkOption
);

// Update drink option
router.patch(
  "/updateDrinkOption/:optionId",
  isValid(headersSchema, true),
  auth(["superAdmin"]),
  fileUpload(5, allowedTypesMap).single("drinkOptionImage"),
  isValid(updateDrinkOptionSchema),
  optionController.updateDrinkOption
);

// Get drink option by ID
router.get(
  "/getDrinkOption/:optionId",
  isValid(headersSchema, true),
  auth(["superAdmin", "user"]),
  isValid(getDrinkOptionSchema),
  optionController.getDrinkOption
);

// Get all drink options
router.get(
  "/getAllDrinkOptions",
  optionController.getAllDrinkOptions
);

export default router;
