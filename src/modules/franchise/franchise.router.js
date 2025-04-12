import Router from "express";
import * as franchiseController from "./controller/franchise.controller.js";
import { allowedTypesMap, fileUpload } from "../../utils/multerCloudinary.js";
import {
  addFranchiseSchema,
  headersSchema,
  updateFranchiseSchema,
} from "./controller/franchise.validation.js";
import { isValid } from "../../middlewares/validation.middleware.js";
import { auth } from "../../middlewares/auth.middleware.js";
const router = Router();

//add franchise
router.post(
  "/addFranchise",
  isValid(headersSchema, true),
  auth(["superAdmin"]),
  fileUpload(5, allowedTypesMap).fields([
    { name: "processImage", maxCount: 20 },
  ]),
  isValid(addFranchiseSchema),
  franchiseController.addFranchise
);

//get franchise
router.get("/getFranchise", franchiseController.getFranchise);

//update franchise
router.patch(
  "/updateFranchise/:franchiseId",
  isValid(headersSchema, true),
  auth(["superAdmin"]),
  fileUpload(5, allowedTypesMap).fields([
    { name: "processImage", maxCount: 20 },
  ]),
  isValid(updateFranchiseSchema),
  franchiseController.updateFranchise
);

export default router;
