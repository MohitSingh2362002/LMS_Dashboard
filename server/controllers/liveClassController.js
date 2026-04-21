import { v4 as uuidv4 } from "uuid";
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import LiveClass from "../models/LiveClass.js";
import asyncHandler from "../utils/asyncHandler.js";
import { activateDueLiveClasses } from "../utils/liveClassScheduler.js";

const sanitizeRoomName = (value = "") =>
  value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const canManageLiveClass = async (user, liveClass) => {
  if (user.role === "admin") return true;
  return user.role === "instructor" && String(liveClass.instructor) === String(user._id);
};

export const getLiveClasses = asyncHandler(async (req, res) => {
  await activateDueLiveClasses(req.io);

  const filter = {};

  if (req.user.role === "instructor") {
    filter.instructor = req.user._id;
  }

  if (req.user.role === "learner") {
    const enrollments = await Enrollment.find({ learner: req.user._id }).select("course");
    const enrolledCourseIds = enrollments.map((enrollment) => enrollment.course);
    filter.course = { $in: enrolledCourseIds };
  }

  const classes = await LiveClass.find(filter)
    .populate("instructor", "name email avatar")
    .populate("course", "title")
    .sort({ createdAt: -1 });

  res.json(classes);
});

export const createLiveClass = asyncHandler(async (req, res) => {
  const { title, roomName, course, scheduledAt, isImmediate } = req.body;
  const roomId = uuidv4();
  const shouldStartImmediately = Boolean(isImmediate);
  const parsedScheduledAt = scheduledAt ? new Date(scheduledAt) : null;
  const normalizedRoomName = sanitizeRoomName(roomName);

  if (!title?.trim()) {
    res.status(400);
    throw new Error("Live class title is required");
  }

  if (!normalizedRoomName || normalizedRoomName.length < 2) {
    res.status(400);
    throw new Error("Room name must be at least 2 valid characters");
  }

  if (!shouldStartImmediately && !parsedScheduledAt) {
    res.status(400);
    throw new Error("Scheduled classes need a date and time");
  }

  const existingRoom = await LiveClass.findOne({ roomName: normalizedRoomName });
  if (existingRoom) {
    res.status(400);
    throw new Error("This room name is already in use");
  }

  const liveClass = await LiveClass.create({
    title,
    roomName: normalizedRoomName,
    course: course || null,
    instructor: req.user._id,
    scheduledAt: shouldStartImmediately ? null : parsedScheduledAt,
    roomId,
    roomUrl: `${process.env.LIVE_CLASS_BASE_URL || "https://localhost:3000"}/room/${normalizedRoomName}`,
    status:
      shouldStartImmediately || (parsedScheduledAt && parsedScheduledAt <= new Date())
        ? "live"
        : "scheduled",
    isImmediate: shouldStartImmediately
  });

  const populated = await LiveClass.findById(liveClass._id)
    .populate("instructor", "name email avatar")
    .populate("course", "title");

  req.io?.emit(
    populated.status === "live" ? "live-class:started" : "live-class:created",
    populated
  );
  res.status(201).json(populated);
});

export const endLiveClass = asyncHandler(async (req, res) => {
  const liveClass = await LiveClass.findById(req.params.id);

  if (!liveClass) {
    res.status(404);
    throw new Error("Live class not found");
  }

  const allowed = await canManageLiveClass(req.user, liveClass);
  if (!allowed) {
    res.status(403);
    throw new Error("Forbidden");
  }

  liveClass.status = "ended";
  await liveClass.save();
  req.io?.to(liveClass.roomId).emit("class-ended", { roomId: liveClass.roomId });
  res.json(liveClass);
});

export const deleteLiveClass = asyncHandler(async (req, res) => {
  const liveClass = await LiveClass.findById(req.params.id);

  if (!liveClass) {
    res.status(404);
    throw new Error("Live class not found");
  }

  const allowed = await canManageLiveClass(req.user, liveClass);
  if (!allowed) {
    res.status(403);
    throw new Error("Forbidden");
  }

  await liveClass.deleteOne();
  res.json({ message: "Live class deleted" });
});
