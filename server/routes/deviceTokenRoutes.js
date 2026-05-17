import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import DeviceToken from "../models/DeviceToken.js";

const router = express.Router();

/** POST /api/device-tokens  { token, platform }  — register FCM token for current user */
router.post("/", protect, async (req, res) => {
  try {
    const { token, platform = "android" } = req.body;
    if (!token) return res.status(400).json({ message: "token is required" });
    await DeviceToken.findOneAndUpdate(
      { token },
      { userId: req.user._id, token, platform, isActive: true, lastSeen: new Date() },
      { upsert: true, new: true }
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

/** DELETE /api/device-tokens  { token }  — deregister on logout */
router.delete("/", protect, async (req, res) => {
  try {
    const { token } = req.body;
    if (token) await DeviceToken.findOneAndUpdate({ token }, { isActive: false });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
