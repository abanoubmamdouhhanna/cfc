import Router from "express";
import * as userController from "./controller/user.controller.js";
import {
  changePasswordSchema,
  headersSchema,
  updateUserSchema,
} from "./controller/user.validation.js";
import { isValid } from "../../middlewares/validation.middleware.js";
import { auth } from "../../middlewares/auth.middleware.js";

const router = Router();

//user profile
router.get(
  "/userProfile",
  isValid(headersSchema, true),
  auth(["superAdmin", "admin", "user"]),
  userController.userProfile
);

//update user
router.post(
  "/updateUser",
  isValid(headersSchema, true),
  auth(["superAdmin", "admin", "user"]),
  isValid(updateUserSchema),
  userController.updateUser
);

//update password
router.patch(
  "/changePassword",
  isValid(headersSchema, true),
  auth(["superAdmin", "admin", "user"]),
  isValid(changePasswordSchema),
  userController.changePassword
);

//delete user
router.patch(
  "/deleteUser",
  isValid(headersSchema, true),
  auth(["superAdmin", "admin", "user"]),
  userController.deleteUser
);

//recover account
router.get("/accountRecovery/:reactiveToken", userController.accountRecovery);

//get all users
router.get(
  "/getAllUsers",
  isValid(headersSchema, true),
  auth(["superAdmin"]),
  userController.getAllUsers
);

export default router;
