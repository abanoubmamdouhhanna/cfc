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

//add offer meal
router.post(
  "/addOfferMeal",
  isValid(headersSchema, true),
  auth(["superAdmin"]),
  fileUpload(5, allowedTypesMap).single("mealImage"),
  isValid(addMealSchema),
  mealController.addOfferMeal
);

//update offer meal
router.patch(
  "/updateOfferMeal/:mealId",
  isValid(headersSchema, true),
  auth(["superAdmin"]),
  fileUpload(5, allowedTypesMap).single("mealImage"),
  isValid(updateMealSchema),
  mealController.updateOfferMeal
);

//delete offer meal
router.delete(
  "/deleteOfferMeal/:mealId",
  isValid(headersSchema, true),
  auth(["superAdmin"]),
  isValid(deleteMealSchema),
  mealController.deleteOfferMeal
);

//get sp meals
router.get(
  "/getOfferMeals",
  isValid(headersSchema, true),
  auth(["superAdmin","admin","user"]),
  mealController.getOfferMeals
);

export default router;
