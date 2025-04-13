import slugify from "slugify";
import cloudinary from "../../../utils/cloudinary.js";
import { nanoid } from "nanoid";
import { asyncHandler } from "../../../utils/errorHandling.js";
import { uploadToCloudinary } from "../../../utils/uploadHelper.js";
import spMealModel from "../../../../DB/models/Spmeals.model.js";
import spOfferMealModel from "../../../../DB/models/SpOfferMeals.model.js";

//create meal
export const addMeal = asyncHandler(async (req, res, next) => {
  const {
    title,
    description,
    price,
    compoPrice,
    discount = 0,
    size,
  } = req.body;

  const customId = `${title}_${nanoid()}`;
  const slug = slugify(title);

  // Parse prices
  const basePrice = parseFloat(price);
  const baseCompoPrice = compoPrice ? parseFloat(compoPrice) : null;

  // Calculate finalPrice based on whether compoPrice is present
  const finalComboPrice = (
    baseCompoPrice -
    baseCompoPrice * (discount / 100)
  ).toFixed(2);

  const finalPrice = (basePrice - basePrice * (discount / 100)).toFixed(2);

  // Upload meal image
  const mealImage = await uploadToCloudinary(
    req.file,
    `${process.env.APP_NAME}/Meal/${customId}`,
    `${customId}mainMealImage`
  );

  const mainMealImagePublicId = `${process.env.APP_NAME}/Meal/${customId}/${customId}mainMealImage`;

  // Create meal data
  const mealData = {
    title,
    description,
    price: basePrice,
    compoPrice: baseCompoPrice,
    discount,
    customId,
    slug,
    finalPrice,
    finalComboPrice,
    size,
    image: mealImage,
    createdBy: req.user._id,
    mainMealImagePublicId,
  };

  const meal = await spMealModel.create(mealData);

  return res.status(201).json({
    status: "success",
    message: "Special Meal Created successfully",
    result: meal,
  });
});

//====================================================================================================================//
//update meal

export const updateMeal = asyncHandler(async (req, res, next) => {
  const { mealId } = req.params;
  const { title, description, price, compoPrice, discount, size, status } =
    req.body;

  const meal = await spMealModel.findById(mealId);
  if (!meal) {
    return next(new Error("Invalid meal ID", { cause: 400 }));
  }

  const hasUpdatableData =
    title ||
    description ||
    price ||
    compoPrice ||
    discount ||
    status ||
    (Array.isArray(size) && size.length > 0) ||
    (req.files && req.files.mealImage && req.files.mealImage.length > 0);

  if (!hasUpdatableData) {
    return next(new Error("We need information to update", { cause: 400 }));
  }

  // Check for redundant values
  const checkFields = {
    title,
    description,
    price,
    compoPrice,
    discount,
    status,
  };
  for (let key in checkFields) {
    if (checkFields[key] !== undefined && meal[key] == checkFields[key]) {
      return next(
        new Error(
          `Cannot update ${key} with the same value. Please provide a different value.`,
          { cause: 400 }
        )
      );
    }
  }

  // Update slug if title changed
  if (title) {
    req.body.slug = slugify(title);
  }

  // Final price calculation logic based on compoPrice presence
  const basePrice =
    compoPrice !== undefined
      ? parseFloat(compoPrice)
      : price !== undefined
      ? parseFloat(price)
      : compoPrice !== undefined
      ? parseFloat(meal.compoPrice)
      : parseFloat(meal.price);

  const discountValue = discount !== undefined ? discount : meal.discount;
  req.body.finalPrice = (basePrice - basePrice * (discountValue / 100)).toFixed(
    2
  );

  // Update meal image
  if (req.files?.mealImage?.length) {
    const mealImage = await uploadToCloudinary(
      req.file,
      `${process.env.APP_NAME}/Meal/${meal.customId}`,
      `${meal.customId}mainMealImage`
    );
    req.body.image = mealImage;
  }

  req.body.updatedBy = req.user._id;

  const mealUpdated = await spMealModel.findByIdAndUpdate(mealId, req.body, {
    new: true,
  });

  return res.status(200).json({
    status: "success",
    message: "Special Meal updated successfully",
    result: mealUpdated,
  });
});

//====================================================================================================================//
//delete meal

export const deleteMeal = asyncHandler(async (req, res, next) => {
  const deleteMeal = await spMealModel.findByIdAndDelete(req.params.mealId);
  if (!deleteMeal) {
    return next(new Error("Invalid meal ID", { cause: 404 }));
  }
  await cloudinary.uploader.destroy(deleteMeal.mainMealImagePublicId);
  return res
    .status(200)
    .json({ message: "Subcategory deleted successfully", result: deleteMeal });
});

//====================================================================================================================//
//get sp meals
export const getSpMeals = asyncHandler(async (req, res, next) => {
  const meals = await spMealModel.find({}).lean();
  return res
    .status(200)
    .json({ status: "Success", count: meals.length, result: meals });
});
//====================================================================================================================//
//create meal
export const addOfferMeal = asyncHandler(async (req, res, next) => {
  const {
    title,
    description,
    price,
    compoPrice,
    discount = 0,
    size,
  } = req.body;

  const customId = `${title}_${nanoid()}`;
  const slug = slugify(title);

  // Parse prices
  const basePrice = parseFloat(price);
  const baseCompoPrice = compoPrice ? parseFloat(compoPrice) : null;

  // Calculate finalPrice based on whether compoPrice is present
  const finalComboPrice = (
    baseCompoPrice -
    baseCompoPrice * (discount / 100)
  ).toFixed(2);

  const finalPrice = (basePrice - basePrice * (discount / 100)).toFixed(2);

  // Upload meal image
  const mealImage = await uploadToCloudinary(
    req.file,
    `${process.env.APP_NAME}/Meal/${customId}`,
    `${customId}mainMealImage`
  );

  const mainMealImagePublicId = `${process.env.APP_NAME}/Meal/${customId}/${customId}mainMealImage`;

  // Create meal data
  const mealData = {
    title,
    description,
    price: basePrice,
    compoPrice: baseCompoPrice,
    discount,
    customId,
    slug,
    finalPrice,
    finalComboPrice,
    size,
    image: mealImage,
    createdBy: req.user._id,
    mainMealImagePublicId,
  };

  const meal = await spOfferMealModel.create(mealData);

  return res.status(201).json({
    status: "success",
    message: "Special Meal Created successfully",
    result: meal,
  });
});

//====================================================================================================================//
//update meal

export const updateOfferMeal = asyncHandler(async (req, res, next) => {
  const { mealId } = req.params;
  const { title, description, price, compoPrice, discount, size, status } =
    req.body;

  const meal = await spOfferMealModel.findById(mealId);
  if (!meal) {
    return next(new Error("Invalid meal ID", { cause: 400 }));
  }

  const hasUpdatableData =
    title ||
    description ||
    price ||
    compoPrice ||
    discount ||
    status ||
    (Array.isArray(size) && size.length > 0) ||
    (req.files && req.files.mealImage && req.files.mealImage.length > 0);

  if (!hasUpdatableData) {
    return next(new Error("We need information to update", { cause: 400 }));
  }

  // Check for redundant values
  const checkFields = {
    title,
    description,
    price,
    compoPrice,
    discount,
    status,
  };
  for (let key in checkFields) {
    if (checkFields[key] !== undefined && meal[key] == checkFields[key]) {
      return next(
        new Error(
          `Cannot update ${key} with the same value. Please provide a different value.`,
          { cause: 400 }
        )
      );
    }
  }

  // Update slug if title changed
  if (title) {
    req.body.slug = slugify(title);
  }

  // Final price calculation logic based on compoPrice presence
  const basePrice =
    compoPrice !== undefined
      ? parseFloat(compoPrice)
      : price !== undefined
      ? parseFloat(price)
      : compoPrice !== undefined
      ? parseFloat(meal.compoPrice)
      : parseFloat(meal.price);

  const discountValue = discount !== undefined ? discount : meal.discount;
  req.body.finalPrice = (basePrice - basePrice * (discountValue / 100)).toFixed(
    2
  );

  // Update meal image
  if (req.files?.mealImage?.length) {
    const mealImage = await uploadToCloudinary(
      req.file,
      `${process.env.APP_NAME}/Meal/${meal.customId}`,
      `${meal.customId}mainMealImage`
    );
    req.body.image = mealImage;
  }

  req.body.updatedBy = req.user._id;

  const mealUpdated = await spOfferMealModel.findByIdAndUpdate(
    mealId,
    req.body,
    {
      new: true,
    }
  );

  return res.status(200).json({
    status: "success",
    message: "Special Meal updated successfully",
    result: mealUpdated,
  });
});

//====================================================================================================================//
//delete meal

export const deleteOfferMeal = asyncHandler(async (req, res, next) => {
  const deleteMeal = await spOfferMealModel.findByIdAndDelete(
    req.params.mealId
  );
  if (!deleteMeal) {
    return next(new Error("Invalid meal ID", { cause: 404 }));
  }
  await cloudinary.uploader.destroy(deleteMeal.mainMealImagePublicId);
  return res
    .status(200)
    .json({ message: "Subcategory deleted successfully", result: deleteMeal });
});

//====================================================================================================================//
//get sp meals
export const getOfferMeals = asyncHandler(async (req, res, next) => {
  const meals = await spOfferMealModel.find({}).lean();
  return res
    .status(200)
    .json({ status: "Success", count: meals.length, result: meals });
});
