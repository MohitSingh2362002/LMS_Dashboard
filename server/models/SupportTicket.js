import mongoose from "mongoose";

const responseSchema = new mongoose.Schema({
  message: { type: String, required: true },
  by: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  at: { type: Date, default: Date.now }
});

const supportTicketSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  category: { type: String, enum: ["technical", "billing", "academic", "general"], default: "general" },
  priority: { type: String, enum: ["low", "medium", "high", "urgent"], default: "medium" },
  status: { type: String, enum: ["open", "in-progress", "resolved", "closed"], default: "open" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  responses: [responseSchema]
}, { timestamps: true });

export default mongoose.model("SupportTicket", supportTicketSchema);
