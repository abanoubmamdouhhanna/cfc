import mongoose, { model, Schema, Types } from "mongoose";

const missionSchema = new Schema(
  {
    missionText: { type: String, required: true },
    missionImage: { type: String, required: true },
  },
  { _id: true }
);

const aboutSchema = new Schema(
  {
    customId: String,
    welcome: {
      welcomeText: { type: String, required: true },
      welcomeImage: { type: String, required: true },
    },

    ourValues: [{ type: String, required: true }],
    missions: [missionSchema],
    wayOfDoingBusiness: [{ type: String, required: true }],
    freshManifesto: {
      freshManifestoText: { type: String, required: true },
      manifestoImage: [{ type: String, required: true }],
    },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);
aboutSchema.pre("find", function () {
  this.where({ isDeleted: false });
});

const aboutModel = mongoose.models.About || model("About", aboutSchema);
export default aboutModel;
