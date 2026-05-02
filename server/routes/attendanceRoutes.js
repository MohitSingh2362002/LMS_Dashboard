import express from "express";
import { getAttendance, markAttendance } from "../controllers/attendanceController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router
  .route("/")
  .get(protect, authorize("admin", "instructor", "learner", "parent"), getAttendance)
  .post(protect, authorize("admin", "instructor"), markAttendance);

export default router;
