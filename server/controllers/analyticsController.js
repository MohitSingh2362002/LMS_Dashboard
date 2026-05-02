import Enrollment from "../models/Enrollment.js";
import User from "../models/User.js";
import Course from "../models/Course.js";
import Batch from "../models/Batch.js";
import TestAttempt from "../models/TestAttempt.js";
import MockTest from "../models/MockTest.js";
import Attendance from "../models/Attendance.js";
import Doubt from "../models/Doubt.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getAdminAnalytics = asyncHandler(async (req, res) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    users,
    courses,
    batches,
    enrollments,
    recentEnrollments,
    attempts,
    tests,
    attendanceRecords,
    doubts,
  ] = await Promise.all([
    User.find({}).select("role createdAt"),
    Course.find({}).select("title status pricing"),
    Batch.find({}).select("performanceGroup status learners"),
    Enrollment.find({}).select("progress course createdAt"),
    Enrollment.find({ createdAt: { $gte: thirtyDaysAgo } }).select("createdAt"),
    TestAttempt.find({}).select("score maxScore submittedAt"),
    MockTest.find({}).select("status"),
    Attendance.find({}).select("records sessionDate"),
    Doubt.find({}).select("status createdAt"),
  ]);

  // Role distribution
  const roleCounts = { admin: 0, instructor: 0, learner: 0, parent: 0 };
  users.forEach((u) => {
    roleCounts[u.role] = (roleCounts[u.role] || 0) + 1;
  });

  // Enrollment trend (last 30 days grouped by day)
  const enrollmentTrend = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    enrollmentTrend[key] = 0;
  }
  recentEnrollments.forEach((e) => {
    const key = new Date(e.createdAt).toISOString().slice(0, 10);
    if (enrollmentTrend[key] !== undefined) enrollmentTrend[key] += 1;
  });

  // Batch distribution by performance group
  const batchGroups = { foundation: 0, growth: 0, merit: 0, ranker: 0 };
  batches
    .filter((b) => b.status === "active")
    .forEach((b) => {
      batchGroups[b.performanceGroup] = (batchGroups[b.performanceGroup] || 0) + 1;
    });

  // Course completion rates
  const courseCompletionMap = {};
  enrollments.forEach((e) => {
    const cId = String(e.course);
    if (!courseCompletionMap[cId]) courseCompletionMap[cId] = { total: 0, completed: 0 };
    courseCompletionMap[cId].total += 1;
    if (e.progress >= 100) courseCompletionMap[cId].completed += 1;
  });
  const courseCompletion = courses.map((c) => {
    const stats = courseCompletionMap[String(c._id)] || { total: 0, completed: 0 };
    return {
      title: c.title,
      total: stats.total,
      completed: stats.completed,
      rate: stats.total ? Math.round((stats.completed / stats.total) * 100) : 0,
    };
  });

  // Exam performance distribution
  const scoreBuckets = { "0-20": 0, "21-40": 0, "41-60": 0, "61-80": 0, "81-100": 0 };
  attempts.forEach((a) => {
    const pct = a.maxScore ? Math.round((a.score / a.maxScore) * 100) : 0;
    if (pct <= 20) scoreBuckets["0-20"] += 1;
    else if (pct <= 40) scoreBuckets["21-40"] += 1;
    else if (pct <= 60) scoreBuckets["41-60"] += 1;
    else if (pct <= 80) scoreBuckets["61-80"] += 1;
    else scoreBuckets["81-100"] += 1;
  });

  // Revenue snapshot
  const paidCourseIds = new Set(
    courses.filter((c) => c.pricing?.type === "paid").map((c) => String(c._id))
  );
  const paidEnrollments = enrollments.filter((e) => paidCourseIds.has(String(e.course))).length;
  const totalRevenue = courses
    .filter((c) => c.pricing?.type === "paid")
    .reduce((sum, c) => {
      const stats = courseCompletionMap[String(c._id)] || { total: 0 };
      return sum + stats.total * (c.pricing?.amount || 0);
    }, 0);

  // Doubt stats
  const doubtStats = {
    total: doubts.length,
    pending: doubts.filter((d) => d.status === "pending").length,
    answered: doubts.filter((d) => d.status === "answered").length,
  };

  // Attendance summary
  const totalSessions = attendanceRecords.length;
  let presentCount = 0;
  let totalRecords = 0;
  attendanceRecords.forEach((a) => {
    a.records.forEach((r) => {
      totalRecords += 1;
      if (r.status === "present") presentCount += 1;
    });
  });
  const attendanceRate = totalRecords ? Math.round((presentCount / totalRecords) * 100) : 0;

  res.json({
    roleCounts,
    enrollmentTrend: Object.entries(enrollmentTrend).map(([date, count]) => ({ date, count })),
    batchGroups,
    courseCompletion,
    scoreBuckets,
    totalRevenue,
    paidEnrollments,
    doubtStats,
    attendanceRate,
    totalSessions,
    summary: {
      totalUsers: users.length,
      totalCourses: courses.length,
      totalBatches: batches.filter((b) => b.status === "active").length,
      totalEnrollments: enrollments.length,
      totalAttempts: attempts.length,
      totalTests: tests.length,
      avgScore: attempts.length
        ? Math.round(
            attempts.reduce((s, a) => s + (a.maxScore ? (a.score / a.maxScore) * 100 : 0), 0) /
              attempts.length
          )
        : 0,
    },
  });
});
