import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import api from "../../api/client";
import Loader from "../../components/Loader";
import { useAuth } from "../../context/AuthContext";
import useFetch from "../../hooks/useFetch";
import { formatDate, SOCKET_URL } from "../../utils/helpers";

const Avatar = ({ name, size = "h-9 w-9", color = "bg-brand-primary" }) => (
  <div className={`flex flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${size} ${color}`}>
    {(name || "?").slice(0, 2).toUpperCase()}
  </div>
);

const AVATAR_COLORS = ["bg-brand-primary", "bg-brand-accent", "bg-emerald-500", "bg-violet-500", "bg-rose-500"];

/* ── New-chat modal for ADMIN only ──────────────────────────────── */
const AdminNewChatModal = ({ onClose, onStarted }) => {
  const { data: parents, loading } = useFetch(() => api.get("/chat/available-parents"), []);
  const [selectedParent, setSelectedParent] = useState(null);
  const [selectedLearner, setSelectedLearner] = useState("");
  const [saving, setSaving] = useState(false);

  const parentList = Array.isArray(parents) ? parents : [];

  const start = async () => {
    if (!selectedParent || !selectedLearner) { toast.error("Select a parent and learner"); return; }
    setSaving(true);
    try {
      const { data } = await api.post("/chat/conversations", {
        parent: selectedParent._id,
        learner: selectedLearner,
      });
      onStarted(data);
      onClose();
    } catch (err) { toast.error(err.response?.data?.message || "Failed to start chat"); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl border border-slate-200/70 bg-white p-6 shadow-panel">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-brand-ink">Start New Chat</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        {loading ? <Loader label="Loading parents…" /> : (
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-brand-ink">Select Parent</label>
              <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200">
                {!parentList.length && <p className="px-3 py-3 text-xs text-slate-500">No parents found</p>}
                {parentList.map((p) => (
                  <button key={p._id} onClick={() => { setSelectedParent(p); setSelectedLearner(""); }}
                    className={`flex w-full items-center gap-2.5 border-b border-slate-50 px-3 py-2.5 text-left last:border-0 transition ${selectedParent?._id === p._id ? "bg-brand-surface" : "hover:bg-slate-50"}`}>
                    <Avatar name={p.name} size="h-8 w-8" color="bg-teal-500" />
                    <div>
                      <p className="text-xs font-semibold text-brand-ink">{p.name}</p>
                      <p className="text-[10px] text-slate-500">{p.email}</p>
                    </div>
                    {selectedParent?._id === p._id && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="ml-auto h-4 w-4 text-brand-primary"><path d="M20 6L9 17l-5-5" /></svg>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {selectedParent && (
              <div>
                <label className="mb-1 block text-xs font-semibold text-brand-ink">Select Learner</label>
                <select value={selectedLearner} onChange={(e) => setSelectedLearner(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-brand-primary focus:outline-none">
                  <option value="">Choose learner…</option>
                  {(selectedParent.linkedLearners || []).map((l) => (
                    <option key={l._id} value={l._id}>{l.name}</option>
                  ))}
                </select>
              </div>
            )}

            <button onClick={start} disabled={saving || !selectedParent || !selectedLearner}
              className="w-full rounded-xl bg-brand-primary py-2.5 text-sm font-bold text-white hover:bg-brand-ink disabled:opacity-50 transition">
              {saving ? "Starting…" : "Start Conversation"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Instructor batch-filter sidebar panel ──────────────────────── */
const InstructorBatchPanel = ({ onStartChat }) => {
  const [selectedBatch, setSelectedBatch] = useState("");
  const [batchData, setBatchData] = useState(null);
  const [loading, setLoading] = useState(false);

  const { data: batches } = useFetch(() => api.get("/batches"), []);
  const batchList = Array.isArray(batches) ? batches : [];

  const fetchParents = async (batchId) => {
    if (!batchId) { setBatchData(null); return; }
    setLoading(true);
    try {
      const { data } = await api.get(`/chat/batch/${batchId}/parents`);
      setBatchData(data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load parents");
    } finally { setLoading(false); }
  };

  const handleBatchChange = (e) => {
    const id = e.target.value;
    setSelectedBatch(id);
    fetchParents(id);
  };

  const parents = batchData?.parents || [];

  return (
    <div className="border-b border-slate-100">
      {/* Batch selector */}
      <div className="px-3 pt-3 pb-2">
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Browse by Batch</p>
        <select
          value={selectedBatch}
          onChange={handleBatchChange}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 focus:border-brand-primary focus:outline-none"
        >
          <option value="">Select a batch…</option>
          {batchList.map((b) => (
            <option key={b._id} value={b._id}>{b.name}</option>
          ))}
        </select>
      </div>

      {/* Parents in selected batch */}
      {selectedBatch && (
        <div className="pb-2">
          {loading ? (
            <p className="px-4 py-2 text-xs text-slate-400">Loading parents…</p>
          ) : !parents.length ? (
            <p className="px-4 py-2 text-xs text-slate-400 italic">No parents linked to learners in this batch.</p>
          ) : (
            parents.map((parent) => (
              <div key={parent._id} className="border-t border-slate-50">
                {/* Show one row per linked learner in this batch */}
                {(parent.linkedLearners || []).map((learner) => (
                  <button
                    key={`${parent._id}-${learner._id}`}
                    onClick={() => onStartChat({ parent, learner })}
                    className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left hover:bg-slate-50 transition"
                  >
                    <Avatar name={parent.name} size="h-8 w-8" color="bg-teal-500" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-brand-ink">{parent.name}</p>
                      <p className="text-[10px] text-slate-500">
                        <span className="text-brand-primary font-medium">{learner.name}</span>
                      </p>
                    </div>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                      className="h-3.5 w-3.5 shrink-0 text-slate-300">
                      <path d="M21 15a4 4 0 0 1-4 4H8l-5 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8z" />
                    </svg>
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

/* ── Main page ──────────────────────────────────────────────────── */
const ParentTeacherChatPage = () => {
  const { user } = useAuth();
  const [activeConversation, setActiveConversation] = useState("");
  const [message, setMessage] = useState("");
  const [socket, setSocket] = useState(null);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const messagesEndRef = useRef(null);

  // For parent: fetch their allowed teacher contacts (batch-assigned teachers only)
  const { data: contacts } = useFetch(
    () => (user.role === "parent" ? api.get("/chat/contacts") : Promise.resolve({ data: { links: [] } })),
    [user.role]
  );
  const { data: conversations, loading: lc, refresh: refreshConversations, setData: setConversations } = useFetch(
    () => api.get("/chat/conversations"), []
  );
  const { data: messages, setData: setMessages, loading: lm } = useFetch(
    () => (activeConversation ? api.get(`/chat/conversations/${activeConversation}/messages`) : Promise.resolve({ data: [] })),
    [activeConversation]
  );

  const active = useMemo(() => conversations.find((c) => c._id === activeConversation), [conversations, activeConversation]);
  const contactLinks = contacts?.links || [];

  useEffect(() => {
    const s = io(SOCKET_URL, { transports: ["websocket", "polling"] });
    setSocket(s);
    return () => s.disconnect();
  }, []);

  useEffect(() => {
    if (!socket || !activeConversation) return undefined;
    socket.emit("join-conversation", { conversationId: activeConversation });
    const handler = (incoming) => {
      if (String(incoming.conversation) !== String(activeConversation)) return;
      setMessages((cur) => cur.some((m) => m._id === incoming._id) ? cur : [...cur, incoming]);
    };
    socket.on("chat:message", handler);
    return () => socket.off("chat:message", handler);
  }, [socket, activeConversation, setMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const convList = Array.isArray(conversations) ? conversations : [];

  // Parent: teachers without an existing conversation (batch-assigned only)
  const teacherIdsWithConv = new Set(convList.map((c) => String(c.teacher?._id)).filter(Boolean));
  const newContacts = contactLinks.filter((link) => !teacherIdsWithConv.has(String(link.teacher?._id)));

  const startConversationFromLink = async (link) => {
    try {
      const { data } = await api.post("/chat/conversations", { learner: link.learner._id, teacher: link.teacher._id });
      await refreshConversations();
      setActiveConversation(data._id);
    } catch (err) { toast.error(err.response?.data?.message || "Unable to start chat"); }
  };

  // Instructor: start or open chat with a parent from batch-filter panel
  const startConversationFromBatch = async ({ parent, learner }) => {
    try {
      const { data } = await api.post("/chat/conversations", { parent: parent._id, learner: learner._id });
      setConversations((prev) => {
        const arr = Array.isArray(prev) ? prev : [];
        return arr.some((c) => c._id === data._id) ? arr : [data, ...arr];
      });
      setActiveConversation(data._id);
    } catch (err) { toast.error(err.response?.data?.message || "Unable to start chat"); }
  };

  const handleNewChatStarted = (conv) => {
    setConversations((prev) => {
      const arr = Array.isArray(prev) ? prev : [];
      return arr.some((c) => c._id === conv._id) ? arr : [conv, ...arr];
    });
    setActiveConversation(conv._id);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !activeConversation) return;
    try {
      await api.post(`/chat/conversations/${activeConversation}/messages`, { body: message });
      setMessage("");
      refreshConversations();
    } catch (err) { toast.error(err.response?.data?.message || "Send failed"); }
  };

  if (lc) return <Loader label="Loading chat..." />;

  const isAdmin = user.role === "admin";
  const isInstructor = user.role === "instructor";
  const isAdminOrInstructor = isAdmin || isInstructor;

  const getOtherPerson = (conv) => {
    if (user.role === "parent") return conv.teacher;
    return conv.parent;
  };

  return (
    <>
      {showAdminModal && (
        <AdminNewChatModal
          onClose={() => setShowAdminModal(false)}
          onStarted={handleNewChatStarted}
        />
      )}

      <div className="flex h-[calc(100vh-104px)] overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-card">
        {/* ── Sidebar ── */}
        <aside className="flex w-72 flex-shrink-0 flex-col border-r border-slate-100 overflow-hidden">
          {/* Header */}
          <div className="flex-shrink-0 border-b border-slate-100 px-4 py-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-brand-ink">
                {isAdminOrInstructor ? "Parent Chats" : "Teacher Chats"}
              </p>
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-brand-primary px-2 py-0.5 text-[10px] font-bold text-white">
                  {convList.length}
                </span>
                {/* Admin-only: start new chat button */}
                {isAdmin && (
                  <button onClick={() => setShowAdminModal(true)}
                    title="Start new chat with parent"
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-surface text-brand-primary hover:bg-brand-primary hover:text-white transition">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-3.5 w-3.5"><path d="M12 5v14M5 12h14" /></svg>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Instructor: batch-filter panel */}
            {isInstructor && (
              <InstructorBatchPanel onStartChat={startConversationFromBatch} />
            )}

            {/* Parent: "Start Chat with Teacher" (batch-assigned only, no existing conv) */}
            {user.role === "parent" && newContacts.length > 0 && (
              <div className="border-b border-slate-100 px-3 py-2">
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Start Chat with Teacher
                </p>
                {newContacts.map((link) => (
                  <button key={`${link.learner._id}-${link.teacher._id}`}
                    onClick={() => startConversationFromLink(link)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left hover:bg-slate-50 transition">
                    <Avatar name={link.teacher.name} size="h-8 w-8" color="bg-brand-accent" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-brand-ink">{link.teacher.name}</p>
                      <p className="text-[10px] text-slate-500">{link.learner.name}</p>
                    </div>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                      className="h-3.5 w-3.5 shrink-0 text-slate-300">
                      <path d="M21 15a4 4 0 0 1-4 4H8l-5 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8z" />
                    </svg>
                  </button>
                ))}
              </div>
            )}

            {/* Conversations list */}
            {convList.length > 0 && (
              <div>
                {isInstructor && (
                  <p className="px-4 pt-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Your Conversations
                  </p>
                )}
                {convList.map((conv, i) => {
                  const other = getOtherPerson(conv);
                  const isActive = activeConversation === conv._id;
                  const unread = conv.unread || 0;
                  return (
                    <button key={conv._id} onClick={() => setActiveConversation(conv._id)}
                      className={`flex w-full items-start gap-3 border-b border-slate-50 px-4 py-3 text-left transition last:border-0 ${isActive ? "bg-brand-surface" : "hover:bg-slate-50"}`}>
                      <Avatar name={other?.name} size="h-9 w-9" color={AVATAR_COLORS[i % AVATAR_COLORS.length]} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-1">
                          <p className={`truncate text-sm font-semibold ${isActive ? "text-brand-primary" : "text-brand-ink"}`}>
                            {other?.name || "—"}
                          </p>
                          {unread > 0 && (
                            <span className="flex-shrink-0 rounded-full bg-brand-cta px-1.5 py-0.5 text-[9px] font-bold text-white">{unread}</span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500">
                          {conv.learner?.name}
                          {conv.batch?.name ? ` · ${conv.batch.name}` : ""}
                        </p>
                        {conv.lastMessage && (
                          <p className="mt-0.5 truncate text-xs text-slate-400">{conv.lastMessage}</p>
                        )}
                        <p className="mt-0.5 text-[9px] text-slate-400">{formatDate(conv.updatedAt)}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Empty state */}
            {convList.length === 0 && !isInstructor && (
              <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-10 w-10 text-slate-300">
                  <path d="M21 15a4 4 0 01-4 4H8l-5 4V7a4 4 0 014-4h10a4 4 0 014 4v8z" />
                </svg>
                <p className="text-xs text-slate-400">
                  {isAdmin ? "No parent chats yet. Click + to start one." : "No conversations yet"}
                </p>
              </div>
            )}
          </div>

          {/* Bottom user info */}
          <div className="flex-shrink-0 border-t border-slate-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <Avatar name={user.name} size="h-8 w-8" color="bg-brand-primary" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-brand-ink">{user.name}</p>
                <p className="truncate text-[10px] capitalize text-slate-500">{user.role}</p>
              </div>
            </div>
          </div>
        </aside>

        {/* ── Chat area ── */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {!activeConversation ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-surface text-brand-primary">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8">
                  <path d="M21 15a4 4 0 01-4 4H8l-5 4V7a4 4 0 014-4h10a4 4 0 014 4v8z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-brand-ink">Select a conversation</p>
              <p className="text-xs text-slate-400">
                {isInstructor
                  ? "Select a batch, then click a parent to start chatting"
                  : isAdmin
                  ? "Pick a parent chat or click + to start a new one"
                  : "Choose a chat from the left panel"}
              </p>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
                <div className="flex items-center gap-3">
                  <Avatar name={getOtherPerson(active)?.name} color="bg-brand-accent" />
                  <div>
                    <p className="text-sm font-bold text-brand-ink">{getOtherPerson(active)?.name}</p>
                    <p className="text-xs text-slate-500">
                      {active?.learner?.name}
                      {active?.batch?.name ? ` · Batch ${active.batch.name}` : ""}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 space-y-4 overflow-y-auto p-5">
                {lm ? <Loader label="Loading messages..." /> : (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 border-t border-slate-100" />
                      <span className="text-[10px] font-semibold uppercase text-slate-400">Conversation</span>
                      <div className="flex-1 border-t border-slate-100" />
                    </div>

                    {Array.isArray(messages) && messages.map((msg) => {
                      const mine = String(msg.sender?._id) === String(user._id);
                      const senderLabel = !mine ? (msg.sender?.role?.toUpperCase() + " · " + msg.sender?.name) : null;
                      return (
                        <div key={msg._id} className={`flex gap-3 ${mine ? "justify-end" : "justify-start"}`}>
                          {!mine && <Avatar name={msg.sender?.name} size="h-8 w-8" color="bg-brand-accent" />}
                          <div className={`max-w-[72%] space-y-1 flex flex-col ${mine ? "items-end" : "items-start"}`}>
                            {senderLabel && (
                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{senderLabel}</p>
                            )}
                            <div className={`rounded-2xl px-4 py-2.5 ${mine ? "bg-brand-primary text-white" : "bg-slate-100 text-brand-ink"}`}>
                              <p className="text-sm leading-relaxed">{msg.body}</p>
                            </div>
                            <p className="text-[10px] text-slate-400">{formatDate(msg.createdAt)}</p>
                          </div>
                          {mine && <Avatar name={user.name} size="h-8 w-8" color="bg-brand-primary" />}
                        </div>
                      );
                    })}

                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input */}
              <form onSubmit={sendMessage} className="border-t border-slate-100 px-4 py-3">
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <input value={message} onChange={(e) => setMessage(e.target.value)}
                    placeholder={`Message ${getOtherPerson(active)?.name || ""}…`}
                    className="flex-1 bg-transparent text-sm placeholder:text-slate-400 focus:outline-none" />
                  <button type="submit"
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-cta text-white hover:brightness-95">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4">
                      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                    </svg>
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default ParentTeacherChatPage;
