import mongoose, { Schema, model, Types } from "mongoose";

const drinkOptionSchema = new Schema(
  {
    customId: String,
    name: { type: String, required: true, trim: true },
    image: { type: String },
    mainDrinkOptionImagePublicId: { type: String },
    price: { type: Number, default: 0 },
    isAvailable: { type: Boolean, default: true },
    isFreeWithCombo: { type: Boolean, default: false }, 
    createdBy: { type: Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: Types.ObjectId, ref: "User" },

  },
  { timestamps: true }
);

const drinkOptionModel =
  mongoose.models.DrinkOption || model("DrinkOption", drinkOptionSchema);
export default drinkOptionModel;
