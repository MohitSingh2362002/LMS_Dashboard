import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import api from "../../api/client";
import EmptyState from "../../components/EmptyState";
import Loader from "../../components/Loader";
import { useAuth } from "../../context/AuthContext";
import useFetch from "../../hooks/useFetch";
import { formatDate, SOCKET_URL } from "../../utils/helpers";

const ParentTeacherChatPage = () => {
  const { user } = useAuth();
  const [activeConversation, setActiveConversation] = useState("");
  const [message, setMessage] = useState("");
  const [socket, setSocket] = useState(null);
  const { data: contacts, loading: loadingContacts } = useFetch(
    () => (user.role === "parent" ? api.get("/chat/contacts") : Promise.resolve({ data: { links: [] } })),
    [user.role]
  );
  const { data: conversations, loading: loadingConversations, refresh: refreshConversations } = useFetch(
    () => api.get("/chat/conversations"),
    []
  );
  const { data: messages, setData: setMessages, loading: loadingMessages, refresh: refreshMessages } = useFetch(
    () => (activeConversation ? api.get(`/chat/conversations/${activeConversation}/messages`) : Promise.resolve({ data: [] })),
    [activeConversation]
  );

  const active = useMemo(
    () => conversations.find((conversation) => conversation._id === activeConversation),
    [conversations, activeConversation]
  );
  const contactLinks = contacts.links || [];

  useEffect(() => {
    const nextSocket = io(SOCKET_URL, { transports: ["websocket", "polling"] });
    setSocket(nextSocket);
    return () => nextSocket.disconnect();
  }, []);

  useEffect(() => {
    if (!socket || !activeConversation) return undefined;
    socket.emit("join-conversation", { conversationId: activeConversation });
    const onMessage = (incoming) => {
      if (String(incoming.conversation) !== String(activeConversation)) return;
      setMessages((current) => {
        if (current.some((item) => item._id === incoming._id)) return current;
        return [...current, incoming];
      });
    };
    socket.on("chat:message", onMessage);
    return () => socket.off("chat:message", onMessage);
  }, [socket, activeConversation, setMessages]);

  const startConversation = async (link) => {
    try {
      const { data } = await api.post("/chat/conversations", {
        learner: link.learner._id,
        teacher: link.teacher._id
      });
      await refreshConversations();
      setActiveConversation(data._id);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to start chat");
    }
  };

  const sendMessage = async (event) => {
    event.preventDefault();
    if (!message.trim() || !activeConversation) return;
    try {
      await api.post(`/chat/conversations/${activeConversation}/messages`, { body: message });
      setMessage("");
      refreshConversations();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to send message");
    }
  };

  if (loadingContacts || loadingConversations) return <Loader label="Loading chat..." />;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-teal-700">Communication</p>
        <h2 className="font-display text-3xl text-slate-900">Parent-Teacher Chat</h2>
        <p className="mt-2 text-sm text-slate-500">Direct communication between parents and assigned teachers or batch mentors.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px,1fr]">
        <aside className="space-y-6">
          {user.role === "parent" ? (
            <section className="rounded-[28px] bg-white p-5 shadow-panel">
              <h3 className="font-display text-xl">Assigned Teachers</h3>
              <div className="mt-4 space-y-3">
                {contactLinks.map((link) => (
                  <button
                    key={`${link.learner._id}-${link.teacher._id}`}
                    className="w-full rounded-2xl border border-slate-100 p-4 text-left hover:bg-slate-50"
                    onClick={() => startConversation(link)}
                  >
                    <p className="font-semibold text-slate-900">{link.teacher.name}</p>
                    <p className="mt-1 text-sm text-slate-500">{link.learner.name} · {link.source}</p>
                  </button>
                ))}
                {!contactLinks.length ? <p className="text-sm text-slate-500">No assigned teachers found for linked learners.</p> : null}
              </div>
            </section>
          ) : null}

          <section className="rounded-[28px] bg-white p-5 shadow-panel">
            <h3 className="font-display text-xl">Conversations</h3>
            <div className="mt-4 space-y-3">
              {conversations.map((conversation) => {
                const other = user.role === "parent" ? conversation.teacher : conversation.parent;
                return (
                  <button
                    key={conversation._id}
                    className={`w-full rounded-2xl border p-4 text-left ${activeConversation === conversation._id ? "border-teal-600 bg-teal-50" : "border-slate-100 hover:bg-slate-50"}`}
                    onClick={() => setActiveConversation(conversation._id)}
                  >
                    <p className="font-semibold text-slate-900">{other?.name}</p>
                    <p className="mt-1 text-sm text-slate-500">{conversation.learner?.name} · {conversation.batch?.name || conversation.course?.title || "General"}</p>
                    {conversation.lastMessage ? <p className="mt-2 truncate text-sm text-slate-500">{conversation.lastMessage}</p> : null}
                  </button>
                );
              })}
              {!conversations.length ? <p className="text-sm text-slate-500">No conversations yet.</p> : null}
            </div>
          </section>
        </aside>

        <section className="flex min-h-[620px] flex-col rounded-[28px] bg-white shadow-panel">
          {!activeConversation ? (
            <div className="flex flex-1 items-center justify-center p-8">
              <EmptyState title="Select a conversation" description="Choose an existing conversation or start one from assigned teachers." />
            </div>
          ) : (
            <>
              <div className="border-b border-slate-100 p-5">
                <p className="font-semibold text-slate-900">
                  {user.role === "parent" ? active?.teacher?.name : active?.parent?.name}
                </p>
                <p className="mt-1 text-sm text-slate-500">{active?.learner?.name} · {active?.batch?.name || active?.course?.title || "General"}</p>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto p-5">
                {loadingMessages ? (
                  <Loader label="Loading messages..." />
                ) : (
                  messages.map((item) => {
                    const mine = String(item.sender?._id) === String(user._id);
                    const senderRole =
                      user.role === "admin"
                        ? String(item.sender?._id) === String(active?.parent?._id)
                          ? "Parent"
                          : String(item.sender?._id) === String(active?.teacher?._id)
                            ? "Instructor"
                            : item.sender?.role || "Sender"
                        : "";
                    return (
                      <div key={item._id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[78%] rounded-3xl p-4 ${mine ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-800"}`}>
                          {user.role === "admin" ? (
                            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                              {senderRole} · {item.sender?.name || "Unknown"}
                            </p>
                          ) : null}
                          <p className="text-sm">{item.body}</p>
                          <p className={`mt-2 text-[11px] ${mine ? "text-white/70" : "text-slate-400"}`}>{formatDate(item.createdAt)}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <form className="border-t border-slate-100 p-5" onSubmit={sendMessage}>
                <div className="flex gap-3">
                  <input
                    className="min-w-0 flex-1 rounded-2xl border border-slate-200 px-4 py-3"
                    placeholder="Type message"
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                  />
                  <button className="rounded-2xl bg-teal-700 px-5 py-3 text-sm font-medium text-white">Send</button>
                </div>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default ParentTeacherChatPage;
