import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import User from "../models/User.js";

const router = express.Router();

/** POST /api/device-tokens  { token, platform }  — upsert FCM token inside user document */
router.post("/", protect, async (req, res) => {
  try {
    const { token, platform = "android" } = req.body;
    if (!token) return res.status(400).json({ message: "token is required" });

    // Pull old entry for this token (if any), then push fresh one
    await User.findByIdAndUpdate(req.user._id, { $pull: { deviceTokens: { token } } });
    await User.findByIdAndUpdate(req.user._id, {
      $push: { deviceTokens: { token, platform, isActive: true, lastSeen: new Date() } },
    });

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

/** DELETE /api/device-tokens  { token }  — deactivate token on logout */
router.delete("/", protect, async (req, res) => {
  try {
    const { token } = req.body;
    if (token) {
      await User.findByIdAndUpdate(
        req.user._id,
        { $set: { "deviceTokens.$[el].isActive": false } },
        { arrayFilters: [{ "el.token": token }] }
      );
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
