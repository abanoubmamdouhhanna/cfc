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
  const meal = await mealModel.findById(mealId);
  if (!meal) {
    return next(new Error("Invalid meal Id", { cause: 400 }));
  }

  if (meal.status == "not available" || meal.isDeleted) {
    await mealModel.updateOne(
      { _id: mealId },
      { $addToSet: { wishUser: req.user._id } }
    );
    return next(
      new Error("You can't buy this meal at least right now", { cause: 400 })
    );
  }

  let cart = await cartModel.findOne({ createdBy: req.user._id });

  // If cart doesn't exist, create a new one
  if (!cart) {
    cart = await cartModel.create({
      createdBy: req.user.id,
      meals: [{ mealId, quantity }],
    });
  } else {
    // Check if the meal already exists in the cart
    const existingMeal = cart.meals.find((item) => item.mealId.toString() === mealId);

    if (existingMeal) {
      // If meal exists, increase the quantity
      existingMeal.quantity += quantity;
    } else {
      // If meal doesn't exist, add it as a new item
      cart.meals.push({ mealId, quantity });
    }

    await cart.save();
  }

  // Populate meal details before returning the response
  cart = await cartModel.findById(cart._id).populate({
    path: "meals.mealId",
    select: "title finalPrice description image", // Select only the fields you need
  });

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
