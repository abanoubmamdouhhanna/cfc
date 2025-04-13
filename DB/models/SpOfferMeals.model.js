import mongoose, { model, Schema, Types } from "mongoose";

const spOfferMealSchema = new Schema(
  {
    customId: String,
    slug: { type: String, required: true },
    image: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String },
    price: { type: Number, required: true, default: 1 },
    compoPrice: { type: Number, default: 1 },
    discount: { type: Number, default: 0 },
    finalPrice: { type: Number, required: true, default: 1 },
    finalComboPrice: { type: Number, required: true, default: 1 },
    size: [String],
    wishUser: [{ type: Types.ObjectId, ref: "User" }],
    status: {
      type: String,
      default: "avialable",
      enum: ["avialable", "not avialable"],
    },
    mainMealImagePublicId: String,
    createdBy: { type: Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: Types.ObjectId, ref: "User" },
    isDeleted: { type: Boolean, default: false },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  }
);

spOfferMealSchema.pre("find", function () {
  this.where({ isDeleted: false });
});

//virtual populate to review model
spOfferMealSchema.virtual("reviews", {
  ref: "Review",
  localField: "_id",
  foreignField: "mealId",
});

const spOfferMealModel = mongoose.models.SpOfferMeal || model("SpOfferMeal", spOfferMealSchema);
export default spOfferMealModel;
