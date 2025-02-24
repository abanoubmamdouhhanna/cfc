import orderModel from "../../../../DB/models/Order.model.js";
import reviewModel from "../../../../DB/models/Review.model.js.js";
import { asyncHandler } from "../../../utils/errorHandling.js";

//create review
export const createReview = asyncHandler(async (req, res, next) => {
  const { mealId } = req.params;
  const { comment, rating } = req.body;

  const order = await orderModel.findOne({
    userId: req.user._id,
    status: "Completed",
    "meals.mealId": mealId,
  });
  if (!order) {
    return next(
      new Error("Can't review meal before pickedup it", { cause: 400 })
    );
  }

  //check if you reviewed same meals before
  if (
    await reviewModel.findOne({
      mealId,
      orderId: order._id,
      createdBy: req.user._id,
    })
  ) {
    return next(new Error("Already reviewed by you", { cause: 400 }));
  }
  const review = await reviewModel.create({
    mealId,
    orderId: order._id,
    createdBy: req.user._id,
    rating,
    comment,
  });
  return res.status(200).json({
    status: "success",
    message: "You reviewed meal successfully",
    result: review,
  });
});
//====================================================================================================================//
//update review

export const updateReview = asyncHandler(async (req, res, next) => {
  const { mealId, reviewId } = req.params;
  const review = await reviewModel.findOneAndUpdate(
    {
      _id: reviewId,
      mealId,
      createdBy: req.user._id,
    },
    req.body,
    { new: true }
  );
  if (!review) {
    return next(new Error("In-valid review Id", { cause: 400 }));
  }
  return res.status(200).json({
    status: "success",
    message: "Your review on meal updated successfully",
    result: review,
  });
});

//====================================================================================================================//
//delete review

export const deleteReview = asyncHandler(async (req, res, next) => {
  const { reviewId } = req.params;
  const review = await reviewModel.findById(reviewId);
  if (!review) {
    return next(new Error("In-valid review Id", { cause: 400 }));
  }
  const deleteReview = await reviewModel.findByIdAndDelete(reviewId);
  return res.status(200).json({
    status: "success",
    message: "Review on meal deleted successfully",
    result: review,
  });
});
//====================================================================================================================//
//get all reviews

export const getReviews = asyncHandler(async (req, res, next) => {
  const allReviews = await reviewModel.find({});
  return res.status(200).json({
    status: "success",
    message: "All review on all meals",
    result: allReviews,
  });
});
