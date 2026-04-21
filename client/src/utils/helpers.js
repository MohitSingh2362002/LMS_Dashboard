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

export const stripHtml = (html = "") => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

export const average = (items = []) =>
  items.length ? (items.reduce((sum, item) => sum + item, 0) / items.length).toFixed(1) : "0.0";
