import { nanoid } from "nanoid";
import { asyncHandler } from "../../../utils/errorHandling.js";
import { uploadToCloudinary } from "../../../utils/uploadHelper.js";
import newsletterModel from "../../../../DB/models/Newsletter.model.js";
import aboutModel from "../../../../DB/models/Aboutus.model.js";

//send newsletter
export const sendNewsLetter = asyncHandler(async (req, res, next) => {
  const requiredFields =["location","email"]

  for (const field of requiredFields) {
    if (!req.body[field]) {
      return next(new Error(`${field} must be provided.`, { cause: 400 }));
    }
  }
  const { email ,location } = req.body;
  const checkExist = await newsletterModel.findOne({ email });
  if (checkExist) {
    return next(new Error(`Email already exist`, { cause: 400 }));
  }


  const newsLetter = await newsletterModel.create({email,location});
  res
    .status(201)
    .json({ message: "Newsletter sends successfully", newsLetter });
});
//====================================================================================================================//
//get newsletters by admin
export const getNewsLetters = asyncHandler(async (req, res, next) => {
  const newsLetters = await newsletterModel.find({});

  return res.status(200).json({
    status: "succcess",
    message: "Done",
    newsLetters,
  });
});
//====================================================================================================================//
// Get newsletters by admin (only emails)

export const getEmails = asyncHandler(async (req, res, next) => {
  const newsletters = await newsletterModel.find({}, "email"); // Fetch only the email field

  const emails = newsletters.map((newsletter) => newsletter.email); // Extract emails into an array

  return res.status(200).json({
    status: "success",
    message: "Done",
    emails, 
  });
});

//====================================================================================================================//
//delete newsletter

export const deleteNewsLetter = asyncHandler(async (req, res, next) => {
  const newsletter = await newsletterModel.findByIdAndDelete(req.params.newsLetterId);
  if (!newsletter) {
    return next(new Error("Invalid newsLetter Id", { cause: 404 }));
  }

  return res.status(200).json({
    status: "success",
    message: "Newsletter deleted successfully",
    deletedNewsletter: newsletter,
  });
});

//====================================================================================================================//
//delete all newsletters

export const deleteAllNewsLetters = asyncHandler(async (req, res, next) => {
  const newsLetters = await newsletterModel.deleteMany();

  return res.status(200).json({
    status: "success",
    message: "All newsletters deleted successfully",
    deletedNewsLetters: newsLetters,
  });
});
