import Router from "express";
import * as teamController from "./controller/team.controller.js";
import { allowedTypesMap, fileUpload } from "../../utils/multerCloudinary.js";
import { addTeamSchema, headersSchema, updateTeamSchema
} from "./controller/team.validation.js";
import { isValid } from "../../middlewares/validation.middleware.js";
import { auth } from "../../middlewares/auth.middleware.js";
const router = Router();

//add team
router.post(
  "/addTeam",
  isValid(headersSchema, true),
  auth(["superAdmin"]),
  fileUpload(2, allowedTypesMap).fields([
    { name: "memberImage", maxCount: 20 },
  ]),
  isValid(addTeamSchema),
  teamController.addTeam
);

//get team
router.get("/getTeam", teamController.getTeam);

//update team
router.patch(
  "/updateTeam/:teamId",
  isValid(headersSchema, true),
  auth(["superAdmin"]),
  fileUpload(2, allowedTypesMap).fields([
    { name: "memberImage", maxCount: 20 },
  ]),
  isValid(updateTeamSchema),
  teamController.updateTeam
);

export default router;
