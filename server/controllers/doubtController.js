import Batch from "../models/Batch.js";
import Course from "../models/Course.js";
import Doubt from "../models/Doubt.js";
import asyncHandler from "../utils/asyncHandler.js";

const populateDoubt = (query) =>
  query
    .populate("learner", "name email avatar")
    .populate("course", "title instructor")
    .populate("batch", "name mentor")
    .populate("assignedTeacher", "name email avatar")
    .populate("answeredBy", "name email avatar");

const resolveAssignment = async ({ learnerId, courseId, batchId }) => {
  if (batchId) {
    const batch = await Batch.findOne({ _id: batchId, learners: learnerId }).populate("mentor", "name email");
    if (!batch) return { batch: null, assignedTeacher: null };
    return { batch: batch._id, assignedTeacher: batch.mentor?._id || null };
  }

  if (courseId) {
    const [course, batch] = await Promise.all([
      Course.findById(courseId).select("instructor"),
      Batch.findOne({ course: courseId, learners: learnerId, status: "active" }).select("mentor")
    ]);
    return {
      batch: batch?._id || null,
      assignedTeacher: batch?.mentor || course?.instructor || null
    };
  }

  const batch = await Batch.findOne({ learners: learnerId, status: "active" }).select("mentor");
  return { batch: batch?._id || null, assignedTeacher: batch?.mentor || null };
};

const teacherDoubtFilter = async (teacherId) => {
  const [courses, batches] = await Promise.all([
    Course.find({ instructor: teacherId }).select("_id"),
    Batch.find({ mentor: teacherId }).select("_id")
  ]);

  return {
    $or: [
      { assignedTeacher: teacherId },
      { course: { $in: courses.map((course) => course._id) } },
      { batch: { $in: batches.map((batch) => batch._id) } }
    ]
  };
};

export const getDoubts = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.query.status) {
    filter.status = req.query.status;
  }

  if (req.user.role === "learner") {
    filter.learner = req.user._id;
  } else if (req.user.role === "instructor") {
    Object.assign(filter, await teacherDoubtFilter(req.user._id));
  }

  const doubts = await populateDoubt(Doubt.find(filter).sort({ updatedAt: -1 }));
  res.json(doubts);
});

export const createDoubt = asyncHandler(async (req, res) => {
  const assignment = await resolveAssignment({
    learnerId: req.user._id,
    courseId: req.body.course || null,
    batchId: req.body.batch || null
  });

  const doubt = await Doubt.create({
    learner: req.user._id,
    course: req.body.course || null,
    batch: assignment.batch,
    assignedTeacher: assignment.assignedTeacher,
    subject: req.body.subject || "",
    chapter: req.body.chapter || "",
    topic: req.body.topic || "",
    question: req.body.question,
    audio: req.file
      ? {
          name: req.file.originalname,
          path: `/uploads/${req.file.filename}`,
          size: req.file.size || 0
        }
      : undefined
  });

  const populated = await populateDoubt(Doubt.findById(doubt._id));
  res.status(201).json(populated);
});

export const answerDoubt = asyncHandler(async (req, res) => {
  const doubt = await Doubt.findById(req.params.id).populate("course", "instructor").populate("batch", "mentor");

  if (!doubt) {
    res.status(404);
    throw new Error("Doubt not found");
  }

  const canAnswer =
    req.user.role === "admin" ||
    String(doubt.assignedTeacher || "") === String(req.user._id) ||
    String(doubt.course?.instructor || "") === String(req.user._id) ||
    String(doubt.batch?.mentor || "") === String(req.user._id);

  if (!canAnswer) {
    res.status(403);
    throw new Error("Forbidden");
  }

  doubt.answer = req.body.answer || "";
  doubt.answeredBy = req.user._id;
  doubt.answeredAt = new Date();
  doubt.status = "answered";
  await doubt.save();

  const populated = await populateDoubt(Doubt.findById(doubt._id));
  res.json(populated);
});

export const reopenDoubt = asyncHandler(async (req, res) => {
  const doubt = await Doubt.findOne({ _id: req.params.id, learner: req.user._id });

  if (!doubt) {
    res.status(404);
    throw new Error("Doubt not found");
  }

  doubt.status = "reopened";
  await doubt.save();

  const populated = await populateDoubt(Doubt.findById(doubt._id));
  res.json(populated);
});
