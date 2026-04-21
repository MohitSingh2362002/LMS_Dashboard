import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    learner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: "" }
  },
  { timestamps: true }
);

reviewSchema.index({ learner: 1, course: 1 }, { unique: true });

export default mongoose.model("Review", reviewSchema);
