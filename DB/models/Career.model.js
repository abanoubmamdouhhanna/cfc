import mongoose, { model, Schema, Types } from "mongoose";
const coreSchema = new Schema(
  {
    coreTile: { type: String, required: true },
    coredescription: { type: String, required: true },
  },
  { _id: true }
);
const careerSchema = new Schema(
  {
    whyCFC: { type: String, required: true },
    coreValues:[coreSchema],
    benefits: [{ type: String, required: true }],

    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

careerSchema.pre("find", function () {
  this.where({ isDeleted: false });
});

const careerModel = mongoose.models.Career || model("Career", careerSchema);
export default careerModel;
