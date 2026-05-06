import mongoose from "mongoose";

const mockTestSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    examPattern: {
      type: String,
      enum: ["NEET", "Olympiad", "Foundation"],
      default: "NEET"
    },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
    batch: { type: mongoose.Schema.Types.ObjectId, ref: "Batch" },
    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: "ExamQuestion" }],
    durationMinutes: { type: Number, default: 180, min: 1 },
    startsAt: { type: Date },
    endsAt: { type: Date },
    status: {
      type: String,
      enum: ["draft", "published", "archived", "scheduled"],
      default: "draft"
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

export default mongoose.model("MockTest", mockTestSchema);
