import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { SOCKET_URL } from "../../utils/helpers";

const socket = io(SOCKET_URL, { autoConnect: false });

const LiveRoomPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [participantCount, setParticipantCount] = useState(1);
  const [liveClass, setLiveClass] = useState(null);
  const providerRoomUrl = liveClass?.roomUrl || `https://localhost:3000/room/${roomId}`;

  useEffect(() => {
    const loadClass = async () => {
      const { data } = await api.get("/live-classes");
      setLiveClass(data.find((item) => item.roomId === roomId) || null);
    };

    loadClass().catch(() => {});

    socket.connect();
    socket.emit("join-room", { roomId });
    socket.on("room-participants", ({ count }) => setParticipantCount(count));
    socket.on("class-ended", () => toast("This class has ended."));

    return () => {
      socket.emit("leave-room", { roomId });
      socket.off("room-participants");
      socket.off("class-ended");
      socket.disconnect();
    };
  }, [roomId]);

  const endClass = async () => {
    if (!liveClass) return;
    try {
      await api.put(`/live-classes/${liveClass._id}/end`);
      toast.success("Class ended");
      navigate(`/${user.role}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to end class");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[28px] border border-white/10 bg-white/5 p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-teal-200">Live Room</p>
            <h1 className="mt-2 font-display text-4xl">{liveClass?.title || "Live Class Session"}</h1>
            <p className="mt-2 text-sm text-white/70">Participants online: {participantCount}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={providerRoomUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-2xl border border-white/20 px-4 py-3 text-sm font-medium text-white"
            >
              Open Provider
            </a>
            {(user.role === "admin" || user.role === "instructor") && liveClass?.status !== "ended" ? (
              <button className="rounded-2xl bg-rose-500 px-4 py-3 text-sm font-medium text-white" onClick={endClass}>
                End Class
              </button>
            ) : null}
          </div>
        </div>
        <div className="overflow-hidden rounded-[28px] border border-white/10 bg-black shadow-panel">
          <iframe
            title="Live Class Provider"
            src={providerRoomUrl}
            className="h-[75vh] w-full"
            allow="camera; microphone; fullscreen"
          />
        </div>
      </div>
    </div>
  );
};

export default LiveRoomPage;
