import Batch from "../models/Batch.js";
import Enrollment from "../models/Enrollment.js";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getParentDashboard = asyncHandler(async (req, res) => {
  const learnerIds = req.user.linkedLearners || [];

  const [learners, enrollments, batches] = await Promise.all([
    User.find({ _id: { $in: learnerIds }, role: "learner" }).select("name email avatar"),
    Enrollment.find({ learner: { $in: learnerIds } })
      .populate("learner", "name email avatar")
      .populate({
        path: "course",
        populate: { path: "instructor", select: "name email avatar" }
      })
      .sort({ updatedAt: -1 }),
    Batch.find({ learners: { $in: learnerIds } })
      .populate("course", "title status")
      .populate("mentor", "name email avatar")
      .populate("learners", "name email avatar")
      .sort({ updatedAt: -1 })
  ]);

  const batchByLearner = learnerIds.reduce((map, learnerId) => {
    map[String(learnerId)] = batches.filter((batch) =>
      batch.learners.some((learner) => String(learner._id) === String(learnerId))
    );
    return map;
  }, {});

  res.json({
    linkedLearners: learners,
    enrollments,
    batches,
    batchByLearner
  });
});
