import mongoose, { Schema, model, Types } from "mongoose";

const sauceOptionSchema = new Schema(
  {
    customId:String,
    name: { type: String, required: true, trim: true },
    image: { type: String },
    mainSauceOptionImagePublicId: { type: String },
    price: { type: Number, default: 0 },
    isAvailable: { type: Boolean, default: true },
    isFreeWithCombo: { type: Boolean, default: false }, 
    createdBy: { type: Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: Types.ObjectId, ref: "User" },

  },
  { timestamps: true }
);

const sauceOptionModel =
  mongoose.models.SauceOption || model("SauceOption", sauceOptionSchema);
export default sauceOptionModel;
