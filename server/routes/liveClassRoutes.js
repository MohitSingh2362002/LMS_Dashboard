import express from "express";
import crypto from "crypto";
import {
  createLiveClass,
  deleteLiveClass,
  endLiveClass,
  getLiveClasses
} from "../controllers/liveClassController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";
import LiveClass from "../models/LiveClass.js";

const router = express.Router();

// ── Secure join-token store (in-memory, TTL = 2 minutes, one-time use) ───────
const joinTokens = new Map();
const TOKEN_TTL_MS = 2 * 60 * 1000;

setInterval(() => {
  const now = Date.now();
  for (const [token, data] of joinTokens) {
    if (now > data.expiresAt) joinTokens.delete(token);
  }
}, 5 * 60 * 1000);

// ── IMPORTANT: static routes MUST come before /:id routes ────────────────────

// GET /api/live-classes/join-token/:token  (NO auth — token IS the auth)
// livesession calls this to exchange the one-time token for room details.
router.get("/join-token/:token", (req, res) => {
  const data = joinTokens.get(req.params.token);
  if (!data) return res.status(404).json({ message: "Invalid or expired join token" });
  if (Date.now() > data.expiresAt) {
    joinTokens.delete(req.params.token);
    return res.status(410).json({ message: "Join token expired. Please request a new link." });
  }
  joinTokens.delete(req.params.token); // one-time use — delete immediately
  res.json({ roomName: data.roomName, displayName: data.displayName, joinAs: data.joinAs });
});

// GET/POST /
router
  .route("/")
  .get(protect, getLiveClasses)
  .post(protect, authorize("admin", "instructor"), createLiveClass);

// POST /api/live-classes/:id/join-token  (requires auth)
// Dash calls this on behalf of the logged-in user to create a one-time join token.
router.post("/:id/join-token", protect, async (req, res) => {
  const liveClass = await LiveClass.findById(req.params.id);
  if (!liveClass) return res.status(404).json({ message: "Live class not found" });
  if (liveClass.status === "ended") return res.status(403).json({ message: "This session has ended" });

  const joinAs = ["admin", "instructor"].includes(req.user.role) ? "host" : "participant";
  const token = crypto.randomBytes(24).toString("hex"); // 48-char unguessable token

  joinTokens.set(token, {
    roomName: liveClass.roomId || liveClass._id.toString(),
    displayName: req.user.name,
    joinAs,
    expiresAt: Date.now() + TOKEN_TTL_MS,
  });

  res.json({ token });
});

router.put("/:id/end", protect, authorize("admin", "instructor"), endLiveClass);
router.delete("/:id", protect, authorize("admin", "instructor"), deleteLiveClass);

export default router;
