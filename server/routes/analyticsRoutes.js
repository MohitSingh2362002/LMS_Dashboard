import express from "express";
import {
  getAdminAnalytics,
  getWeeklyAttendance,
  getLeaderboard,
  getInstructorStats,
} from "../controllers/analyticsController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/admin", protect, authorize("admin"), getAdminAnalytics);
router.get(
  "/weekly-attendance",
  protect,
  authorize("admin", "instructor"),
  getWeeklyAttendance
);
router.get(
  "/leaderboard",
  protect,
  authorize("admin", "instructor", "learner", "parent"),
  getLeaderboard
);
router.get(
  "/instructor-stats",
  protect,
  authorize("admin"),
  getInstructorStats
);

export default router;
