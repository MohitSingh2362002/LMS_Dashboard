import express from "express";
import {
  enrollInCourse,
  getMyEnrollments,
  getLearnersByCourse,
  parentEnrollLearner,
  updateProgress
} from "../controllers/enrollmentController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, authorize("learner"), enrollInCourse);
router.post("/parent-enroll", protect, authorize("parent"), parentEnrollLearner);
router.get("/mine", protect, authorize("learner"), getMyEnrollments);
router.get("/course/:courseId", protect, authorize("admin", "instructor"), getLearnersByCourse);
router.put("/:id/progress", protect, authorize("learner"), updateProgress);

export default router;
