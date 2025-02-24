import mongoose, { model, Schema, Types } from "mongoose";

const orderSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true },
    address: [String],
    phone: [String],
    meals: [
      {
        mealId: { type: Types.ObjectId, ref: "Meal", required: true },
        name: { type: String, required: true },
        description: { type: String, required: true },
        quantity: { type: Number, default: 1 },
        size: { type: Number, default: 1 },
        unitPrice: { type: Number, default: 1 },
        finalPrice: { type: Number, default: 1 },
      },
    ],
    couponId: { type: Types.ObjectId, ref: "Coupon" },
    note: String,
    reason: String,
    // invoice:String,
    finalPrice: { type: Number, default: 1 },
    status: {
      type: String,
      default: "Pending",
      enum: [
        "Pending",
        "Processing",
        "Cancelled",
        "Rejected",
        "Completed",
      ],
    },
    paymentType: {
      type: String,
      default: "COD",
      enum: ["COD", "Card", "PayPal", "E-wallets"],
    },
    invoice:{
      url:String,
      id:String
    },

    updatedBy: { type: Types.ObjectId, ref: "User" },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

orderSchema.pre("find", function () {
  this.where({ isDeleted: false });
});



const orderModel = mongoose.models.Order || model("Order", orderSchema);
export default orderModel;
