import cartModel from "../../../../DB/models/Cart.model.js";
import drinkOptionModel from "../../../../DB/models/Drink.model.js";
import mealModel from "../../../../DB/models/Meal.model.js";
import sauceOptionModel from "../../../../DB/models/Sauce.model.js";
import sideOptionModel from "../../../../DB/models/Side.model.js";
import { asyncHandler } from "../../../utils/errorHandling.js";

//get cart
export const getCart = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;

  // 1️⃣ Fetch cart with meals & meal additions populated
  const cart = await cartModel
    .findOne({ createdBy: userId })
    .populate([
      {
        path: "meals.mealId",
        select: "title finalPrice finalComboPrice description image isCombo",
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

  if (!cart || (!cart.meals?.length && !cart.extras?.length)) {
    return res.status(200).json({
      status: "success",
      message: "User cart is empty",
      result: {
        createdBy: userId,
        meals: [],
        extras: [],
        cartSubtotal: 0,
      },
    });
  }

  let cartSubtotal = 0;

  // 2️⃣ Calculate meals subtotal
  for (const mealItem of cart.meals) {
    if (!mealItem.mealId) continue;

    const basePrice = mealItem.isCombo
      ? mealItem.mealId.finalComboPrice
      : mealItem.mealId.finalPrice;

    const itemBasePrice = basePrice * mealItem.quantity;
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

    mealItem.itemSubtotal = parseFloat(
      (itemBasePrice + itemExtrasPrice).toFixed(2)
    );
    cartSubtotal += mealItem.itemSubtotal;
  }

  // 3️⃣ Manually populate standalone extras & calculate subtotal
  if (cart.extras?.length) {
    for (const extra of cart.extras) {
      let optionDetails = null;

      if (extra.type === "sauce") {
        optionDetails = await sauceOptionModel
          .findById(extra.id)
          .select("name price");
      } else if (extra.type === "drink") {
        optionDetails = await drinkOptionModel
          .findById(extra.id)
          .select("name price");
      } else if (extra.type === "side") {
        optionDetails = await sideOptionModel
          .findById(extra.id)
          .select("name price");
      }

      if (optionDetails) {
        extra.details = optionDetails; // attach populated info
        const extraSubtotal = (optionDetails.price || 0) * extra.quantity;
        extra.itemSubtotal = parseFloat(extraSubtotal.toFixed(2));
        cartSubtotal += extra.itemSubtotal;
      } else {
        // If invalid ID (edge case), mark as $0
        extra.details = { name: "Unavailable", price: 0 };
        extra.itemSubtotal = 0;
      }
    }
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
//add Standalone Extra
export const addStandaloneExtra = asyncHandler(async (req, res, next) => {
  const { type, id, quantity } = req.body;

  if (!["sauce", "drink", "side"].includes(type)) {
    return next(new Error("Invalid type, must be sauce, drink, or side", { cause: 400 }));
  }

  // Validate existence
  let option;
  if (type === "sauce") {
    option = await sauceOptionModel.findById(id);
  } else if (type === "drink") {
    option = await drinkOptionModel.findById(id);
  } else if (type === "side") {
    option = await sideOptionModel.findById(id);
  }

  if (!option || !option.isAvailable) {
    return next(new Error(`This ${type} is not available`, { cause: 400 }));
  }

  // Find or create cart
  let cart = await cartModel.findOne({ createdBy: req.user._id });
  if (!cart) {
    cart = await cartModel.create({
      createdBy: req.user._id,
      extras: [{ type, id, quantity: quantity || 1 }],
    });
  } else {
    // Check if already in extras
    const existingIndex = cart.extras.findIndex(
      (e) => e.type === type && e.id.toString() === id
    );

    if (existingIndex !== -1) {
      cart.extras[existingIndex].quantity += quantity || 1;
    } else {
      cart.extras.push({ type, id, quantity: quantity || 1 });
    }

    await cart.save();
  }

  // Optional: populate for response
  return res.status(201).json({
    status: "success",
    message: `${type} added to cart successfully`,
    result: cart,
  });
});
//====================================================================================================================//
//clear cart

export async function clearAllCartItems(createdBy) {
  return await cartModel.updateOne(
    { createdBy },
    { meals: [], extras: [] }
  );
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
