import ContentAccessLog from "../models/ContentAccessLog.js";
import asyncHandler from "../utils/asyncHandler.js";

export const createContentAccessLog = asyncHandler(async (req, res) => {
  const log = await ContentAccessLog.create({
    user: req.user._id,
    course: req.body.course || null,
    enrollment: req.body.enrollment || null,
    action: req.body.action || "view",
    resource: req.body.resource || "",
    metadata: req.body.metadata || {}
  });

  res.status(201).json(log);
});

export const getContentAccessLogs = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.query.action) filter.action = req.query.action;
  if (req.query.user) filter.user = req.query.user;
  if (req.query.course) filter.course = req.query.course;

  const logs = await ContentAccessLog.find(filter)
    .populate("user", "name email role")
    .populate("course", "title")
    .populate("enrollment", "progress")
    .sort({ createdAt: -1 })
    .limit(200);

  res.json(logs);
});
