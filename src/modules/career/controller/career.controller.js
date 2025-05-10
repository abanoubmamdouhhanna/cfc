import careerModel from "../../../../DB/models/Career.model.js";
import { asyncHandler } from "../../../utils/errorHandling.js";

//get career
export const getCareer = asyncHandler(async (req, res, next) => {
  const career = await careerModel.findOne({});

  return res.status(200).json({
    status: "success",
    message: "Done",
    result: career,
  });
});
//====================================================================================================================//
//update career
export const upsertCareer = asyncHandler(async (req, res, next) => {
  const { whyCFC, coreValues, benefits } = req.body;

  // Prevent empty updates
  if (
    !(
      whyCFC ||
      (Array.isArray(coreValues) && coreValues.length > 0) ||
      (Array.isArray(benefits) && benefits.length > 0)
    )
  ) {
    return next(new Error("We need information to update", { cause: 400 }));
  }

  // Format core values if provided
  const formattedCoreValues = coreValues?.map((core) => ({
    coreTile: core.coreTile,
    coredescription: core.coredescription,
  }));

  // Check if a career document already exists
  let checkCareer = await careerModel.findOne();

  const careerData = {
    whyCFC: whyCFC || checkCareer?.whyCFC || "",
    coreValues: formattedCoreValues || checkCareer?.coreValues || [],
    benefits: benefits || checkCareer?.benefits || [],
  };

  let career;
  if (checkCareer) {
    // Update existing
    career = await careerModel.findOneAndUpdate({}, careerData, { new: true });
  } else {
    // Create new
    career = await careerModel.create(careerData);
  }

  return res.status(201).json({
    status: "success",
    message: checkCareer
      ? "Career section updated successfully"
      : "Career section created successfully",
    result: career,
  });
});

