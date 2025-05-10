import Router from "express";
import * as jobController from "./controller/job.controller.js";
import {
  addJobSchema,
  deleteJobSchema,
  headersSchema,
} from "./controller/job.validation.js";
import { allowedTypesMap, fileUpload } from "../../utils/multerCloudinary.js";
import { isValid } from "../../middlewares/validation.middleware.js";
import { auth } from "../../middlewares/auth.middleware.js";
const router = Router();

//apply to job
router.post(
  "/apply/:hireId",
  isValid(headersSchema, true),
  auth(["user"]),
  fileUpload(5, allowedTypesMap).single("resume"),
  isValid(addJobSchema),
  jobController.apply
);

//get job
router.get(
  "/getJobs",
  isValid(headersSchema, true),
  auth(["superAdmin","admin","user"]),
  jobController.getJobs
);

//delete job
router.delete(
  "/deleteJob/:jobId",
  isValid(headersSchema, true),
  auth(["superAdmin"]),
  isValid(deleteJobSchema),
  jobController.deleteJob
);

//delete all job apps
router.delete(
  "/deleteAllJobs",
  isValid(headersSchema, true),
  auth(["superAdmin"]),
  jobController.deleteAllJobs
);

export default router;
