import mongoose, { model, Schema, Types } from "mongoose";

const cartMealSchema = new Schema({
  mealId: { type: Types.ObjectId, ref: "Meal", required: true },
  quantity: { type: Number, default: 1 },
  isCombo:Boolean,
  sauces: [
    {
      id: { type: Types.ObjectId, ref: "SauceOption", required: true },
      _id: false,

    },
  ],
  drinks: [
    {
      id: { type: Types.ObjectId, ref: "DrinkOption", required: true },
      _id: false,

    },
  ],
  sides: [
    {
      id: { type: Types.ObjectId, ref: "SideOption", required: true },
      _id: false,

    },
  ],
  _id: false,
});
const cartSchema = new Schema(
  {
    createdBy: { type: Types.ObjectId, ref: "User", required: true },
    meals: [cartMealSchema],
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

cartSchema.pre("find", function () {
  this.where({ isDeleted: false });
});

const cartModel = mongoose.models.Cart || model("Cart", cartSchema);
export default cartModel;
