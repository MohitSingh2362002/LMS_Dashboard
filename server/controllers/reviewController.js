import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import Review from "../models/Review.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getReviews = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.courseId) {
    filter.course = req.query.courseId;
  }

  const reviews = await Review.find(filter)
    .populate("learner", "name avatar")
    .populate("course", "title")
    .sort({ createdAt: -1 });

  if (req.user.role === "instructor") {
    const courses = await Course.find({ instructor: req.user._id }).select("_id");
    const allowedIds = new Set(courses.map((course) => String(course._id)));
    res.json(reviews.filter((review) => allowedIds.has(String(review.course?._id))));
    return;
  }

  res.json(reviews);
});

export const createReview = asyncHandler(async (req, res) => {
  const enrollment = await Enrollment.findOne({
    learner: req.user._id,
    course: req.body.course
  });

  if (!enrollment) {
    res.status(400);
    throw new Error("You must be enrolled before reviewing this course");
  }

  const review = await Review.create({
    learner: req.user._id,
    course: req.body.course,
    rating: req.body.rating,
    comment: req.body.comment
  });

  const populated = await Review.findById(review._id)
    .populate("learner", "name avatar")
    .populate("course", "title");

  res.status(201).json(populated);
});

export const updateReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    res.status(404);
    throw new Error("Review not found");
  }

  if (String(review.learner) !== String(req.user._id)) {
    res.status(403);
    throw new Error("Forbidden");
  }

  review.rating = req.body.rating;
  review.comment = req.body.comment;
  await review.save();
  res.json(review);
});

export const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    res.status(404);
    throw new Error("Review not found");
  }

  const canDelete =
    req.user.role === "admin" || String(review.learner) === String(req.user._id);

  if (!canDelete) {
    res.status(403);
    throw new Error("Forbidden");
  }

  await review.deleteOne();
  res.json({ message: "Review deleted" });
});
