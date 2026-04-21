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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../../.env") });

const richHtml = (title) =>
  `<h2>${title}</h2><p>This is sample rich-text content for ${title}. You can replace it with your curriculum, media, and assignments.</p><ul><li>Hands-on lesson</li><li>Reference notes</li><li>Practice checklist</li></ul>`;

const seed = async () => {
  await connectDB();
  await Promise.all([
    User.deleteMany({}),
    Course.deleteMany({}),
    Enrollment.deleteMany({}),
    Review.deleteMany({}),
    PublicFormQuestion.deleteMany({}),
    LiveClass.deleteMany({})
  ]);

  const admin = await User.create({
    name: "Admin User",
    email: "admin@lms.com",
    password: "admin123",
    role: "admin"
  });

  const instructors = await User.create([
    {
      name: "Ava Patel",
      email: "ava@lms.com",
      password: "password123",
      role: "instructor"
    },
    {
      name: "Rohan Mehta",
      email: "rohan@lms.com",
      password: "password123",
      role: "instructor"
    }
  ]);

  const learners = await User.create(
    Array.from({ length: 5 }).map((_, index) => ({
      name: `Learner ${index + 1}`,
      email: `learner${index + 1}@lms.com`,
      password: "password123",
      role: "learner"
    }))
  );

  const courses = await Course.insertMany([
    {
      title: "React Foundations",
      tags: ["frontend", "react", "starter"],
      instructorDisplayName: instructors[0].name,
      instructor: instructors[0]._id,
      description: richHtml("React Foundations"),
      tagline: "<p>Build polished UIs with confidence.</p>",
      pricing: { type: "free", amount: 0, currency: "USD" },
      pages: [
        { title: "Welcome", content: richHtml("Welcome") },
        { title: "Components", content: richHtml("Components") }
      ],
      advancedSettings: { accessDuration: 365, certificateEnabled: true },
      status: "published"
    },
    {
      title: "Backend APIs with Node",
      tags: ["backend", "node", "express"],
      instructorDisplayName: instructors[1].name,
      instructor: instructors[1]._id,
      description: richHtml("Backend APIs with Node"),
      tagline: "<p>Design reliable Express services.</p>",
      pricing: { type: "paid", amount: 49, currency: "USD" },
      pages: [
        { title: "REST Basics", content: richHtml("REST Basics") },
        { title: "Authentication", content: richHtml("Authentication") }
      ],
      advancedSettings: { accessDuration: 180, certificateEnabled: true },
      status: "published"
    },
    {
      title: "System Design for Full-Stack Teams",
      tags: ["architecture", "full-stack", "advanced"],
      instructorDisplayName: instructors[0].name,
      instructor: instructors[0]._id,
      description: richHtml("System Design for Full-Stack Teams"),
      tagline: "<p>Map product requirements into scalable systems.</p>",
      pricing: { type: "paid", amount: 79, currency: "USD" },
      pages: [
        { title: "Requirements", content: richHtml("Requirements") },
        { title: "Tradeoffs", content: richHtml("Tradeoffs") }
      ],
      advancedSettings: { accessDuration: 90, certificateEnabled: false },
      status: "published"
    }
  ]);

  await Enrollment.insertMany([
    { learner: learners[0]._id, course: courses[0]._id, progress: 50, completedPages: [0] },
    { learner: learners[1]._id, course: courses[1]._id, progress: 100, completedPages: [0, 1] },
    { learner: learners[2]._id, course: courses[2]._id, progress: 50, completedPages: [0] },
    { learner: learners[3]._id, course: courses[0]._id, progress: 100, completedPages: [0, 1] },
    { learner: learners[4]._id, course: courses[1]._id, progress: 0, completedPages: [] }
  ]);

  await Review.insertMany([
    {
      learner: learners[0]._id,
      course: courses[0]._id,
      rating: 5,
      comment: "Excellent intro course with practical examples."
    },
    {
      learner: learners[1]._id,
      course: courses[1]._id,
      rating: 4,
      comment: "Very clear explanations on authentication."
    },
    {
      learner: learners[3]._id,
      course: courses[0]._id,
      rating: 5,
      comment: "Loved the pacing and the chapter breakdown."
    }
  ]);

  await PublicFormQuestion.insertMany([
    {
      askedBy: learners[0]._id,
      course: courses[0]._id,
      question: "Will this course help me prepare for React interviews?",
      answer: "Yes, especially the component and state management sections.",
      isAnswered: true
    },
    {
      askedBy: learners[2]._id,
      course: courses[1]._id,
      question: "Do we cover JWT refresh token strategies?",
      answer: "",
      isAnswered: false
    }
  ]);

  await LiveClass.create({
    title: "Weekly React Office Hours",
    roomName: "weekly-react-office-hours",
    instructor: instructors[0]._id,
    course: courses[0]._id,
    scheduledAt: new Date(Date.now() + 86400000),
    roomId: "sample-react-office-hours",
    roomUrl: `${process.env.LIVE_CLASS_BASE_URL || "https://localhost:3000"}/room/weekly-react-office-hours`,
    status: "scheduled",
    isImmediate: false
  });

  console.log("Seed complete");
  console.log("Admin login: admin@lms.com / admin123");
  console.log(`Instructor login: ${instructors[0].email} / password123`);
  console.log(`Learner login: ${learners[0].email} / password123`);
  process.exit(0);
};

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
