import couponModel from "../../../../DB/models/Coupon.model.js";
import cloudinary from "../../../utils/cloudinary.js";
import { asyncHandler } from "../../../utils/errorHandling.js";
import { nanoid } from "nanoid";
import { uploadToCloudinary } from "../../../utils/uploadHelper.js";

//====================================================================================================================//
//Create Coupon
export const createCoupon = asyncHandler(async (req, res, next) => {
  req.body.name = req.body.name.toUpperCase();

  // Check for duplicate coupon name
  const existingCoupon = await couponModel.findOne({ name: req.body.name }).select("_id");
  if (existingCoupon) {
    return next(new Error("Coupon name already exists. Please choose another name.", { cause: 409 }));
  }

  // Generate a unique ID for the coupon
  const customId = nanoid();

  // Upload coupon image if provided
  if (req.file) {
    req.body.imageURL = await uploadToCloudinary(
      req.file,
      `${process.env.APP_NAME}/Coupon/${customId}`,
      `${customId}couponImage`
    );
  }

  req.body.customId = customId;
  req.body.createdBy = req.user._id;

  const coupon = await couponModel.create(req.body);
  if (!coupon) {
    return next(new Error("Failed to create coupon", { cause: 400 }));
  }

  return res.status(201).json({
    status: "success",
    message: "Coupon created successfully",
    result: coupon,
  });
});

//====================================================================================================================//
//Get All Coupons
export const getCoupons = asyncHandler(async (req, res, next) => {
  const coupons = await couponModel.find({});
  return res.status(200).json({
    status: "success",
    message: "Coupons retrieved successfully",
    count:coupons.length,
    result: coupons,
  });
});

//====================================================================================================================//
//Update Coupon
export const updateCoupon = asyncHandler(async (req, res, next) => {
  const { couponId } = req.params;

  // Find the coupon by ID
  const coupon = await couponModel.findById(couponId);
  if (!coupon) {
    return next(new Error(`Invalid coupon ID: ${couponId}`, { cause: 404 }));
  }


  // Ensure at least one valid update field is provided
  if (!(req.body.name || req.body.amount || req.body.expire || req.file)) {
    return next(new Error("You must provide at least one field to update (name, amount, expire, or image).", { cause: 400 }));
  }

  const object = { ...req.body };

  for (let key in object) {
    if (coupon[key] == object[key]) {
      return next(
        new Error(
          `I'm sorry, but we cannot update your ${key} with your old one. Please make sure that ${key} you have entered correctly and try again.`,
          { cause: 400 }
        )
      );
    }
  }
  //Update coupon name (if changed)
  if (req.body.name) {
    req.body.name = req.body.name.toUpperCase();
    
    if (coupon.name === req.body.name) {
      return next(new Error("New coupon name must be different from the current name.", { cause: 409 }));
    }

    const duplicateName = await couponModel.findOne({ name: req.body.name }).select("_id");
    if (duplicateName) {
      return next(new Error("Coupon name already exists. Please choose another name.", { cause: 409 }));
    }
  }

  //Update coupon image (if provided)
  if (req.file) {
      req.body.imageURL = await uploadToCloudinary(
      req.file,
      `${process.env.APP_NAME}/Coupon/${coupon.customId}`,
      `${coupon.customId}couponImage`
    );
  }

  //Perform the update
  req.body.updatedBy = req.user._id;
  const updatedCoupon = await couponModel.findByIdAndUpdate(couponId, req.body, { new: true });

  return res.status(200).json({
    status: "success",
    message: "Coupon updated successfully",
    result: updatedCoupon,
  });
});

//====================================================================================================================//
//Delete Coupon

export const deleteCoupon = asyncHandler(async (req, res, next) => {
  const { couponId } = req.params;

  // Find the coupon by ID
  const coupon = await couponModel.findById(couponId);
  if (!coupon) {
    return next(new Error(`Invalid coupon ID: ${couponId}`, { cause: 404 }));
  }

  //Remove coupon image from Cloudinary (if exists)
  if (coupon.imageURL) {
    await cloudinary.uploader.destroy(coupon.couponImagePublicId);
  }

  //Delete the coupon from the database
  await couponModel.findByIdAndDelete(couponId);

  return res.status(200).json({
    status: "success",
    message: "Coupon deleted successfully",
  });
});
