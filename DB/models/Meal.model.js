import mongoose, { model, Schema, Types } from "mongoose";

const mealSchema = new Schema(
  {
    customId: String,
    slug: { type: String, required: true },
    image: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String },
    flavor: [String],
    price: { type: Number, required: true, default: 1 },
    discount: { type: Number, default: 0 },
    finalPrice: { type: Number, required: true, default: 1 },
    size: [String],
    wishUser: [{ type: Types.ObjectId, ref: "User" }],
    status: {
      type: String,
      default: "avialable",
      enum: ["avialable", "not avialable"],
    },
    mainMealImagePublicId: String,
    categoryId: { type: Types.ObjectId, ref: "Category", required: true },
    subcategoryId: { type: Types.ObjectId, ref: "Subcategory", required: true },
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

mealSchema.pre("find", function () {
  this.where({ isDeleted: false });
});

//virtual populate to review model
mealSchema.virtual("reviews", {
  ref: "Review",
  localField: "_id",
  foreignField: "mealId",
});

const mealModel = mongoose.models.Meal || model("Meal", mealSchema);
export default mealModel;
