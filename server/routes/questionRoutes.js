import express from "express";
import {
  answerQuestion,
  createQuestion,
  getQuestions
} from "../controllers/questionController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router
  .route("/")
  .get(protect, getQuestions)
  .post(protect, authorize("learner"), createQuestion);

router.put("/:id/answer", protect, authorize("admin", "instructor"), answerQuestion);

export default router;
