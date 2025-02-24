import mongoose, { model, Schema, Types } from "mongoose";

const reviewSchema = new Schema(
  {
    mealId: { type: Types.ObjectId, ref: "Meal", required: true },
    orderId: { type: Types.ObjectId, ref: "Order", required: true },
    comment: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    createdBy: { type: Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: Types.ObjectId, ref: "User" },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

reviewSchema.pre("find", function () {
  this.where({ isDeleted: false });
});

const reviewModel = mongoose.models.Review || model("Review", reviewSchema);
export default reviewModel;
