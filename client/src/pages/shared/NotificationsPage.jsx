import toast from "react-hot-toast";
import api from "../../api/client";
import EmptyState from "../../components/EmptyState";
import Loader from "../../components/Loader";
import useFetch from "../../hooks/useFetch";
import { formatDate } from "../../utils/helpers";

const NotificationsPage = () => {
  const { data: notifications, loading, refresh } = useFetch(() => api.get("/notifications"), []);

  const markAllRead = async () => {
    try {
      await api.put("/notifications/read-all");
      toast.success("Notifications marked as read");
      refresh();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to update notifications");
    }
  };

  if (loading) return <Loader label="Loading notifications..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-teal-700">Notifications</p>
          <h2 className="font-display text-3xl text-slate-900">Notification Center</h2>
          <p className="mt-2 text-sm text-slate-500">Attendance alerts and important LMS updates stay here.</p>
        </div>
        <button className="rounded-2xl bg-teal-700 px-4 py-3 text-sm font-medium text-white" onClick={markAllRead}>
          Mark All Read
        </button>
      </div>

      {!notifications.length ? (
        <EmptyState title="No notifications yet" description="Alerts will appear here as activity happens." />
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <article key={notification._id} className={`rounded-[24px] bg-white p-5 shadow-panel ${notification.isRead ? "opacity-70" : ""}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{notification.title}</p>
                  <p className="mt-2 text-sm text-slate-600">{notification.message}</p>
                  <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-400">{formatDate(notification.createdAt)}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${notification.isRead ? "bg-slate-100 text-slate-500" : "bg-teal-50 text-teal-700"}`}>
                  {notification.isRead ? "Read" : "New"}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
