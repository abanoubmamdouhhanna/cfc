import mealModel from "../../../../DB/models/Meal.model.js";
import userModel from "../../../../DB/models/User.model.js";
import { asyncHandler } from "../../../utils/errorHandling.js";
//wishlist

export const wishlist = asyncHandler(async (req, res, next) => {
  const { mealId } = req.params;
  if (!(await mealModel.findOne({ _id: mealId, isDeleted: false }))) {
    return next(new Error("In-valid meal", { cause: 400 }));
  }
  await userModel.updateOne(
    { _id: req.user._id },
    { $addToSet: { wishlist: mealId } }
  );
  return res
    .status(200)
    .json({ status: "success", message: "Added to wishlist" });
});
//====================================================================================================================//
//get wishlist
export const getWishlist = asyncHandler(async (req, res, next) => {
  // Populate the wishlist field with meal details (optional)
  const user = await userModel.findById(req.user._id).populate({
    path: "wishlist",
    match: { isDeleted: false }, // Exclude deleted meals
  });

  if (!user) {
    return next(new Error("User not found", { cause: 404 }));
  }

  return res.status(200).json({
    status: "success",
    data: user.wishlist,
  });
});

//====================================================================================================================//
//remove From Wishlist

export const removeFromWishlist = asyncHandler(async (req, res, next) => {
  const { mealId } = req.params;

  await userModel.updateOne(
    { _id: req.user._id },
    { $pull: { wishlist: mealId } }
  );
  return res
    .status(200)
    .json({ status: "success", message: "removed from wishlist" });
});
