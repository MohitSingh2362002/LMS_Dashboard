import mongoose from "mongoose";

const recordedSessionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    liveClass: { type: mongoose.Schema.Types.ObjectId, ref: "LiveClass" },
    course:    { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: "User",  required: true },

    // Bunny Stream fields
    bunnyVideoId:   { type: String, default: null },
    bunnyLibraryId: { type: String, default: null },
    playbackUrl:    { type: String, default: null }, // Bunny CDN iframe embed base URL
    thumbnailUrl:   { type: String, default: null }, // Bunny auto-generated thumbnail

    // Recording metadata
    duration:   { type: Number, default: 0 }, // seconds
    size:       { type: Number, default: 0 }, // bytes
    recordedAt: { type: Date,   default: Date.now },

    status: {
      type: String,
      enum: ["uploading", "processing", "ready", "failed"],
      default: "uploading",
    },
  },
  { timestamps: true }
);

export default mongoose.model("RecordedSession", recordedSessionSchema);
