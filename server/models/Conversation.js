import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    parent: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    learner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    batch: { type: mongoose.Schema.Types.ObjectId, ref: "Batch" },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
    lastMessage: { type: String, default: "" },
    lastMessageAt: { type: Date }
  },
  { timestamps: true }
);

conversationSchema.index({ parent: 1, teacher: 1, learner: 1 }, { unique: true });

export default mongoose.model("Conversation", conversationSchema);
