import Router from "express";
import * as hireController from "./controller/hire.controller.js";
import {
  addHireSchema,
  deleteHireSchema,
  headersSchema,
  updateHireSchema,
} from "./controller/hire.validation.js";
import { isValid } from "../../middlewares/validation.middleware.js";
import { auth } from "../../middlewares/auth.middleware.js";
const router = Router();

//add hire
router.post(
  "/addHire",
  isValid(headersSchema, true),
  auth(["superAdmin"]),
  isValid(addHireSchema),
  hireController.addHire
);

//update hire
router.patch(
  "/updateHire/:hireId",
  isValid(headersSchema, true),
  auth(["superAdmin"]),
  isValid(updateHireSchema),
  hireController.updateHire
);

//get hire
router.get("/getHires", hireController.getHires);

//delete hire
router.delete(
  "/deleteHire/:hireId",
  isValid(headersSchema, true),
  auth(["superAdmin"]),
  isValid(deleteHireSchema),
  hireController.deleteHire
);

//delete all hires
router.delete(
  "/deleteAllHires",
  isValid(headersSchema, true),
  auth(["superAdmin"]),
  hireController.deleteAllHires
);

export default router;
