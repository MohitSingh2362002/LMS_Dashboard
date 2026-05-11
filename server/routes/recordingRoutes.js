import express from "express";
import { protect, authorize, protectRecording } from "../middleware/authMiddleware.js";
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

// ── Host upload routes — authenticated with recording JWT (not user JWT) ──
// livesession sends the recording_token stored in localStorage as Bearer token.
router.post("/init",     protectRecording, initRecording);
router.post("/complete", protectRecording, completeRecording);

// ── Dash user routes — authenticated with normal user JWT ──
router.use(protect);

// List recordings (admin sees all, instructor sees own, learner sees enrolled)
router.get("/",    getRecordings);
// Get single recording (includes iframe embed URL)
router.get("/:id", getRecordingById);
// Delete recording
router.delete("/:id", authorize("admin", "instructor"), deleteRecording);

export default router;
