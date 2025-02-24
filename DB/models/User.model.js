import mongoose, { model, Schema, Types } from "mongoose";

const userSchema = new Schema(
  {
    firstName: {
      type: String,
      min: 3,
      max: 20,
      required: [true, "firstName is required"],
     },
    lastName: {
      type: String,
      min: 3,
      max: 20,
      required: [true, "lastName is required"],
     },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      default: "not Active",
      enum: ["Active", "not Active"],
    },
    role: {
      type: String,
      default: "user",
      enum: ["superAdmin", "admin", "user"],
    },
    isConfirmed: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    wishlist: [{ type: Types.ObjectId, ref: "Meal" }],
    activationCode: String,
    otp: String,
    otpexp: Date,
    permanentlyDeleted: Date,
    changeAccountInfo: Date,
  },
  { timestamps: true , toJSON:{virtuals:true},
  toObject:{virtuals:true},}
);
userSchema.pre("find", function () {
  this.where({ isDeleted: false });
});
userSchema.virtual("wishListContent" ,
  {
    ref:"Meal",
    localField:'wishlist',
    foreignField:'_id'
  })

const userModel = mongoose.models.User || model("User", userSchema);
export default userModel;
