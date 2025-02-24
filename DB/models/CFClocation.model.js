import mongoose, { model, Schema, Types } from "mongoose";

const locationSchema = new Schema(
  {
    customId:String,
    title: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: String, required: true },
    hours: { type: String, required: true },
    locationURL: { type: String, required: true },
    locationPhoto:{type: String },
    locationPhotoPublicId:String,
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

locationSchema.pre("find", function () {
  this.where({ isDeleted: false });
});

const locationModel =
  mongoose.models.Location || model("Location", locationSchema);
export default locationModel;
