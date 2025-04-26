import { Router } from "express";
import * as optionController from "./controller/option.controller.js";
import { allowedTypesMap, fileUpload } from "../../utils/multerCloudinary.js";
import { isValid } from "../../middlewares/validation.middleware.js";
import { auth } from "../../middlewares/auth.middleware.js";
import {
  createSideOptionSchema,
  getSideOptionSchema,
  headersSchema,
  updateSideOptionSchema,
} from "./controller/option.validation.js";

const router = Router();

//add side option
router.post(
  "/createSideOption",
  isValid(headersSchema, true),
  auth(["superAdmin"]),
  fileUpload(5, allowedTypesMap).single("sideOptionImage"),
  isValid(createSideOptionSchema),
  optionController.createSideOption
);

//update side option
router.patch(
  "/updateSideOption/:optionId ",
  isValid(headersSchema, true),
  auth(["superAdmin"]),
  fileUpload(5, allowedTypesMap).single("sideOptionImage"),
  isValid(updateSideOptionSchema),
  optionController.updateSideOption
);

// Get side option by ID
router.get(
  "/getSideOption/:optionId ",
  isValid(headersSchema, true),
  auth(["superAdmin", "user"]),
  isValid(getSideOptionSchema),
  optionController.getSideOption
);

// Get all side options
router.get(
  "/getAllsideOptions",
  optionController.getAllSideOptions
);

export default router;
