import mongoose, { model, Schema, Types } from "mongoose";

const couponSchema = new Schema(
  {
    imageURL: String,
    customId: String,
    name: { type: String, unique: true, required: true },
    amount: { type: Number, required: true, default: 1 },
    createdBy: { type: Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: Types.ObjectId, ref: "User" },
    usedBy: [{ type: Types.ObjectId, ref: "User" }],
    isDeleted: { type: Boolean, default: false },
    expire:{type:Date ,required:true}
  },
  {
    timestamps: true,
  }
);

couponSchema.pre("find", function () {
  this.where({ isDeleted: false });
});

couponSchema.virtual("couponImagePublicId").get(function () {
  return `${process.env.APP_NAME}/Coupon/${this.customId}/${this.customId}couponImage`;
})

const couponModel = mongoose.models.Coupon || model("Coupon", couponSchema);
export default couponModel;
