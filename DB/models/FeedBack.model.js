import mongoose, { model, Schema, Types } from "mongoose";

const feedbackSchema = new Schema(
  {
    feedBackType:{
      type: String,
      enum:[
        "Start your own CFC",
        "Suggest a CFC location",
        "Customer Service",
        "Food Quality",
        "General Feedback",
        "Online Orders",
        "Vendor Inquiries",
        "Donations & Sponsorship Inquiries"
      ],
      required: true,
    },
    //feedback
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      enum: [
        "Alabama",
        "Alaska",
        "Arizona",
        "Arkansas",
        "California",
        "Colorado",
        "Connecticut",
        "Delaware",
        "Florida",
        "Georgia",
        "Hawaii",
        "Idaho",
        "Illinois",
        "Indiana",
        "Iowa",
        "Kansas",
        "Kentucky",
        "Louisiana",
        "Maine",
        "Maryland",
        "Massachusetts",
        "Michigan",
        "Minnesota",
        "Mississippi",
        "Missouri",
        "Montana",
        "Nebraska",
        "Nevada",
        "New Hampshire",
        "New Jersey",
        "New Mexico",
        "New York",
        "North Carolina",
        "North Dakota",
        "Ohio",
        "Oklahoma",
        "Oregon",
        "Pennsylvania",
        "Rhode Island",
        "South Carolina",
        "South Dakota",
        "Tennessee",
        "Texas",
        "Utah",
        "Vermont",
        "Virginia",
        "Washington",
        "West Virginia",
        "Wisconsin",
        "Wyoming",
      ],
      required:true
    },
    phone: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    //suggest loction
    newLocationAdress: {
      type: String,
    },
    city: {
      type: String,
    },
    postalCode: {
      type: Number,
    }
  },
  { timestamps: true }
);
feedbackSchema.pre("find", function () {
  this.where({ isDeleted: false });
});

const feedbackModel =
  mongoose.models.Feedback || model("Feedback", feedbackSchema);
export default feedbackModel;
