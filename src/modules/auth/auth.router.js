import { Router } from "express";
import * as authController from "./controller/auth.controller.js";
import {
  addAdminSchema,
  authRegisterSchema,
  forgetPasswordSchema,
  headersSchema,
  logInSchema,
  reActivateAccSchema,
  resetPasswordOTPSchema,
} from "./controller/auth.validation.js";
import { isValid } from "../../middlewares/validation.middleware.js";
import { auth } from "../../middlewares/auth.middleware.js";

const router = Router();

//registeration
router.post(
  "/register",
   isValid(authRegisterSchema),
  authController.signUp
);

//create admin
router.post(
  "/addAdmin/:locationId",
  isValid(headersSchema, true),
  auth(["superAdmin"]),
  isValid(addAdminSchema),
  authController.addAdmin
);

//login
router.post("/login", isValid(logInSchema), authController.logIn);

//log out
router.patch(
  "/logOut",
  isValid(headersSchema, true),
  auth(["user"]),
  authController.logOut
);
//email confirmation
router.get("/confirm/:activationCode", authController.activateAcc);

//request new email confirmation
router.post(
  "/newConfirm/:email",
  isValid(reActivateAccSchema),
  authController.reActivateAcc
);

//forget password By OTP
router.post(
  "/forgetPasswordOTP",
  isValid(forgetPasswordSchema),
  authController.forgetPasswordOTP
);

//reset password by otp
router.post(
  "/resetPasswordOTP/:userEmail",
  isValid(resetPasswordOTPSchema),
  authController.resetPasswordOTP
);

export default router;
