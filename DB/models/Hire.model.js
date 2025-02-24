import mongoose, { model, Schema, Types } from "mongoose";

const hireingSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      default: "fullTime",
      enum: ["fullTime", "partTime", "seasonal"],
    },
    description: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);
hireingSchema.pre("find", function () {
  this.where({ isDeleted: false });
});

const hireingModel = mongoose.models.Hireing || model("Hireing", hireingSchema);
export default hireingModel;
