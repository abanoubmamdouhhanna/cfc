import mongoose, { model, Schema, Types } from "mongoose";

const processSchema = new Schema(
  {
    processText: { type: String, required: true },
    processImage: { type: String, required: true },
  },
  { _id: true }
);

const franchiseSchema = new Schema(
  {
    customId: String,
    //welcome
    welcomeText: { type: String, required: true },
    whyChooseCFC: [{ type: String, required: true }],
    ourProcess: [processSchema],
    benfits: [{ type: String, required: true }],

    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

franchiseSchema.pre("find", function () {
  this.where({ isDeleted: false });
});

const franchiseModel = mongoose.models.Franchise || model("Franchiset", franchiseSchema);
export default franchiseModel;
