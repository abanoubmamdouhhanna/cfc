import { nanoid } from "nanoid";
import { asyncHandler } from "../../../utils/errorHandling.js";
import cloudinary from "../../../utils/cloudinary.js";
import categoryModel from "../../../../DB/models/Category.model.js";
import slugify from "slugify";
import subcategoryModel from "../../../../DB/models/Subcategory.model.js";
import mealModel from "../../../../DB/models/Meal.model.js";

import { uploadToCloudinary } from "../../../utils/uploadHelper.js";
import { ApiFeatures } from "../../../utils/apiFeatures.js";

//add category
export const addCategory = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new Error("category image is required"));
  }
  //capitalize only first letter
  const name =
    req.body.name.charAt(0).toUpperCase() +
    req.body.name.slice(1).toLowerCase();

  if (await categoryModel.findOne({ name })) {
    return next(new Error("Duplicated category name", { cause: 409 }));
  }

  const customId = `${name}_${nanoid()}`;
  const categoryImage = await uploadToCloudinary(
    req.file,
    `${process.env.APP_NAME}/Category/${customId}`,
    `${customId}categoryImage`
  );

  const categoryImagePublicId = `${process.env.APP_NAME}/Category/${customId}/${customId}categoryImage`;
  const category = await categoryModel.create({
    name,
    slug: slugify(name, "_"),
    customId,
    createdBy: req.user._id,
    imageURL: categoryImage,
    categoryImagePublicId,
  });
  if (!category) {
    return next(new Error("Fail to create category", { cause: 400 }));
  }

  return res.status(201).json({
    status: "success",
    message: "Category created successfully",
    result: category,
  });
});
//====================================================================================================================//
//get categories
export const getCategories = asyncHandler(async (req, res, next) => {
  const categories = await categoryModel
    .find({}, "name imageURL status createdBy ")
    .populate([
      {
        path: "SubCategories",
        select: "name imageURL status ",
        populate: {
          path: "viewMeals",
          select:
            "title image flavor price discount finalPrice size wishUser status",
        },
      },
    ]);
  return res.status(200).json({
    status: "success",
    message: "Done",
    result: categories,
  });
});
//====================================================================================================================//
//get categories with meals

export const getCategoriesWithMeals = asyncHandler(async (req, res, next) => {
  const categories = await categoryModel
    .find({}, "name imageURL status createdBy")
    .populate({
      path: "SubCategories",
      select: "_id", // Only need `_id` to use in another query
      populate: {
        path: "viewMeals",
        select:
          "title image flavor price discount finalPrice size wishUser status",
      },
    });

  // Transform result: Extract meals directly inside categories
  const transformedCategories = categories.map((category) => {
    const meals = category.SubCategories.flatMap(
      (subCategory) => subCategory.viewMeals
    );

    return {
      _id: category._id,
      name: category.name,
      imageURL: category.imageURL,
      status: category.status,
      createdBy: category.createdBy,
      meals: meals, // Meals directly inside category
    };
  });

  return res.status(200).json({
    status: "success",
    message: "Done",
    result: transformedCategories,
  });
});
//====================================================================================================================//
//get category with meals

export const getCategoryWithMeals = asyncHandler(async (req, res, next) => {
  const categories = await categoryModel
    .find({ _id: req.params.categoryId }, "name imageURL status createdBy")
    .populate({
      path: "SubCategories",
      select: "_id", // Only need `_id` to use in another query
      populate: {
        path: "viewMeals",
        select:
          "title image flavor price discount finalPrice size wishUser status",
      },
    });

  // Transform result: Extract meals directly inside categories
  const transformedCategories = categories.map((category) => {
    const meals = category.SubCategories.flatMap(
      (subCategory) => subCategory.viewMeals
    );

    return {
      _id: category._id,
      name: category.name,
      imageURL: category.imageURL,
      status: category.status,
      createdBy: category.createdBy,
      meals: meals, // Meals directly inside category
    };
  });

  return res.status(200).json({
    status: "success",
    message: "Done",
    result: transformedCategories,
  });
});

//====================================================================================================================//
//update Category
export const updateCategory = asyncHandler(async (req, res, next) => {
  const category = await categoryModel.findById(req.params.categoryId);
  if (!category) {
    return next(new Error("In-valid Category id", { cause: 404 }));
  }
  if (!(req.body.name || req.file || req.body.status)) {
    return next(
      new Error("We need information to update", {
        cause: 404,
      })
    );
  }
  const object = { ...req.body };

  for (let key in object) {
    if (category[key] == object[key]) {
      return next(
        new Error(
          `I'm sorry, but we cannot update your ${key} with your old one. Please make sure that ${key} you have entered correctly and try again.`,
          { cause: 400 }
        )
      );
    }
  }
  if (req.body.name) {
    const name =
      req.body.name.charAt(0).toUpperCase() +
      req.body.name.slice(1).toLowerCase();
    if (category.name === name) {
      return next(
        new Error("You can't update category name with the same old name", {
          cause: 409,
        })
      );
    }
    if (await categoryModel.findOne({ name })) {
      return next(new Error("Duplicated category name", { cause: 409 }));
    }
    req.body.name = name;
    req.body.slug = slugify(name, "_");
  }

  if (req.file) {
    const categoryImage = await uploadToCloudinary(
      req.file,
      `${process.env.APP_NAME}/Category/${category.customId}`,
      `${category.customId}categoryImage`
    );
    req.body.imageURL = categoryImage;
  }
  req.body.updatedBy = req.user._id;
  const updatedCategory = await categoryModel.findOneAndUpdate(
    { _id: req.params.categoryId },
    req.body,
    { new: true }
  );
  return res.status(200).json({
    status: "success",
    message: "Category updated successfully",
    result: updatedCategory,
  });
});
//====================================================================================================================//
//delete category

export const deleteCategory = asyncHandler(async (req, res, next) => {
  const Category = await categoryModel.findByIdAndDelete(req.params.categoryId);
  if (!Category) {
    return next(new Error("Invalid category ID", { cause: 404 }));
  }
  const subCategories = await subcategoryModel.find({
    categoryId: req.params.categoryId,
  });
  for (const subCategory of subCategories) {
    if (subCategory.subcategoryImagePublicId) {
      await cloudinary.uploader.destroy(subCategory.subcategoryImagePublicId);
    }
  }
  await subcategoryModel.deleteMany({
    categoryId: req.params.categoryId,
  });

  const meals = await mealModel.find({ categoryId: req.params.categoryId });
  for (const meal of meals) {
    if (meal.mainMealImagePublicId) {
      await cloudinary.uploader.destroy(meal.mainMealImagePublicId);
    }
  }
  await mealModel.deleteMany({
    categoryId: req.params.categoryId,
  });
  await cloudinary.uploader.destroy(Category.categoryImagePublicId);

  return res.status(200).json({
    status: "success",
    message: "Category and its subcategories deleted successfully",
    deletedCategory: Category,
  });
});
//====================================================================================================================//
//get meals
export const mealList = asyncHandler(async (req, res, next) => {
  const apiObject = new ApiFeatures(
    mealModel.find().populate([
      {
        path: "reviews",
      },
    ]),
    req.query
  )
    .paginate()
    .filter()
    .search()
    .sort()
    .select();
  const meals = await apiObject.mongooseQuery;
  //  calc avg rating
  for (let i = 0; i < meals.length; i++) {
    let calcRate = 0;
    for (let j = 0; j < meals[i].review?.length; j++) {
      calcRate += meals[i].review[j].rating;
    }
    const meal = meals[i].toObject();
    meal.avgRating = calcRate / meals[i].review?.length;
    meals[i] = meal;
  }
  return res.status(200).json({
    status: "success",
    message: "Done",
    count: meals.length,
    result: meals,
  });
});
