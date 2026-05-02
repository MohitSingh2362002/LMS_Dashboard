export const navigationByRole = {
  admin: [
    { label: "Overview", to: "/admin" },
    { label: "Courses", to: "/admin/courses" },
    { label: "Batches", to: "/admin/batches" },
    { label: "Migration Requests", to: "/admin/migrations" },
    { label: "Question Bank", to: "/admin/exam/questions" },
    { label: "Mock Tests", to: "/admin/exam/tests" },
    { label: "Leaderboards", to: "/admin/exam/leaderboards" },
    { label: "Users", to: "/admin/users" },
    { label: "Live Classes", to: "/admin/live-classes" },
    { label: "Q&A", to: "/admin/questions" },
    { label: "Reviews", to: "/admin/reviews" }
  ],
  instructor: [
    { label: "Overview", to: "/instructor" },
    { label: "Batches", to: "/instructor/batches" },
    { label: "Migration Requests", to: "/instructor/migrations" },
    { label: "Question Bank", to: "/instructor/exam/questions" },
    { label: "Mock Tests", to: "/instructor/exam/tests" },
    { label: "Leaderboards", to: "/instructor/exam/leaderboards" },
    { label: "Live Tests & Notes", to: "/instructor/resources" },
    { label: "Live Classes", to: "/instructor/live-classes" },
    { label: "Q&A", to: "/instructor/questions" }
  ],
  learner: [
    { label: "My Courses", to: "/learner" },
    { label: "My Batch", to: "/learner/batches" },
    { label: "Exam Cracker", to: "/learner/exam" },
    { label: "Leaderboards", to: "/learner/exam/leaderboards" }
  ],
  parent: [
    { label: "Trust Center", to: "/parent" },
    { label: "Batches", to: "/parent/batches" },
    { label: "Tests", to: "/parent/exam" },
    { label: "Leaderboards", to: "/parent/exam/leaderboards" }
  ]
};
