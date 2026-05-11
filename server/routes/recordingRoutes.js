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

// ── Diagnostic: test Bunny credentials (no auth — safe, read-only) ──
router.get("/check-bunny", async (req, res) => {
  const apiKey    = process.env.BUNNY_STREAM_API_KEY;
  const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID;
  if (!apiKey || !libraryId) return res.json({ ok: false, error: "BUNNY_STREAM_API_KEY or BUNNY_STREAM_LIBRARY_ID not set" });
  try {
    const axios = (await import("axios")).default;
    const r = await axios.get(`https://video.bunnycdn.com/library/${libraryId}`, {
      headers: { AccessKey: apiKey, Accept: "application/json" },
    });
    res.json({ ok: true, libraryName: r.data.Name, libraryId: r.data.Id });
  } catch (err) {
    res.json({ ok: false, status: err.response?.status, error: err.response?.data?.Message || err.message });
  }
});

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
