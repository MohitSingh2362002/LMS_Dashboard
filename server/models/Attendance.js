import mongoose from "mongoose";

const attendanceRecordSchema = new mongoose.Schema(
  {
    learner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["present", "absent", "late"],
      default: "present"
    },
    note: { type: String, default: "", trim: true }
  },
  { _id: false }
);

const attendanceSchema = new mongoose.Schema(
  {
    batch: { type: mongoose.Schema.Types.ObjectId, ref: "Batch", required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    sessionDate: { type: Date, required: true },
    records: [attendanceRecordSchema]
  },
  { timestamps: true }
);

attendanceSchema.index({ batch: 1, sessionDate: 1 }, { unique: true });

export default mongoose.model("Attendance", attendanceSchema);
