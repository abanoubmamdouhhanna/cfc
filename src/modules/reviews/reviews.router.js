import { Router } from "express";
import * as reviewController from "./controller/reviews.controller.js";
import { createReviewSchema, deleteReviewSchema, headersSchema, updateReviewSchema } from './controller/reviews.validation.js'
import { isValid } from "../../middlewares/validation.middleware.js";
import { auth } from "../../middlewares/auth.middleware.js";

const router = Router();

//create review
router.post(
  "/createReview",
  isValid(headersSchema, true),
  auth(["user"]),
    isValid(createReviewSchema),
  reviewController.createReview
);

//update review
router.patch(
  "/updateReview/:mealId/:reviewId",
  isValid(headersSchema, true),
  auth(["user"]),
  isValid(updateReviewSchema),
  reviewController.updateReview
);

//delete review
router.delete(
  "/deleteReview/:reviewId",
  isValid(headersSchema, true),
  auth(["superAdmin"]),
  isValid(deleteReviewSchema),
  reviewController.deleteReview
);

//get all reviews
router.get("/getReviews",
  isValid(headersSchema,true),
  auth(["superAdmin"]),
  reviewController.getReviews
)

export default router;
