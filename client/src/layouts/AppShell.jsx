import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import { navigationByRole } from "../data/navigation";
import { classNames, SOCKET_URL } from "../utils/helpers";
import NavIcon from "../components/NavIcon";
import { useLocation } from "react-router-dom";

// ── Global search overlay ───────────────────────────────────────────
const SearchOverlay = ({ onClose, navItems }) => {
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => { inputRef.current?.focus(); }, []);

  const results = query.length < 2 ? [] : navItems.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase())
  );

  const go = (to) => { navigate(to); onClose(); };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-3 pt-20 backdrop-blur-sm sm:pt-24" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        className="max-h-[calc(100vh-6rem)] w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-panel">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
          <svg className="h-4 w-4 text-slate-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
          <input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages, sections…"
            className="flex-1 bg-transparent text-sm text-brand-ink placeholder:text-slate-400 focus:outline-none" />
          <kbd className="hidden rounded border border-slate-200 px-1.5 py-0.5 text-[10px] text-slate-400 sm:block">ESC</kbd>
        </div>
        <div className="max-h-64 overflow-y-auto py-2">
          {!query ? (
            <p className="px-4 py-3 text-xs text-slate-400">Start typing to search…</p>
          ) : !results.length ? (
            <p className="px-4 py-3 text-xs text-slate-400">No pages match "{query}"</p>
          ) : (
            results.map((item) => (
              <button key={item.to} onClick={() => go(item.to)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-brand-ink hover:bg-brand-surface">
                <NavIcon name={item.icon} className="h-4 w-4 text-brand-primary" />
                <span className="font-medium">{item.label}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// ── Notifications panel ─────────────────────────────────────────────
const NotificationsPanel = ({ notifications, onClose, onClearAll }) => (
  <div className="fixed inset-0 z-50" onClick={onClose}>
    <div onClick={(e) => e.stopPropagation()}
      className="absolute left-3 right-3 top-14 rounded-2xl border border-slate-200/70 bg-white shadow-panel sm:left-auto sm:w-80">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <h3 className="text-sm font-bold text-brand-ink">Notifications</h3>
        {notifications.length > 0 && (
          <button onClick={onClearAll} className="text-[11px] font-semibold text-brand-primary hover:underline">Clear all</button>
        )}
      </div>
      <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
        {!notifications.length ? (
          <p className="px-4 py-5 text-center text-xs text-slate-400">You're all caught up!</p>
        ) : (
          notifications.map((n, i) => (
            <div key={i} className="px-4 py-3">
              <p className="text-xs font-semibold text-brand-ink">{n.title || "Notification"}</p>
              <p className="mt-0.5 text-[11px] text-slate-500">{n.message}</p>
              {n.at && <p className="mt-1 text-[10px] text-slate-400">{new Date(n.at).toLocaleTimeString()}</p>}
            </div>
          ))
        )}
      </div>
    </div>
  </div>
);

// ── Quick Action menu ───────────────────────────────────────────────
const QuickActionMenu = ({ role, onClose }) => {
  const navigate = useNavigate();

  const actions = {
    admin: [
      { label: "Register Student", icon: "users", to: "/admin/users" },
      { label: "Manage Courses", icon: "courses", to: "/admin/courses" },
      { label: "Live Classes", icon: "live", to: "/admin/live-classes" },
      { label: "Mock Tests", icon: "tests", to: "/admin/exam/tests" },
      { label: "Question Bank", icon: "questions", to: "/admin/exam/questions" }
    ],
    instructor: [
      { label: "Mark Attendance", icon: "attendance", to: "/instructor/attendance" },
      { label: "Add Question", icon: "questions", to: "/instructor/exam/questions" },
      { label: "Live Classes", icon: "live", to: "/instructor/live-classes" },
      { label: "Mock Tests", icon: "tests", to: "/instructor/exam/tests" }
    ],
    learner: [
      { label: "Mock Tests", icon: "tests", to: "/learner/exam" },
      { label: "Leaderboards", icon: "leaderboard", to: "/learner/exam/leaderboards" },
      { label: "Doubt Vault", icon: "doubts", to: "/learner/doubts" }
    ],
    parent: [
      { label: "Growth Reports", icon: "reports", to: "/parent/reports" },
      { label: "Tests", icon: "tests", to: "/parent/exam" },
      { label: "Leaderboards", icon: "leaderboard", to: "/parent/exam/leaderboards" }
    ]
  };

  const items = actions[role] || [];

  const go = (to) => { navigate(to); onClose(); };

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        className="absolute left-3 right-3 top-14 rounded-xl border border-slate-200/70 bg-white shadow-panel overflow-hidden sm:left-auto sm:w-52">
        <div className="border-b border-slate-100 px-4 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Quick Actions</p>
        </div>
        {!items.length ? (
          <p className="px-4 py-3 text-xs text-slate-500">No quick actions</p>
        ) : (
          items.map((item) => (
            <button key={item.to} onClick={() => go(item.to)}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium text-brand-ink hover:bg-brand-surface transition-colors">
              <NavIcon name={item.icon} className="h-4 w-4 text-brand-primary" />
              {item.label}
            </button>
          ))
        )}
      </div>
    </div>
  );
};

const AppShell = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showQuickAction, setShowQuickAction] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const navItems = navigationByRole[user.role] || [];

  useEffect(() => {
    if (!user?._id) return undefined;
    const socket = io(SOCKET_URL, { transports: ["websocket", "polling"] });
    socket.emit("join-user", { userId: user._id });
    socket.on("notification:new", (notification) => {
      toast(notification.message, { icon: "!" });
      setNotifications((prev) => [{ ...notification, at: new Date() }, ...prev].slice(0, 20));
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(notification.title, { body: notification.message });
      }
    });
    return () => socket.disconnect();
  }, [user?._id]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        setShowSearch(false);
        setShowQuickAction(false);
      }
      // Cmd/Ctrl+K to open search
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowSearch((v) => !v);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const portalLabel =
    user.role === "admin"
      ? { brand: "EduAdmin", subtitle: "LMS Portal" }
      : user.role === "learner"
        ? { brand: "EduMaster LMS", subtitle: "Learner Portal" }
        : { brand: "LMS Studio", subtitle: `${user.role} portal` };

  const unreadCount = notifications.length;

  return (
    <div data-portal-role={user.role} className="flex h-screen overflow-hidden bg-brand-background text-brand-ink">
      {/* Global overlays */}
      {showSearch && <SearchOverlay navItems={navItems} onClose={() => setShowSearch(false)} />}
      {showQuickAction && <QuickActionMenu role={user.role} onClose={() => setShowQuickAction(false)} />}

      {/* Mobile backdrop */}
      {open ? (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      ) : null}

      {/* Sidebar — always fixed, never scrolls */}
      <aside
        className={classNames(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-sidebar text-white transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex items-center gap-3 px-6 py-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-accent text-white">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5L2 10zM6 12v5a6 3 0 0012 0v-5" />
            </svg>
          </div>
          <div>
            <p className="text-base font-bold leading-tight">{portalLabel.brand}</p>
            <p className="text-[11px] uppercase tracking-wider text-sidebar-muted">{portalLabel.subtitle}</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to.split("/").length === 2}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                classNames(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-brand-accent text-white"
                    : "text-sidebar-muted hover:bg-sidebar-hover hover:text-white"
                )
              }
            >
              <NavIcon name={item.icon} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/5 px-3 py-3">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-muted transition-colors hover:bg-sidebar-hover hover:text-white"
            type="button"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main — offset by sidebar width on desktop, scrolls independently */}
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto lg:ml-64">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white px-3 py-3 sm:px-4 lg:px-8">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <button
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 text-sm transition hover:bg-slate-50 lg:hidden"
              onClick={() => setOpen((value) => !value)}
              aria-label="Open navigation"
            >
              ☰
            </button>

            {/* Search bar — opens overlay on click */}
            <button
              type="button"
              onClick={() => setShowSearch(true)}
              className="relative order-3 flex min-w-0 flex-[1_0_100%] items-center gap-3 rounded-full border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm text-slate-400 transition hover:border-brand-accent hover:bg-white sm:order-none sm:max-w-xl sm:flex-1"
            >
              <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <span className="text-left">{user.role === "learner" ? "Search courses, tests..." : "Search for pages, courses, users…"}</span>
              <kbd className="ml-auto hidden rounded border border-slate-200 px-1.5 py-0.5 text-[10px] sm:block">⌘K</kbd>
            </button>

            <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-3">
              {/* Bell — navigates to notifications page */}
              <button
                type="button"
                onClick={() => { setShowQuickAction(false); navigate(`/${user.role}/notifications`); }}
                className={`relative hidden rounded-lg p-2 transition sm:block ${location.pathname.includes("/notifications") ? "bg-brand-surface text-brand-primary" : "text-slate-500 hover:bg-slate-100 hover:text-brand-ink"}`}
              >
                <NavIcon name="bell" className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-cta text-[9px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
                {unreadCount === 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand-cta" />}
              </button>
              <>
                <button
                  type="button"
                  onClick={() => setShowQuickAction((v) => !v)}
                  className="whitespace-nowrap rounded-lg bg-brand-ink px-3 py-2 text-xs font-semibold text-white transition hover:bg-black sm:px-4 sm:text-sm"
                >
                  Quick Action
                </button>
              </>


              {/* User avatar */}
              <div className="flex items-center gap-2">
                <div className="hidden text-right md:block">
                  <p className="text-sm font-semibold leading-tight">{user.name}</p>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500">
                    {user.role === "admin" ? "Super Administrator" : user.role}
                  </p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-primary text-xs font-bold uppercase text-white ring-2 ring-white">
                  {user.name.slice(0, 2)}
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-3 py-4 sm:px-4 sm:py-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppShell;
