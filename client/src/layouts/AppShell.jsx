import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { navigationByRole } from "../data/navigation";
import { classNames } from "../utils/helpers";

const AppShell = () => {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navItems = navigationByRole[user.role] || [];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(13,148,136,0.12),_transparent_32%),linear-gradient(180deg,#f8fafc_0%,#eef6ff_100%)] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside
          className={classNames(
            "fixed inset-y-0 left-0 z-40 w-72 border-r border-slate-200 bg-white/90 p-6 shadow-panel backdrop-blur transition-transform lg:static lg:translate-x-0",
            open ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="mb-8">
            <p className="font-display text-2xl text-teal-800">LMS Studio</p>
            <p className="mt-2 text-sm text-slate-500">Role-based learning operations platform</p>
          </div>
          <nav className="space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to.split("/").length === 2}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  classNames(
                    "block rounded-2xl px-4 py-3 text-sm font-medium transition",
                    isActive
                      ? "bg-teal-700 text-white"
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
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm lg:hidden"
                onClick={() => setOpen((value) => !value)}
              >
                Menu
              </button>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-teal-700">{user.role}</p>
                <h1 className="font-display text-2xl text-slate-900">Welcome back, {user.name}</h1>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-semibold">{user.email}</p>
                  <p className="text-xs text-slate-500">Signed in</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-teal-700 text-sm font-bold uppercase text-white">
                  {user.name.slice(0, 2)}
                </div>
                <button
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white"
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
