import Lead from "../models/Lead.js";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";

// ── helpers ────────────────────────────────────────────────────────────────
const pushActivity = (lead, action, note = "", performedBy = null, performedByName = "", meta = {}) => {
  lead.activities.push({ action, note, performedBy, performedByName, meta });
};

// ── PUBLIC: submit enquiry form ────────────────────────────────────────────
// Accepts ANY fields — stores everything in rawFields, maps known ones to top-level
export const createLead = asyncHandler(async (req, res) => {
  if (!req.body || !Object.keys(req.body).length) {
    return res.status(400).json({ message: "No data received" });
  }

  const body = req.body;

  // Try to find known fields with common naming variations
  const pick = (...keys) => {
    for (const k of keys) {
      const v = body[k] || body[k.toLowerCase()] || body[k.toUpperCase()];
      if (v && String(v).trim()) return String(v).trim();
    }
    return "";
  };

  const name         = pick("name", "fullName", "full_name", "Name", "FullName");
  const phone        = pick("phone", "mobile", "contact", "Phone", "Mobile", "phoneNumber", "phone_number");
  const email        = pick("email", "Email", "emailAddress", "email_address");
  const city         = pick("city", "City", "location", "Location");
  const interestedIn = pick("interestedIn", "interested_in", "course", "Course", "program", "Program", "interest");
  const message      = pick("message", "Message", "query", "Query", "comments", "Comments", "description");
  const source       = pick("source", "Source") || "web-form";

  // Store ALL incoming fields as-is (nothing is lost)
  const rawFields = { ...body };

  const lead = new Lead({
    name, phone, email, city, interestedIn, message,
    source: ["web-form","social","referral","walk-in","call","other"].includes(source) ? source : "web-form",
    rawFields,
  });

  pushActivity(lead, "created", "Enquiry submitted via form", null, "System");
  await lead.save();

  res.status(201).json({ ok: true, leadId: lead._id });
});

// ── LIST leads ─────────────────────────────────────────────────────────────
export const getLeads = asyncHandler(async (req, res) => {
  const { status, assignedTo, search, page = 1, limit = 30, followUpToday, sort = "-createdAt" } = req.query;

  const filter = {};

  // Counsellors can only see their own leads
  if (req.user.role === "counsellor") {
    filter.assignedTo = req.user._id;
  } else {
    if (assignedTo) filter.assignedTo = assignedTo === "unassigned" ? null : assignedTo;
  }

  if (status) filter.status = status;

  if (search) {
    filter.$or = [
      { name:  { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  if (followUpToday === "true") {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end   = new Date(); end.setHours(23, 59, 59, 999);
    filter.followUpDate = { $gte: start, $lte: end };
  }

  const [leads, total] = await Promise.all([
    Lead.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate("assignedTo", "name email avatar"),
    Lead.countDocuments(filter),
  ]);

  res.json({ leads, total, page: Number(page), pages: Math.ceil(total / limit) });
});

// ── GET single lead ────────────────────────────────────────────────────────
export const getLead = asyncHandler(async (req, res) => {
  const lead = await Lead.findById(req.params.id)
    .populate("assignedTo", "name email avatar")
    .populate("admittedBy", "name")
    .populate("activities.performedBy", "name avatar");

  if (!lead) return res.status(404).json({ message: "Lead not found" });

  // Counsellors can only view their own leads
  if (req.user.role === "counsellor" && String(lead.assignedTo?._id) !== String(req.user._id)) {
    return res.status(403).json({ message: "Not your lead" });
  }

  res.json(lead);
});

// ── UPDATE lead (counsellor details / follow-up / status) ─────────────────
export const updateLead = asyncHandler(async (req, res) => {
  const lead = await Lead.findById(req.params.id);
  if (!lead) return res.status(404).json({ message: "Lead not found" });

  if (req.user.role === "counsellor" && String(lead.assignedTo) !== String(req.user._id)) {
    return res.status(403).json({ message: "Not your lead" });
  }

  const { details, followUpDate, lastContactedAt, status, note } = req.body;

  if (details) {
    lead.details = { ...lead.details.toObject?.() ?? lead.details, ...details };
    pushActivity(lead, "details_updated", "Contact details updated", req.user._id, req.user.name);
  }

  if (followUpDate !== undefined) {
    lead.followUpDate = followUpDate ? new Date(followUpDate) : null;
    pushActivity(lead, "followup_set", `Follow-up set for ${followUpDate ? new Date(followUpDate).toDateString() : "cleared"}`, req.user._id, req.user.name);
  }

  if (lastContactedAt !== undefined) {
    lead.lastContactedAt = lastContactedAt ? new Date(lastContactedAt) : null;
  }

  if (status && status !== lead.status) {
    const oldStatus = lead.status;
    lead.status = status;
    pushActivity(lead, "status_changed", note || "", req.user._id, req.user.name, { from: oldStatus, to: status });
  }

  if (note && !status) {
    pushActivity(lead, "note_added", note, req.user._id, req.user.name);
  }

  await lead.save();
  await lead.populate("assignedTo", "name email avatar");
  res.json(lead);
});

// ── ASSIGN lead to counsellor ──────────────────────────────────────────────
export const assignLead = asyncHandler(async (req, res) => {
  const { counsellorId, note } = req.body;
  const lead = await Lead.findById(req.params.id);
  if (!lead) return res.status(404).json({ message: "Lead not found" });

  const counsellor = await User.findById(counsellorId).select("name email");
  if (!counsellor) return res.status(404).json({ message: "Counsellor not found" });

  lead.assignedTo = counsellorId;
  lead.assignedAt = new Date();
  if (lead.status === "new" || lead.status === "contacted") lead.status = "assigned";

  pushActivity(lead, "assigned", note || `Assigned to ${counsellor.name}`, req.user._id, req.user.name, {
    counsellorId, counsellorName: counsellor.name,
  });

  await lead.save();
  await lead.populate("assignedTo", "name email avatar");
  res.json(lead);
});

// ── BULK ASSIGN leads ──────────────────────────────────────────────────────
export const bulkAssign = asyncHandler(async (req, res) => {
  const { leadIds, counsellorId } = req.body;
  if (!leadIds?.length || !counsellorId) {
    return res.status(400).json({ message: "leadIds and counsellorId required" });
  }

  const counsellor = await User.findById(counsellorId).select("name");
  if (!counsellor) return res.status(404).json({ message: "Counsellor not found" });

  const leads = await Lead.find({ _id: { $in: leadIds } });

  await Promise.all(
    leads.map((lead) => {
      lead.assignedTo = counsellorId;
      lead.assignedAt = new Date();
      if (lead.status === "new" || lead.status === "contacted") lead.status = "assigned";
      pushActivity(lead, "assigned", `Bulk assigned to ${counsellor.name}`, req.user._id, req.user.name, {
        counsellorId, counsellorName: counsellor.name,
      });
      return lead.save();
    })
  );

  res.json({ ok: true, updated: leads.length });
});

// ── ADD activity / note ────────────────────────────────────────────────────
export const addActivity = asyncHandler(async (req, res) => {
  const { note, action = "note_added" } = req.body;
  if (!note) return res.status(400).json({ message: "note is required" });

  const lead = await Lead.findById(req.params.id);
  if (!lead) return res.status(404).json({ message: "Lead not found" });

  if (req.user.role === "counsellor" && String(lead.assignedTo) !== String(req.user._id)) {
    return res.status(403).json({ message: "Not your lead" });
  }

  pushActivity(lead, action, note, req.user._id, req.user.name);
  await lead.save();
  res.json(lead.activities[lead.activities.length - 1]);
});

// ── MARK ADMITTED ──────────────────────────────────────────────────────────
export const markAdmitted = asyncHandler(async (req, res) => {
  const { note } = req.body;
  const lead = await Lead.findById(req.params.id);
  if (!lead) return res.status(404).json({ message: "Lead not found" });

  if (req.user.role === "counsellor" && String(lead.assignedTo) !== String(req.user._id)) {
    return res.status(403).json({ message: "Not your lead" });
  }

  if (lead.status === "admitted") {
    return res.status(400).json({ message: "Lead is already admitted" });
  }

  lead.status     = "admitted";
  lead.admittedAt = new Date();
  lead.admittedBy = req.user._id;

  pushActivity(lead, "admitted", note || "Marked as admission done", req.user._id, req.user.name);

  await lead.save();
  await lead.populate("assignedTo", "name email avatar");

  // ── Auto-create a Learner account ─────────────────────────────────────────
  let learnerAccount = null;
  if (lead.email) {
    const existing = await User.findOne({ email: lead.email.toLowerCase() });
    if (!existing) {
      // Generate temp password: first 4 chars of name + last 4 digits of phone (or random)
      const namePart  = (lead.name || "user").replace(/\s+/g, "").slice(0, 4).toLowerCase();
      const phonePart = (lead.phone || "").replace(/\D/g, "").slice(-4) || Math.random().toString(36).slice(-4);
      const tempPassword = `${namePart}${phonePart}`;

      const learnerCount = await User.countDocuments({ role: "learner" });
      const studentId    = `STU${String(learnerCount + 1).padStart(5, "0")}`;

      const newUser = await User.create({
        name:      lead.name || "Student",
        email:     lead.email.toLowerCase(),
        password:  tempPassword,
        role:      "learner",
        studentId,
      });

      learnerAccount = {
        _id:       newUser._id,
        name:      newUser.name,
        email:     newUser.email,
        studentId,
        tempPassword, // shown once to admin so they can share with student
      };

      pushActivity(lead, "note_added",
        `Learner account created — ID: ${studentId}, Email: ${newUser.email}, Temp Password: ${tempPassword}`,
        req.user._id, req.user.name
      );
      await lead.save();
    } else {
      learnerAccount = { _id: existing._id, name: existing.name, email: existing.email, studentId: existing.studentId, alreadyExisted: true };
    }
  }

  res.json({ ...lead.toObject(), learnerAccount });
});

// ── DELETE lead (admin only) ───────────────────────────────────────────────
export const deleteLead = asyncHandler(async (req, res) => {
  const lead = await Lead.findByIdAndDelete(req.params.id);
  if (!lead) return res.status(404).json({ message: "Lead not found" });
  res.json({ ok: true });
});

// ── STATS (admin dashboard) ────────────────────────────────────────────────
export const getLeadStats = asyncHandler(async (req, res) => {
  const [statusCounts, todayCount, overdueFollowUps, counsellorStats] = await Promise.all([
    Lead.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Lead.countDocuments({ createdAt: { $gte: new Date(new Date().setHours(0,0,0,0)) } }),
    Lead.countDocuments({ followUpDate: { $lt: new Date() }, status: { $nin: ["admitted", "lost"] } }),
    Lead.aggregate([
      { $match: { assignedTo: { $ne: null } } },
      { $group: { _id: "$assignedTo", total: { $sum: 1 }, admitted: { $sum: { $cond: [{ $eq: ["$status", "admitted"] }, 1, 0] } } } },
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "counsellor" } },
      { $unwind: "$counsellor" },
      { $project: { name: "$counsellor.name", total: 1, admitted: 1 } },
      { $sort: { total: -1 } },
      { $limit: 10 },
    ]),
  ]);

  const statusMap = {};
  statusCounts.forEach(({ _id, count }) => { statusMap[_id] = count; });

  res.json({
    total:    Object.values(statusMap).reduce((a, b) => a + b, 0),
    byStatus: statusMap,
    todayNew: todayCount,
    overdueFollowUps,
    counsellorStats,
  });
});

// ── LIST counsellors ───────────────────────────────────────────────────────
export const getCounsellors = asyncHandler(async (req, res) => {
  const counsellors = await User.find({ role: "counsellor" }).select("name email avatar isActive createdAt");
  res.json(counsellors);
});
