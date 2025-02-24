import mongoose, { model, Schema, Types } from "mongoose";

const categorySchema = new Schema(
  {
    customId:String,
    name: { type: String,unique:true, required: true },
    slug: { type: String, required: true },
    imageURL: {type:String ,required:true},
    status: {
      type: String,
      default: "avialable",
      enum: ["avialable", "not avialable"],
    },
    categoryImagePublicId:String,
    createdBy: { type: Types.ObjectId, ref: "User", required: true }, 
    updatedBy: { type: Types.ObjectId, ref: "User"}, 
    isDeleted: { type: Boolean, default: false },
  },
  {
    toObject:{virtuals:true},
    toJSON:{virtuals:true},
    timestamps: true,
  }
);

categorySchema.pre("find", function () {
  this.where({ isDeleted: false });
});


categorySchema.virtual("SubCategories",
  {
    ref:"Subcategory",
    localField:"_id",
    foreignField:"categoryId"
  })
  

const categoryModel =
  mongoose.models.Category || model("Category", categorySchema);
export default categoryModel;
