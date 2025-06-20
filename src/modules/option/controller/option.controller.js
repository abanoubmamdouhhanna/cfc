import { nanoid } from "nanoid";
import sideOptionModel from "../../../../DB/models/Side.model.js";
import drinkOptionModel from "../../../../DB/models/Drink.model.js";
import sauceOptionModel from "../../../../DB/models/Sauce.model.js";
import { asyncHandler } from "../../../utils/errorHandling.js";
import { uploadToCloudinary } from "../../../utils/uploadHelper.js";
import slugify from "slugify";

// Helper to build option data
const buildOptionData = async (name, price, req, customId, type) => {
  const slug = slugify(name);
  const basePrice = parseFloat(price);
  const filePath = `${process.env.APP_NAME}/${type}/${customId}`;
  const fileName = `${customId}${type}Image`;
  const image = req.file
    ? await uploadToCloudinary(req.file, filePath, fileName)
    : null;

  const publicId = image ? `${filePath}/${fileName}` : null;

  return {
    name,
    price: basePrice,
    customId,
    slug,
    image: image ? image : null,
    [`main${type}ImagePublicId`]: publicId,
    createdBy: req.user._id,
  };
};

// ================== SIDE ==================
export const createSideOption = asyncHandler(async (req, res, next) => {
  const { name, price } = req.body;
  const customId = `${name}_${nanoid()}`;
  const data = await buildOptionData(name, price, req, customId, "sideOption");
  const sideOption = await sideOptionModel.create(data);
  res.status(201).json({
    status: "success",
    message: "Side option created",
    result: sideOption,
  });
});
//====================================================================================================================//

export const updateSideOption = asyncHandler(async (req, res, next) => {
  const { name, price, isAvailable } = req.body;
  const { optionId } = req.params;

  const option = await sideOptionModel.findById(optionId);
  if (!option) return next(new Error("Side option not found", { cause: 404 }));

  const updatedData = {
    name: name || option.name,
    price: price ? parseFloat(price) : option.price,
    isAvailable: isAvailable !== undefined ? isAvailable : option.isAvailable,
    updatedBy: req.user._id,
  };

  if (req.file) {
    const filePath = `${process.env.APP_NAME}/sideOption/${option.customId}`;
    const fileName = `${option.customId}sideOptionImage`;
    updatedData.image = await uploadToCloudinary(req.file, filePath, fileName);
    updatedData.mainSideOptionImagePublicId = `${filePath}/${fileName}`;
  }

  if (name && name !== option.name) updatedData.slug = slugify(name);

  const updated = await sideOptionModel.findByIdAndUpdate(
    optionId,
    updatedData,
    { new: true }
  );
  res.status(200).json({
    status: "success",
    message: "Side option updated",
    result: updated,
  });
});
//====================================================================================================================//

export const getSideOption = asyncHandler(async (req, res, next) => {
  const { optionId } = req.params;
  const option = await sideOptionModel.findById(optionId);
  if (!option) return next(new Error("Side option not found", { cause: 404 }));
  res.status(200).json({
    status: "success",
    message: "Side option retrieved",
    result: option,
  });
});
//====================================================================================================================//

export const getAllSideOptions = asyncHandler(async (req, res, next) => {
  const options = await sideOptionModel.find(
    { isAvailable: true },
    "name image price"
  );
  res.status(200).json({
    status: "success",
    message: "Side options retrieved",
    result: options,
  });
});

// ================== DRINK ==================
export const createDrinkOption = asyncHandler(async (req, res, next) => {
  const { name, price } = req.body;
  const customId = `${name}_${nanoid()}`;
  const data = await buildOptionData(name, price, req, customId, "drinkOption");
  const drinkOption = await drinkOptionModel.create(data);
  res.status(201).json({
    status: "success",
    message: "Drink option created",
    result: drinkOption,
  });
});
//====================================================================================================================//

export const updateDrinkOption = asyncHandler(async (req, res, next) => {
  const { name, price, isAvailable } = req.body;
  const { optionId } = req.params;

  const option = await drinkOptionModel.findById(optionId);
  if (!option) return next(new Error("Drink option not found", { cause: 404 }));

  const updatedData = {
    name: name || option.name,
    price: price ? parseFloat(price) : option.price,
    isAvailable: isAvailable !== undefined ? isAvailable : option.isAvailable,
    updatedBy: req.user._id,
  };

  if (req.file) {
    const filePath = `${process.env.APP_NAME}/drinkOption/${option.customId}`;
    const fileName = `${option.customId}drinkOptionImage`;
    updatedData.image = await uploadToCloudinary(req.file, filePath, fileName);
    updatedData.mainDrinkOptionImagePublicId = `${filePath}/${fileName}`;
  }

  if (name && name !== option.name) updatedData.slug = slugify(name);

  const updated = await drinkOptionModel.findByIdAndUpdate(
    optionId,
    updatedData,
    { new: true }
  );
  res.status(200).json({
    status: "success",
    message: "Drink option updated",
    result: updated,
  });
});
//====================================================================================================================//

export const getDrinkOption = asyncHandler(async (req, res, next) => {
  const { optionId } = req.params;
  const option = await drinkOptionModel.findById(optionId);
  if (!option) return next(new Error("Drink option not found", { cause: 404 }));
  res.status(200).json({
    status: "success",
    message: "Drink option retrieved",
    result: option,
  });
});
//====================================================================================================================//

export const getAllDrinkOptions = asyncHandler(async (req, res, next) => {
  const options = await drinkOptionModel.find(
    { isAvailable: true },
    "name image price"
  );
  res.status(200).json({
    status: "success",
    message: "Drink options retrieved",
    result: options,
  });
});
// ================== SAUCE ==================
export const createSauceOption = asyncHandler(async (req, res, next) => {
  const { name, price } = req.body;
  const customId = `${name}_${nanoid()}`;
  const data = await buildOptionData(name, price, req, customId, "sauceOption");
  const sauceOption = await sauceOptionModel.create(data);
  res.status(201).json({
    status: "success",
    message: "Sauce option created",
    result: sauceOption,
  });
});
//====================================================================================================================//

export const updateSauceOption = asyncHandler(async (req, res, next) => {
  const { name, price, isAvailable } = req.body;
  const { optionId } = req.params;

  const option = await sauceOptionModel.findById(optionId);
  if (!option) return next(new Error("Sauce option not found", { cause: 404 }));

  const updatedData = {
    name: name || option.name,
    price: price ? parseFloat(price) : option.price,
    isAvailable: isAvailable !== undefined ? isAvailable : option.isAvailable,
    updatedBy: req.user._id,
  };

  if (req.file) {
    const filePath = `${process.env.APP_NAME}/sauceOption/${option.customId}`;
    const fileName = `${option.customId}sauceOptionImage`;
    updatedData.image = await uploadToCloudinary(req.file, filePath, fileName);
    updatedData.mainSauceOptionImagePublicId = `${filePath}/${fileName}`;
  }

  if (name && name !== option.name) updatedData.slug = slugify(name);

  const updated = await sauceOptionModel.findByIdAndUpdate(
    optionId,
    updatedData,
    { new: true }
  );
  res.status(200).json({
    status: "success",
    message: "Sauce option updated",
    result: updated,
  });
});
//====================================================================================================================//

export const getSauceOption = asyncHandler(async (req, res, next) => {
  const { optionId } = req.params;
  const option = await sauceOptionModel.findById(optionId);
  if (!option) return next(new Error("Sauce option not found", { cause: 404 }));
  res.status(200).json({
    status: "success",
    message: "Sauce option retrieved",
    result: option,
  });
});
//====================================================================================================================//

export const getAllSauceOptions = asyncHandler(async (req, res, next) => {
  const options = await sauceOptionModel.find(
    { isAvailable: true },
    "name image price"
  );
  res.status(200).json({
    status: "success",
    message: "Sauce options retrieved",
    result: options,
  });
});
//====================================================================================================================//

export const getFreeComboOptions = asyncHandler(async (req, res, next) => {
  // Fetch all 3 in parallel
  const [sides, drinks, sauces] = await Promise.all([
    sideOptionModel.find(
      { isAvailable: true, isFreeWithCombo: true },
      "name image price"
    ),
    drinkOptionModel.find(
      { isAvailable: true, isFreeWithCombo: true },
      "name image price"
    ),
    sauceOptionModel.find(
      { isAvailable: true, isFreeWithCombo: true },
      "name image price"
    ),
  ]);

  res.status(200).json({
    status: "success",
    message: "Free combo options retrieved",
    result: {
      sides,
      drinks,
      sauces,
    },
  });
});
