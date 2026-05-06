import mongoose from "mongoose";

const batchSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    learners: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    performanceGroup: {
      type: String,
      enum: ["foundation", "growth", "merit", "ranker"],
      default: "foundation"
    },
    status: {
      type: String,
      enum: ["active", "archived"],
      default: "active"
    },
    syllabusProgress: { type: Number, default: 0, min: 0, max: 100 }
  },
  { timestamps: true }
);

batchSchema.index({ name: 1, course: 1 }, { unique: true });

export default mongoose.model("Batch", batchSchema);
