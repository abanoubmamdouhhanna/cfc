import mongoose, { Schema, model, Types } from "mongoose";

const sideOptionSchema = new Schema(
  {
    customId:String,
    name: { type: String, required: true, trim: true },
    image: { type: String },
    mainsideOptionImagePublicId: { type: String },
    price: { type: Number, default: 0 },
    isAvailable: { type: Boolean, default: true },
    createdBy: { type: Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: Types.ObjectId, ref: "User" },

  },
  { timestamps: true }
);

const sideOptionModel =
  mongoose.models.SideOption || model("SideOption", sideOptionSchema);
export default sideOptionModel;
