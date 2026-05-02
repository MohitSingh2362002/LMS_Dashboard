import Batch from "../models/Batch.js";
import Enrollment from "../models/Enrollment.js";
import TestAttempt from "../models/TestAttempt.js";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";

const percent = (value, total) => (total ? Math.round((value / total) * 100) : 0);

const buildRankMap = async (testIds = []) => {
  const rankMap = {};

  await Promise.all(
    testIds.map(async (testId) => {
      const attempts = await TestAttempt.find({ test: testId })
        .populate("learner", "name email")
        .sort({ score: -1, timeTakenSeconds: 1, submittedAt: 1 });
      const seen = new Set();
      let rank = 0;

      attempts.forEach((attempt) => {
        const learnerId = String(attempt.learner?._id || attempt.learner);
        if (seen.has(learnerId)) return;
        seen.add(learnerId);
        rank += 1;
        rankMap[`${testId}:${learnerId}`] = rank;
      });
    })
  );

  return rankMap;
};

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

export const getParentReports = asyncHandler(async (req, res) => {
  const learnerIds = req.user.linkedLearners || [];

  const [learners, enrollments, attempts] = await Promise.all([
    User.find({ _id: { $in: learnerIds }, role: "learner" }).select("name email avatar"),
    Enrollment.find({ learner: { $in: learnerIds } })
      .populate("learner", "name email avatar")
      .populate("course", "title")
      .sort({ updatedAt: -1 }),
    TestAttempt.find({ learner: { $in: learnerIds } })
      .populate("learner", "name email avatar")
      .populate("test", "title examPattern")
      .populate("answers.question", "subject chapter topic")
      .sort({ submittedAt: 1 })
  ]);

  const rankMap = await buildRankMap([...new Set(attempts.map((attempt) => String(attempt.test?._id)).filter(Boolean))]);

  const reports = learners.map((learner) => {
    const learnerId = String(learner._id);
    const learnerEnrollments = enrollments.filter((item) => String(item.learner?._id) === learnerId);
    const learnerAttempts = attempts.filter((item) => String(item.learner?._id) === learnerId);
    const subjectStats = {};
    const chapterStats = {};
    const topicStats = {};

    learnerAttempts.forEach((attempt) => {
      attempt.answers.forEach((answer) => {
        const question = answer.question;
        if (!question) return;

        [
          [subjectStats, question.subject || "General"],
          [chapterStats, question.chapter || "General"],
          [topicStats, question.topic || "General"]
        ].forEach(([bucket, key]) => {
          bucket[key] = bucket[key] || { correct: 0, total: 0 };
          bucket[key].total += 1;
          bucket[key].correct += answer.isCorrect ? 1 : 0;
        });
      });
    });

    const mapStats = (stats) =>
      Object.entries(stats)
        .map(([name, item]) => ({
          name,
          correct: item.correct,
          total: item.total,
          accuracy: percent(item.correct, item.total)
        }))
        .sort((a, b) => b.total - a.total);

    const trend = learnerAttempts.map((attempt) => ({
      attemptId: attempt._id,
      testId: attempt.test?._id,
      testTitle: attempt.test?.title || "Mock Test",
      score: attempt.score,
      maxScore: attempt.maxScore,
      percentage: percent(attempt.score, attempt.maxScore),
      rank: rankMap[`${attempt.test?._id}:${learnerId}`] || null,
      submittedAt: attempt.submittedAt
    }));

    const courseProgress = learnerEnrollments.map((enrollment) => ({
      enrollmentId: enrollment._id,
      courseTitle: enrollment.course?.title || "Course",
      progress: enrollment.progress || 0,
      updatedAt: enrollment.updatedAt
    }));

    const averageProgress = courseProgress.length
      ? Math.round(courseProgress.reduce((sum, item) => sum + item.progress, 0) / courseProgress.length)
      : 0;
    const averageTestScore = trend.length
      ? Math.round(trend.reduce((sum, item) => sum + item.percentage, 0) / trend.length)
      : 0;
    const weakTopics = mapStats(topicStats)
      .filter((item) => item.total > 0 && item.accuracy < 60)
      .slice(-5)
      .reverse();

    return {
      learner,
      summary: {
        averageProgress,
        averageTestScore,
        attempts: learnerAttempts.length,
        courses: courseProgress.length
      },
      courseProgress,
      trend,
      subjectStats: mapStats(subjectStats),
      chapterStats: mapStats(chapterStats),
      topicStats: mapStats(topicStats),
      weakTopics
    };
  });

  res.json({ reports });
});
