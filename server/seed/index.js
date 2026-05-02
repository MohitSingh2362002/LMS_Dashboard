import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import connectDB from "../config/db.js";
import User from "../models/User.js";
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import Review from "../models/Review.js";
import PublicFormQuestion from "../models/PublicFormQuestion.js";
import LiveClass from "../models/LiveClass.js";
import Batch from "../models/Batch.js";
import ExamQuestion from "../models/ExamQuestion.js";
import MockTest from "../models/MockTest.js";
import TestAttempt from "../models/TestAttempt.js";
import Attendance from "../models/Attendance.js";
import Doubt from "../models/Doubt.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../../.env") });

const richHtml = (title) =>
  `<h2>${title}</h2><p>This is sample rich-text content for ${title}. You can replace it with your curriculum, media, and assignments.</p><ul><li>Hands-on lesson</li><li>Reference notes</li><li>Practice checklist</li></ul>`;

const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

const seed = async () => {
  await connectDB();
  await Promise.all([
    User.deleteMany({}),
    Course.deleteMany({}),
    Enrollment.deleteMany({}),
    Review.deleteMany({}),
    PublicFormQuestion.deleteMany({}),
    LiveClass.deleteMany({}),
    Batch.deleteMany({}),
    ExamQuestion.deleteMany({}),
    MockTest.deleteMany({}),
    TestAttempt.deleteMany({}),
    Attendance.deleteMany({}),
    Doubt.deleteMany({}),
  ]);

  // ── Users ──
  const admin = await User.create({
    name: "Admin User",
    email: "admin@lms.com",
    password: "admin123",
    role: "admin",
  });

  const instructors = await User.create([
    { name: "Ava Patel", email: "ava@lms.com", password: "password123", role: "instructor" },
    { name: "Rohan Mehta", email: "rohan@lms.com", password: "password123", role: "instructor" },
  ]);

  const learners = await User.create(
    Array.from({ length: 6 }).map((_, i) => ({
      name: ["Arjun Sharma", "Priya Gupta", "Vikram Reddy", "Neha Singh", "Karan Patel", "Ananya Iyer"][i],
      email: `learner${i + 1}@lms.com`,
      password: "password123",
      role: "learner",
    }))
  );

  const parents = await User.create([
    { name: "Raj Sharma", email: "parent1@lms.com", password: "password123", role: "parent", linkedLearners: [learners[0]._id, learners[1]._id] },
    { name: "Sunita Patel", email: "parent2@lms.com", password: "password123", role: "parent", linkedLearners: [learners[4]._id] },
  ]);

  // ── Courses ──
  const courses = await Course.insertMany([
    {
      title: "NEET Biology Masterclass",
      tags: ["biology", "neet", "medical"],
      instructorDisplayName: instructors[0].name,
      instructor: instructors[0]._id,
      description: richHtml("NEET Biology Masterclass"),
      tagline: "<p>Ace NEET Biology with structured chapters and practice.</p>",
      pricing: { type: "paid", amount: 2999, currency: "INR" },
      pages: [
        { title: "Cell Biology", content: richHtml("Cell Biology") },
        { title: "Genetics & Evolution", content: richHtml("Genetics & Evolution") },
        { title: "Human Physiology", content: richHtml("Human Physiology") },
        { title: "Ecology", content: richHtml("Ecology") },
      ],
      notes: [{ title: "Quick Revision Notes", content: "Key formulas and diagrams for NEET Biology." }],
      advancedSettings: { accessDuration: 365, certificateEnabled: true },
      status: "published",
    },
    {
      title: "NEET Chemistry Crash Course",
      tags: ["chemistry", "neet", "medical"],
      instructorDisplayName: instructors[1].name,
      instructor: instructors[1]._id,
      description: richHtml("NEET Chemistry Crash Course"),
      tagline: "<p>Fast-track your chemistry preparation for NEET.</p>",
      pricing: { type: "paid", amount: 1999, currency: "INR" },
      pages: [
        { title: "Organic Chemistry", content: richHtml("Organic Chemistry") },
        { title: "Inorganic Chemistry", content: richHtml("Inorganic Chemistry") },
        { title: "Physical Chemistry", content: richHtml("Physical Chemistry") },
      ],
      notes: [{ title: "Periodic Table Cheatsheet", content: "Complete periodic table with trends." }],
      advancedSettings: { accessDuration: 180, certificateEnabled: true },
      status: "published",
    },
    {
      title: "Physics Olympiad Prep",
      tags: ["physics", "olympiad", "competitive"],
      instructorDisplayName: instructors[0].name,
      instructor: instructors[0]._id,
      description: richHtml("Physics Olympiad Prep"),
      tagline: "<p>Competitive physics for Olympiad aspirants.</p>",
      pricing: { type: "free", amount: 0, currency: "INR" },
      pages: [
        { title: "Mechanics", content: richHtml("Mechanics") },
        { title: "Thermodynamics", content: richHtml("Thermodynamics") },
        { title: "Electromagnetism", content: richHtml("Electromagnetism") },
      ],
      advancedSettings: { accessDuration: 365, certificateEnabled: true },
      status: "published",
    },
    {
      title: "React Foundations",
      tags: ["frontend", "react", "starter"],
      instructorDisplayName: instructors[1].name,
      instructor: instructors[1]._id,
      description: richHtml("React Foundations"),
      tagline: "<p>Build polished UIs with confidence.</p>",
      pricing: { type: "free", amount: 0, currency: "USD" },
      pages: [
        { title: "Welcome", content: richHtml("Welcome") },
        { title: "Components", content: richHtml("Components") },
      ],
      advancedSettings: { accessDuration: 365, certificateEnabled: false },
      status: "draft",
    },
  ]);

  // ── Batches ──
  const batches = await Batch.insertMany([
    { name: "Foundation Batch A", course: courses[0]._id, mentor: instructors[0]._id, learners: [learners[0]._id, learners[1]._id], performanceGroup: "foundation", status: "active" },
    { name: "Growth Batch B", course: courses[0]._id, mentor: instructors[0]._id, learners: [learners[2]._id, learners[3]._id], performanceGroup: "growth", status: "active" },
    { name: "Merit Batch C", course: courses[1]._id, mentor: instructors[1]._id, learners: [learners[4]._id], performanceGroup: "merit", status: "active" },
    { name: "Ranker Batch D", course: courses[2]._id, mentor: instructors[1]._id, learners: [learners[5]._id, learners[0]._id], performanceGroup: "ranker", status: "active" },
  ]);

  // ── Enrollments (varied progress) ──
  await Enrollment.insertMany([
    { learner: learners[0]._id, course: courses[0]._id, progress: 75, completedPages: [0, 1, 2], createdAt: daysAgo(25) },
    { learner: learners[0]._id, course: courses[2]._id, progress: 33, completedPages: [0], createdAt: daysAgo(10) },
    { learner: learners[1]._id, course: courses[0]._id, progress: 100, completedPages: [0, 1, 2, 3], createdAt: daysAgo(28) },
    { learner: learners[1]._id, course: courses[1]._id, progress: 50, completedPages: [0], createdAt: daysAgo(15) },
    { learner: learners[2]._id, course: courses[0]._id, progress: 50, completedPages: [0, 1], createdAt: daysAgo(20) },
    { learner: learners[3]._id, course: courses[1]._id, progress: 25, completedPages: [], createdAt: daysAgo(12) },
    { learner: learners[4]._id, course: courses[1]._id, progress: 100, completedPages: [0, 1, 2], createdAt: daysAgo(22) },
    { learner: learners[4]._id, course: courses[2]._id, progress: 66, completedPages: [0, 1], createdAt: daysAgo(8) },
    { learner: learners[5]._id, course: courses[2]._id, progress: 0, completedPages: [], createdAt: daysAgo(3) },
  ]);

  // ── Exam Questions ──
  const questionData = [
    { question: "Which organelle is known as the powerhouse of the cell?", type: "single", options: [{ label: "A", text: "Ribosome" }, { label: "B", text: "Mitochondria" }, { label: "C", text: "Nucleus" }, { label: "D", text: "Golgi body" }], correctOptions: ["B"], subject: "Biology", chapter: "Cell Biology", topic: "Cell Organelles", difficulty: "easy", exam: "NEET", marks: 4, negativeMarks: 1 },
    { question: "DNA replication is:", type: "single", options: [{ label: "A", text: "Conservative" }, { label: "B", text: "Semi-conservative" }, { label: "C", text: "Dispersive" }, { label: "D", text: "None" }], correctOptions: ["B"], subject: "Biology", chapter: "Genetics", topic: "DNA Replication", difficulty: "medium", exam: "NEET", marks: 4, negativeMarks: 1 },
    { question: "The SI unit of force is:", type: "single", options: [{ label: "A", text: "Pascal" }, { label: "B", text: "Newton" }, { label: "C", text: "Joule" }, { label: "D", text: "Watt" }], correctOptions: ["B"], subject: "Physics", chapter: "Mechanics", topic: "Units & Measurements", difficulty: "easy", exam: "NEET", marks: 4, negativeMarks: 1 },
    { question: "What is the pH of pure water at 25°C?", type: "numeric", options: [], correctOptions: [], correctNumericAnswer: 7, subject: "Chemistry", chapter: "Ionic Equilibrium", topic: "pH Scale", difficulty: "easy", exam: "NEET", marks: 4, negativeMarks: 0 },
    { question: "Which vitamin is water-soluble?", type: "single", options: [{ label: "A", text: "Vitamin A" }, { label: "B", text: "Vitamin D" }, { label: "C", text: "Vitamin C" }, { label: "D", text: "Vitamin K" }], correctOptions: ["C"], subject: "Biology", chapter: "Human Physiology", topic: "Vitamins", difficulty: "easy", exam: "NEET", marks: 4, negativeMarks: 1 },
    { question: "Newton's third law states:", type: "single", options: [{ label: "A", text: "F = ma" }, { label: "B", text: "Every action has equal and opposite reaction" }, { label: "C", text: "Objects at rest stay at rest" }, { label: "D", text: "Energy is conserved" }], correctOptions: ["B"], subject: "Physics", chapter: "Mechanics", topic: "Newton's Laws", difficulty: "easy", exam: "Olympiad", marks: 4, negativeMarks: 1 },
    { question: "The hybridization of carbon in methane is:", type: "single", options: [{ label: "A", text: "sp" }, { label: "B", text: "sp2" }, { label: "C", text: "sp3" }, { label: "D", text: "sp3d" }], correctOptions: ["C"], subject: "Chemistry", chapter: "Organic Chemistry", topic: "Hybridization", difficulty: "medium", exam: "NEET", marks: 4, negativeMarks: 1 },
    { question: "The acceleration due to gravity on Earth is approximately:", type: "numeric", options: [], correctOptions: [], correctNumericAnswer: 9.8, subject: "Physics", chapter: "Mechanics", topic: "Gravitation", difficulty: "easy", exam: "Olympiad", marks: 4, negativeMarks: 0 },
    { question: "Krebs cycle occurs in:", type: "single", options: [{ label: "A", text: "Cytoplasm" }, { label: "B", text: "Mitochondrial matrix" }, { label: "C", text: "Nucleus" }, { label: "D", text: "ER" }], correctOptions: ["B"], subject: "Biology", chapter: "Cell Biology", topic: "Cellular Respiration", difficulty: "medium", exam: "NEET", marks: 4, negativeMarks: 1 },
    { question: "Benzene has how many pi electrons?", type: "numeric", options: [], correctOptions: [], correctNumericAnswer: 6, subject: "Chemistry", chapter: "Organic Chemistry", topic: "Aromaticity", difficulty: "hard", exam: "NEET", marks: 4, negativeMarks: 0 },
  ];

  const examQuestions = await ExamQuestion.insertMany(
    questionData.map((q) => ({ ...q, createdBy: admin._id }))
  );

  // ── Mock Tests ──
  const neetQuestionIds = examQuestions.filter((q) => q.exam === "NEET").map((q) => q._id);
  const olympiadQuestionIds = examQuestions.filter((q) => q.exam === "Olympiad").map((q) => q._id);

  const mockTests = await MockTest.insertMany([
    { title: "NEET Full Mock Test 1", examPattern: "NEET", course: courses[0]._id, batch: batches[0]._id, questions: neetQuestionIds, durationMinutes: 180, status: "published", createdBy: admin._id },
    { title: "Olympiad Practice Set", examPattern: "Olympiad", course: courses[2]._id, batch: batches[3]._id, questions: olympiadQuestionIds, durationMinutes: 120, status: "published", createdBy: admin._id },
  ]);

  // ── Test Attempts (spread over 30 days) ──
  const buildAnswers = (test, score) => {
    const questions = test === 0 ? neetQuestionIds : olympiadQuestionIds;
    return questions.map((qId, i) => ({
      question: qId,
      selectedOptions: score > i * 15 ? ["B"] : ["A"],
      isCorrect: score > i * 15,
      score: score > i * 15 ? 4 : -1,
    }));
  };

  const attemptData = [
    { learner: learners[0]._id, test: mockTests[0]._id, score: 20, maxScore: 32, correctCount: 5, incorrectCount: 3, skippedCount: 0, weakTopics: ["Genetics", "Cell Organelles"], submittedAt: daysAgo(28) },
    { learner: learners[0]._id, test: mockTests[0]._id, score: 24, maxScore: 32, correctCount: 6, incorrectCount: 2, skippedCount: 0, weakTopics: ["Genetics"], submittedAt: daysAgo(20) },
    { learner: learners[0]._id, test: mockTests[1]._id, score: 8, maxScore: 12, correctCount: 2, incorrectCount: 1, skippedCount: 0, weakTopics: [], submittedAt: daysAgo(10) },
    { learner: learners[1]._id, test: mockTests[0]._id, score: 28, maxScore: 32, correctCount: 7, incorrectCount: 1, skippedCount: 0, weakTopics: [], submittedAt: daysAgo(22) },
    { learner: learners[1]._id, test: mockTests[0]._id, score: 30, maxScore: 32, correctCount: 8, incorrectCount: 0, skippedCount: 0, weakTopics: [], submittedAt: daysAgo(7) },
    { learner: learners[2]._id, test: mockTests[0]._id, score: 16, maxScore: 32, correctCount: 4, incorrectCount: 4, skippedCount: 0, weakTopics: ["Vitamins", "Cell Organelles", "Hybridization"], submittedAt: daysAgo(18) },
    { learner: learners[3]._id, test: mockTests[0]._id, score: 12, maxScore: 32, correctCount: 3, incorrectCount: 5, skippedCount: 0, weakTopics: ["pH Scale", "DNA Replication", "Krebs Cycle"], submittedAt: daysAgo(14) },
    { learner: learners[4]._id, test: mockTests[0]._id, score: 26, maxScore: 32, correctCount: 7, incorrectCount: 1, skippedCount: 0, weakTopics: ["Aromaticity"], submittedAt: daysAgo(16) },
    { learner: learners[5]._id, test: mockTests[1]._id, score: 4, maxScore: 12, correctCount: 1, incorrectCount: 2, skippedCount: 0, weakTopics: ["Newton's Laws", "Gravitation"], submittedAt: daysAgo(5) },
  ];

  await TestAttempt.insertMany(
    attemptData.map((a) => ({
      ...a,
      answers: buildAnswers(a.test.equals(mockTests[0]._id) ? 0 : 1, a.score),
      timeTakenSeconds: Math.floor(Math.random() * 5400) + 1800,
      status: "submitted",
    }))
  );

  // ── Attendance (last 7 sessions) ──
  const attendanceRecords = [];
  for (let day = 1; day <= 7; day++) {
    attendanceRecords.push({
      batch: batches[0]._id,
      course: courses[0]._id,
      markedBy: instructors[0]._id,
      sessionDate: daysAgo(day),
      records: [
        { learner: learners[0]._id, status: day % 3 === 0 ? "absent" : "present", note: "" },
        { learner: learners[1]._id, status: "present", note: "" },
      ],
    });
  }
  for (let day = 1; day <= 5; day++) {
    attendanceRecords.push({
      batch: batches[1]._id,
      course: courses[0]._id,
      markedBy: instructors[0]._id,
      sessionDate: daysAgo(day),
      records: [
        { learner: learners[2]._id, status: day % 4 === 0 ? "late" : "present", note: "" },
        { learner: learners[3]._id, status: day % 2 === 0 ? "absent" : "present", note: "" },
      ],
    });
  }
  await Attendance.insertMany(attendanceRecords);

  // ── Doubts ──
  await Doubt.insertMany([
    { learner: learners[0]._id, course: courses[0]._id, batch: batches[0]._id, assignedTeacher: instructors[0]._id, subject: "Biology", chapter: "Genetics", topic: "DNA Replication", question: "Can you explain semiconservative replication with a diagram?", answer: "In semiconservative replication, each strand of the parent DNA serves as a template for a new complementary strand.", answeredBy: instructors[0]._id, answeredAt: daysAgo(5), status: "answered" },
    { learner: learners[2]._id, course: courses[0]._id, batch: batches[1]._id, assignedTeacher: instructors[0]._id, subject: "Biology", chapter: "Cell Biology", topic: "Cell Organelles", question: "What is the difference between rough and smooth ER?", status: "pending" },
    { learner: learners[4]._id, course: courses[1]._id, batch: batches[2]._id, assignedTeacher: instructors[1]._id, subject: "Chemistry", chapter: "Organic Chemistry", topic: "Hybridization", question: "Why is sp3 hybridization tetrahedral?", status: "pending" },
    { learner: learners[1]._id, course: courses[0]._id, batch: batches[0]._id, subject: "Biology", chapter: "Human Physiology", topic: "Vitamins", question: "List all water-soluble vitamins and their deficiency diseases.", answer: "Water-soluble vitamins include B-complex and Vitamin C. Deficiency of B1 causes Beriberi, B12 causes pernicious anemia, and C causes scurvy.", answeredBy: instructors[0]._id, answeredAt: daysAgo(2), status: "answered" },
  ]);

  // ── Reviews ──
  await Review.insertMany([
    { learner: learners[0]._id, course: courses[0]._id, rating: 5, comment: "Excellent course! The cell biology section was particularly well-explained." },
    { learner: learners[1]._id, course: courses[0]._id, rating: 4, comment: "Great content, would love more practice questions in each chapter." },
    { learner: learners[1]._id, course: courses[1]._id, rating: 5, comment: "Chemistry made easy. Organic chemistry section is a game changer." },
    { learner: learners[4]._id, course: courses[1]._id, rating: 3, comment: "Good course but the physical chemistry part needs more examples." },
    { learner: learners[2]._id, course: courses[0]._id, rating: 2, comment: "Content is okay but pacing is too fast for beginners." },
    { learner: learners[5]._id, course: courses[2]._id, rating: 4, comment: "Olympiad-level physics explained beautifully." },
  ]);

  // ── Public Form Questions ──
  await PublicFormQuestion.insertMany([
    { askedBy: learners[0]._id, course: courses[0]._id, question: "Will this course cover NEET 2025 syllabus changes?", answer: "Yes, all content is updated for the latest NEET syllabus.", isAnswered: true },
    { askedBy: learners[2]._id, course: courses[1]._id, question: "Are there downloadable PDF notes?", answer: "", isAnswered: false },
    { askedBy: learners[4]._id, course: courses[2]._id, question: "Is there a separate section for previous year Olympiad papers?", answer: "We are adding a dedicated past-papers section next month.", isAnswered: true },
  ]);

  // ── Live Classes ──
  await LiveClass.create({
    title: "Weekly NEET Biology Live Q&A",
    roomName: "weekly-neet-biology",
    instructor: instructors[0]._id,
    course: courses[0]._id,
    scheduledAt: new Date(Date.now() + 86400000),
    roomId: "sample-neet-biology",
    roomUrl: `${process.env.LIVE_CLASS_BASE_URL || "https://localhost:3000"}/room/weekly-neet-biology`,
    status: "scheduled",
    isImmediate: false,
  });

  console.log("\n✅ Seed complete!\n");
  console.log("── Login credentials ──");
  console.log("Admin:       admin@lms.com / admin123");
  console.log(`Instructor:  ${instructors[0].email} / password123`);
  console.log(`Learner:     ${learners[0].email} / password123`);
  console.log(`Parent:      ${parents[0].email} / password123`);
  console.log(`\nTotal: 1 admin, 2 instructors, 6 learners, 2 parents`);
  console.log(`       4 courses, 4 batches, 10 exam questions, 2 mock tests`);
  console.log(`       9 enrollments, 9 test attempts, 12 attendance sessions`);
  console.log(`       4 doubts, 6 reviews, 3 Q&A entries, 1 live class\n`);
  process.exit(0);
};

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
