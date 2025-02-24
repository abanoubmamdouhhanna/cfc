import Router from "express";
import * as newsLetterController from "./controller/newsletter.controller.js";
import { addnewsLetterSchema, deletenewsLetterSchema, headersSchema } from "./controller/newsletter.validation.js";
import { isValid } from "../../middlewares/validation.middleware.js";
import { auth } from "../../middlewares/auth.middleware.js";
const router = Router();

//send newsLetter
router.post(
  "/sendNewsLetter",
  isValid(headersSchema, true),
  auth(["user"]),
  isValid(addnewsLetterSchema),
  newsLetterController.sendNewsLetter
);

//get newsLetters
router.get(
  "/getNewsLetters",
  isValid(headersSchema, true),
  auth(["superAdmin"]),
  newsLetterController.getNewsLetters
);

//get emails from newsLetters
router.get(
  "/getEmails",
  isValid(headersSchema, true),
  auth(["superAdmin"]),
  newsLetterController.getEmails
);

//delete newsLetter
router.delete(
  "/deleteNewsLetter/:newsLetterId",
  isValid(headersSchema, true),
  auth(["superAdmin"]),
  isValid(deletenewsLetterSchema),
  newsLetterController.deleteNewsLetter
);

//delete all newsLetters
router.delete(
  "/deleteAllNewsLetters",
  isValid(headersSchema, true),
  auth(["superAdmin"]),
  newsLetterController.deleteAllNewsLetters
);

export default router;
