import { Router } from "express";
import * as categoryController from "./controller/category.controller.js";
import { allowedTypesMap, fileUpload } from "../../utils/multerCloudinary.js";
import {
  createCategorySchema,
  deleteCategorySchema,
  headersSchema,
  updateCategorySchema,
} from "./controller/category.validation.js";
import subcategoryRouter from "../subcategory/subcategory.router.js";
import { auth } from "../../middlewares/auth.middleware.js";
import { isValid } from "../../middlewares/validation.middleware.js";

const router = Router();
router.use("/:categoryId/subcategory", subcategoryRouter);

//add category
router.post(
  "/addCategory",
  isValid(headersSchema, true),
  auth(["superAdmin"]),
  fileUpload(2, allowedTypesMap).single("categoryImage"),
  isValid(createCategorySchema),
  categoryController.addCategory
);

//get categories
router.get("/getCategories", categoryController.getCategories);

//get categories with meals
router.get("/getCategoriesWithMeals", categoryController.getCategoriesWithMeals);

//get category with meals
router.get("/getCategoryWithMeals/:categoryId", categoryController.getCategoryWithMeals);


//update category
router.patch(
  "/updateCategory/:categoryId",
  isValid(headersSchema, true),
  auth(["superAdmin"]),
  fileUpload(2, allowedTypesMap).single("categoryImage"),
  isValid(updateCategorySchema),
  categoryController.updateCategory
);

//delete category
router.delete(
  "/deleteCategory/:categoryId",
  isValid(headersSchema, true),
  auth(["superAdmin"]),
  isValid(deleteCategorySchema),
  categoryController.deleteCategory
);

//get meals
router.get("/getAllMeals", categoryController.mealList);


export default router;
