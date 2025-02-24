import mongoose, { model, Schema, Types } from "mongoose";

const subcategorySchema = new Schema(
  {
    customId: String,
    name: { type: String, unique: true, required: true },
    slug: { type: String, required: true },
    imageURL: { type: String, required: true },
    categoryId: { type: Types.ObjectId, ref: "Category", required: true },
    status: {
      type: String,
      default: "avialable",
      enum: ["avialable", "not avialable"],
    },
    subcategoryImagePublicId:String,
    createdBy: { type: Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: Types.ObjectId, ref: "User" },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

subcategorySchema.pre("find", function () {
  this.where({ isDeleted: false });
});

subcategorySchema.virtual("viewMeals", {
  ref: "Meal",
  localField: "_id",
  foreignField: "subcategoryId",
});

const subcategoryModel =
  mongoose.models.Subcategory || model("Subcategory", subcategorySchema);
export default subcategoryModel;
