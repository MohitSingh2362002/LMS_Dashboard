import mongoose from "mongoose";

/**
 * FCM device tokens — stored on the MAIN DB so the notification service can read them
 * via its secondary connection to MAIN_MONGO_URI.
 */
const deviceTokenSchema = new mongoose.Schema(
  {
    userId:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    token:    { type: String, required: true, unique: true },
    platform: { type: String, enum: ["android", "ios", "web"], default: "android" },
    isActive: { type: Boolean, default: true },
    lastSeen: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("DeviceToken", deviceTokenSchema);
