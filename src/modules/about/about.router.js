import Router from "express";
import * as aboutController from "./controller/about.controller.js";
import { allowedTypesMap, fileUpload } from "../../utils/multerCloudinary.js";
import { headersSchema, updateAboutSchema } from "./controller/about.validation.js";
import { isValid } from "../../middlewares/validation.middleware.js";
import { auth } from "../../middlewares/auth.middleware.js";
const router = Router();

//get about
router.get("/getAbout", aboutController.getAbout);

//update about
router.patch(
  "/upsertAbout",
  isValid(headersSchema, true),
  auth(["superAdmin"]),
  fileUpload(5, allowedTypesMap).fields([
    { name: "manifestoImage", maxCount: 10 },
    { name: "welcomeImage", maxCount: 1 },
    { name: "missionImage", maxCount: 20 },
  ]),
  isValid(updateAboutSchema),
  aboutController.upsertAbout
);

export default router;
