import Router from "express";
import * as teamController from "./controller/team.controller.js";
import { allowedTypesMap, fileUpload } from "../../utils/multerCloudinary.js";
import {  headersSchema, updateTeamSchema
} from "./controller/team.validation.js";
import { isValid } from "../../middlewares/validation.middleware.js";
import { auth } from "../../middlewares/auth.middleware.js";
const router = Router();


//get team
router.get("/getTeam", teamController.getTeam);

//update team
router.patch(
  "/upsertTeam",
  isValid(headersSchema, true),
  auth(["superAdmin"]),
  fileUpload(5, allowedTypesMap).fields([
    { name: "memberImage", maxCount: 20 },
  ]),
  isValid(updateTeamSchema),
  teamController.upsertTeam
);

export default router;
