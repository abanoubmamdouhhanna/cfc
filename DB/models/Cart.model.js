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

    extras: [
      {
        type: { type: String, enum: ["sauce", "drink", "side"], required: true },
        id: { type: Types.ObjectId, required: true },
        quantity: { type: Number, default: 1 },
        _id: false
      }
    ],

    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

cartSchema.pre("find", function () {
  this.where({ isDeleted: false });
});

// In your cart schema
cartSchema.virtual('sauceExtras', {
  ref: 'SauceOption',
  localField: 'extras.id',
  foreignField: '_id',
  match: { 'extras.type': 'sauce' } // works only if structure matches
});

cartSchema.virtual('drinkExtras', {
  ref: 'DrinkOption',
  localField: 'extras.id',
  foreignField: '_id',
  match: { 'extras.type': 'drink' }
});

cartSchema.virtual('sideExtras', {
  ref: 'SideOption',
  localField: 'extras.id',
  foreignField: '_id',
  match: { 'extras.type': 'side' }
});


const cartModel = mongoose.models.Cart || model("Cart", cartSchema);
export default cartModel;
