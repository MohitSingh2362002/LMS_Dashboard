import express from "express";
import jwt from "jsonwebtoken";
import {
  createLiveClass,
  deleteLiveClass,
  endLiveClass,
  getLiveClasses
} from "../controllers/liveClassController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";
import LiveClass from "../models/LiveClass.js";

const router = express.Router();

// ── IMPORTANT: static routes MUST come before /:id routes ────────────────────

// GET/POST /
router
  .route("/")
  .get(protect, getLiveClasses)
  .post(protect, authorize("admin", "instructor"), createLiveClass);

// POST /api/live-classes/:id/join-token
// Creates a self-contained signed JWT — livesession decodes it client-side.
// No HTTP call from livesession to Dash needed → works on Vercel, offline, everywhere.
router.post("/:id/join-token", protect, async (req, res) => {
  const liveClass = await LiveClass.findById(req.params.id);
  if (!liveClass) return res.status(404).json({ message: "Live class not found" });
  if (liveClass.status === "ended") return res.status(403).json({ message: "This session has ended" });

  const joinAs = ["admin", "instructor"].includes(req.user.role) ? "host" : "participant";
  const secret = process.env.ROOM_JOIN_SECRET || process.env.JWT_SECRET;

  const liveClassId = liveClass._id.toString();
  const courseId    = liveClass.course ? liveClass.course.toString() : null;

  // Room-join JWT — decoded client-side in livesession, 5 min TTL.
  const token = jwt.sign(
    { roomName: liveClass.roomId || liveClassId, displayName: req.user.name, joinAs, liveClassId, courseId },
    secret,
    { expiresIn: "5m" }
  );

  // Recording JWT — used by livesession host to authenticate /api/recordings/* calls.
  // Long TTL (8 h) so it survives a full session. Verified server-side with ROOM_JOIN_SECRET.
  const recordingToken = joinAs === "host"
    ? jwt.sign(
        { type: "recording", liveClassId, courseId, instructorId: req.user._id.toString() },
        secret,
        { expiresIn: "8h" }
      )
    : null;

  res.json({ token, recordingToken });
});

router.put("/:id/end", protect, authorize("admin", "instructor"), endLiveClass);
router.delete("/:id", protect, authorize("admin", "instructor"), deleteLiveClass);

export default router;
