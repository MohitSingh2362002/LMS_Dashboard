import mongoose from "mongoose";

const enrollmentSchema = new mongoose.Schema(
  {
    learner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    enrolledAt: { type: Date, default: Date.now },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    completedPages: [{ type: Number }]
  },
  { timestamps: true }
);

enrollmentSchema.index({ learner: 1, course: 1 }, { unique: true });

export default mongoose.model("Enrollment", enrollmentSchema);
