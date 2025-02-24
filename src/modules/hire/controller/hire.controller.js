import hireingModel from "../../../../DB/models/Hire.model.js";
import { asyncHandler } from "../../../utils/errorHandling.js";

//add hire
export const addHire = asyncHandler(async (req, res, next) => {
  const { title, address, type, description } = req.body;
  if (!title || !address || !type || !description) {
    return next(
      new Error("title , address , type , description must be provided.", {
        cause: 400,
      })
    );
  }
  const newHire = await hireingModel.create({
    title,
    address,
    type,
    description,
  });

  return res.status(201).json({
    message: "Hiring position added successfully!",
    data: newHire,
  });
});

//====================================================================================================================//
//update hire

export const updateHire = asyncHandler(async (req, res, next) => {
  const { hireId } = req.params;

  const checkHire = await hireingModel.findById(hireId);
  if (!checkHire) {
    return next(new Error("Invalid Hiring position ID", { cause: 404 }));
  }

  const { title, address, type, description } = req.body;

  if (!(title || address || type || description)) {
    return next(new Error("No data provided to update", { cause: 400 }));
  }

  const object = { ...req.body };
  for (let key in object) {
    if (checkHire[key] == object[key]) {
      return next(
        new Error(
          `I'm sorry, but we cannot update your ${key} with your old one. Please make sure that ${key} you have entered correctly and try again.`,
          { cause: 400 }
        )
      );
    }
  }

  const updatedHire = await hireingModel.findOneAndUpdate(
    { _id:hireId },
    {
      title,
      address,
      type,
      description,
    },{new:true}
  );

  return res.status(200).json({
    message: "Hiring position updated successfully",
    data: updatedHire,
  });
});
//====================================================================================================================//
//get hires
export const getHires = asyncHandler(async (req, res, next) => {
  const Hires = await hireingModel.find({});
  return res.status(200).json({
    status: "succcess",
    message: "Done",
    Hires,
  });
});
//====================================================================================================================//
//delete hire

export const deleteHire = asyncHandler(async (req, res, next) => {
  const hire = await hireingModel.findByIdAndDelete(req.params.hireId);
  if (!hire) {
    return next(new Error("Invalid Hiring position ID", { cause: 404 }));
  }

  return res.status(200).json({
    status: "success",
    message: "Hiring position deleted successfully",
    deletedhire: hire,
  });
});

//====================================================================================================================//
//delete all hires

export const deleteAllHires = asyncHandler(async (req, res, next) => {
  const hires = await hireingModel.deleteMany();

  return res.status(200).json({
    status: "success",
    message: "Hiring positions deleted successfully",
    deletedhires: hires,
  });
});
