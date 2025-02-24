import feedbackModel from "../../../../DB/models/FeedBack.model.js";
import { asyncHandler } from "../../../utils/errorHandling.js";

//add feedBack
export const addfeedback = asyncHandler(async (req, res, next) => {
  const {
    feedBackType,
    name,
    email,
    state,
    phone,
    message,
    newLocationAdress,
    city,
    postalCode,
  } = req.body;
  if (!name || !email || !state || !phone || !message || !feedBackType) {
    return next(
      new Error(
        "name , email , state , phone , message , feedBackType must be provided.",
        { cause: 400 }
      )
    );
  }
  const newFeedback = await feedbackModel.create({
    feedBackType,
    name,
    email,
    state,
    phone,
    message,
    newLocationAdress,
    city,
    postalCode,
  });

  return res.status(201).json({
    message: "Contact request submitted successfully!",
    data: newFeedback,
  });
});
//====================================================================================================================//
//get feedbacks
export const getfeedbacks = asyncHandler(async (req, res, next) => {
  const feedBacks = await feedbackModel.find();
  return res.status(200).json({
    status: "succcess",
    message: "Done",
    feedBacks,
  });
});
//====================================================================================================================//
//delete feedback

export const deleteFeedback = asyncHandler(async (req, res, next) => {
  const feedback = await feedbackModel.findByIdAndDelete(req.params.feedbackId);
  if (!feedback) {
    return next(new Error("Invalid feedback ID", { cause: 404 }));
  }

  return res.status(200).json({
    status: "success",
    message: "feedback deleted successfully",
    deletedfeedback: feedback,
  });
});

//====================================================================================================================//
//delete all feedback

export const deleteAllFeedbacks = asyncHandler(async (req, res, next) => {
  const feedback = await feedbackModel.deleteMany();

  return res.status(200).json({
    status: "success",
    message: "feedback deleted successfully",
    deletedfeedback: feedback,
  });
});
