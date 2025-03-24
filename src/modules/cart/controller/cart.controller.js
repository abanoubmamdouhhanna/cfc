import cartModel from "../../../../DB/models/Cart.model.js";
import mealModel from "../../../../DB/models/Meal.model.js";
import { asyncHandler } from "../../../utils/errorHandling.js";

//get cart
export const getCart = asyncHandler(async (req, res, next) => {
  const cart = await cartModel.findOne({ createdBy: req.user._id }).populate({
    path: "meals.mealId",
    select: "title finalPrice description image", // Select only the fields you need
  }).lean()

  return res.status(200).json({
    status: "success",
    message: "user Cart",
    result: cart,
  });
});
//====================================================================================================================//
//add to cart

export const addToCart = asyncHandler(async (req, res, next) => {
  const { mealId, quantity } = req.body;

  // Find the meal once
  const meal = await mealModel.findById(mealId);
  if (!meal) {
    return next(new Error("Invalid meal Id", { cause: 400 }));
  }

  if (meal.status === "not available" || meal.isDeleted) {
    await mealModel.updateOne(
      { _id: mealId },
      { $addToSet: { wishUser: req.user._id } }
    );
    return next(new Error("You can't buy this meal at least right now", { cause: 400 }));
  }

  // Update or create the cart in one query
  const cart = await cartModel.findOneAndUpdate(
    { createdBy: req.user._id, "meals.mealId": mealId }, 
    { 
      $inc: { "meals.$.quantity": quantity } // Increase quantity if meal exists
    },
    { new: true }
  ).populate({
    path: "meals.mealId",
    select: "title finalPrice description image",
  });

  if (!cart) {
    // If cart or meal doesn't exist in cart, create/update it
    const newCart = await cartModel.findOneAndUpdate(
      { createdBy: req.user._id },
      {
        $push: { meals: { mealId, quantity } } // Add new meal
      },
      { new: true, upsert: true } // Create cart if not exists
    ).populate({
      path: "meals.mealId",
      select: "title finalPrice description image",
    });

    return res.status(201).json({
      status: "success",
      message: "Cart updated successfully",
      result: newCart,
    });
  }

  return res.status(201).json({
    status: "success",
    message: "Cart updated successfully",
    result: cart,
  });
});


//====================================================================================================================//
//clear cart

export async function clearAllCartItems(createdBy) {
  const cart = await cartModel.updateOne({ createdBy }, { meals: [] });
  return cart;
}
export const clearCart = asyncHandler(async (req, res, next) => {
  await clearAllCartItems(req.user._id);
  return res.status(200).json({
    status: "success",
    message: "Cart cleared successfully",
  });
});

//====================================================================================================================//
//clear Cart Item
export async function clearSelectedItems(mealIds, createdBy) {
  const cart = await cartModel.updateOne(
    { createdBy },
    {
      $pull: {
        meals: {
          mealId: { $in: mealIds },
        },
      },
    }
  );
  return cart;
}

export const clearCartItem = asyncHandler(async (req, res, next) => {
  const { mealIds } = req.body;
  if (!mealIds) {
    return next(new Error("Empty cart"));
  }
  await clearSelectedItems(mealIds, req.user._id);
  return res.status(200).json({
    status: "success",
    message: "Cart item selected cleared successfully",
  });
});
