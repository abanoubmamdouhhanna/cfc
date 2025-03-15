import mongoose, { model, Schema, Types } from "mongoose";

const orderSchema = new Schema(
  {
    customId: String,
    locationId: { type: Types.ObjectId, ref: "Location", required: true },
    userId: { type: Types.ObjectId, ref: "User", required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    phone: { type: String, required: true },
    meals: [
      {
        mealId: { type: Types.ObjectId, ref: "Meal", required: true },
        title: { type: String, required: true },
        description: { type: String },
        flavor: { type: String },
        quantity: { type: Number, default: 1 },
        size: { type: Number, default: 1 },
        unitPrice: { type: Number, default: 1 },
        finalPrice: { type: Number, default: 1 },
      },
    ],
    couponId: { type: Types.ObjectId, ref: "Coupon" },
    reason: String,
    discount: { type: Number, default: 0 },
    finalPrice: { type: Number, default: 1 },
    tax: { type: Number },
    totalPrice: { type: Number, default: 1 }, // price after tax
    status: {
      type: String,
      default: "Pending",
      enum: ["Pending", "Processing", "Completed", "Cancelled", "Rejected"],
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending",
    },
    paymentType: {
      type: String,
      default: "Card",
      enum: ["Card", "PayPal", "Wallet"],
    },
    orderDate: {
      type: String,
      required: true,
    },
    orderTime: {
      type: String,
      required: true,
    },

    invoice: String,
    invoicePublicId: String,
    stripeSessionurl: String,
    paypalCheckoutUrl: String,

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
