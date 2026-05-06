import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
  {
    author:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type:     { type: String, enum: ["urgent", "general", "info"], default: "general" },
    title:    { type: String, trim: true, default: "" },
    message:  { type: String, required: true, trim: true },
    pinned:   { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.model("Announcement", announcementSchema);
