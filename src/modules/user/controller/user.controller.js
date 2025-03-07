import userModel from "../../../../DB/models/User.model.js";
import moment from "moment/moment.js";
import { accountRecoveryEmail } from "../../../utils/Emails/accountRecoveryEmail.js";
import { asyncHandler } from "../../../utils/errorHandling.js";
import { compare, Hash } from "../../../utils/Hash&Compare.js";
import {
  generateToken,
  verifyToken,
} from "../../../utils/generateAndVerifyToken.js";

//user profile
export const userProfile = asyncHandler(async (req, res, next) => {
  const user = await userModel
    .findOne({ _id: req.user._id }, "firstName lastName email phone wishlist")
    .populate(
      "wishListContent",
      "title image flavor price discount finalPrice size wishUser status"
    )
    .populate("walletBalance", "balance -userId -_id");
  return res.status(200).json({ status: "Success", message: "Done", user });
});

//====================================================================================================================//
//update user
export const updateUser = asyncHandler(async (req, res, next) => {
  const { firstName, lastName, phone, email } = req.body;
  if (!(firstName || lastName || phone || email)) {
    return next(new Error("We need information to update", { cause: 400 }));
  }

  const checkUser = await userModel.findById({ _id: req.user._id });

  const object = { ...req.body };

  for (let key in object) {
    if (checkUser[key] == object[key]) {
      return next(
        new Error(
          `I'm sorry, but we cannot update your ${key} with your old one. Please make sure that ${key} you have entered correctly and try again.`,
          { cause: 400 }
        )
      );
    }
  }

  if (email) {
    const existingUser = await userModel.findOne({
      email,
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return next(
          new Error("The email you have entered is already in use.", {
            cause: 409,
          })
        );
      }
    }
  }
  if (checkUser.isDeleted == true) {
    return next(
      new Error(
        "Can't update your information because your account may be suspended or deleted",
        { cause: 400 }
      )
    );
  }
  const user = await userModel.findByIdAndUpdate(
    { _id: req.user._id },

    req.body,
    { new: true }
  );
  return res
    .status(200)
    .json({ status: "success", message: "User updated", result: user });
});

//====================================================================================================================//
//update password
export const changePassword = asyncHandler(async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;
  const matchOld = compare({
    plainText: oldPassword,
    hashValue: req.user.password,
  });
  if (!matchOld) {
    return next(new Error("In-valid password", { cause: 409 }));
  }
  const checkMatchNew = compare({
    plainText: newPassword,
    hashValue: req.user.password,
  });
  if (checkMatchNew) {
    return next(
      new Error("New password can't be old password", { cause: 400 })
    );
  }
  const hashPassword = Hash({ plainText: newPassword });
  const user = await userModel
    .findByIdAndUpdate(req.user._id, { password: hashPassword }, { new: true })
    .select("email updatedAt");
  return res.status(200).json({
    status: "success",
    message: "Password updated successfully",
    result: user,
  });
});

//====================================================================================================================//
//deleteUser
export const deleteUser = asyncHandler(async (req, res, next) => {
  const user = await userModel
    .findByIdAndUpdate(
      req.user._id,
      { isDeleted: true, status: "not Active" },
      { new: true }
    )
    .select("email isDeleted permanentlyDeleted");
  user.permanentlyDeleted = moment().add(1, "month").calendar();
  await user.save();
  const reactiveToken = generateToken({
    payload: { email: user.email },
    signature: process.env.RECOVER_ACCOUNT_SIGNATURE,
    expiresIn: 60 * 60 * 24 * 30,
  });

  const link = `${req.protocol}://${req.headers.host}/user/accountRecovery/${reactiveToken}`;
  const html = accountRecoveryEmail(link);

  emitter.emit("deleteUser",{
    email:user.email,html
  })

  return res.status(200).json({
    status: "success",
    message:
      "The account has been successfully disabled, you have 30 days to recover it or it will be permanently deleted.",
  });
});

//====================================================================================================================//
//recover account
export const accountRecovery = asyncHandler(async (req, res, next) => {
  const { reactiveToken } = req.params;
  const decoded = verifyToken({
    payload: reactiveToken,
    signature: process.env.RECOVER_ACCOUNT_SIGNATURE,
  });
  const user = await userModel.updateOne(
    { email: decoded.email, isDeleted: true },
    { isDeleted: false, $unset: { permanentlyDeleted: 1 }, status: "Active" }
  );
  if (user.matchedCount == 0) {
    return next(new Error("Account may be already active", { cause: 410 }));
  }

  return res.status(200).json({
    status: "success",
    message: "Your account recoverd successfully",
    result: user,
  });
});

//get all users
export const getAllUsers =asyncHandler(async(req,res,next)=>
{
  const allUsers=await userModel.find({role:"user"})
  return res.status(200).json({
    status: "success",
    message: "All users successfully",
    result: allUsers,
  });
})