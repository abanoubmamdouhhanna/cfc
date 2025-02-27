import cartModel from "../../../../DB/models/Cart.model.js";
import mealModel from "../../../../DB/models/meal.model.js";
import { asyncHandler } from "../../../utils/errorHandling.js";

//get cart
export const getCart = asyncHandler(async (req, res, next) => {
  const cart = await cartModel.find({ createdBy: req.user._id }).lean();

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
    return next(new Error("In-valid meal Id", { cause: 400 }));
  }

  if (meal.status == "not avialable" || meal.isDeleted) {
    await mealModel.updateOne(
      { _id: mealId },
      { $addToSet: { wishUser: req.user._id } }
    );
    return next(
      new Error("You can't buy this meal at least right now", {
        cause: 400,
      })
    );
  }

  const cart = await cartModel.findOne({ createdBy: req.user._id });
  //create cart for first time
  if (!cart) {
    const newCart = await cartModel.create({
      createdBy: req.user.id,
      meals: [{ mealId, quantity }],
    });
    return res.status(201).json({
      status: "success",
      message: "Cart created successfully",
      result: newCart,
    });
  }
  //update cart items
  let matchmeal = false;
  for (let index = 0; index < cart.meals.length; index++) {
    if (cart.meals[index].mealId.toString() == mealId) {
      cart.meals[index].quantity = quantity;
      matchmeal = true;
      break;
    }
  }

  //push to cart
  if (!matchmeal) {
    cart.meals.push({ mealId, quantity });
  }
  await cart.save();
  return res.status(201).json({
    status: "success",
    message: "Cart created successfully",
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
