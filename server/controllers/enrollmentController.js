import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";

export const enrollInCourse = asyncHandler(async (req, res) => {
  const { courseId } = req.body;

  const course = await Course.findById(courseId);
  if (!course || course.status !== "published") {
    res.status(404);
    throw new Error("Course unavailable");
  }

  const enrollment = await Enrollment.create({
    learner: req.user._id,
    course: courseId
  });

  const populated = await Enrollment.findById(enrollment._id).populate("course");
  res.status(201).json(populated);
});

export const getMyEnrollments = asyncHandler(async (req, res) => {
  const enrollments = await Enrollment.find({ learner: req.user._id })
    .populate({
      path: "course",
      populate: { path: "instructor", select: "name email avatar" }
    })
    .sort({ updatedAt: -1 });

  res.json(enrollments);
});

// Admin: get learner IDs enrolled in a specific course
export const getLearnersByCourse = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const enrollments = await Enrollment.find({ course: courseId }).select("learner");
  const learnerIds = enrollments.map((e) => String(e.learner));
  res.json(learnerIds);
});

/**
 * POST /enrollments/parent-enroll
 * Parent purchases/enrolls a linked learner in a course.
 * Body: { courseId, learnerId }
 */
export const parentEnrollLearner = asyncHandler(async (req, res) => {
  const { courseId, learnerId } = req.body;

  if (!courseId || !learnerId) {
    res.status(400); throw new Error("courseId and learnerId are required");
  }

  // Verify this learner is linked to the parent
  const parent = await User.findById(req.user._id).select("linkedLearners");
  const isLinked = (parent?.linkedLearners || []).some((id) => String(id) === String(learnerId));
  if (!isLinked) {
    res.status(403); throw new Error("This learner is not linked to your account");
  }

  const course = await Course.findById(courseId);
  if (!course || course.status !== "published") {
    res.status(404); throw new Error("Course unavailable");
  }

  // Upsert enrollment (idempotent)
  let enrollment = await Enrollment.findOne({ learner: learnerId, course: courseId });
  if (!enrollment) {
    enrollment = await Enrollment.create({ learner: learnerId, course: courseId });
  }

  const populated = await Enrollment.findById(enrollment._id).populate("course");
  res.status(201).json(populated);
});

export const updateProgress = asyncHandler(async (req, res) => {
  const enrollment = await Enrollment.findById(req.params.id).populate("course");

  if (!enrollment) {
    res.status(404);
    throw new Error("Enrollment not found");
  }

  if (String(enrollment.learner) !== String(req.user._id)) {
    res.status(403);
    throw new Error("Forbidden");
  }

  const { completedPageIndex } = req.body;
  const completedPages = new Set(enrollment.completedPages || []);
  completedPages.add(completedPageIndex);
  enrollment.completedPages = [...completedPages].sort((a, b) => a - b);

  const totalPages = enrollment.course.pages.length || 1;
  enrollment.progress = Math.min(
    100,
    Math.round((enrollment.completedPages.length / totalPages) * 100)
  );

  await enrollment.save();
  res.json(enrollment);
});
