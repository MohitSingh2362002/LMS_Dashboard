import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import Review from "../models/Review.js";
import asyncHandler from "../utils/asyncHandler.js";

const buildCoursePayload = (req) => ({
  title: req.body.title,
  tags: req.body.tags ? JSON.parse(req.body.tags) : [],
  instructorDisplayName: req.body.instructorDisplayName || "",
  instructor: req.body.instructor || null,
  description: req.body.description || "",
  tagline: req.body.tagline || "",
  pricing: req.body.pricing
    ? JSON.parse(req.body.pricing)
    : { type: "free", amount: 0, currency: "USD" },
  pages: req.body.pages ? JSON.parse(req.body.pages) : [],
  advancedSettings: req.body.advancedSettings
    ? JSON.parse(req.body.advancedSettings)
    : { accessDuration: 365, certificateEnabled: false },
  status: req.body.status || "draft",
  ...(req.file ? { thumbnail: `/uploads/${req.file.filename}` } : {})
});

export const getCourses = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.user.role === "instructor") {
    filter.instructor = req.user._id;
  } else if (req.user.role === "learner") {
    filter.status = "published";
  }

  const courses = await Course.find(filter)
    .populate("instructor", "name email avatar")
    .sort({ updatedAt: -1 });

  const courseIds = courses.map((course) => course._id);
  const [enrollments, reviews] = await Promise.all([
    Enrollment.aggregate([
      { $match: { course: { $in: courseIds } } },
      { $group: { _id: "$course", count: { $sum: 1 } } }
    ]),
    Review.aggregate([
      { $match: { course: { $in: courseIds } } },
      { $group: { _id: "$course", averageRating: { $avg: "$rating" }, count: { $sum: 1 } } }
    ])
  ]);

  const enrollmentMap = Object.fromEntries(
    enrollments.map((item) => [String(item._id), item.count])
  );
  const reviewMap = Object.fromEntries(
    reviews.map((item) => [
      String(item._id),
      { averageRating: Number(item.averageRating.toFixed(1)), reviewCount: item.count }
    ])
  );

  res.json(
    courses.map((course) => ({
      ...course.toObject(),
      enrollmentCount: enrollmentMap[String(course._id)] || 0,
      reviewStats: reviewMap[String(course._id)] || { averageRating: 0, reviewCount: 0 }
    }))
  );
});

export const getCourseById = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id).populate("instructor", "name email avatar");

  if (!course) {
    res.status(404);
    throw new Error("Course not found");
  }

  res.json(course);
});

export const createCourse = asyncHandler(async (req, res) => {
  const course = await Course.create(buildCoursePayload(req));
  const populated = await Course.findById(course._id).populate("instructor", "name email avatar");
  res.status(201).json(populated);
});

export const updateCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    res.status(404);
    throw new Error("Course not found");
  }

  Object.assign(course, buildCoursePayload(req));
  const updated = await course.save();
  const populated = await Course.findById(updated._id).populate("instructor", "name email avatar");
  res.json(populated);
});

export const deleteCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    res.status(404);
    throw new Error("Course not found");
  }

  await course.deleteOne();
  res.json({ message: "Course deleted" });
});

export const duplicateCourse = asyncHandler(async (req, res) => {
  const source = await Course.findById(req.params.id);

  if (!source) {
    res.status(404);
    throw new Error("Course not found");
  }

  const clone = await Course.create({
    ...source.toObject(),
    _id: undefined,
    title: `${source.title} (Copy)`,
    status: "draft",
    createdAt: undefined,
    updatedAt: undefined
  });

  res.status(201).json(clone);
});
