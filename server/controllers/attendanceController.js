import Attendance from "../models/Attendance.js";
import Batch from "../models/Batch.js";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import { createNotifications } from "../utils/notifications.js";

const startOfDay = (value) => {
  const date = value ? new Date(value) : new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

const populateAttendance = (query) =>
  query
    .populate("batch", "name performanceGroup")
    .populate("course", "title")
    .populate("markedBy", "name email")
    .populate("records.learner", "name email avatar");

const canManageBatch = (user, batch) =>
  user.role === "admin" || String(batch.mentor) === String(user._id);

export const getAttendance = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.query.batch) filter.batch = req.query.batch;
  if (req.query.date) filter.sessionDate = startOfDay(req.query.date);

  if (req.user.role === "instructor") {
    const batches = await Batch.find({ mentor: req.user._id }).select("_id");
    filter.batch = { $in: batches.map((batch) => batch._id) };
  }

  if (req.user.role === "learner") {
    filter["records.learner"] = req.user._id;
  }

  if (req.user.role === "parent") {
    filter["records.learner"] = { $in: req.user.linkedLearners || [] };
  }

  const attendance = await populateAttendance(Attendance.find(filter).sort({ sessionDate: -1, updatedAt: -1 }));

  if (req.user.role === "learner" || req.user.role === "parent") {
    const visibleLearners = new Set(
      (req.user.role === "learner" ? [req.user._id] : req.user.linkedLearners || []).map((id) => String(id))
    );

    res.json(
      attendance.map((item) => ({
        ...item.toObject(),
        records: item.records.filter((record) => visibleLearners.has(String(record.learner?._id || record.learner)))
      }))
    );
    return;
  }

  res.json(attendance);
});

export const markAttendance = asyncHandler(async (req, res) => {
  const batch = await Batch.findById(req.body.batch).populate("course", "title").populate("learners", "name email");

  if (!batch) {
    res.status(404);
    throw new Error("Batch not found");
  }

  if (!canManageBatch(req.user, batch)) {
    res.status(403);
    throw new Error("Forbidden");
  }

  const sessionDate = startOfDay(req.body.sessionDate);
  const allowedLearners = new Set(batch.learners.map((learner) => String(learner._id)));
  const records = (req.body.records || [])
    .filter((record) => allowedLearners.has(String(record.learner)))
    .map((record) => ({
      learner: record.learner,
      status: record.status || "present",
      note: record.note || ""
    }));

  const attendance = await Attendance.findOneAndUpdate(
    { batch: batch._id, sessionDate },
    {
      batch: batch._id,
      course: batch.course?._id || batch.course || null,
      markedBy: req.user._id,
      sessionDate,
      records
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  const parents = await User.find({ role: "parent", linkedLearners: { $in: records.map((record) => record.learner) } }).select("linkedLearners");
  const learnerById = Object.fromEntries(batch.learners.map((learner) => [String(learner._id), learner]));
  const notifications = [];

  records.forEach((record) => {
    const learner = learnerById[String(record.learner)];
    const title = `Attendance marked: ${record.status}`;
    const message = `${learner?.name || "Learner"} was marked ${record.status} for ${batch.name}.`;

    notifications.push({
      recipient: record.learner,
      title,
      message,
      type: "attendance",
      link: "/learner/attendance",
      metadata: { batch: batch._id, attendance: attendance._id, status: record.status }
    });

    parents
      .filter((parent) => parent.linkedLearners.some((id) => String(id) === String(record.learner)))
      .forEach((parent) => {
        notifications.push({
          recipient: parent._id,
          title,
          message,
          type: "attendance",
          link: "/parent/attendance",
          metadata: { learner: record.learner, batch: batch._id, attendance: attendance._id, status: record.status }
        });
      });
  });

  await createNotifications(req.io, notifications);

  const populated = await populateAttendance(Attendance.findById(attendance._id));
  res.status(201).json(populated);
});
