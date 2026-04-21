import Course from "../models/Course.js";
import PublicFormQuestion from "../models/PublicFormQuestion.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getQuestions = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.user.role === "learner") {
    filter.isAnswered = true;
  }

  if (req.query.courseId) {
    filter.course = req.query.courseId;
  }

  if (req.query.answered === "true") {
    filter.isAnswered = true;
  }
  if (req.query.answered === "false") {
    filter.isAnswered = false;
  }

  if (req.user.role === "instructor") {
    const courses = await Course.find({ instructor: req.user._id }).select("_id");
    filter.course = { $in: courses.map((course) => course._id) };
  }

  const questions = await PublicFormQuestion.find(filter)
    .populate("askedBy", "name email avatar")
    .populate("course", "title")
    .sort({ createdAt: -1 });

  res.json(questions);
});

export const createQuestion = asyncHandler(async (req, res) => {
  const question = await PublicFormQuestion.create({
    askedBy: req.user._id,
    course: req.body.course || null,
    question: req.body.question
  });

  const populated = await PublicFormQuestion.findById(question._id)
    .populate("askedBy", "name email avatar")
    .populate("course", "title");

  res.status(201).json(populated);
});

export const answerQuestion = asyncHandler(async (req, res) => {
  const question = await PublicFormQuestion.findById(req.params.id).populate("course", "title instructor");

  if (!question) {
    res.status(404);
    throw new Error("Question not found");
  }

  if (
    req.user.role === "instructor" &&
    question.course &&
    String(question.course.instructor) !== String(req.user._id)
  ) {
    res.status(403);
    throw new Error("Forbidden");
  }

  question.answer = req.body.answer;
  question.isAnswered = true;
  await question.save();
  res.json(question);
});
