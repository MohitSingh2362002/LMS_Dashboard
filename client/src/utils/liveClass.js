import api from "../api/client";

const LIVE_SESSION_BASE = import.meta.env.VITE_LIVE_CLASS_BASE_URL || "https://localhost:3000";

/**
 * Requests a one-time join token from the server and returns the livesession URL.
 * The URL contains only the opaque token — no room name, no role, no display name
 * is visible in the address bar or browser history.
 */
export const buildLiveClassJoinUrl = async (liveClass) => {
  const { data } = await api.post(`/live-classes/${liveClass._id}/join-token`);
  const url = new URL("/", LIVE_SESSION_BASE);
  url.searchParams.set("t", data.token);

  // Pass the Dash auth token so livesession can call /api/recordings/* on the host's behalf.
  // Stored in livesession's own localStorage under the same key.
  const dashAuth = localStorage.getItem("lms_token");
  if (dashAuth) url.searchParams.set("auth", dashAuth);

  return url.toString();
};
