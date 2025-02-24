import cartModel from "../../../../DB/models/Cart.model.js";
import productModel from "../../../../DB/models/Product.model.js";
import { asyncHandler } from "../../../utils/errorHandling.js";

//get cart
export const getCart=asyncHandler(async(req,res,next)=>
{
  const cart =await cartModel.findById(req.user._id)
  return res
  .status(200)
  .json({
    status: "success",
    message: "User Cart",
    result: cart,
  });

}
)
//add to cart
export const addToCart = asyncHandler(async (req, res, next) => {
  const { productId, quantity } = req.body;
  const product = await productModel.findById(productId);
  if (!product) {
    return next(new Error("In-valid product Id", { cause: 400 }));
  }

  if (quantity > product.stock || product.isDeleted) {
    await productModel.updateOne(
      { _id: productId },
      { $addToSet: { wishUser: req.user._id } }
    );
    return next(
      new Error("You can't buy this quantity or at least right now", {
        cause: 400,
      })
    );
  }

  const cart = await cartModel.findOne({ createdBy: req.user._id });
  //create cart for first time
  if (!cart) {
    const newCart = await cartModel.create({
      createdBy: req.user.id,
      products: [{ productId, quantity }],
    });
    return res
      .status(201)
      .json({
        status: "success",
        message: "Cart created successfully",
        result: newCart,
      });
  }
  //update cart items
  let matchProduct = false;
  for (let index = 0; index < cart.products.length; index++) {
    if (cart.products[index].productId.toString() == productId) {
      cart.products[index].quantity = quantity;
      matchProduct = true;
      break;
    }
  }

  //push to cart
  if (!matchProduct) {
    cart.products.push({ productId, quantity });
  }
  await cart.save();
  return res
    .status(201)
    .json({
      status: "success",
      message: "Cart created successfully",
      result: cart,
    });
});

//====================================================================================================================//
//clear cart
export async function clearAllCartItems(createdBy)
{
  const cart = await cartModel.updateOne({createdBy},{products:[]})
  return cart

}
export const clearCart=asyncHandler(async(req,res,next)=>
{
  await clearAllCartItems(req.user._id)
    return res
    .status(200)
    .json({
      status: "success",
      message: "Cart cleared successfully"
    });
}
)

//====================================================================================================================//
//clear Cart Item
export async function clearSelectedItems(productIds, createdBy) {
  const cart = await cartModel.updateOne(
    { createdBy },
    {
      $pull: {
        products: {
          productId: { $in: productIds },
        },
      },
    }
  );
  return cart;
}

export const clearCartItem=asyncHandler(async(req,res,next)=>
{
  const {productIds}=req.body
  await clearSelectedItems(productIds,req.user._id)
  return res
    .status(200)
    .json({
      status: "success",
      message: "Cart item selected cleared successfully"
    });
})