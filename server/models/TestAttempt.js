import mongoose from "mongoose";

const answerSchema = new mongoose.Schema(
  {
    question: { type: mongoose.Schema.Types.ObjectId, ref: "ExamQuestion", required: true },
    selectedOptions: [{ type: String, trim: true, uppercase: true }],
    numericAnswer: { type: Number },
    isCorrect: { type: Boolean, default: false },
    score: { type: Number, default: 0 }
  },
  { _id: false }
);

const testAttemptSchema = new mongoose.Schema(
  {
    learner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    test: { type: mongoose.Schema.Types.ObjectId, ref: "MockTest", required: true },
    answers: [answerSchema],
    score: { type: Number, default: 0 },
    maxScore: { type: Number, default: 0 },
    correctCount: { type: Number, default: 0 },
    incorrectCount: { type: Number, default: 0 },
    skippedCount: { type: Number, default: 0 },
    timeTakenSeconds: { type: Number, default: 0 },
    weakTopics: [{ type: String, trim: true }],
    status: {
      type: String,
      enum: ["submitted"],
      default: "submitted"
    },
    submittedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

testAttemptSchema.index({ learner: 1, test: 1, createdAt: -1 });

export default mongoose.model("TestAttempt", testAttemptSchema);
