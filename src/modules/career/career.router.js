import Router from "express";
import * as careerController from "./controller/career.controller.js";
import {
  adddCareerSchema,
  headersSchema,
  updateCareerSchema,
} from "./controller/career.validation.js";
import { isValid } from "../../middlewares/validation.middleware.js";
import { auth } from "../../middlewares/auth.middleware.js";
const router = Router();

//add career
router.post(
  "/addCareer",
  isValid(headersSchema, true),
  auth(["superAdmin"]),
  isValid(adddCareerSchema),
  careerController.addCareer
);

//get career
router.get("/getCareer", careerController.getCareer);

//update career
router.patch(
  "/updateCareer/:careerId",
  isValid(headersSchema, true),
  auth(["superAdmin"]),
  isValid(updateCareerSchema),
  careerController.updateCareer
);

export default router;
