import express from "express";
import { getParentDashboard, getParentReports } from "../controllers/parentController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/dashboard", protect, authorize("parent"), getParentDashboard);
router.get("/reports", protect, authorize("parent"), getParentReports);

export default router;
