import mongoose from "mongoose";

const batchMigrationRequestSchema = new mongoose.Schema(
  {
    learner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    fromBatch: { type: mongoose.Schema.Types.ObjectId, ref: "Batch", required: true },
    toBatch: { type: mongoose.Schema.Types.ObjectId, ref: "Batch", required: true },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reason: { type: String, default: "", trim: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending"
    },
    reviewedAt: { type: Date }
  },
  { timestamps: true }
);

export default mongoose.model("BatchMigrationRequest", batchMigrationRequestSchema);
