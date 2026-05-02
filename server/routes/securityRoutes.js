import express from "express";
import { createContentAccessLog, getContentAccessLogs } from "../controllers/securityController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router
  .route("/content-logs")
  .get(protect, authorize("admin", "instructor"), getContentAccessLogs)
  .post(protect, createContentAccessLog);

export default router;
