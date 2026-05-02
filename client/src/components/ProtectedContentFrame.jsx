import { useEffect, useMemo } from "react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

const ProtectedContentFrame = ({ children, course, enrollment, resource = "course-content" }) => {
  const { user } = useAuth();
  const watermark = useMemo(
    () => `${user?.name || "Learner"} · ${user?.email || ""} · ${new Date().toLocaleString("en-IN")}`,
    [user?.email, user?.name]
  );

  const logAction = async (action, metadata = {}) => {
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
  };

  useEffect(() => {
    logAction("view");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course, enrollment, resource]);

  const blockAction = (event, action) => {
    event.preventDefault();
    logAction(action, { key: event.key || "", type: event.type });
  };

  const onKeyDown = (event) => {
    const key = event.key?.toLowerCase();
    const blocked =
      (event.metaKey || event.ctrlKey) && ["c", "s", "p", "u"].includes(key) ||
      key === "printscreen";

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
