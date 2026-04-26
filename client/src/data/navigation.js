export const navigationByRole = {
  admin: [
    { label: "Overview", to: "/admin" },
    { label: "Courses", to: "/admin/courses" },
    { label: "Users", to: "/admin/users" },
    { label: "Live Classes", to: "/admin/live-classes" },
    { label: "Q&A", to: "/admin/questions" },
    { label: "Reviews", to: "/admin/reviews" }
  ],
  instructor: [
    { label: "Overview", to: "/instructor" },
    { label: "Live Tests & Notes", to: "/instructor/resources" },
    { label: "Live Classes", to: "/instructor/live-classes" },
    { label: "Q&A", to: "/instructor/questions" }
  ],
  learner: [{ label: "My Courses", to: "/learner" }]
};
