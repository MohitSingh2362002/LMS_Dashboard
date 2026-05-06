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

const ParentTeacherChatPage = () => {
  const { user } = useAuth();
  const [activeConversation, setActiveConversation] = useState("");
  const [message, setMessage] = useState("");
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);

  const { data: contacts } = useFetch(
    () => (user.role === "parent" ? api.get("/chat/contacts") : Promise.resolve({ data: { links: [] } })),
    [user.role]
  );
  const { data: conversations, loading: lc, refresh: refreshConversations } = useFetch(() => api.get("/chat/conversations"), []);
  const { data: messages, setData: setMessages, loading: lm } = useFetch(
    () => (activeConversation ? api.get(`/chat/conversations/${activeConversation}/messages`) : Promise.resolve({ data: [] })),
    [activeConversation]
  );

  const active = useMemo(() => conversations.find((c) => c._id === activeConversation), [conversations, activeConversation]);
  const contactLinks = contacts.links || [];

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

  const startConversation = async (link) => {
    try {
      const { data } = await api.post("/chat/conversations", { learner: link.learner._id, teacher: link.teacher._id });
      await refreshConversations();
      setActiveConversation(data._id);
    } catch (err) { toast.error(err.response?.data?.message || "Unable to start chat"); }
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

  const convList = Array.isArray(conversations) ? conversations : [];

  return (
    <div className="flex h-[calc(100vh-104px)] overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-card">
      {/* Sidebar */}
      <aside className="flex w-72 flex-shrink-0 flex-col border-r border-slate-100">
        {/* Sidebar header */}
        <div className="border-b border-slate-100 px-4 py-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-brand-ink">Active Chats</p>
            <span className="rounded-md bg-brand-primary px-2 py-0.5 text-[10px] font-bold text-white">
              {convList.length} Active
            </span>
          </div>
        </div>

        {/* Contacts (parent only) */}
        {user.role === "parent" && contactLinks.length > 0 ? (
          <div className="border-b border-slate-100 px-3 py-2">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Assigned Teachers</p>
            {contactLinks.map((link) => (
              <button key={`${link.learner._id}-${link.teacher._id}`}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs hover:bg-slate-50"
                onClick={() => startConversation(link)}>
                <Avatar name={link.teacher.name} size="h-7 w-7" color="bg-brand-accent" />
                <div>
                  <p className="font-semibold text-brand-ink">{link.teacher.name}</p>
                  <p className="text-slate-500">{link.learner.name}</p>
                </div>
              </button>
            ))}
          </div>
        ) : null}

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {convList.length === 0 ? (
            <p className="px-4 py-6 text-center text-xs text-slate-400">No conversations yet</p>
          ) : (
            convList.map((conv, i) => {
              const other = user.role === "parent" ? conv.teacher : conv.parent;
              const isActive = activeConversation === conv._id;
              const unread = conv.unread || 0;
              return (
                <button key={conv._id} onClick={() => setActiveConversation(conv._id)}
                  className={`flex w-full items-start gap-3 border-b border-slate-50 px-4 py-3 text-left transition last:border-0 ${isActive ? "bg-brand-surface" : "hover:bg-slate-50"}`}>
                  <Avatar name={other?.name} size="h-9 w-9" color={AVATAR_COLORS[i % AVATAR_COLORS.length]} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-1">
                      <p className={`truncate text-sm font-semibold ${isActive ? "text-brand-primary" : "text-brand-ink"}`}>{other?.name || "—"}</p>
                      {unread > 0 ? <span className="flex-shrink-0 rounded-full bg-brand-cta px-1.5 py-0.5 text-[9px] font-bold text-white">{unread}</span> : null}
                    </div>
                    <p className="text-[10px] text-slate-500">{conv.learner?.name} • Batch {conv.batch?.name || "—"}</p>
                    {conv.lastMessage ? (
                      <p className="mt-0.5 truncate text-xs text-slate-400">{conv.lastMessage}</p>
                    ) : null}
                    <p className="mt-0.5 text-[9px] text-slate-400">{formatDate(conv.updatedAt)}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Bottom user info */}
        <div className="border-t border-slate-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <Avatar name={user.name} size="h-8 w-8" color="bg-brand-primary" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-brand-ink">{user.name}</p>
              <p className="truncate text-[10px] text-slate-500">{user.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Chat area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {!activeConversation ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-surface text-brand-primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8"><path d="M21 15a4 4 0 01-4 4H8l-5 4V7a4 4 0 014-4h10a4 4 0 014 4v8z" /></svg>
            </div>
            <p className="text-sm font-semibold text-brand-ink">Select a conversation</p>
            <p className="text-xs text-slate-400">Choose a chat from the left panel</p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
              <div className="flex items-center gap-3">
                <Avatar name={user.role === "parent" ? active?.teacher?.name : active?.parent?.name}
                  color="bg-brand-accent" />
                <div>
                  <p className="text-sm font-bold text-brand-ink">
                    {user.role === "parent" ? active?.teacher?.name : active?.parent?.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {active?.learner?.name} • Batch {active?.batch?.name || "—"}
                  </p>
                </div>
              </div>
              <button className="rounded p-1.5 text-slate-400 hover:bg-slate-100">⋮</button>
            </div>

            {/* Messages */}
            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              {lm ? (
                <Loader label="Loading messages..." />
              ) : (
                <>
                  {/* Date divider */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 border-t border-slate-100" />
                    <span className="text-[10px] font-semibold uppercase text-slate-400">Yesterday</span>
                    <div className="flex-1 border-t border-slate-100" />
                  </div>

                  {Array.isArray(messages) && messages.map((msg) => {
                    const mine = String(msg.sender?._id) === String(user._id);
                    const senderRole = !mine ? (
                      String(msg.sender?._id) === String(active?.parent?._id) ? "PARENT" : "INSTRUCTOR"
                    ) : null;

                    return (
                      <div key={msg._id} className={`flex gap-3 ${mine ? "justify-end" : "justify-start"}`}>
                        {!mine ? <Avatar name={msg.sender?.name} size="h-8 w-8" color="bg-brand-accent" /> : null}
                        <div className={`max-w-[72%] space-y-1 ${mine ? "items-end" : "items-start"} flex flex-col`}>
                          {senderRole ? (
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              {senderRole} · {msg.sender?.name}
                            </p>
                          ) : null}
                          {msg.image ? (
                            <div className="overflow-hidden rounded-2xl border border-slate-200">
                              <img src={msg.image} alt="attachment" className="max-w-[280px] object-cover" />
                            </div>
                          ) : null}
                          <div className={`rounded-2xl px-4 py-2.5 ${mine ? "bg-brand-primary text-white" : "bg-slate-100 text-brand-ink"}`}>
                            <p className="text-sm leading-relaxed">{msg.body}</p>
                          </div>
                          <p className="text-[10px] text-slate-400">{formatDate(msg.createdAt)}</p>
                        </div>
                        {mine ? <Avatar name={user.name} size="h-8 w-8" color="bg-brand-primary" /> : null}
                      </div>
                    );
                  })}

                  {/* Today divider */}
                  {messages.length > 0 ? (
                    <div className="flex items-center gap-3">
                      <div className="flex-1 border-t border-slate-100" />
                      <span className="text-[10px] font-semibold uppercase text-slate-400">Today</span>
                      <div className="flex-1 border-t border-slate-100" />
                    </div>
                  ) : null}

                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} className="border-t border-slate-100 px-4 py-3">
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <input value={message} onChange={(e) => setMessage(e.target.value)}
                  placeholder={`Type your message to ${user.role === "parent" ? active?.teacher?.name : active?.parent?.name}...`}
                  className="flex-1 bg-transparent text-sm placeholder:text-slate-400 focus:outline-none" />
                <button type="submit"
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-cta text-white hover:brightness-95">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ParentTeacherChatPage;
