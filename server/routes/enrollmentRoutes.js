import express from "express";
import {
  enrollInCourse,
  getMyEnrollments,
  getLearnersByCourse,
  updateProgress
} from "../controllers/enrollmentController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, authorize("learner"), enrollInCourse);
router.get("/mine", protect, authorize("learner"), getMyEnrollments);
router.get("/course/:courseId", protect, authorize("admin", "instructor"), getLearnersByCourse);
router.put("/:id/progress", protect, authorize("learner"), updateProgress);

export default router;
