import subcategoryModel from "../../../../DB/models/Subcategory.model.js";
import cloudinary from "../../../utils/cloudinary.js";
import slugify from "slugify";
import { asyncHandler } from "../../../utils/errorHandling.js";
import categoryModel from "../../../../DB/models/Category.model.js";
import { nanoid } from "nanoid";
import mealModel from "../../../../DB/models/Meal.model.js";
import { uploadToCloudinary } from "../../../utils/uploadHelper.js";

//create subcategory
export const createSubcategory = asyncHandler(async (req, res, next) => {
  const { categoryId } = req.params;
  const category = await categoryModel.findById(categoryId);
  if (!category) {
    return next(new Error("In-valid category id", { cause: 404 }));
  }
  if (!req.file) {
    return next(new Error("Subcategory image is required",{cause:404}));
  }
  //capitalize only first letter
  const name =
    req.body.name.charAt(0).toUpperCase() +
    req.body.name.slice(1).toLowerCase();

  if (await subcategoryModel.findOne({ name })) {
    return next(new Error("Duplicated subcategory name", { cause: 409 }));
  }
  const customId = `${name}_${nanoid()}`;

  const subcategoryImage = await uploadToCloudinary(
    req.file,
    `${process.env.APP_NAME}/Subcategories/${customId}`,
    `${customId}subcategoryImage`
  );
  const subcategoryImagePublicId = `${process.env.APP_NAME}/Subcategories/${customId}/${customId}subcategoryImage`;
  const subcategory = await subcategoryModel.create({
    name,
    slug: slugify(name, "_"),
    categoryId,
    customId,
    createdBy: req.user._id,
    imageURL: subcategoryImage,
    subcategoryImagePublicId,
  });
  if (!subcategory) {
    return next(new Error("Fail to create Subcategory", { cause: 400 }));
  }
  return res.status(201).json({
    status: "success",
    message: "Subcategory created successfully",
    result: subcategory,
  });
});

//====================================================================================================================//
//get Subcategories
export const getSubCategories = asyncHandler(async (req, res, next) => {
  const category = await categoryModel.findById(req.params.categoryId);
  if (!category) {
    return next(new Error("In-valid Category id", { cause: 404 }));
  }
  const subcategory = await subcategoryModel
    .find({}, "name imageURL status ")
    .populate({
      path: "viewMeals",
      select:
        "title image flavor price discount finalPrice size wishUser status",
    });
  return res.status(200).json({
    status: "success",
    message: "Done",
    result: subcategory,
  });
});

//====================================================================================================================//
//update subcategory
export const updateSubcategory = asyncHandler(async (req, res, next) => {
  const { categoryId, subcategoryId } = req.params;
  const subcategory = await subcategoryModel.findOne({
    _id: subcategoryId,
    categoryId,
  });
  if (!subcategory) {
    return next(
      new Error("In-valid subcategory id or category id", { cause: 404 })
    );
  }
  if (!(req.body.name || req.file)) {
    return next(
      new Error("subcategory name or subcategory image is required to update", {
        cause: 404,
      })
    );
  }

  if (req.body.name) {
    const name =
      req.body.name.charAt(0).toUpperCase() +
      req.body.name.slice(1).toLowerCase();
    if (subcategory.name === name) {
      return next(
        new Error("You can't update subcategory name with the same old name", {
          cause: 409,
        })
      );
    }
    if (await subcategoryModel.findOne({ name })) {
      return next(new Error("Duplicated subcategory name", { cause: 409 }));
    }
    req.body.name = name;
    req.body.slug = slugify(name, "_");
  }

  if (req.file) {
    const subcategoryImage = await uploadToCloudinary(
      req.file,
      `${process.env.APP_NAME}/Subcategories/${customId}`,
      `${customId}subcategoryImage`
    );

    req.body.imageURL = subcategoryImage;
  }

  req.body.updatedBy = req.user._id;
  const updatedSubcategory = await subcategoryModel.findOneAndUpdate(
    { _id: subcategoryId, categoryId },
    req.body,
    { new: true }
  );
  return res.status(200).json({
    status: "success",
    message: "Subcategory updated successfully",
    result: updatedSubcategory,
  });
});
//====================================================================================================================//
//delete subcategory

export const deleteSubcategory = asyncHandler(async (req, res, next) => {
  const subCategory = await subcategoryModel.findByIdAndDelete(
    req.params.subCategoryId
  );
  if (!subCategory) {
    return next(new Error("Invalid subCategory ID", { cause: 404 }));
  }
  const meals = await mealModel.find({
    subcategoryId: req.params.subCategoryId,
  });
  for (const meal of meals) {
    if (meal.mainMealImagePublicId) {
      await cloudinary.uploader.destroy(meal.mainMealImagePublicId);
    }
  }
  await mealModel.deleteMany({
    subcategoryId: req.params.subCategoryId,
  });
  await cloudinary.uploader.destroy(subCategory.subcategoryImagePublicId);

  return res.status(200).json({
    message: "Subcategory and its meals deleted successfully",
    result: subCategory,
  });
});
