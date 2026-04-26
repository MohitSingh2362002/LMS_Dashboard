export const classNames = (...classes) => classes.filter(Boolean).join(" ");
export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:7001";
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_BASE_URL;

export const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short"
      }).format(new Date(value))
    : "—";

export const getFullImageUrl = (path) =>
  path?.startsWith("/uploads") ? `${API_BASE_URL}${path}` : path || "";

export const getFullFileUrl = (path) =>
  path?.startsWith("/uploads") ? `${API_BASE_URL}${path}` : path || "";

export const stripHtml = (html = "") => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

export const average = (items = []) =>
  items.length ? (items.reduce((sum, item) => sum + item, 0) / items.length).toFixed(1) : "0.0";

export const formatFileSize = (bytes = 0) => {
  if (!bytes) return "PDF";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const toDateTimeLocalValue = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
};

export const getLiveTestStatus = (liveTest, currentDate = new Date()) => {
  if (!liveTest?.enabled) {
    return { label: "Disabled", tone: "slate", canJoin: false };
  }

  const startsAt = liveTest.startsAt ? new Date(liveTest.startsAt) : null;
  const endsAt = liveTest.endsAt ? new Date(liveTest.endsAt) : null;
  const now = currentDate instanceof Date ? currentDate : new Date(currentDate);

  if (startsAt && !Number.isNaN(startsAt.getTime()) && now < startsAt) {
    return { label: "Upcoming", tone: "amber", canJoin: false };
  }

  if (endsAt && !Number.isNaN(endsAt.getTime()) && now > endsAt) {
    return { label: "Closed", tone: "slate", canJoin: false };
  }

  return {
    label: startsAt || endsAt ? "Live Now" : "Open",
    tone: "emerald",
    canJoin: Boolean(liveTest.link)
  };
};
