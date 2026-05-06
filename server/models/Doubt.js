import mongoose from "mongoose";

const doubtSchema = new mongoose.Schema(
  {
    learner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
    batch: { type: mongoose.Schema.Types.ObjectId, ref: "Batch" },
    assignedTeacher: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    subject: { type: String, default: "", trim: true },
    chapter: { type: String, default: "", trim: true },
    topic: { type: String, default: "", trim: true },
    question: { type: String, required: true, trim: true },
    audio: {
      name: { type: String, default: "" },
      path: { type: String, default: "" },
      size: { type: Number, default: 0 }
    },
    image: {
      name: { type: String, default: "" },
      path: { type: String, default: "" },
      size: { type: Number, default: 0 }
    },
    answer: { type: String, default: "" },
    answeredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    answeredAt: { type: Date },
    status: {
      type: String,
      enum: ["pending", "answered", "reopened"],
      default: "pending"
    }
  },
  { timestamps: true }
);

doubtSchema.index({ learner: 1, status: 1, createdAt: -1 });
doubtSchema.index({ assignedTeacher: 1, status: 1, createdAt: -1 });

export default mongoose.model("Doubt", doubtSchema);
