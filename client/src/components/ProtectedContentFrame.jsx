import { useCallback, useEffect, useMemo, useRef } from "react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

const ProtectedContentFrame = ({ children, course, enrollment, resource = "course-content" }) => {
  const { user } = useAuth();
  const warnCountRef = useRef(0);

  const watermark = useMemo(
    () => `${user?.name || "Learner"} · ${user?.email || ""} · ${new Date().toLocaleString("en-IN")}`,
    [user?.email, user?.name]
  );

  const logAction = useCallback(async (action, metadata = {}) => {
    try {
      await api.post("/security/content-logs", {
        course,
        enrollment,
        action,
        resource,
        metadata
      });
    } catch {
      // Logging must never interrupt learning.
    }
  }, [course, enrollment, resource]);

  // Log initial view
  useEffect(() => {
    logAction("view");
  }, [course, enrollment, resource, logAction]);

  // Tab-visibility detection
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        warnCountRef.current += 1;
        logAction("tab-switch", { count: warnCountRef.current });
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [logAction]);

  // DevTools height-anomaly detection
  useEffect(() => {
    const check = () => {
      if (window.outerHeight - window.innerHeight > 160) {
        logAction("devtools-detected", { heightDiff: window.outerHeight - window.innerHeight });
      }
    };
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [logAction]);

  const blockAction = (event, action) => {
    event.preventDefault();
    logAction(action, { key: event.key || "", type: event.type });
  };

  const onKeyDown = (event) => {
    const key = event.key?.toLowerCase();
    const blocked =
      key === "printscreen" ||
      ((event.metaKey || event.ctrlKey) && ["c", "s", "p", "u"].includes(key)) ||
      (event.ctrlKey && event.shiftKey && key === "s");

    if (blocked) blockAction(event, "blocked-shortcut");
  };

  return (
    <div
      className="protected-content relative overflow-hidden"
      data-watermark={watermark}
      onContextMenu={(event) => blockAction(event, "blocked-context-menu")}
      onCopy={(event) => blockAction(event, "blocked-copy")}
      onCut={(event) => blockAction(event, "blocked-copy")}
      onKeyDown={onKeyDown}
      tabIndex={0}
    >
      {children}
    </div>
  );
};

export default ProtectedContentFrame;
