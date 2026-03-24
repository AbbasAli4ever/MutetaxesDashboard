"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { LuPaperclip, LuSend, LuLoader, LuShieldCheck } from "react-icons/lu";
import { FaRegUser } from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";
import { authFetch, API_BASE_URL } from "@/lib/auth";
import { useChat } from "@/hooks/useChat";
import type { ApiConversationDetail, ApiConversation } from "@/types/chat";

const formatTimestamp = (iso: string) =>
  new Date(iso).toLocaleString("en-US", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

const MessagesTab: React.FC = () => {
  const { user, getToken, logout } = useAuth();

  const [loadingList, setLoadingList] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeDetail, setActiveDetail] = useState<ApiConversationDetail | null>(null);

  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [messageInput, setMessageInput] = useState("");

  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  const handleConversationUpdated = useCallback((updatedConv: ApiConversation) => {
    setActiveDetail(prev => prev?.id === updatedConv.id ? { ...prev, ...updatedConv } : prev);
  }, []);

  const { messages, setMessages, typingUsers, sendMessage, handleTyping, markRead } = useChat(
    activeId,
    getToken,
    logout,
    handleConversationUpdated,
  );

  // Bootstrap: get or create the customer's single conversation
  useEffect(() => {
    (async () => {
      setLoadingList(true);
      try {
        const res = await authFetch(`${API_BASE_URL}/api/v1/conversations/my`);
        if (res.ok) {
          const data = await res.json();
          const detail: ApiConversationDetail = data.conversation;
          setActiveId(detail.id);
          setActiveDetail(detail);
          setMessages(detail.messages ?? []);
          setHasMore((detail.messages?.length ?? 0) >= 30);
        }
      } catch (err) {
        console.error("Failed to bootstrap conversation", err);
      } finally {
        setLoadingList(false);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Mark as read once conversation loads
  useEffect(() => {
    if (activeId && messages.length > 0) {
      markRead();
    }
  }, [activeId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll to bottom on new messages
  useEffect(() => {
    if (!loadingMore && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages.length, activeId]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    doSend();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      doSend();
    }
  };

  const assignedToName = activeDetail?.assignedTo?.name ?? null;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] flex flex-col h-[640px] overflow-hidden">
      {loadingList ? (
        <div className="flex-1 flex items-center justify-center">
          <LuLoader className="h-6 w-6 animate-spin text-emerald-600" />
        </div>
      ) : (
        <>
          {/* ── Header ── */}
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex-shrink-0">
                <LuShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white leading-tight">
                  Support Chat
                </h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {assignedToName ? `Assigned to ${assignedToName}` : "MuteTaxes Support Team"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Messages ── */}
          <div
            ref={messagesContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto custom-scrollbar px-6 py-4"
          >
            {loadingMore && (
              <div className="flex items-center justify-center py-3">
                <LuLoader className="h-4 w-4 animate-spin text-emerald-600" />
              </div>
            )}

            {messages.length === 0 && (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  No messages yet. Start the conversation!
                </p>
              </div>
            )}

            <div className="space-y-4">
              {messages.map(msg => {
                const isMe = msg.senderId === user?.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                        isMe
                          ? "bg-emerald-600 text-white rounded-br-sm"
                          : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200 rounded-bl-sm"
                      }`}
                    >
                      <div className={`flex items-center gap-1.5 text-xs mb-1.5 ${isMe ? "text-emerald-100/80" : "text-gray-400 dark:text-gray-500"}`}>
                        <FaRegUser className="h-3 w-3" />
                        <span className="font-medium">{msg.sender.name}</span>
                      </div>
                      <p className="text-sm leading-relaxed">{msg.body}</p>
                      <p className={`mt-1.5 text-xs ${isMe ? "text-emerald-100/60 text-right" : "text-gray-400 dark:text-gray-500"}`}>
                        {formatTimestamp(msg.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}

              {typingUsers.length > 0 && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-3">
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                      {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing…
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Input ── */}
          <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800">
            <form onSubmit={handleSendMessage}>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <LuPaperclip className="h-5 w-5" />
                </button>
                <textarea
                  rows={1}
                  value={messageInput}
                  onChange={e => {
                    setMessageInput(e.target.value);
                    handleTyping();
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message..."
                  className="flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                />
                <button
                  type="submit"
                  disabled={!messageInput.trim()}
                  className="flex-shrink-0 h-9 w-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white transition-colors hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <LuSend className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                Press Enter to send, Shift + Enter for new line
              </p>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default MessagesTab;
