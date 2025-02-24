import careerModel from "../../../../DB/models/Career.model.js";
import { asyncHandler } from "../../../utils/errorHandling.js";

//add career
export const addCareer = asyncHandler(async (req, res, next) => {
  const { whyCFC, coreValues, benefits } = req.body;

  const formattedCoreValues = coreValues.map((core) => ({
    coreTile: core.coreTile,
    coredescription: core.coredescription,
  }));

  const career = await careerModel.create({
    whyCFC,
    coreValues: formattedCoreValues,
    benefits,
  });

  return res.status(201).json({
    status: "success",
    message: "Career entry created successfully",
    result: career,
  });
});
//====================================================================================================================//
//get career
export const getCareer = asyncHandler(async (req, res, next) => {
  const career = await careerModel.find({});

  return res.status(200).json({
    status: "success",
    message: "Done",
    result: career,
  });
});
//====================================================================================================================//
//update career
export const updateCareer = asyncHandler(async (req, res, next) => {
  const { whyCFC, coreValues, benefits } = req.body;

  const checkCareer = await careerModel.findById(req.params.careerId);
  if (!checkCareer) {
    return next(new Error("In-valid career Id", { cause: 400 }));
  }

  if (
    !(
      whyCFC ||
      (Array.isArray(coreValues) && coreValues.length > 0) ||
      (Array.isArray(benefits) && benefits.length > 0)
    )
  ) {
    return next(new Error("We need information to update", { cause: 400 }));
  }

  const formattedCoreValues = coreValues?.map((core) => ({
    coreTile: core.coreTile,
    coredescription: core.coredescription,
  }));

  const career = await careerModel.findByIdAndUpdate(
    { _id: req.params.careerId },
    {
      whyCFC,
      coreValues: formattedCoreValues,
      benefits,
    },
    { new: true }
  );

  return res.status(201).json({
    status: "success",
    message: "Career updated successfully",
    result: career,
  });
});
