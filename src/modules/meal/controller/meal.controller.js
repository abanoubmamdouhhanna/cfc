import slugify from "slugify";
import subcategoryModel from "../../../../DB/models/Subcategory.model.js";
import cloudinary from "../../../utils/cloudinary.js";
import { nanoid } from "nanoid";
import mealModel from "../../../../DB/models/Meal.model.js";
import { asyncHandler } from "../../../utils/errorHandling.js";
import userModel from "../../../../DB/models/User.model.js";
import { ApiFeatures } from "../../../utils/apiFeatures.js";
import { uploadToCloudinary } from "../../../utils/uploadHelper.js";

//create meal
export const addMeal = asyncHandler(async (req, res, next) => {
  const { title,description, price, discount, flavor, size } = req.body;
  const { categoryId, subcategoryId } = req.params;
  const subCat = await subcategoryModel.findOne({
    _id: subcategoryId,
    categoryId,
  });
  if (!subCat) {
    return next(
      new Error("Invalid subcategoryId or categoryId", { cause: 400 })
    );
  }

  const customId = `${title}_${nanoid()}`;
  const slug = slugify(title);
  const finalPrice = Number.parseFloat(
    price - price * ((discount || 0) / 100)
  ).toFixed(2);


  const mealImage = await uploadToCloudinary(
    req.file,
    `${process.env.APP_NAME}/Meal/${customId}`,
    `${customId}mainMealImage`
  );

  const mainMealImagePublicId = `${process.env.APP_NAME}/Meal/${customId}/${customId}mainMealImage`;
  const mealData = {
    title,
    description,
    price,
    discount,
    customId,
    slug,
    finalPrice,
    flavor,
    size,
    image: mealImage,
    categoryId,
    subcategoryId,
    createdBy: req.user._id,
    mainMealImagePublicId,
  };
  const meal = await mealModel.create(mealData);

  return res.status(201).json({
    status: "success",
    message: "Meal Created successfully",
    result: meal,
  });
});
//====================================================================================================================//
//update meal

export const updateMeal = asyncHandler(async (req, res, next) => {
  const { mealId } = req.params;
  const {
    title,
    description,
    flavor,
    price,
    discount,
    size,
    categoryId,
    subcategoryId,
    status,
  } = req.body;

  const meal = await mealModel.findById(mealId);
  if (!meal) {
    return next(new Error("In-valid meal Id", { cause: 400 }));
  }
  if (
    !(
      title ||
      description ||
      price ||
      discount ||
      categoryId ||
      subcategoryId ||
      status ||
      (Array.isArray(flavor) && flavor.length > 0) ||
      (Array.isArray(size) && size.length > 0) ||
      (req.files && req.files.mealImage && req.files.mealImage.length > 0)
    )
  ) {
    return next(new Error("We need information to update", { cause: 400 }));
  }
  if (
    title ||
    description ||
    price ||
    discount ||
    categoryId ||
    subcategoryId ||
    status
  ) {
    const object = { ...req.body };
    for (let key in object) {
      if (meal[key] == object[key]) {
        return next(
          new Error(
            `Cannot update ${key} with the same value. Please provide a different value.`,
            { cause: 400 }
          )
        );
      }
    }
  }

  if (subcategoryId && categoryId) {
    if (!(await subcategoryModel.findOne({ _id: subcategoryId, categoryId }))) {
      return next(
        new Error("In-valid subcategoryId or categoryId", { cause: 400 })
      );
    }
  }

  //update title
  if (title) {
    req.body.slug = slugify(title);
  }

  //update price or discount
  req.body.finalPrice =
    price || discount
      ? Number.parseFloat(
          (price || meal.price) -
            (price || meal.price) * ((discount || meal.discount) / 100)
        ).toFixed(2)
      : meal.finalPrice;

  //update image
  if (req.files?.mealImage?.length) {
    const mealImage = await uploadToCloudinary(
      req.file,
      `${process.env.APP_NAME}/Meal/${meal.customId}`,
      `${meal.customId}mainMealImage`
    );

    req.body.image = mealImage;
  }

  req.body.updatedBy = req.user._id;
  const mealUpdated = await mealModel.findByIdAndUpdate(
    { _id: mealId },
    req.body,
    { new: true }
  );
  return res.status(200).json({
    status: "success",
    message: "meal updated successfully",
    result: mealUpdated,
  });
});
//====================================================================================================================//
//delete meal

export const deleteMeal = asyncHandler(async (req, res, next) => {
  const deleteMeal = await mealModel.findByIdAndDelete(req.params.mealId);
  if (!deleteMeal) {
    return next(new Error("Invalid meal ID", { cause: 404 }));
  }
  await cloudinary.uploader.destroy(deleteMeal.mainMealImagePublicId);
  return res
    .status(200)
    .json({ message: "Subcategory deleted successfully", result: deleteMeal });
});
