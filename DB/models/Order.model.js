import mongoose, { model, Schema, Types } from "mongoose";

const orderSchema = new Schema(
  {
    customId:String,
    locationId: { type: Types.ObjectId, ref: "Location", required: true },
    userId: { type: Types.ObjectId, ref: "User", required: true },
    address: { type: String, required: true },
    phone: [{ type: String, required: true }],
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
    reason: String,
    finalPrice: { type: Number, default: 1 },
    status: {
      type: String,
      default: "Pending",
      enum: [
        "Pending",
        "Processing",
        "Prepared",
        "Completed",
        "Cancelled",
        "Rejected",
      ],
    },
    paymentType: {
      type: String,
      default: "Card",
      enum: [ "Card", "PayPal", "E-wallets"],
    },
    invoice:String,
    invoicePublicId:String,

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
