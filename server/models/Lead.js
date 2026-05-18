import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    action:      { type: String, required: true },   // e.g. "status_changed", "note_added", "assigned"
    note:        { type: String, default: "" },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    performedByName: { type: String, default: "" },
    meta:        { type: mongoose.Schema.Types.Mixed, default: {} }, // extra info like old/new status
  },
  { timestamps: true }
);

const leadSchema = new mongoose.Schema(
  {
    // ── Basic info (filled by form) ──────────────────────────────────
    name:         { type: String, default: "" },
    email:        { type: String, trim: true, lowercase: true, default: "" },
    phone:        { type: String, default: "" },
    city:         { type: String, trim: true, default: "" },
    interestedIn: { type: String, trim: true, default: "" },
    message:      { type: String, default: "" },
    source:       {
      type: String,
      enum: ["web-form", "social", "referral", "walk-in", "call", "other"],
      default: "web-form",
    },
    // ── Raw fields — stores EVERY field sent from the form, whatever they are named
    rawFields:    { type: mongoose.Schema.Types.Mixed, default: {} },

    // ── Pipeline ─────────────────────────────────────────────────────
    status: {
      type: String,
      enum: ["new", "contacted", "assigned", "in-progress", "admitted", "lost"],
      default: "new",
      index: true,
    },

    // ── Assignment ───────────────────────────────────────────────────
    assignedTo:   { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    assignedAt:   { type: Date, default: null },

    // ── Counsellor fills these ────────────────────────────────────────
    details: {
      profession:     { type: String, default: "" },
      education:      { type: String, default: "" },
      dob:            { type: Date, default: null },
      gender:         { type: String, enum: ["male", "female", "other", ""], default: "" },
      address:        { type: String, default: "" },
      alternatePhone: { type: String, default: "" },
      qualification:  { type: String, default: "" },
      experience:     { type: String, default: "" },
    },

    // ── Follow-up ────────────────────────────────────────────────────
    followUpDate: { type: Date, default: null },
    lastContactedAt: { type: Date, default: null },

    // ── Admission ────────────────────────────────────────────────────
    admittedAt:   { type: Date, default: null },
    admittedBy:   { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    // ── Activity timeline ────────────────────────────────────────────
    activities: [activitySchema],
  },
  { timestamps: true }
);

// Text search index
leadSchema.index({ name: "text", email: "text", phone: "text" });

export default mongoose.model("Lead", leadSchema);
