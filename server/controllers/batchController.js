import Batch from "../models/Batch.js";
import BatchMigrationRequest from "../models/BatchMigrationRequest.js";
import Course from "../models/Course.js";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";

const populateBatch = (query) =>
  query
    .populate("course", "title status")
    .populate("mentor", "name email avatar")
    .populate("learners", "name email avatar");

const canManageBatch = (user, batch) =>
  user.role === "admin" || String(batch.mentor) === String(user._id);

const validateBatchRefs = async (res, { course, mentor, learners = [] }) => {
  const [courseDoc, mentorDoc, learnerCount] = await Promise.all([
    Course.findById(course),
    User.findOne({ _id: mentor, role: "instructor", isActive: true }),
    User.countDocuments({ _id: { $in: learners }, role: "learner", isActive: true })
  ]);

  if (!courseDoc) {
    res.status(400);
    throw new Error("Course not found");
  }

  if (!mentorDoc) {
    res.status(400);
    throw new Error("Mentor must be an active instructor");
  }

  if (learnerCount !== learners.length) {
    res.status(400);
    throw new Error("One or more learner accounts are invalid");
  }
};

export const getBatches = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.user.role === "instructor") {
    filter.mentor = req.user._id;
  }

  if (req.query.performanceGroup) {
    filter.performanceGroup = req.query.performanceGroup;
  }

  if (req.query.status) {
    filter.status = req.query.status;
  }

  const batches = await populateBatch(Batch.find(filter).sort({ updatedAt: -1 }));
  res.json(batches);
});

export const getMyBatches = asyncHandler(async (req, res) => {
  const batches = await populateBatch(
    Batch.find({ learners: req.user._id, status: "active" }).sort({ updatedAt: -1 })
  );

  res.json(batches);
});

export const createBatch = asyncHandler(async (req, res) => {
  const { name, course, mentor, learners = [], performanceGroup = "foundation", status = "active" } = req.body;

  await validateBatchRefs(res, { course, mentor, learners });

  const batch = await Batch.create({
    name,
    course,
    mentor,
    learners,
    performanceGroup,
    status
  });

  const populated = await populateBatch(Batch.findById(batch._id));
  res.status(201).json(populated);
});

export const updateBatch = asyncHandler(async (req, res) => {
  const batch = await Batch.findById(req.params.id);

  if (!batch) {
    res.status(404);
    throw new Error("Batch not found");
  }

  const next = {
    name: req.body.name ?? batch.name,
    course: req.body.course ?? batch.course,
    mentor: req.body.mentor ?? batch.mentor,
    learners: req.body.learners ?? batch.learners,
    performanceGroup: req.body.performanceGroup ?? batch.performanceGroup,
    status: req.body.status ?? batch.status
  };

  await validateBatchRefs(res, next);
  Object.assign(batch, next);

  const updated = await batch.save();
  const populated = await populateBatch(Batch.findById(updated._id));
  res.json(populated);
});

export const updateSyllabusProgress = asyncHandler(async (req, res) => {
  const batch = await Batch.findById(req.params.id);

  if (!batch) {
    res.status(404);
    throw new Error("Batch not found");
  }

  if (!canManageBatch(req.user, batch)) {
    res.status(403);
    throw new Error("Forbidden — you are not the mentor of this batch");
  }

  const value = Number(req.body.syllabusProgress);
  if (Number.isNaN(value) || value < 0 || value > 100) {
    res.status(400);
    throw new Error("syllabusProgress must be a number between 0 and 100");
  }

  batch.syllabusProgress = Math.round(value);
  await batch.save();

  const populated = await populateBatch(Batch.findById(batch._id));
  res.json(populated);
});

export const requestMigration = asyncHandler(async (req, res) => {
  const { learner, fromBatch, toBatch, reason = "" } = req.body;
  const [source, destination] = await Promise.all([
    Batch.findById(fromBatch),
    Batch.findById(toBatch)
  ]);

  if (!source || !destination) {
    res.status(404);
    throw new Error("Batch not found");
  }

  if (String(fromBatch) === String(toBatch)) {
    res.status(400);
    throw new Error("Source and target batches must be different");
  }

  if (!canManageBatch(req.user, source)) {
    res.status(403);
    throw new Error("Forbidden");
  }

  if (!source.learners.some((id) => String(id) === String(learner))) {
    res.status(400);
    throw new Error("Learner is not in the source batch");
  }

  const existingPendingRequest = await BatchMigrationRequest.findOne({
    learner,
    fromBatch,
    toBatch,
    status: "pending"
  });

  if (existingPendingRequest) {
    res.status(400);
    throw new Error("A pending migration request already exists for this learner");
  }

  const request = await BatchMigrationRequest.create({
    learner,
    fromBatch,
    toBatch,
    requestedBy: req.user._id,
    reason
  });

  const populated = await BatchMigrationRequest.findById(request._id)
    .populate("learner", "name email avatar")
    .populate("fromBatch", "name performanceGroup")
    .populate("toBatch", "name performanceGroup")
    .populate("requestedBy", "name email");

  res.status(201).json(populated);
});

export const getMigrationRequests = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.query.status) {
    filter.status = req.query.status;
  }

  if (req.user.role === "instructor") {
    filter.requestedBy = req.user._id;
  }

  const requests = await BatchMigrationRequest.find(filter)
    .populate("learner", "name email avatar")
    .populate("fromBatch", "name performanceGroup")
    .populate("toBatch", "name performanceGroup")
    .populate("requestedBy", "name email")
    .populate("reviewedBy", "name email")
    .sort({ createdAt: -1 });

  res.json(requests);
});

export const reviewMigrationRequest = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!["approved", "rejected"].includes(status)) {
    res.status(400);
    throw new Error("Status must be approved or rejected");
  }

  const request = await BatchMigrationRequest.findById(req.params.id);

  if (!request) {
    res.status(404);
    throw new Error("Migration request not found");
  }

  if (request.status !== "pending") {
    res.status(400);
    throw new Error("Migration request has already been reviewed");
  }

  request.status = status;
  request.reviewedBy = req.user._id;
  request.reviewedAt = new Date();

  if (status === "approved") {
    await Promise.all([
      Batch.findByIdAndUpdate(request.fromBatch, { $pull: { learners: request.learner } }),
      Batch.findByIdAndUpdate(request.toBatch, { $addToSet: { learners: request.learner } })
    ]);
  }

  await request.save();

  const populated = await BatchMigrationRequest.findById(request._id)
    .populate("learner", "name email avatar")
    .populate("fromBatch", "name performanceGroup")
    .populate("toBatch", "name performanceGroup")
    .populate("requestedBy", "name email")
    .populate("reviewedBy", "name email");

  res.json(populated);
});
