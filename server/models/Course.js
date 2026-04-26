import mongoose from "mongoose";

const pageSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, default: "" }
  },
  { _id: false }
);

const noteSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const noteFileSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    path: { type: String, required: true, trim: true },
    size: { type: Number, default: 0 },
    uploadedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const liveTestSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: false },
    title: { type: String, default: "", trim: true },
    instructions: { type: String, default: "" },
    link: { type: String, default: "", trim: true },
    startsAt: { type: Date },
    endsAt: { type: Date }
  },
  { _id: false }
);

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    tags: [{ type: String, trim: true }],
    instructorDisplayName: { type: String, default: "" },
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    description: { type: String, default: "" },
    tagline: { type: String, default: "" },
    thumbnail: { type: String, default: "" },
    pricing: {
      type: {
        type: String,
        enum: ["free", "paid"],
        default: "free"
      },
      amount: { type: Number, default: 0 },
      currency: { type: String, default: "USD" }
    },
    pages: [pageSchema],
    notes: [noteSchema],
    noteFiles: [noteFileSchema],
    liveTest: { type: liveTestSchema, default: () => ({}) },
    advancedSettings: {
      accessDuration: { type: Number, default: 365 },
      certificateEnabled: { type: Boolean, default: false }
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft"
    }
  },
  { timestamps: true }
);

export default mongoose.model("Course", courseSchema);
