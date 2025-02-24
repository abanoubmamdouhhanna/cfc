import Router from "express";
import * as feedbackController from "./controller/feedback.controller.js";
import {
  addFeedbackSchema,
  deleteFeedbackSchema,
  headersSchema,
} from "./controller/feedback.validation.js";
import { isValid } from "../../middlewares/validation.middleware.js";
import { auth } from "../../middlewares/auth.middleware.js";
const router = Router();

//add feedback
router.post(
  "/addfeedback",
  isValid(headersSchema, true),
  auth(["user"]),
  isValid(addFeedbackSchema),
  feedbackController.addfeedback
);

//get feedback
router.get(
  "/getfeedbacks",
  isValid(headersSchema, true),
  auth(["superAdmin"]),
  feedbackController.getfeedbacks
);

//delete feedback
router.delete(
  "/deleteFeedback/:feedbackId",
  isValid(headersSchema, true),
  auth(["superAdmin"]),
  isValid(deleteFeedbackSchema),
  feedbackController.deleteFeedback
);

//delete all feedback
router.delete(
  "/deleteAllFeedbacks",
  isValid(headersSchema, true),
  auth(["superAdmin"]),
  feedbackController.deleteAllFeedbacks
);

export default router;
