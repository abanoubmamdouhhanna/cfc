import { Router } from "express";
import * as mealController from "./controller/meal.controller.js";
import { allowedTypesMap, fileUpload } from "../../utils/multerCloudinary.js";
import {
  addMealSchema,
  deleteMealSchema,
  headersSchema,
  updateMealSchema,
  } from "./controller/meal.validation.js";
import { isValid } from "../../middlewares/validation.middleware.js";
import { auth } from "../../middlewares/auth.middleware.js";
const router = Router({ mergeParams: true });

//add meal
router.post(
  "/addMeal",
  isValid(headersSchema, true),
  auth(["superAdmin"]),
  fileUpload(5, allowedTypesMap).single("mealImage"),
  isValid(addMealSchema),
  mealController.addMeal
);

//update meal
router.patch(
  "/updateMeal/:mealId",
  isValid(headersSchema, true),
  auth(["superAdmin"]),
  fileUpload(5, allowedTypesMap).single("mealImage"),
  isValid(updateMealSchema),
  mealController.updateMeal
);

//delete meal
router.delete(
  "/deleteMeal/:mealId",
  isValid(headersSchema, true),
  auth(["superAdmin"]),
  isValid(deleteMealSchema),
  mealController.deleteMeal
);

export default router;
