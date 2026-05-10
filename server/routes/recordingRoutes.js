import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import {
  initRecording,
  completeRecording,
  markReady,
  getRecordings,
  getRecordingById,
  deleteRecording,
} from "../controllers/recordingController.js";

const router = express.Router();

// ── Bunny webhook (no auth — verify via shared secret if needed) ──
router.post("/webhook/ready", markReady);

// ── Protected routes ──
router.use(protect);

// Host creates recording entry + gets TUS credentials
router.post("/init",     authorize("admin", "instructor"), initRecording);
// Host confirms upload finished
router.post("/complete", authorize("admin", "instructor"), completeRecording);

// List recordings (admin sees all, instructor sees own, learner sees enrolled)
router.get("/",    getRecordings);
// Get single recording (includes iframe embed URL)
router.get("/:id", getRecordingById);
// Delete recording
router.delete("/:id", authorize("admin", "instructor"), deleteRecording);

export default router;
