"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  LuMessageSquarePlus,
  LuPaperclip,
  LuSend,
} from "react-icons/lu";
import { FaRegUser } from "react-icons/fa";


type SenderType = "me" | "them";

interface MessageItem {
  id: number;
  sender: SenderType;
  author: string;
  text: string;
  timestamp: string;
}

interface ThreadItem {
  id: string;
  title: string;
  participant: string;
  preview: string;
  date: string;
  unread?: boolean;
}

const threads: ThreadItem[] = [
  {
    id: "reports-q4",
    title: "Q4 2025 Financial Reports",
    participant: "Emily Chan, CPA",
    preview: "The reports have been uploaded to your portal.",
    date: "5/1/2026",
  },
  {
    id: "tax-filing",
    title: "Tax Filing for 2024/25",
    participant: "Emily Chan, CPA",
    preview: "We need additional documents for the tax computation.",
    date: "3/1/2026",
    unread: true,
  },
  {
    id: "registration-renewal",
    title: "Business Registration Renewal",
    participant: "Emily Chan, CPA",
    preview: "Renewal has been completed successfully.",
    date: "20/12/2025",
  },
];

const initialMessages: Record<string, MessageItem[]> = {
  "reports-q4": [
    {
      id: 1,
      sender: "them",
      author: "Emily Chan, CPA",
      text: "Your Q4 2025 financial reports are now available. Let me know if you need a walkthrough.",
      timestamp: "2026-01-05 09:10 AM",
    },
    {
      id: 2,
      sender: "me",
      author: "You",
      text: "Thanks, I will review them today.",
      timestamp: "2026-01-05 09:12 AM",
    },
  ],
  "tax-filing": [
    {
      id: 3,
      sender: "them",
      author: "Emily Chan, CPA",
      text: "Hi David, I hope you are doing well. Regarding your tax filing for 2024/25, we need some additional documents to complete the computation.",
      timestamp: "2026-01-03 10:30 AM",
    },
    {
      id: 4,
      sender: "me",
      author: "You",
      text: "Hi Emily, sure. What documents do you need?",
      timestamp: "2026-01-03 11:15 AM",
    },
    {
      id: 5,
      sender: "them",
      author: "Emily Chan, CPA",
      text: "We need copies of your rental agreements and proof of capital allowances claimed. If you could upload them to the portal, that would be great.",
      timestamp: "2026-01-03 11:30 AM",
    },
  ],
  "registration-renewal": [
    {
      id: 6,
      sender: "them",
      author: "Emily Chan, CPA",
      text: "The business registration renewal has been completed successfully.",
      timestamp: "2025-12-20 03:05 PM",
    },
    {
      id: 7,
      sender: "me",
      author: "You",
      text: "Great, thank you for the update.",
      timestamp: "2025-12-20 03:15 PM",
    },
  ],
};

const replyPool = [
  "Thanks for confirming. I will review and get back to you shortly.",
  "Got it. Please upload the files and we will proceed.",
  "Appreciate it. Let me know if you need anything else from my end.",
];

const MessagesTab: React.FC = () => {
  const [activeThreadId, setActiveThreadId] = useState<string>("tax-filing");
  const [messagesByThread, setMessagesByThread] =
    useState<Record<string, MessageItem[]>>(initialMessages);
  const [messageInput, setMessageInput] = useState("");
  const replyTimeouts = useRef<number[]>([]);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  const activeThread = useMemo(
    () => threads.find((thread) => thread.id === activeThreadId),
    [activeThreadId]
  );

  const activeMessages = messagesByThread[activeThreadId] ?? [];

  const handleSendMessage = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = messageInput.trim();
    if (!trimmed) {
      return;
    }

    setMessagesByThread((prev) => {
      const updated = prev[activeThreadId] ?? [];
      return {
        ...prev,
        [activeThreadId]: [
          ...updated,
          {
            id: Date.now(),
            sender: "me",
            author: "You",
            text: trimmed,
            timestamp: "Just now",
          },
        ],
      };
    });
    setMessageInput("");

    const timeoutId = window.setTimeout(() => {
      const replyText =
        replyPool[Math.floor(Math.random() * replyPool.length)];
      setMessagesByThread((prev) => {
        const updated = prev[activeThreadId] ?? [];
        return {
          ...prev,
          [activeThreadId]: [
            ...updated,
            {
              id: Date.now() + 1,
              sender: "them",
              author: "Emily Chan, CPA",
              text: replyText,
              timestamp: "Just now",
            },
          ],
        };
      });
    }, 900);

    replyTimeouts.current.push(timeoutId);
  };

  useEffect(() => {
    return () => {
      replyTimeouts.current.forEach((timeoutId) =>
        window.clearTimeout(timeoutId)
      );
    };
  }, []);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [activeThreadId, activeMessages.length]);

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      <div className="col-span-12 xl:col-span-4 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6 flex flex-col h-[640px]">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          Conversations
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Your message threads
        </p>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
          <div className="space-y-3">
            {threads.map((thread) => {
              const isActive = thread.id === activeThreadId;
              return (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => setActiveThreadId(thread.id)}
                  className={`w-full text-left rounded-xl border p-4 transition-colors ${
                    isActive
                      ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10"
                      : "border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      {thread.title}
                    </h3>
                    {thread.unread ? (
                      <span className="h-2 w-2 rounded-full bg-green-500" />
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {thread.participant}
                  </p>
                  <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                    {thread.preview}
                  </p>
                  <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                    {thread.date}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <button className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800">
          <LuMessageSquarePlus className="h-4 w-4" />
          New Message
        </button>
      </div>

      <div className="col-span-12 xl:col-span-8 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6 flex flex-col h-[640px]">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {activeThread?.title ?? "Conversation"}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Conversation with {activeThread?.participant ?? "support"}
            </p>
          </div>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
            active
          </span>
        </div>

        <div
          ref={messagesContainerRef}
          className="mt-6 flex-1 overflow-y-auto custom-scrollbar pr-2"
        >
          <div className="space-y-4">
            {activeMessages.map((message) => {
              const isMe = message.sender === "me";
              return (
                <div
                  key={message.id}
                  className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl p-4 ${
                      isMe
                        ? "bg-emerald-600 text-white"
                        : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200"
                    }`}
                  >
                    <div
                      className={`flex items-center gap-2 text-xs ${
                        isMe ? "text-emerald-100" : "text-gray-500"
                      }`}
                    >
                      <FaRegUser className="h-4 w-4" />
                      <span className="font-medium">{message.author}</span>
                    </div>
                    <p className="mt-2 text-sm">{message.text}</p>
                    <p
                      className={`mt-2 text-xs ${
                        isMe ? "text-emerald-100/80" : "text-gray-400"
                      }`}
                    >
                      {message.timestamp}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSendMessage} className="mt-4">
          <textarea
            rows={2}
            value={messageInput}
            onChange={(event) => setMessageInput(event.target.value)}
            placeholder="Type your message..."
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 placeholder:text-gray-400 shadow-theme-xs focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <LuPaperclip className="h-4 w-4" />
              Attach File
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
            >
              <LuSend className="h-4 w-4" />
              Send Message
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MessagesTab;
