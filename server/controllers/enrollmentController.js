import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
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
