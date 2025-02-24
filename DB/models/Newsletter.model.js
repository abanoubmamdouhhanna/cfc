import mongoose, { model, Schema, Types } from "mongoose";

const newsletterSchema = new Schema(
  {
    location: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

newsletterSchema.pre("find", function () {
  this.where({ isDeleted: false });
});



const newsletterModel =
  mongoose.models.Newsletter || model("Newsletter", newsletterSchema);
export default newsletterModel;
