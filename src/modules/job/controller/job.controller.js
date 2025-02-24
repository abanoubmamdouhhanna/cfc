import { nanoid } from "nanoid";
import { asyncHandler } from "../../../utils/errorHandling.js";
import { uploadToCloudinary } from "../../../utils/uploadHelper.js";
import jobModel from "../../../../DB/models/JobApp.model.js";

//apply to job
export const apply = asyncHandler(async (req, res, next) => {
  const { hireId } = req.params;
  const requiredFields = [
    "firstName",
    "middleName",
    "lastName",
    "address",
    "city",
    "state",
    "postalCode",
    "email",
    "phone",
    "ssn",
    "dateAvialabe",
    "desiredPay",
    "position",
    "employmentDesired",
    "USCitizen",
    "everWorkedForEmployer",
    "areConvicted",
    "highSchool",
    "eduCity",
    "eduState",
    "from",
    "to",
    "graduate",
    "diploma",
    "college",
    "collegeCity",
    "collegeState",
    "collegeFrom",
    "collegeTo",
    "collegeGraduate",
    "degree",
  ];

  for (const field of requiredFields) {
    if (!req.body[field]) {
      return next(new Error(`${field} must be provided.`, { cause: 400 }));
    }
  }
  const { email } = req.body;
  const checkExist = await jobModel.findOne({ email });
  if (checkExist) {
    return next(new Error(`Email already exist`, { cause: 400 }));
  }

  const customId = `JobApp_${nanoid()}`;
  const resume = await uploadToCloudinary(
    req.file,
    `${process.env.APP_NAME}/Resume/${customId}`,
    `${customId}resume`
  );
  const data = { ...req.body, hireId, resume };
  const jobApplication = await jobModel.create(data);
  res
    .status(201)
    .json({ message: "Job application created successfully", jobApplication });
});
//====================================================================================================================//
//get hires
export const getJobs = asyncHandler(async (req, res, next) => {
  const JobApps = await jobModel.find({});
  return res.status(200).json({
    status: "succcess",
    message: "Done",
    JobApps,
  });
});
//====================================================================================================================//
//delete hire

export const deleteJob = asyncHandler(async (req, res, next) => {
  const job = await jobModel.findByIdAndDelete(req.params.jobId);
  if (!job) {
    return next(new Error("Invalid jobApp ID", { cause: 404 }));
  }

  return res.status(200).json({
    status: "success",
    message: "Job app deleted successfully",
    deletedjob: job,
  });
});

//====================================================================================================================//
//delete all hires

export const deleteAllJobs = asyncHandler(async (req, res, next) => {
  const jobs = await jobModel.deleteMany();

  return res.status(200).json({
    status: "success",
    message: "Job Apps deleted successfully",
    deletedJobs: jobs,
  });
});
