import mongoose, { model, Schema, Types } from "mongoose";

const jobAppSchema = new Schema(
  {
    customId:String,
    hireId:{ type: Types.ObjectId, ref: "Hireing" },
    //personal info
    firstName: {
      type: String,
      min: 3,
      max: 20,
      required: [true, "firstName is required"],
    },
    middleName: {
      type: String,
      min: 3,
      max: 20,
      required: [true, "middleName is required"],
    },
    lastName: {
      type: String,
      min: 3,
      max: 20,
      required: [true, "lastName is required"],
    },
    address: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    postalCode: {
      type: Number,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phone: {
      type: String,
      required: true,
    },
    ssn: {
      type: String,
      required: true,
    },

    dateAvialabe: {
      type: Date,
      required: true,
    },
    desiredPay: {
      type: Number,
      required: true,
    },
    position: {
      type: String,
      required: true,
    },

    employmentDesired: {
      type: String,
      required: true,
      enum: ["fullTime", "partTime", "seasonal"],
    },

    //employment
    USCitizen: {
      type: Boolean,
      required: true,
      enum: ["yes", "no"],
    },
    allowToWork: {
      type: Boolean,
      enum: ["yes", "no"],
    },
    everWorkedForEmployer: {
      type: Boolean,
      required: true,
      enum: ["yes", "no"],
    },
    ifWorked: String,
    areConvicted: {
      type: Boolean,
      required: true,
      enum: ["yes", "no"],
    },
    ifConvicted: String,

    //education
    highSchool: {
      type: String,
      required: true,
    },
    eduCity: {
      type: String,
      required: true,
    },
    eduState: {
      type: String,
      required: true,
    },
    from: {
      type: Date,
      required: true,
    },
    to: {
      type: Date,
      required: true,
    },
    graduate: {
      type: Boolean,
      enum: ["yes", "no"],
    },
    diploma: {
      type: String,
      required: true,
    },
    college: {
      type: String,
      required: true,
    },
    collegeCity: {
      type: String,
      required: true,
    },
    collegeState: {
      type: String,
      required: true,
    },
    collegeFrom: {
      type: Date,
      required: true,
    },
    collegeTo: {
      type: Date,
      required: true,
    },
    collegeGraduate: {
      type: Boolean,
      enum: ["yes", "no"],
    },
    degree: {
      type: String,
      required: true,
    },
    resume: {
      type: String,
      required: true,
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);
jobAppSchema.pre("find", function () {
  this.where({ isDeleted: false });
});

const jobModel = mongoose.models.Job || model("Job", jobAppSchema);
export default jobModel;
