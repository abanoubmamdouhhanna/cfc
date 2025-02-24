import mongoose, { model, Schema } from "mongoose";

const teamSchema = new Schema(
  {
    customId:String,
    //diversity
    diversity: String,
    //team
    team: [{
      name: String,
      title: String,
      memberImage: String,
    }],
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

teamSchema.pre("find", function () {
  this.where({ isDeleted: false });
});

const teamModel = mongoose.models.Team || model("Team", teamSchema);
export default teamModel;
