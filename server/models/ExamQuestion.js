import mongoose from "mongoose";

const optionSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    text: { type: String, required: true, trim: true }
  },
  { _id: false }
);

const examQuestionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["single", "multiple", "numeric", "assertion-reason"],
      default: "single"
    },
    options: [optionSchema],
    correctOptions: [{ type: String, trim: true, uppercase: true }],
    correctNumericAnswer: { type: Number },
    writtenAnswer: { type: String, default: "" },
    explanation: { type: String, default: "" },
    subject: { type: String, required: true, trim: true },
    chapter: { type: String, default: "", trim: true },
    topic: { type: String, default: "", trim: true },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium"
    },
    exam: {
      type: String,
      enum: ["NEET", "Olympiad"],
      default: "NEET"
    },
    marks: { type: Number, default: 4 },
    negativeMarks: { type: Number, default: 1 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

examQuestionSchema.index({ subject: 1, chapter: 1, topic: 1, exam: 1 });

export default mongoose.model("ExamQuestion", examQuestionSchema);
