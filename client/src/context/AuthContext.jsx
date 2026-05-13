import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/client";

const AuthContext = createContext(null);

const USER_CACHE_KEY = "lms_user";

export const AuthProvider = ({ children }) => {
  // Restore user from cache immediately — no flicker on PWA reopen
  const [user, setUser] = useState(() => {
    try {
      const cached = localStorage.getItem(USER_CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  // If we already have a cached user, skip the loading spinner
  const [loading, setLoading] = useState(!localStorage.getItem(USER_CACHE_KEY));

  const persistUser = (u) => {
    if (u) {
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(u));
    } else {
      localStorage.removeItem(USER_CACHE_KEY);
    }
    setUser(u);
  };

  useEffect(() => {
    const bootstrap = async () => {
      const token = localStorage.getItem("lms_token");
      if (!token) {
        persistUser(null);
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get("/auth/me");
        persistUser(data.user);
      } catch (error) {
        const status = error?.response?.status;
        if (status === 401) {
          // Token is invalid / expired — clear everything
          localStorage.removeItem("lms_token");
          persistUser(null);
        }
        // Any other error (network offline, 5xx, timeout) — keep the cached
        // user so the PWA stays logged in and works offline.
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  const login = async (payload) => {
    const { data } = await api.post("/auth/login", payload);
    localStorage.setItem("lms_token", data.token);
    persistUser(data.user);
    return data.user;
  };

  const register = async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    localStorage.setItem("lms_token", data.token);
    persistUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("lms_token");
    persistUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      setUser: persistUser,
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
