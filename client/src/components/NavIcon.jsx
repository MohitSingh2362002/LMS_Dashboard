const paths = {
  dashboard: "M3 12l9-9 9 9M5 10v10h4v-6h6v6h4V10",
  courses: "M4 5h16v3H4zM4 11h16v3H4zM4 17h10v3H4z",
  batch: "M12 3l9 4-9 4-9-4 9-4zM3 11l9 4 9-4M3 15l9 4 9-4",
  migration: "M4 7h11l-3-3M20 17H9l3 3",
  questions: "M9 9a3 3 0 116 0c0 2-3 2-3 5M12 19h.01",
  tests: "M9 11l3 3 8-8M5 12v6a2 2 0 002 2h10a2 2 0 002-2v-2",
  leaderboard: "M8 21V10M16 21V6M12 21V14",
  doubts: "M21 15a4 4 0 01-4 4H8l-5 4V7a4 4 0 014-4h10a4 4 0 014 4v8z",
  attendance: "M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  chat: "M21 11.5a8.38 8.38 0 01-9 8.5 8.5 8.5 0 01-3.8-.9L3 21l1.9-5.7A8.38 8.38 0 0112 3a8.5 8.5 0 019 8.5z",
  users: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75",
  instructor: "M22 10v6M2 10l10-5 10 5-10 5L2 10zM6 12v5a6 3 0 0012 0v-5",
  parents: "M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM22 21l-3-3m1-4a4 4 0 11-8 0 4 4 0 018 0z",
  live: "M23 7l-7 5 7 5V7zM14 5H3a2 2 0 00-2 2v10a2 2 0 002 2h11a2 2 0 002-2V7a2 2 0 00-2-2z",
  reviews: "M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z",
  security: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  bell: "M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0",
  resources: "M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2zM22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z",
  reports: "M3 3v18h18M7 14l4-4 4 4 5-5",
  recordings: "M15 10l4.553-2.277A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"
};

const NavIcon = ({ name, className = "h-5 w-5" }) => {
  const d = paths[name] || paths.dashboard;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d={d} />
    </svg>
  );
};

export default NavIcon;
