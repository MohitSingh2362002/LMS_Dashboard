import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/authMiddleware.js";
import {
  createLead, getLeads, getLead, updateLead,
  assignLead, bulkAssign, addActivity,
  markAdmitted, deleteLead, getLeadStats, getCounsellors,
} from "../controllers/leadController.js";

const router = express.Router();

// ── Public (form submission from external website) ─────────────────────────
// Allow ANY origin — this endpoint is intentionally public (like a tracking pixel)
const publicCors = (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
};

router.options("/public", publicCors);
router.post("/public", publicCors, createLead);

// ── Protected ─────────────────────────────────────────────────────────────
router.use(protect);

// Stats & counsellors (admin only)
router.get("/stats",       authorize("admin"), getLeadStats);
router.get("/counsellors", authorize("admin", "counsellor"), getCounsellors);

// Bulk assign (admin only)
router.patch("/bulk-assign", authorize("admin"), bulkAssign);

// CRUD
router.get("/",    authorize("admin", "counsellor"), getLeads);
router.get("/:id", authorize("admin", "counsellor"), getLead);
router.put("/:id", authorize("admin", "counsellor"), updateLead);
router.delete("/:id", authorize("admin"), deleteLead);

// Actions
router.patch("/:id/assign", authorize("admin"), assignLead);
router.patch("/:id/admit",  authorize("admin", "counsellor"), markAdmitted);
router.post("/:id/activities", authorize("admin", "counsellor"), addActivity);

export default router;
