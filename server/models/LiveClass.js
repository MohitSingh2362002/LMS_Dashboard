import mongoose from "mongoose";

const liveClassSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    roomName: { type: String, required: true, trim: true, lowercase: true, unique: true },
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
    scheduledAt: { type: Date },
    roomUrl: { type: String, required: true },
    roomId: { type: String, required: true },
    status: {
      type: String,
      enum: ["scheduled", "live", "ended"],
      default: "scheduled"
    },
    isImmediate: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.model("LiveClass", liveClassSchema);
