import Enrollment from "../models/Enrollment.js";
import User from "../models/User.js";
import Course from "../models/Course.js";
import Batch from "../models/Batch.js";
import TestAttempt from "../models/TestAttempt.js";
import MockTest from "../models/MockTest.js";
import Attendance from "../models/Attendance.js";
import Doubt from "../models/Doubt.js";
import Review from "../models/Review.js";
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

  // Enrollment counts per course
  const enrollmentCountByCourse = {};
  enrollments.forEach((e) => {
    const key = String(e.course);
    enrollmentCountByCourse[key] = (enrollmentCountByCourse[key] || 0) + 1;
  });

  res.json({
    roleCounts,
    enrollmentTrend: Object.entries(enrollmentTrend).map(([date, count]) => ({ date, count })),
    batchGroups,
    courseCompletion,
    enrollmentCountByCourse,
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

// GET /api/analytics/weekly-attendance
// Returns Mon–Fri attendance rates for the current calendar week
export const getWeeklyAttendance = asyncHandler(async (req, res) => {
  const now = new Date();
  // Find Monday of the current week (ISO week starts Monday)
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  friday.setHours(23, 59, 59, 999);

  const records = await Attendance.find({
    sessionDate: { $gte: monday, $lte: friday },
  });

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const result = days.map((label, i) => {
    const dayStart = new Date(monday);
    dayStart.setDate(monday.getDate() + i);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);

    const daySessions = records.filter((r) => {
      const d = new Date(r.sessionDate);
      return d >= dayStart && d <= dayEnd;
    });

    let present = 0, absent = 0, late = 0;
    daySessions.forEach((s) => {
      s.records.forEach((r) => {
        if (r.status === "present") present++;
        else if (r.status === "absent") absent++;
        else if (r.status === "late") late++;
      });
    });

    const total = present + absent + late;
    const rate = total ? Math.round((present / total) * 100) : null;
    return { label, present, absent, late, total, rate };
  });

  res.json(result);
});

// GET /api/analytics/leaderboard?limit=20
// Top learners by average score across all TestAttempts
export const getLeaderboard = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);

  // Aggregate by learner: totalAttempts, sumScore, sumMaxScore, correctCount, incorrectCount
  const agg = await TestAttempt.aggregate([
    {
      $group: {
        _id: "$learner",
        totalAttempts: { $sum: 1 },
        sumScore: { $sum: "$score" },
        sumMaxScore: { $sum: "$maxScore" },
        totalCorrect: { $sum: "$correctCount" },
        totalIncorrect: { $sum: "$incorrectCount" },
        lastAttempt: { $max: "$submittedAt" },
        prevScore: { $first: "$score" },
        prevMaxScore: { $first: "$maxScore" },
      },
    },
    {
      $addFields: {
        avgPct: {
          $cond: [
            { $gt: ["$sumMaxScore", 0] },
            { $multiply: [{ $divide: ["$sumScore", "$sumMaxScore"] }, 100] },
            0,
          ],
        },
        accuracy: {
          $cond: [
            { $gt: [{ $add: ["$totalCorrect", "$totalIncorrect"] }, 0] },
            {
              $multiply: [
                { $divide: ["$totalCorrect", { $add: ["$totalCorrect", "$totalIncorrect"] }] },
                100,
              ],
            },
            0,
          ],
        },
      },
    },
    { $sort: { avgPct: -1, totalAttempts: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "learnerInfo",
      },
    },
    { $unwind: { path: "$learnerInfo", preserveNullAndEmptyArrays: true } },
  ]);

  // Look up which batch each learner is in
  const learnerIds = agg.map((a) => a._id);
  const batches = await Batch.find({ learners: { $in: learnerIds } })
    .select("name learners")
    .lean();

  const learnerBatch = {};
  batches.forEach((b) => {
    b.learners.forEach((lid) => {
      if (!learnerBatch[String(lid)]) learnerBatch[String(lid)] = b.name;
    });
  });

  const leaderboard = agg.map((entry, i) => ({
    rank: i + 1,
    learnerId: entry._id,
    name: entry.learnerInfo?.name || "Unknown",
    email: entry.learnerInfo?.email || "",
    batchName: learnerBatch[String(entry._id)] || null,
    totalAttempts: entry.totalAttempts,
    avgScore: Math.round(entry.avgPct),
    accuracy: Math.round(entry.accuracy),
    totalPoints: entry.sumScore,
    maxPoints: entry.sumMaxScore,
    lastAttempt: entry.lastAttempt,
  }));

  // Summary stats
  const totalParticipants = await TestAttempt.distinct("learner");
  const overallAvg =
    leaderboard.length > 0
      ? Math.round(leaderboard.reduce((s, l) => s + l.avgScore, 0) / leaderboard.length)
      : 0;

  res.json({ leaderboard, totalParticipants: totalParticipants.length, overallAvg });
});

// GET /api/analytics/instructor-stats
// Returns per-instructor: batchCount, courseCount, avgRating
export const getInstructorStats = asyncHandler(async (req, res) => {
  const [instructors, batches, courses, reviews] = await Promise.all([
    User.find({ role: "instructor" }).select("_id").lean(),
    Batch.find({}).select("mentor").lean(),
    Course.find({}).select("instructor _id").lean(),
    Review.find({}).select("course rating").lean(),
  ]);

  // Build course → rating map
  const courseRatings = {};
  reviews.forEach((r) => {
    const cid = String(r.course);
    if (!courseRatings[cid]) courseRatings[cid] = { sum: 0, count: 0 };
    courseRatings[cid].sum += r.rating;
    courseRatings[cid].count += 1;
  });

  const stats = {};
  instructors.forEach((inst) => {
    const id = String(inst._id);
    const batchCount = batches.filter((b) => b.mentor && String(b.mentor) === id).length;
    const instCourses = courses.filter(
      (c) => c.instructor && String(c.instructor) === id
    );
    const courseCount = instCourses.length;

    // avg rating across all their courses
    let ratingSum = 0, ratingCount = 0;
    instCourses.forEach((c) => {
      const cr = courseRatings[String(c._id)];
      if (cr && cr.count > 0) {
        ratingSum += cr.sum;
        ratingCount += cr.count;
      }
    });
    const avgRating = ratingCount > 0 ? +(ratingSum / ratingCount).toFixed(1) : null;

    stats[id] = { batchCount, courseCount, avgRating };
  });

  res.json(stats);
});
