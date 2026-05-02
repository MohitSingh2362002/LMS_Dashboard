import express from "express";
import { getParentDashboard } from "../controllers/parentController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/dashboard", protect, authorize("parent"), getParentDashboard);

export default router;
