import mongoose, { model, Types } from "mongoose";

const transactionSchema = new mongoose.Schema({
  type: { type: String, enum: ["reward", "spend"], required: true },
  amount: { type: Number, required: true, min: 0 },
  orderId: { type: Types.ObjectId, ref: "Order" },
  createdAt: { type: Date, default: Date.now },
});

const walletSchema = new mongoose.Schema({
  userId: { type:Types.ObjectId, ref: "User", required: true },
  balance: { type: Number, required: true, default: 0 }, 
  transactions: [transactionSchema], 
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

walletSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const walletModel = mongoose.models.Wallet || model("Wallet", walletSchema);
export default walletModel;
