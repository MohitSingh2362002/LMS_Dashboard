export const navigationByRole = {
  admin: [
    { label: "Overview", to: "/admin" },
    { label: "Analytics", to: "/admin/analytics" },
    { label: "Courses", to: "/admin/courses" },
    { label: "Batches", to: "/admin/batches" },
    { label: "Migration Requests", to: "/admin/migrations" },
    { label: "Question Bank", to: "/admin/exam/questions" },
    { label: "Mock Tests", to: "/admin/exam/tests" },
    { label: "Leaderboards", to: "/admin/exam/leaderboards" },
    { label: "Doubt Vault", to: "/admin/doubts" },
    { label: "Attendance", to: "/admin/attendance" },
    { label: "Parent Chat", to: "/admin/chat" },
    { label: "Security Audit", to: "/admin/security" },
    { label: "Notifications", to: "/admin/notifications" },
    { label: "Users", to: "/admin/users" },
    { label: "Live Classes", to: "/admin/live-classes" },
    { label: "Reviews", to: "/admin/reviews" }
  ],
  instructor: [
    { label: "Overview", to: "/instructor" },
    { label: "Batches", to: "/instructor/batches" },
    { label: "Migration Requests", to: "/instructor/migrations" },
    { label: "Question Bank", to: "/instructor/exam/questions" },
    { label: "Mock Tests", to: "/instructor/exam/tests" },
    { label: "Leaderboards", to: "/instructor/exam/leaderboards" },
    { label: "Doubt Vault", to: "/instructor/doubts" },
    { label: "Attendance", to: "/instructor/attendance" },
    { label: "Parent Chat", to: "/instructor/chat" },
    { label: "Security Audit", to: "/instructor/security" },
    { label: "Notifications", to: "/instructor/notifications" },
    { label: "Live Tests & Notes", to: "/instructor/resources" },
    { label: "Live Classes", to: "/instructor/live-classes" }
  ],
  learner: [
    { label: "My Courses", to: "/learner" },
    { label: "My Batch", to: "/learner/batches" },
    { label: "Exam Cracker", to: "/learner/exam" },
    { label: "Leaderboards", to: "/learner/exam/leaderboards" },
    { label: "Doubt Vault", to: "/learner/doubts" },
    { label: "Attendance", to: "/learner/attendance" },
    { label: "Notifications", to: "/learner/notifications" }
  ],
  parent: [
    { label: "Trust Center", to: "/parent" },
    { label: "Growth Reports", to: "/parent/reports" },
    { label: "Batches", to: "/parent/batches" },
    { label: "Tests", to: "/parent/exam" },
    { label: "Leaderboards", to: "/parent/exam/leaderboards" },
    { label: "Attendance", to: "/parent/attendance" },
    { label: "Teacher Chat", to: "/parent/chat" },
    { label: "Notifications", to: "/parent/notifications" }
  ]
};
