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

  // Sign with ROOM_JOIN_SECRET (shared with livesession via env var).
  // TTL = 5 minutes — plenty of time to open the tab and auto-join.
  const token = jwt.sign(
    { roomName: liveClass.roomId || liveClass._id.toString(), displayName: req.user.name, joinAs },
    process.env.ROOM_JOIN_SECRET || process.env.JWT_SECRET,
    { expiresIn: "5m" }
  );

  res.json({ token });
});

router.put("/:id/end", protect, authorize("admin", "instructor"), endLiveClass);
router.delete("/:id", protect, authorize("admin", "instructor"), deleteLiveClass);

export default router;
