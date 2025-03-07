import { Router } from "express";
import * as reviewController from "./controller/reviews.controller.js";
import { createReviewSchema, deleteReviewSchema, headersSchema, updateReviewSchema } from './controller/reviews.validation.js'
import { isValid } from "../../middlewares/validation.middleware.js";
import { auth } from "../../middlewares/auth.middleware.js";

const router = Router();

//create review
router.post(
  "/createReview/:mealId",
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

//delete review by author
router.delete(
  "/deleteReview/:reviewId",
  isValid(headersSchema, true),
  auth(["user"]),
  isValid(deleteReviewSchema),
  reviewController.deleteReview
);
//delete review by superAdmin
router.delete(
  "/deleteReviewByAdmin/:reviewId",
  isValid(headersSchema, true),
  auth(["superAdmin"]),
  isValid(deleteReviewSchema),
  reviewController.deleteReviewByAdmin
);
//get all reviews
router.get("/getReviews",
  reviewController.getReviews
)

export default router;
