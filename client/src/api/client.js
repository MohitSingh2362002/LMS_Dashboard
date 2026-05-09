import axios from "axios";

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || "http://localhost:7001"}/api`
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("lms_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Single-device enforcement: when the server rejects a token because the user
// logged in on another device, clear the local session and redirect to login.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && err.response?.data?.message === "SESSION_EXPIRED") {
      localStorage.removeItem("lms_token");
      window.location.replace("/?session_expired=1");
    }
    return Promise.reject(err);
  }
);

export default api;
