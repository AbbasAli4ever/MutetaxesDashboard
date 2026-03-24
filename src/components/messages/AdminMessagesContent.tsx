"use client";
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  LuPaperclip,
  LuSearch,
  LuSend,
  LuEllipsisVertical,
  LuPlus,
  LuArrowLeft,
  LuX,
  LuLoader,
  LuUserCheck,
  LuInfo,
} from "react-icons/lu";
import { LiaCheckDoubleSolid } from "react-icons/lia";
import { useAuth } from "@/context/AuthContext";
import { authFetch, API_BASE_URL } from "@/lib/auth";
import { useChat } from "@/hooks/useChat";
import { usePermissions } from "@/hooks/usePermissions";
import type {
  ApiConversationSummary,
  ApiConversationDetail,
  ApiMessage,
  ApiConversation,
} from "@/types/chat";

interface AdminUser {
  id: number;
  name: string;
  email: string;
}

interface ClientUser {
  id: number;
  name: string;
  email: string;
}

// ── Helpers ─────────────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  "bg-brand-500",
  "bg-purple-500",
  "bg-teal-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-rose-500",
  "bg-emerald-500",
];

const getAvatarColor = (id: number) => AVATAR_COLORS[id % AVATAR_COLORS.length];
const getInitial = (name: string) => (name ?? "?").charAt(0).toUpperCase();

const formatMsgTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

const formatMsgDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const formatConvDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

// ── Component ───────────────────────────────────────────────────────────────────
const AdminMessagesContent: React.FC = () => {
  const { user, getToken, logout } = useAuth();
  const { can } = usePermissions();
  const canAssign = can('MESSAGES', 'UPDATE');

  // Conversation list
  const [conversations, setConversations] = useState<ApiConversationSummary[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  // Active conversation
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeDetail, setActiveDetail] = useState<ApiConversationDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Pagination
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Admin users (for assign dropdowns)
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  // Client users (for new conversation dropdown)
  const [clientUsers, setClientUsers] = useState<ClientUser[]>([]);

  // UI state
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [showChatView, setShowChatView] = useState(false);
  const [showNewConvModal, setShowNewConvModal] = useState(false);
  const [newConvForm, setNewConvForm] = useState({ clientId: "", assignedToId: "" });
  const [submittingConv, setSubmittingConv] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [toast, setToast] = useState<{ id: number; variant: "success" | "info"; title: string; description?: string } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => {
      setToast(current => (current?.id === toast.id ? null : current));
    }, 4200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  // Ref so onAnyNewMessage always reads the latest activeId without being a dep
  const activeIdRef = useRef<string | null>(null);
  useEffect(() => { activeIdRef.current = activeId; }, [activeId]);

  // Socket callbacks
  const handleConversationUpdated = useCallback((updatedConv: ApiConversation) => {
    setConversations(prev =>
      prev.map(c => c.id === updatedConv.id ? { ...c, ...updatedConv } : c)
    );
    setActiveDetail(prev =>
      prev?.id === updatedConv.id ? { ...prev, ...updatedConv } : prev
    );
  }, []);

  const handleMessagesRead = useCallback((convId: string, readByUserId: number) => {
    if (readByUserId === user?.id) {
      setConversations(prev =>
        prev.map(c => c.id === convId ? { ...c, unreadCount: 0 } : c)
      );
    }
  }, [user?.id]);

  const handleNewConversation = useCallback((conv: ApiConversationSummary) => {
    setConversations(prev => {
      if (prev.some(c => c.id === conv.id)) return prev;
      return [conv, ...prev];
    });
  }, []);

  // Fires for every new_message from any joined room — updates the conversation list in real-time
  const handleAnyNewMessage = useCallback((msg: ApiMessage) => {
    setConversations(prev => prev.map(c => {
      if (c.id !== msg.conversationId) return c;
      return {
        ...c,
        lastMessage: {
          body: msg.body,
          createdAt: msg.createdAt,
          senderId: msg.senderId,
          senderType: msg.senderType,
        },
        // Only increment unread if this isn't the conversation the admin is actively viewing
        unreadCount: c.id === activeIdRef.current ? 0 : c.unreadCount + 1,
      };
    }));
  }, []);

  // All conversation IDs to watch so the socket joins their rooms on load
  const watchConversationIds = useMemo(
    () => conversations.map(c => c.id),
    [conversations]
  );

  const { messages, setMessages, typingUsers, sendMessage, handleTyping, markRead } = useChat(
    activeId,
    getToken,
    logout,
    handleConversationUpdated,
    handleMessagesRead,
    handleNewConversation,
    handleAnyNewMessage,
    watchConversationIds,
  );

  // Load conversation list
  useEffect(() => {
    (async () => {
      setLoadingList(true);
      try {
        const res = await authFetch(`${API_BASE_URL}/api/v1/conversations`);
        if (res.ok) {
          const data = await res.json();
          setConversations(data.conversations ?? []);
        }
      } catch (err) {
        console.error("Failed to load conversations", err);
      } finally {
        setLoadingList(false);
      }
    })();
  }, []);

  // Load admin users + clients for dropdowns (both come from /users, filtered by type)
  useEffect(() => {
    (async () => {
      try {
        const res = await authFetch(`${API_BASE_URL}/users`);
        if (res.ok) {
          const data = await res.json();
          const all: Array<{ id: number; name: string; email: string; type: string }> = data.users ?? [];
          setAdminUsers(all.filter(u => u.type === "ADMIN"));
          setClientUsers(all.filter(u => u.type === "CUSTOMER"));
        }
      } catch (err) {
        console.error("Failed to load dropdown users", err);
      }
    })();
  }, []);

  // Mark as read after detail loads
  useEffect(() => {
    if (activeId && !loadingDetail && messages.length > 0) {
      markRead();
    }
  }, [activeId, loadingDetail]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll to bottom on new messages
  useEffect(() => {
    if (!loadingMore) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, activeId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close menu on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSelectConversation = async (id: string) => {
    if (id === activeId) {
      setShowChatView(true);
      return;
    }
    setActiveId(id);
    setShowChatView(true);
    setLoadingDetail(true);
    setMessages([]);
    setActiveDetail(null);
    setHasMore(false);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/v1/conversations/${id}`);
      if (res.ok) {
        const data = await res.json();
        const detail: ApiConversationDetail = data.conversation;
        setActiveDetail(detail);
        setMessages(detail.messages ?? []);
        setHasMore((detail.messages?.length ?? 0) >= 30);
        setConversations(prev =>
          prev.map(c => c.id === id ? { ...c, unreadCount: 0 } : c)
        );
      }
    } catch (err) {
      console.error("Failed to load conversation detail", err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const loadOlderMessages = useCallback(async () => {
    if (!activeId || !hasMore || loadingMore || messages.length === 0) return;
    const oldestId = messages[0].id;
    setLoadingMore(true);
    try {
      const res = await authFetch(
        `${API_BASE_URL}/api/v1/conversations/${activeId}/messages?before=${oldestId}&limit=30`
      );
      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...(data.messages ?? []), ...prev]);
        setHasMore(data.hasMore ?? false);
      }
    } catch (err) {
      console.error("Failed to load older messages", err);
    } finally {
      setLoadingMore(false);
    }
  }, [activeId, hasMore, loadingMore, messages, setMessages]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (e.currentTarget.scrollTop < 60) {
      loadOlderMessages();
    }
  }, [loadOlderMessages]);

  const doSend = () => {
    const trimmed = messageInput.trim();
    if (!trimmed) return;
    sendMessage(trimmed);
    setMessageInput("");
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    doSend();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      doSend();
    }
  };

  const patchConversationAssignment = async (convId: string, assignedToId: number | null) => {
    const res = await authFetch(`${API_BASE_URL}/api/v1/conversations/${convId}`, {
      method: "PATCH",
      body: JSON.stringify({ assignedToId }),
    });
    if (res.ok) {
      const data = await res.json();
      setConversations(prev =>
        prev.map(c => c.id === convId ? { ...c, ...data.conversation } : c)
      );
      setActiveDetail(prev => prev ? { ...prev, ...data.conversation } : prev);
    }
  };

  const handleAssignToMe = async () => {
    if (!activeId || !user) return;
    setShowMenu(false);
    try {
      await patchConversationAssignment(activeId, user.id);
    } catch (err) {
      console.error("Failed to assign conversation", err);
    }
  };

  const handleAssignTo = async (adminId: number) => {
    if (!activeId) return;
    setShowAssignModal(false);
    try {
      await patchConversationAssignment(activeId, adminId);
    } catch (err) {
      console.error("Failed to assign conversation", err);
    }
  };

  const handleUnassign = async () => {
    if (!activeId) return;
    setShowMenu(false);
    try {
      await patchConversationAssignment(activeId, null);
    } catch (err) {
      console.error("Failed to unassign conversation", err);
    }
  };

  const handleCreateConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newConvForm.clientId.trim()) return;
    setSubmittingConv(true);
    try {
      const body: Record<string, unknown> = {
        clientId: Number(newConvForm.clientId),
      };
      if (newConvForm.assignedToId.trim()) {
        body.assignedToId = Number(newConvForm.assignedToId);
      }
      const res = await authFetch(`${API_BASE_URL}/api/v1/conversations`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        const convId: string = data.conversation.id;
        // Deduplicate in case the socket new_conversation event already added it
        setConversations(prev =>
          prev.some(c => c.id === convId)
            ? prev
            : [{ ...data.conversation, unreadCount: 0, lastMessage: null }, ...prev]
        );
        setShowNewConvModal(false);
        setNewConvForm({ clientId: "", assignedToId: "" });
        handleSelectConversation(convId);
      } else if (data.conversationId) {
        // Conversation already exists for this client — show a notice and open it
        setToast({ id: Date.now(), variant: "info", title: "Conversation already exists", description: "Opening the existing conversation for this client." });
        setShowNewConvModal(false);
        setNewConvForm({ clientId: "", assignedToId: "" });
        handleSelectConversation(data.conversationId);
      }
    } catch (err) {
      console.error("Failed to create conversation", err);
    } finally {
      setSubmittingConv(false);
    }
  };

  // Filtered conversation list
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter(c => c.client.name.toLowerCase().includes(q));
  }, [conversations, searchQuery]);

  // Group messages by date
  const groupedMessages = useMemo(() => {
    const groups: { date: string; msgs: ApiMessage[] }[] = [];
    let currentDate = "";
    for (const msg of messages) {
      const date = formatMsgDate(msg.createdAt);
      if (date !== currentDate) {
        currentDate = date;
        groups.push({ date, msgs: [msg] });
      } else {
        groups[groups.length - 1].msgs.push(msg);
      }
    }
    return groups;
  }, [messages]);

  // Derived display values for the active conversation
  const activeConvMeta = useMemo(
    () => conversations.find(c => c.id === activeId),
    [conversations, activeId]
  );

  const activeClientName = activeDetail?.client.name ?? activeConvMeta?.client.name ?? "";
  const activeClientColor = activeDetail
    ? getAvatarColor(activeDetail.client.id)
    : activeConvMeta
    ? getAvatarColor(activeConvMeta.client.id)
    : "bg-brand-500";
  const activeClientInitial = getInitial(activeClientName);
  const activeAssignedTo =
    activeDetail?.assignedTo?.name ?? activeConvMeta?.assignedTo?.name ?? null;

  return (
    <div>
      {/* ── New Conversation Modal ─────────────────────────────────────────────── */}
      {showNewConvModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">New Conversation</h3>
              <button
                onClick={() => setShowNewConvModal(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <LuX className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateConversation} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Client <span className="text-error-500">*</span>
                </label>
                <select
                  required
                  value={newConvForm.clientId}
                  onChange={e => setNewConvForm(f => ({ ...f, clientId: e.target.value }))}
                  className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                >
                  <option value="">Select a client...</option>
                  {clientUsers.map(c => (
                    <option key={c.id} value={String(c.id)}>
                      {c.name} ({c.email})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Assign to Admin{" "}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <select
                  value={newConvForm.assignedToId}
                  onChange={e => setNewConvForm(f => ({ ...f, assignedToId: e.target.value }))}
                  className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                >
                  <option value="">Unassigned</option>
                  {adminUsers.map(a => (
                    <option key={a.id} value={String(a.id)}>
                      {a.name} ({a.email})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewConvModal(false)}
                  className="flex-1 h-10 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingConv || !newConvForm.clientId.trim()}
                  className="flex-1 h-10 rounded-lg bg-brand-500 text-sm font-medium text-white hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingConv ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Assign to Modal ───────────────────────────────────────────────────── */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <LuUserCheck className="h-5 w-5 text-brand-500" />
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">Assign to Admin</h3>
              </div>
              <button
                onClick={() => setShowAssignModal(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <LuX className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 max-h-80 overflow-y-auto">
              {adminUsers.length === 0 ? (
                <p className="text-center text-sm text-gray-400 dark:text-gray-500 py-4">No admin users found</p>
              ) : (
                <div className="space-y-1">
                  {adminUsers.map(admin => (
                    <button
                      key={admin.id}
                      onClick={() => handleAssignTo(admin.id)}
                      className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div
                        className={`${getAvatarColor(admin.id)} h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0`}
                      >
                        {getInitial(admin.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{admin.name}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{admin.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Page header ───────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Messages</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Communicate with clients in real-time
        </p>
      </div>

      <div
        className="grid grid-cols-12 gap-0 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden"
        style={{ height: "calc(100vh - 220px)" }}
      >
        {/* ── Left Panel: Conversation List ─────────────────────────────────── */}
        <div
          className={`col-span-12 xl:col-span-4 border-r border-gray-200 dark:border-gray-800 flex flex-col min-h-0 ${
            showChatView ? "hidden xl:flex" : "flex"
          }`}
        >
          {/* New Conversation */}
          <div className="p-4">
            <button
              onClick={() => setShowNewConvModal(true)}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-600"
            >
              <LuPlus className="h-4 w-4" />
              New Conversation
            </button>
          </div>

          {/* Search */}
          <div className="px-4 pb-3">
            <div className="relative">
              <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by client name..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:placeholder:text-gray-500"
              />
            </div>
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {loadingList ? (
              <div className="flex items-center justify-center py-12">
                <LuLoader className="h-6 w-6 animate-spin text-brand-500" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
                No conversations found
              </div>
            ) : (
              filteredConversations.map(conv => {
                const isActive = conv.id === activeId;
                const color = getAvatarColor(conv.client.id);
                const initial = getInitial(conv.client.name);

                return (
                  <button
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv.id)}
                    className={`w-full text-left px-4 py-4 border-b border-gray-100 dark:border-gray-800 transition-colors ${
                      isActive
                        ? "bg-brand-50 dark:bg-brand-500/10"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`${color} h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0`}
                      >
                        {initial}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                              {conv.client.name}
                            </h4>
                            {conv.unreadCount > 0 && (
                              <span className="inline-flex items-center justify-center h-5 min-w-[20px] rounded-full bg-brand-500 px-1.5 text-[10px] font-bold text-white flex-shrink-0">
                                {conv.unreadCount}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                            {formatConvDate(conv.updatedAt)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                          {conv.assignedTo ? `Assigned to ${conv.assignedTo.name}` : "Unassigned"}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5 line-clamp-1">
                          {conv.lastMessage?.body ?? "No messages yet"}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Current user info */}
          <div className="border-t border-gray-200 dark:border-gray-800 p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-brand-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
              {user ? getInitial(user.name) : "AU"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user?.name ?? "Admin User"}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{user?.email ?? ""}</p>
            </div>
          </div>
        </div>

        {/* ── Right Panel: Chat View ─────────────────────────────────────────── */}
        <div
          className={`col-span-12 xl:col-span-8 flex flex-col min-h-0 ${
            showChatView ? "flex" : "hidden xl:flex"
          }`}
        >
          {!activeId ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Select a conversation to start messaging
              </p>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowChatView(false)}
                    className="xl:hidden p-1.5 -ml-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
                  >
                    <LuArrowLeft className="h-5 w-5" />
                  </button>
                  <div
                    className={`${activeClientColor} h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0`}
                  >
                    {activeClientInitial}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                      {activeClientName}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {activeAssignedTo ? `Assigned to ${activeAssignedTo}` : "Unassigned"}
                    </p>
                  </div>
                </div>

                {/* Three-dot menu */}
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <LuEllipsisVertical className="h-5 w-5" />
                  </button>
                  {showMenu && (
                    <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-theme-lg dark:border-gray-700 dark:bg-gray-900 z-50">
                      <button
                        onClick={handleAssignToMe}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                      >
                        Assign to me
                      </button>
                      {canAssign && (
                        <button
                          onClick={() => { setShowMenu(false); setShowAssignModal(true); }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                        >
                          Assign to...
                        </button>
                      )}
                      <button
                        onClick={handleUnassign}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                      >
                        Unassign
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Messages area */}
              {loadingDetail ? (
                <div className="flex-1 flex items-center justify-center bg-gray-50/50 dark:bg-gray-900/50">
                  <LuLoader className="h-6 w-6 animate-spin text-brand-500" />
                </div>
              ) : (
                <div
                  onScroll={handleScroll}
                  className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar bg-gray-50/50 dark:bg-gray-900/50"
                >
                  {loadingMore && (
                    <div className="flex items-center justify-center py-4">
                      <LuLoader className="h-4 w-4 animate-spin text-brand-500" />
                    </div>
                  )}

                  {messages.length === 0 && !loadingDetail && (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-sm text-gray-400 dark:text-gray-500">
                        No messages yet. Start the conversation!
                      </p>
                    </div>
                  )}

                  {groupedMessages.map(group => (
                    <div key={group.date}>
                      {/* Date separator */}
                      <div className="flex items-center justify-center my-6">
                        <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-4 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                          {group.date}
                        </span>
                      </div>

                      {group.msgs.map(msg => {
                        const isOwnMessage = msg.senderId === user?.id;
                        return (
                          <div
                            key={msg.id}
                            className={`flex mb-4 ${isOwnMessage ? "justify-end" : "justify-start"}`}
                          >
                            {/* Other person's avatar */}
                            {!isOwnMessage && (
                              <div
                                className={`${
                                  msg.senderType === "ADMIN" ? "bg-brand-500" : activeClientColor
                                } h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 mr-3 mt-1`}
                              >
                                {getInitial(msg.sender.name)}
                              </div>
                            )}

                            <div className="max-w-[70%]">
                              <p
                                className={`text-xs font-medium mb-1 ${
                                  isOwnMessage
                                    ? "text-right text-gray-500 dark:text-gray-400"
                                    : "text-gray-500 dark:text-gray-400"
                                }`}
                              >
                                {msg.sender.name}
                              </p>

                              <div
                                className={`rounded-2xl px-4 py-3 ${
                                  isOwnMessage
                                    ? "bg-brand-500 text-white rounded-br-md"
                                    : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-bl-md"
                                }`}
                              >
                                <p className="text-sm leading-relaxed">{msg.body}</p>
                              </div>

                              <div
                                className={`flex items-center gap-1.5 mt-1.5 ${
                                  isOwnMessage ? "justify-end" : ""
                                }`}
                              >
                                <span className="text-[11px] text-gray-400 dark:text-gray-500">
                                  {formatMsgTime(msg.createdAt)}
                                </span>
                                {isOwnMessage && msg.readBy.length > 0 && (
                                  <LiaCheckDoubleSolid className="h-4 w-4 text-brand-400" />
                                )}
                              </div>
                            </div>

                            {/* Own avatar */}
                            {isOwnMessage && (
                              <div className="h-8 w-8 rounded-full bg-brand-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 ml-3 mt-1">
                                {user ? getInitial(user.name) : "A"}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}

                  {/* Typing indicator */}
                  {typingUsers.length > 0 && (
                    <div className="flex justify-start mb-4">
                      <div
                        className={`${activeClientColor} h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 mr-3 mt-1`}
                      >
                        {activeClientInitial}
                      </div>
                      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-bl-md px-4 py-3">
                        <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                          {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing…
                        </p>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              )}

              {/* Message input */}
              <div className="border-t border-gray-200 dark:border-gray-800 px-6 py-4">
                <form onSubmit={handleSend} className="flex items-center gap-3">
                  <button
                    type="button"
                    className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex-shrink-0"
                  >
                    <LuPaperclip className="h-5 w-5" />
                  </button>
                  <input
                    type="text"
                    value={messageInput}
                    onChange={e => {
                      setMessageInput(e.target.value);
                      handleTyping();
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message..."
                    className="flex-1 h-11 rounded-lg border border-gray-200 bg-gray-50 px-4 text-sm text-gray-700 placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:placeholder:text-gray-500"
                  />
                  <button
                    type="submit"
                    disabled={!messageInput.trim()}
                    className="h-11 w-11 rounded-lg bg-brand-500 text-white flex items-center justify-center hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                  >
                    <LuSend className="h-5 w-5" />
                  </button>
                </form>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2">
                  Press Enter to send
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Toast ─────────────────────────────────────────────────────────────── */}
      {toast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[120] w-[calc(100vw-2rem)] max-w-md">
          <div
            className="relative rounded-xl border bg-white/95 dark:bg-gray-900/95 border-blue-200 dark:border-blue-500/30 shadow-2xl backdrop-blur-sm px-4 py-3 pr-10"
            role="status"
            aria-live="polite"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400">
                <LuInfo className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{toast.title}</p>
                {toast.description && (
                  <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-300">{toast.description}</p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="absolute top-2.5 right-2.5 p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Dismiss"
            >
              <LuX className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMessagesContent;
