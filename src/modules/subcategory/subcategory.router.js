import { Router } from "express";
import { allowedTypesMap, fileUpload } from "../../utils/multerCloudinary.js";
import * as subcategoryController from "./controller/subcategory.controller.js";
import {
  createSubcategorySchema,
  deleteSubcategorySchema,
  headersSchema,
  updateSubcategorySchema,
} from "./controller/subcategory.validation.js";
import mealRouter from "../meal/meal.router.js";
import { isValid } from "../../middlewares/validation.middleware.js";
import { auth } from "../../middlewares/auth.middleware.js";

const router = Router({ mergeParams: true });

router.use("/:subcategoryId/meal", mealRouter);

//create subcategory
router.post(
  "/createSubcategory",
  isValid(headersSchema, true),
  auth(["superAdmin"]),
  fileUpload(2, allowedTypesMap).single("subcategoryImage"),
  isValid(createSubcategorySchema),
  subcategoryController.createSubcategory
);

//get sub categories
router.get("/getSubCategories", subcategoryController.getSubCategories);

//update subcategory
router.patch(
  "/updateSubcategory/:subcategoryId",
  isValid(headersSchema, true),
  auth(["superAdmin"]),
  fileUpload(2, allowedTypesMap).single("subcategoryImage"),
  isValid(updateSubcategorySchema),
  subcategoryController.updateSubcategory
);

//delete subcategory
router.delete(
  "/deleteSubcategory/:subCategoryId",
  isValid(headersSchema, true),
  auth(["superAdmin"]),
  isValid(deleteSubcategorySchema),
  subcategoryController.deleteSubcategory
);
export default router;
