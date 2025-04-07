import cartModel from "../../../../DB/models/Cart.model.js";
import drinkOptionModel from "../../../../DB/models/Drink.model.js";
import mealModel from "../../../../DB/models/Meal.model.js";
import sauceOptionModel from "../../../../DB/models/Sauce.model.js";
import sideOptionModel from "../../../../DB/models/Side.model.js";
import { asyncHandler } from "../../../utils/errorHandling.js";

//get cart
export const getCart = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;

  const cart = await cartModel
    .findOne({ createdBy: userId })
    .populate([
      {
        path: "meals.mealId",
        select: "title finalPrice description image isCombo finalComboPrice",
      },
      {
        path: "meals.sauces.id",
        select: "name price",
        model: sauceOptionModel,
      },
      {
        path: "meals.drinks.id",
        select: "name price",
        model: drinkOptionModel,
      },
      {
        path: "meals.sides.id",
        select: "name price",
        model: sideOptionModel,
      },
    ])
    .lean();

  if (!cart || !cart.meals || cart.meals.length === 0) {
    return res.status(200).json({
      status: "success",
      message: "User cart is empty",
      result: { createdBy: userId, meals: [], cartSubtotal: 0 },
    });
  }

  let cartSubtotal = 0;

  for (const mealItem of cart.meals) {
    if (!mealItem.mealId) continue;

    const basePrice = mealItem.isCombo
      ? mealItem.mealId.finalComboPrice
      : mealItem.mealId.finalPrice;
    let itemBasePrice = basePrice * mealItem.quantity;
    let itemExtrasPrice = 0;

    const freeSaucesCount = mealItem.quantity;
    const freeDrinksCount = mealItem.quantity;
    const freeSidesCount = mealItem.quantity;

    mealItem.sauces?.forEach((sauce, index) => {
      if (sauce.id && sauce.id.price !== undefined) {
        if (index >= freeSaucesCount) {
          itemExtrasPrice += sauce.id.price || 0;
        }
      }
    });

    mealItem.drinks?.forEach((drink, index) => {
      if (drink.id && drink.id.price !== undefined) {
        if (index >= freeDrinksCount) {
          itemExtrasPrice += drink.id.price || 0;
        }
      }
    });

    mealItem.sides?.forEach((side, index) => {
      if (side.id && side.id.price !== undefined) {
        if (index >= freeSidesCount) {
          itemExtrasPrice += side.id.price || 0;
        }
      }
    });

    mealItem.itemSubtotal = itemBasePrice + itemExtrasPrice;
    cartSubtotal += mealItem.itemSubtotal;
  }

  cart.cartSubtotal = parseFloat(cartSubtotal.toFixed(2));

  return res.status(200).json({
    status: "success",
    message: "User Cart",
    result: cart,
  });
});
//====================================================================================================================//
//add to cart
export const addToCart = asyncHandler(async (req, res, next) => {
  const { mealId, quantity, sauces, drinks, sides, isCombo } = req.body;

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
    return next(
      new Error("You can't buy this meal at least right now", { cause: 400 })
    );
  }

  const mealDataToAdd = {
    mealId: meal._id,
    isCombo,
    quantity: quantity || 1,
  };

  // Conditionally add sauces, drinks, and sides
  if (isCombo) {
    mealDataToAdd.sauces = sauces || [];
    mealDataToAdd.drinks = drinks || [];
    mealDataToAdd.sides = sides || [];
  }

  // Find the cart
  let cart = await cartModel.findOne({ createdBy: req.user._id });

  if (cart) {
    // Cart exists, check for existing meal
    const existingMealIndex = cart.meals.findIndex((m) => {
      if (m.isCombo === isCombo && m.mealId.toString() === mealId) {
        if (isCombo) {
          return (
            JSON.stringify(m.sauces) === JSON.stringify(mealDataToAdd.sauces) &&
            JSON.stringify(m.drinks) === JSON.stringify(mealDataToAdd.drinks) &&
            JSON.stringify(m.sides) === JSON.stringify(mealDataToAdd.sides)
          );
        } else {
          return true; // No sauces, drinks, sides to compare if isCombo is false
        }
      }
      return false;
    });

    if (existingMealIndex !== -1) {
      // Meal exists, increment quantity
      cart.meals[existingMealIndex].quantity += quantity || 1;
      await cart.save();
    } else {
      // Meal doesn't exist, add as new meal
      cart.meals.push(mealDataToAdd);
      await cart.save();
    }
  } else {
    // Cart doesn't exist, create a new cart
    cart = await cartModel.create({
      createdBy: req.user._id,
      meals: [mealDataToAdd],
    });
  }

  // Populate meals after updating
  const populatedCart = await cartModel.findById(cart._id).populate({
    path: "meals.mealId",
    select: "title finalPrice description image isCombo",
  });

  return res.status(201).json({
    status: "success",
    message: "Meal added to cart successfully",
    result: populatedCart,
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
