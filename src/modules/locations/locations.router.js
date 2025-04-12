import Router from "express";
import * as locationController from "./controller/locations.controller.js";
import {
  adddLocationSchema,
  deleteLocationSchema,
  headersSchema,
  updateLocationSchema,
} from "./controller/locations.validation.js";
import { allowedTypesMap, fileUpload } from "../../utils/multerCloudinary.js";
import { isValid } from "../../middlewares/validation.middleware.js";
import { auth } from "../../middlewares/auth.middleware.js";
const router = Router();

//add location
router.post(
  "/addLocation",
  isValid(headersSchema, true),
  auth(["superAdmin"]),
  fileUpload(5, allowedTypesMap).single("locationPhoto"),
  isValid(adddLocationSchema),
  locationController.addLocation
);

//get locations
router.get("/getLoacation", locationController.getLoacation);

//update location
router.patch(
  "/updateLocation/:locationId",
  isValid(headersSchema, true),
  auth(["superAdmin"]),
  fileUpload(5, allowedTypesMap).single("locationPhoto"),
  isValid(updateLocationSchema),
  locationController.updateLocation
);

//delete location
router.delete(
  "/deleteLocation/:locationId",
  isValid(headersSchema, true),
  auth(["superAdmin"]),
  isValid(deleteLocationSchema),
  locationController.deleteLocation
);

export default router;
