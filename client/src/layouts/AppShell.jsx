import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { NavLink, Outlet } from "react-router-dom";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import { navigationByRole } from "../data/navigation";
import { classNames, SOCKET_URL } from "../utils/helpers";

const AppShell = () => {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navItems = navigationByRole[user.role] || [];

  useEffect(() => {
    if (!user?._id) return undefined;

    const socket = io(SOCKET_URL, { transports: ["websocket", "polling"] });
    socket.emit("join-user", { userId: user._id });
    socket.on("notification:new", (notification) => {
      toast(notification.message, { icon: "!" });

      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(notification.title, { body: notification.message });
      }
    });

    return () => socket.disconnect();
  }, [user?._id]);

  // Close sidebar on Escape key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      await Notification.requestPermission();
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(13,148,136,0.12),_transparent_32%),linear-gradient(180deg,#f8fafc_0%,#eef6ff_100%)] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        {/* Backdrop overlay for mobile */}
        {open ? (
          <div
            className="sidebar-backdrop lg:hidden"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
        ) : null}

        <aside
          className={classNames(
            "fixed inset-y-0 left-0 z-40 w-72 border-r border-slate-200 bg-white/95 p-6 shadow-panel backdrop-blur-lg transition-transform duration-300 ease-out lg:static lg:translate-x-0",
            open ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="mb-8">
            <p className="font-display text-2xl text-teal-800">LMS Studio</p>
            <p className="mt-2 text-sm text-slate-500">Role-based learning operations platform</p>
          </div>
          <nav className="space-y-1 overflow-y-auto" style={{ maxHeight: "calc(100vh - 140px)" }}>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to.split("/").length === 2}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  classNames(
                    "block rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-teal-700 text-white shadow-md"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col lg:ml-0">
          <header className="sticky top-0 z-30 border-b border-white/50 bg-white/70 px-4 py-4 backdrop-blur lg:px-8">
            <div className="flex items-center justify-between gap-4">
              <button
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm transition hover:bg-slate-50 lg:hidden"
                onClick={() => setOpen((value) => !value)}
              >
                ☰ Menu
              </button>
              <div className="hidden sm:block">
                <p className="text-xs uppercase tracking-[0.3em] text-teal-700">{user.role}</p>
                <h1 className="font-display text-2xl text-slate-900">Welcome back, {user.name}</h1>
              </div>
              <p className="font-display text-lg text-slate-900 sm:hidden">LMS Studio</p>
              <div className="flex items-center gap-3">
                <div className="hidden text-right md:block">
                  <p className="text-sm font-semibold">{user.email}</p>
                  <p className="text-xs text-slate-500">Signed in</p>
                </div>
                <button
                  className="hidden rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium transition hover:bg-slate-50 sm:block"
                  onClick={requestNotificationPermission}
                >
                  🔔 Alerts
                </button>
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-teal-700 text-sm font-bold uppercase text-white">
                  {user.name.slice(0, 2)}
                </div>
                <button
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                  onClick={logout}
                >
                  Logout
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default AppShell;
