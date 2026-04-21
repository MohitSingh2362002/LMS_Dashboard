import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/client";
import useFetch from "../../hooks/useFetch";
import Loader from "../../components/Loader";
import LiveClassModal from "../../components/LiveClassModal";
import { formatDate } from "../../utils/helpers";
import { buildLiveClassJoinUrl } from "../../utils/liveClass";
import { useAuth } from "../../context/AuthContext";

const AdminLiveClassesPage = () => {
  const { user } = useAuth();
  const { data: classes, loading, refresh } = useFetch(() => api.get("/live-classes"), []);
  const { data: courses } = useFetch(() => api.get("/courses"), []);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      refresh();
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, [refresh]);

  const sortedCourses = useMemo(
    () => courses.filter((course) => course.status === "published" || course.status === "draft"),
    [courses]
  );

  const createClass = async (payload) => {
    setSaving(true);
    try {
      const { data } = await api.post("/live-classes", payload);
      toast.success("Live class created");
      setOpen(false);
      refresh();
      if (payload.isImmediate) {
        window.open(buildLiveClassJoinUrl(data, user), "_blank", "noopener,noreferrer");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to create live class");
    } finally {
      setSaving(false);
    }
  };

  const endClass = async (id) => {
    try {
      await api.put(`/live-classes/${id}/end`);
      toast.success("Class ended");
      refresh();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to end class");
    }
  };

  const deleteClass = async (id) => {
    if (!window.confirm("Delete this live class?")) return;
    try {
      await api.delete(`/live-classes/${id}`);
      toast.success("Class deleted");
      refresh();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to delete class");
    }
  };

  if (loading) return <Loader label="Loading live classes..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl">Live Classes</h2>
          <p className="mt-2 text-sm text-slate-500">Launch instant rooms or schedule sessions for later.</p>
        </div>
        <button className="rounded-2xl bg-teal-700 px-4 py-3 text-sm font-medium text-white" onClick={() => setOpen(true)}>
          Create Live Class
        </button>
      </div>
      <div className="grid gap-4">
        {classes.map((liveClass) => (
          <div key={liveClass._id} className="rounded-[28px] bg-white p-5 shadow-panel">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-display text-2xl">{liveClass.title}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {liveClass.course?.title || "Standalone session"} · {liveClass.instructor?.name}
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.24em] text-slate-400">
                  {liveClass.isImmediate ? "Started immediately" : `Scheduled ${formatDate(liveClass.scheduledAt)}`}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${liveClass.status === "live" ? "bg-emerald-100 text-emerald-700" : liveClass.status === "scheduled" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
                  {liveClass.status}
                </span>
                {liveClass.status === "live" ? (
                  <>
                    <button className="rounded-xl border px-3 py-2 text-sm" onClick={() => window.open(buildLiveClassJoinUrl(liveClass, user), "_blank", "noopener,noreferrer")}>
                      Join
                    </button>
                    <button className="rounded-xl border border-rose-200 px-3 py-2 text-sm text-rose-600" onClick={() => endClass(liveClass._id)}>
                      End Class
                    </button>
                  </>
                ) : (
                  <button className="rounded-xl border border-rose-200 px-3 py-2 text-sm text-rose-600" onClick={() => deleteClass(liveClass._id)}>
                    {liveClass.status === "scheduled" ? "Cancel" : "Delete"}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <LiveClassModal
        open={open}
        onClose={() => setOpen(false)}
        courses={sortedCourses}
        onSubmit={createClass}
        loading={saving}
      />
    </div>
  );
};

export default AdminLiveClassesPage;
