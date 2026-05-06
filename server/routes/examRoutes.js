import express from "express";
import {
  bulkImportQuestions,
  createMockTest,
  createQuestion,
  getLeaderboard,
  getMockTestForAttempt,
  getMockTests,
  getMyAttempts,
  getParentExamSummary,
  getQuestionBank,
  updateMockTest,
  updateQuestion,
  submitAttempt
} from "../controllers/examController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router
  .route("/questions")
  .get(protect, authorize("admin", "instructor"), getQuestionBank)
  .post(protect, authorize("admin", "instructor"), createQuestion);

router.post("/questions/bulk", protect, authorize("admin", "instructor"), bulkImportQuestions);
router.put("/questions/:id", protect, authorize("admin", "instructor"), updateQuestion);

router
  .route("/tests")
  .get(protect, authorize("admin", "instructor", "learner"), getMockTests)
  .post(protect, authorize("admin", "instructor"), createMockTest);

router.get("/parent/summary", protect, authorize("parent"), getParentExamSummary);
router.get("/tests/:id", protect, authorize("admin", "instructor", "learner"), getMockTestForAttempt);
router.put("/tests/:id", protect, authorize("admin", "instructor"), updateMockTest);
router.post("/tests/:id/attempts", protect, authorize("learner"), submitAttempt);
router.get("/tests/:id/leaderboard", protect, authorize("admin", "instructor", "learner", "parent"), getLeaderboard);
router.get("/attempts/mine", protect, authorize("learner"), getMyAttempts);

export default router;
