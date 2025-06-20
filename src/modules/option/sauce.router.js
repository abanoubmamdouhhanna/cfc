import { Router } from "express";
import * as optionController from "./controller/option.controller.js";
import { allowedTypesMap, fileUpload } from "../../utils/multerCloudinary.js";
import { isValid } from "../../middlewares/validation.middleware.js";
import { auth } from "../../middlewares/auth.middleware.js";
import {
  createSauceOptionSchema,
  getSauceOptionSchema,
  headersSchema,
  updateSauceOptionSchema,
} from "./controller/option.validation.js";

const router = Router();

// Create sauce option
router.post(
  "/createSauceOption",
  isValid(headersSchema, true),
  auth(["superAdmin"]),
  fileUpload(5, allowedTypesMap).single("sauceOptionImage"),
  isValid(createSauceOptionSchema),
  optionController.createSauceOption
);

// Update sauce option
router.patch(
  "/updateSauceOption/:optionId",
  isValid(headersSchema, true),
  auth(["superAdmin"]),
  fileUpload(5, allowedTypesMap).single("sauceOptionImage"),
  isValid(updateSauceOptionSchema),
  optionController.updateSauceOption
);

// Get sauce option by ID
router.get(
  "/getSauceOption/:optionId",
  isValid(headersSchema, true),
  auth(["superAdmin", "user"]),
  isValid(getSauceOptionSchema),
  optionController.getSauceOption
);

// Get all sauce options
router.get(
  "/getAllSauceOptions",
  optionController.getAllSauceOptions
);
export default router;
