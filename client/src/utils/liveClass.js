export const buildLiveClassJoinUrl = (liveClass, user) => {
  const baseUrl = import.meta.env.VITE_LIVE_CLASS_BASE_URL || "https://localhost:3000";
  const url = new URL("/", baseUrl);
  url.searchParams.set("roomName", liveClass?.roomName || liveClass?.roomId || "");
  url.searchParams.set("displayName", user?.name || "User");
  url.searchParams.set(
    "joinAs",
    user?.role === "learner" ? "participant" : "host"
  );

  return url.toString();
};
