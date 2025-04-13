import { Router } from "express";
import * as mealController from "./controller/spMeal.controller.js";
import { allowedTypesMap, fileUpload } from "../../utils/multerCloudinary.js";
import {
  addMealSchema,
  deleteMealSchema,
  headersSchema,
  updateMealSchema,
  } from "./controller/spMeal.validation.js";
import { isValid } from "../../middlewares/validation.middleware.js";
import { auth } from "../../middlewares/auth.middleware.js";
const router = Router();

//add sp meal
router.post(
  "/addMeal",
  isValid(headersSchema, true),
  auth(["superAdmin"]),
  fileUpload(5, allowedTypesMap).single("mealImage"),
  isValid(addMealSchema),
  mealController.addMeal
);

//update sp meal
router.patch(
  "/updateMeal/:mealId",
  isValid(headersSchema, true),
  auth(["superAdmin"]),
  fileUpload(5, allowedTypesMap).single("mealImage"),
  isValid(updateMealSchema),
  mealController.updateMeal
);

//delete sp meal
router.delete(
  "/deleteMeal/:mealId",
  isValid(headersSchema, true),
  auth(["superAdmin"]),
  isValid(deleteMealSchema),
  mealController.deleteMeal
);

//get sp meals
router.get(
  "/getSpMeals",
  isValid(headersSchema, true),
  mealController.getSpMeals
);

export default router;
