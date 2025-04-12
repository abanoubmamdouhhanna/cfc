import Router from "express";
import * as careerController from "./controller/career.controller.js";
import {
    headersSchema,
  updateCareerSchema,
} from "./controller/career.validation.js";
import { isValid } from "../../middlewares/validation.middleware.js";
import { auth } from "../../middlewares/auth.middleware.js";
const router = Router();


//get career
router.get("/getCareer", careerController.getCareer);

//update career
router.patch(
  "/upsertCareer",
  isValid(headersSchema, true),
  auth(["superAdmin"]),
  isValid(updateCareerSchema),
  careerController.upsertCareer
);

export default router;
