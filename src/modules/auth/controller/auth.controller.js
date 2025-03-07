import moment from "moment/moment.js";
import crypto from "crypto";

import { otpEmail } from "../../../utils/Emails/optEmail.js";
import { compare, Hash } from "../../../utils/Hash&Compare.js";
import { asyncHandler } from "../../../utils/errorHandling.js";
import { otp } from "../../../utils/otpGenerator.js";
import {
  generateToken,
  verifyToken,
} from "../../../utils/generateAndVerifyToken.js";
import userModel from "../../../../DB/models/User.model.js";
import { activationMail } from "../../../utils/Emails/activationMail.js";
import { emitter } from "../../../utils/eventEmitter.js";
import { emailres } from "../../../utils/Emails/emailres.js";

// registeration
export const signUp = asyncHandler(async (req, res, next) => {
  const { email, firstName, lastName, password, phone } = req.body;

  const existedUser = await userModel.findOne({ email });

  if (existedUser) {
    return next(new Error("Email already exists", { cause: 401 }));
  }

  // Generate activation code
  const activationCode = crypto.randomBytes(64).toString("hex");

  // Hash password
  const hashPassword = Hash({ plainText: password });

  // Create the user in the database
  const createUser = await userModel.create({
    email,
    firstName,
    lastName,
    password: hashPassword,
    phone,
    activationCode,
  });
  // Send email asynchronously
  const protocol = req.protocol;
  const host = req.headers.host;
  const html = activationMail(activationCode, protocol, host);

  emitter.emit("register", {
    email,
    html,
  });

  // Respond immediately without waiting for the email to be sent
  return res.status(201).json({
    message: "User added successfully. Please check your email for activation.",
    user: createUser._id,
  });
});

//====================================================================================================================//
// create admin

export const addAdmin = asyncHandler(async (req, res, next) => {
  const { locationId } = req.params;

  const { firstName, lastName, email, password, phone } = req.body;

  const existedUser = await userModel.findOne({ email });

  if (existedUser) {
    return next(new Error("Email already exists", { cause: 401 }));
  }
  // Generate activation code
  const activationCode = crypto.randomBytes(64).toString("hex");
  // Hash password
  const hashPassword = Hash({ plainText: password });

  // Create the admin in the database
  const createUser = await userModel.create({
    email,
    firstName,
    lastName,
    password: hashPassword,
    role: "admin",
    phone,
    activationCode,
    locationId,
  });

  // Send email asynchronously
  const protocol = req.protocol;
  const host = req.headers.host;
  const html = activationMail(activationCode, protocol, host);

  emitter.emit("register", {
    email,
    html,
  });
  // Respond immediately without waiting for the email to be sent
  return res.status(201).json({
    message:
      "Admin added successfully. Please check email you added for activation.",
    user: createUser._id,
  });
});

//====================================================================================================================//
// log in

export const logIn = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Validate input data
  if (!password || !email) {
    return next(new Error("email and password are required.", { cause: 400 }));
  }

  // Query user by either userName or email
  const user = await userModel
    .findOne({
      email,
    })
    .select("password isDeleted isBlocked email role isConfirmed locationId");

  // Handle user not found or inactive accounts
  if (!user) {
    return next(
      new Error("Invalid credentials, please try again.", { cause: 404 })
    );
  }

  if (user.isDeleted || user.isBlocked) {
    return next(
      new Error(
        "Your account is suspended or removed. Contact support for assistance.",
        { cause: 403 }
      )
    );
  }
  if (!user.isConfirmed) {
    return next(
      new Error("Please confirm your account to proceed.", { cause: 400 })
    );
  }
  // Verify password
  const isPasswordValid = compare({
    plainText: password,
    hashValue: user.password,
  });
  if (!isPasswordValid) {
    return next(
      new Error("Incorrect password. Please try again.", { cause: 401 })
    );
  }

  const token = generateToken({
    payload: {
      id: user._id,
      email: user.email,
      role: user.role,
      ...(user?.locationId ? { locationId: user.locationId } : {}), // Add only if it exists
    },
  });

  // Update status (optional, based on your business logic)
  if (user.status !== "Active") {
    user.status = "Active";
    await user.save();
  }

  // Respond to client
  return res.status(200).json({
    message: `welcome ${user.role}! Logged in successfully.`,
    authorization: { token },
    result: user,
  });
});
//====================================================================================================================//
//log out

export const logOut = asyncHandler(async (req, res, next) => {
  await userModel.findByIdAndUpdate(
    req.user._id,
    { status: "not Active" },
    { new: true }
  );
  return res.status(200).json({
    status: "success",
    message: "LoggedOut successfully",
  });
});
//====================================================================================================================//
// Activate account

export const activateAcc = asyncHandler(async (req, res, next) => {
  const user = await userModel.updateOne(
    { activationCode: req.params.activationCode },
    {
      isConfirmed: true,
      $unset: { activationCode: 1 },
    }
  );

  return user.matchedCount
    ? res.status(200).send(emailres)
    : next(new Error("Account not found", { cause: 404 }));
});
//====================================================================================================================//
//Re-Activate account
export const reActivateAcc = asyncHandler(async (req, res, next) => {
  const { email } = req.params;
  const user = await userModel.findOne({ email });
  if (!user) {
    return next(new Error("User not found", { cause: 404 }));
  }
  if (user && user.activationCode && user.isConfirmed == false) {
    const protocol = req.protocol;
    const host = req.headers.host;

    const html = activationMail(user.activationCode, protocol, host);

    emitter.emit("reActiveAccount", {
      email,
      html,
    });
    return res.status(200).json({
      message: "Check your email we already sent an activation mail ",
    });
  }
  return next(new Error("Your account is already confirmed", { cause: 400 }));
});
//====================================================================================================================//
//forget password By OTP
export const forgetPasswordOTP = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  const user = await userModel.findOne({ email });
  if (!user) {
    return next(new Error("User not found!", { cause: 404 }));
  }
  const OTP = otp();
  await userModel.findOneAndUpdate(
    { email },
    {
      otp: Hash({ plainText: OTP }),
      otpexp: moment().add(1, "day"),
    }
  );
  const redirectLink = `${req.protocol}://${req.headers.host}/auth/resetPasswordOTP/${email}`;

  const html = otpEmail(OTP, redirectLink);

  emitter.emit("forgetPassword", {
    email,
    html,
  });

  return res.status(200).json({
    status: "success",
    message: "OTP code have been sent to your account",
  });
});
//====================================================================================================================//
//reset password by otp

export const resetPasswordOTP = asyncHandler(async (req, res, next) => {
  const { userEmail } = req.params;
  const { otp, password } = req.body;
  const user = await userModel.findOne({ email: userEmail });
  if (!user) {
    return next(new Error("User not found!", { cause: 404 }));
  }
  if (moment().diff(user.otpexp, "hours") >= 0) {
    return next(new Error(`OTP code has been Expired`, { cause: 410 }));
  }

  const matchOTP = compare({ plainText: otp, hashValue: user.otp });
  if (matchOTP) {
    (user.password = Hash({ plainText: password })), (user.otp = undefined);
    user.otpexp = undefined;
    user.changeAccountInfo = Date.now();
    user.status = "not Active";
    await user.save();

    return res.status(200).json({
      status: "success",
      message: "Password has been changed successfully",
    });
  }
  return next(new Error(`Invalid OTP code`, { cause: 409 }));
});
