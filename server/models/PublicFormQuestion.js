import mongoose from "mongoose";

const publicFormQuestionSchema = new mongoose.Schema(
  {
    askedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
    question: { type: String, required: true, trim: true },
    answer: { type: String, default: "" },
    isAnswered: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.model("PublicFormQuestion", publicFormQuestionSchema);
