import { nanoid } from "nanoid";
import locationModel from "../../../../DB/models/CFClocation.model.js";
import { asyncHandler } from "../../../utils/errorHandling.js";
import { uploadToCloudinary } from "../../../utils/uploadHelper.js";
import cloudinary from "../../../utils/cloudinary.js";

//add career
export const addLocation = asyncHandler(async (req, res, next) => {
  const { title, address, phone, hours, locationURL } = req.body;

  const customId = nanoid();
  const locationPhoto = await uploadToCloudinary(
    req.file,
    `${process.env.APP_NAME}/Location/${customId}`,
    `${customId}locationPhoto`
  );

  const locationPhotoPublicId = `${process.env.APP_NAME}/Location/${customId}/${customId}locationPhoto`;
  const location = await locationModel.create({
    title,
    address,
    phone,
    hours,
    locationURL,
    locationPhoto,
    customId,
    locationPhotoPublicId,
  });

  return res.status(201).json({
    status: "success",
    message: "Location added successfully",
    result: location,
  });
});
//====================================================================================================================//
//get loacations
export const getLoacation = asyncHandler(async (req, res, next) => {
  const loacation = await locationModel.find({});
  return res.status(200).json({
    status: "success",
    message: "Done",
    result: loacation,
  });
});
//====================================================================================================================//
//update location
export const updateLocation = asyncHandler(async (req, res, next) => {
  const { title, address, phone, hours, locationURL } = req.body;
  const { locationId } = req.params;

  // Check if the location exists
  const checkLocation = await locationModel.findById(locationId);
  if (!checkLocation) {
    return next(new Error("Invalid location ID", { cause: 404 }));
  }

  // Ensure there is at least one field to update
  if (!(title || address || phone || hours || locationURL || req.file)) {
    return next(new Error("No data provided to update", { cause: 400 }));
  }

  // Compare provided fields with existing values
  const fieldsToUpdate = { title, address, phone, hours, locationURL };
  for (let key in fieldsToUpdate) {
    if (fieldsToUpdate[key] && fieldsToUpdate[key] === checkLocation[key]) {
      return next(
        new Error(
          `Cannot update ${key} with the same value. Please provide a different value.`,
          { cause: 400 }
        )
      );
    }
  }

  // Handle file upload
  let locationPhoto;
  if (req.file) {
    locationPhoto = await uploadToCloudinary(
      req.file,
      `${process.env.APP_NAME}/Location/${checkLocation.customId}`,
      `${checkLocation.customId}locationPhoto`
    );
  }

  // Dynamically update only the provided fields
  const updateData = { ...fieldsToUpdate };
  if (locationPhoto) updateData.locationPhoto = locationPhoto;

  // Perform the update
  const updatedLocation = await locationModel.findByIdAndUpdate(
    locationId,
    updateData,
    { new: true }
  );

  return res.status(200).json({
    status: "success",
    message: "Location updated successfully",
    result: updatedLocation,
  });
});
//====================================================================================================================//
//delete location

export const deleteLocation = asyncHandler(async (req, res, next) => {
  const location = await locationModel.findByIdAndDelete(req.params.locationId);
  if (!location) {
    return next(new Error("Invalid location ID", { cause: 404 }));
  }

  await cloudinary.uploader.destroy(location.locationPhotoPublicId);

  return res.status(200).json({
    status: "success",
    message: "location deleted successfully",
    deletedlocation: location,
  });
});
