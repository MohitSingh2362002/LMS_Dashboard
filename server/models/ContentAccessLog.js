import mongoose from "mongoose";

const contentAccessLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
    enrollment: { type: mongoose.Schema.Types.ObjectId, ref: "Enrollment" },
    action: {
      type: String,
      enum: ["view", "blocked-copy", "blocked-context-menu", "blocked-shortcut", "download"],
      default: "view"
    },
    resource: { type: String, default: "" },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

contentAccessLogSchema.index({ user: 1, createdAt: -1 });
contentAccessLogSchema.index({ action: 1, createdAt: -1 });

export default mongoose.model("ContentAccessLog", contentAccessLogSchema);
