"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  LuPaperclip,
  LuSearch,
  LuSend,
  LuEllipsisVertical,
  LuPlus,
  LuArrowLeft,
} from "react-icons/lu";
import { LiaCheckDoubleSolid } from "react-icons/lia";

// ── Types ──────────────────────────────────────────────────────────────────────
type ConversationStatus = "open" | "in-progress" | "resolved" | "closed";
type Priority = "high" | "medium" | "low" | "urgent";

interface Message {
  id: number;
  sender: "admin" | "client";
  author: string;
  text: string;
  time: string;
  date: string;
  read?: boolean;
}

interface Conversation {
  id: string;
  ticketId: string;
  clientName: string;
  clientInitial: string;
  clientColor: string;
  subject: string;
  category: string;
  preview: string;
  date: string;
  unreadCount: number;
  status: ConversationStatus;
  priority: Priority;
  assignedTo: string;
  messages: Message[];
}

// ── Style maps ─────────────────────────────────────────────────────────────────
const statusStyles: Record<ConversationStatus, { label: string; bg: string; text: string }> = {
  open: { label: "Open", bg: "bg-blue-50 dark:bg-blue-500/10", text: "text-blue-600 dark:text-blue-400" },
  "in-progress": { label: "In Progress", bg: "bg-warning-50 dark:bg-warning-500/10", text: "text-warning-600 dark:text-warning-400" },
  resolved: { label: "Resolved", bg: "bg-success-50 dark:bg-success-500/10", text: "text-success-600 dark:text-success-400" },
  closed: { label: "Closed", bg: "bg-gray-100 dark:bg-gray-700", text: "text-gray-500 dark:text-gray-400" },
};

const priorityStyles: Record<Priority, { label: string; bg: string; text: string }> = {
  urgent: { label: "Urgent", bg: "bg-error-50 dark:bg-error-500/10", text: "text-error-600 dark:text-error-400" },
  high: { label: "High", bg: "bg-error-50 dark:bg-error-500/10", text: "text-error-600 dark:text-error-400" },
  medium: { label: "Medium", bg: "bg-warning-50 dark:bg-warning-500/10", text: "text-warning-600 dark:text-warning-400" },
  low: { label: "Low", bg: "bg-blue-50 dark:bg-blue-500/10", text: "text-blue-600 dark:text-blue-400" },
};

// ── Dummy data ─────────────────────────────────────────────────────────────────
const initialConversations: Conversation[] = [
  {
    id: "conv-1",
    ticketId: "TKT-001",
    clientName: "John Doe",
    clientInitial: "J",
    clientColor: "bg-brand-500",
    subject: "Document Verification...",
    category: "Documents",
    preview: "Perfect! The document has been ...",
    date: "Feb 4",
    unreadCount: 2,
    status: "in-progress",
    priority: "high",
    assignedTo: "Emily Rodriguez",
    messages: [
      {
        id: 1,
        sender: "client",
        author: "John Doe",
        text: "Hello, I'm having trouble verifying my business documents. The system keeps rejecting my EIN certificate.",
        time: "09:30 AM",
        date: "Wednesday, February 4",
      },
      {
        id: 2,
        sender: "admin",
        author: "Emily Rodriguez",
        text: "Hi John! I've reviewed your case. It appears the document format needs to be PDF. Could you please re-upload in PDF format?",
        time: "10:15 AM",
        date: "Wednesday, February 4",
        read: true,
      },
      {
        id: 3,
        sender: "client",
        author: "John Doe",
        text: "Thank you! I've just uploaded the PDF version. Could you please check if it's acceptable now?",
        time: "11:00 AM",
        date: "Wednesday, February 4",
      },
      {
        id: 4,
        sender: "admin",
        author: "Emily Rodriguez",
        text: "Perfect! The document has been verified successfully. Your registration will proceed to the next stage.",
        time: "11:30 AM",
        date: "Wednesday, February 4",
        read: true,
      },
    ],
  },
  {
    id: "conv-2",
    ticketId: "TKT-002",
    clientName: "Jane Smith",
    clientInitial: "J",
    clientColor: "bg-purple-500",
    subject: "Payment Confirmation ...",
    category: "Payments",
    preview: "Your payment has been confirmed!",
    date: "Feb 4",
    unreadCount: 0,
    status: "resolved",
    priority: "medium",
    assignedTo: "Emily Rodriguez",
    messages: [
      {
        id: 5,
        sender: "client",
        author: "Jane Smith",
        text: "Hi, I made a payment yesterday but haven't received a confirmation email yet. Can you check?",
        time: "02:00 PM",
        date: "Tuesday, February 3",
      },
      {
        id: 6,
        sender: "admin",
        author: "Emily Rodriguez",
        text: "Hi Jane! I can see your payment was processed successfully. The confirmation email has been resent to your registered email address.",
        time: "02:30 PM",
        date: "Tuesday, February 3",
        read: true,
      },
      {
        id: 7,
        sender: "client",
        author: "Jane Smith",
        text: "Got it now, thank you so much!",
        time: "02:45 PM",
        date: "Tuesday, February 3",
      },
      {
        id: 8,
        sender: "admin",
        author: "Emily Rodriguez",
        text: "Your payment has been confirmed! If you need anything else, feel free to reach out.",
        time: "03:00 PM",
        date: "Tuesday, February 3",
        read: true,
      },
    ],
  },
  {
    id: "conv-3",
    ticketId: "TKT-003",
    clientName: "Tech Innovatio...",
    clientInitial: "T",
    clientColor: "bg-teal-500",
    subject: "Registration Status Up...",
    category: "Registration",
    preview: "Could you provide an update on o...",
    date: "Feb 4",
    unreadCount: 1,
    status: "open",
    priority: "low",
    assignedTo: "Emily Rodriguez",
    messages: [
      {
        id: 9,
        sender: "client",
        author: "Tech Innovations Ltd",
        text: "Could you provide an update on our company registration? We submitted the documents last week.",
        time: "10:00 AM",
        date: "Monday, February 3",
      },
      {
        id: 10,
        sender: "admin",
        author: "Emily Rodriguez",
        text: "Hi! Your registration is currently under review. We expect it to be completed within 2-3 business days.",
        time: "10:45 AM",
        date: "Monday, February 3",
        read: true,
      },
    ],
  },
  {
    id: "conv-4",
    ticketId: "TKT-004",
    clientName: "Robert Williams",
    clientInitial: "R",
    clientColor: "bg-orange-500",
    subject: "Compliance Document...",
    category: "Compliance",
    preview: "I need help uploading compliance ...",
    date: "Feb 3",
    unreadCount: 3,
    status: "open",
    priority: "urgent",
    assignedTo: "Emily Rodriguez",
    messages: [
      {
        id: 11,
        sender: "client",
        author: "Robert Williams",
        text: "I need help uploading compliance documents. The portal keeps timing out when I try to upload files larger than 5MB.",
        time: "09:00 AM",
        date: "Sunday, February 2",
      },
      {
        id: 12,
        sender: "admin",
        author: "Emily Rodriguez",
        text: "I'm sorry for the inconvenience. We're aware of the upload size limitation. Could you try compressing the files or splitting them into smaller parts?",
        time: "09:30 AM",
        date: "Sunday, February 2",
        read: true,
      },
      {
        id: 13,
        sender: "client",
        author: "Robert Williams",
        text: "I tried that but some documents can't be split. Is there an alternative way to submit them?",
        time: "10:00 AM",
        date: "Sunday, February 2",
      },
    ],
  },
  {
    id: "conv-5",
    ticketId: "TKT-005",
    clientName: "Lisa Anderson",
    clientInitial: "L",
    clientColor: "bg-pink-500",
    subject: "Account Setup Assista...",
    category: "Account",
    preview: "Thank you for your help!",
    date: "Feb 3",
    unreadCount: 0,
    status: "closed",
    priority: "low",
    assignedTo: "Emily Rodriguez",
    messages: [
      {
        id: 14,
        sender: "client",
        author: "Lisa Anderson",
        text: "Hi, I need help setting up my account. I'm not sure how to configure the tax settings.",
        time: "11:00 AM",
        date: "Saturday, February 1",
      },
      {
        id: 15,
        sender: "admin",
        author: "Emily Rodriguez",
        text: "Sure! Go to Settings > Tax Configuration. I've also sent you a step-by-step guide via email.",
        time: "11:30 AM",
        date: "Saturday, February 1",
        read: true,
      },
      {
        id: 16,
        sender: "client",
        author: "Lisa Anderson",
        text: "Thank you for your help! That worked perfectly.",
        time: "12:00 PM",
        date: "Saturday, February 1",
      },
    ],
  },
];

const autoReplies = [
  "Thank you for your message. I'll look into this right away.",
  "I've checked the system and everything looks good on our end. Could you try again?",
  "I've escalated this to our technical team. You should hear back within 24 hours.",
  "That's been resolved now. Is there anything else I can help you with?",
  "I understand your concern. Let me review the details and get back to you shortly.",
];

// ── Filter tabs ────────────────────────────────────────────────────────────────
type FilterTab = "all" | "open" | "active";

const filterTabs: { label: string; value: FilterTab }[] = [
  { label: "All", value: "all" },
  { label: "Open", value: "open" },
  { label: "Active", value: "active" },
];

// ── Component ──────────────────────────────────────────────────────────────────
const AdminMessagesContent: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [activeId, setActiveId] = useState<string>("conv-1");
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [showMenu, setShowMenu] = useState(false);
  const [showChatView, setShowChatView] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const replyTimeouts = useRef<number[]>([]);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? conversations[0],
    [conversations, activeId]
  );

  // Filter conversations
  const filteredConversations = useMemo(() => {
    let result = conversations;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.clientName.toLowerCase().includes(q) ||
          c.subject.toLowerCase().includes(q) ||
          c.ticketId.toLowerCase().includes(q)
      );
    }
    if (activeFilter === "open") {
      result = result.filter((c) => c.status === "open");
    } else if (activeFilter === "active") {
      result = result.filter((c) => c.status === "in-progress" || c.status === "open");
    }
    return result;
  }, [conversations, searchQuery, activeFilter]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation?.messages.length, activeId]);

  // Clean up reply timeouts
  useEffect(() => {
    return () => {
      replyTimeouts.current.forEach((id) => window.clearTimeout(id));
    };
  }, []);

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

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = messageInput.trim();
    if (!trimmed) return;

    const now = new Date();
    const time = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
    const date = activeConversation.messages[activeConversation.messages.length - 1]?.date ?? "Today";

    const newMsg: Message = {
      id: Date.now(),
      sender: "admin",
      author: "Emily Rodriguez",
      text: trimmed,
      time,
      date,
      read: true,
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeId
          ? { ...c, messages: [...c.messages, newMsg], preview: trimmed }
          : c
      )
    );
    setMessageInput("");

    // Auto-reply from client after delay
    const timeoutId = window.setTimeout(() => {
      const replyText = autoReplies[Math.floor(Math.random() * autoReplies.length)];
      const replyTime = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeId
            ? {
                ...c,
                messages: [
                  ...c.messages,
                  {
                    id: Date.now() + 1,
                    sender: "client",
                    author: c.clientName,
                    text: replyText,
                    time: replyTime,
                    date,
                  },
                ],
                preview: replyText,
                unreadCount: c.unreadCount + 1,
              }
            : c
        )
      );
    }, 1200);
    replyTimeouts.current.push(timeoutId);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  // Group messages by date
  const groupedMessages = useMemo(() => {
    const groups: { date: string; messages: Message[] }[] = [];
    let currentDate = "";
    for (const msg of activeConversation.messages) {
      if (msg.date !== currentDate) {
        currentDate = msg.date;
        groups.push({ date: currentDate, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    }
    return groups;
  }, [activeConversation.messages]);

  const handleSelectConversation = (id: string) => {
    setActiveId(id);
    setShowChatView(true);
    // Clear unread for the selected conversation
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c))
    );
  };

  const handleBackToList = () => {
    setShowChatView(false);
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Messages</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Communicate with clients in real-time
        </p>
      </div>

      <div className="grid grid-cols-12 gap-0 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden" style={{ height: "calc(100vh - 220px)" }}>
        {/* ── Left Panel: Conversation List ──────────────────────────────── */}
        <div className={`col-span-12 xl:col-span-4 border-r border-gray-200 dark:border-gray-800 flex flex-col min-h-0 ${showChatView ? "hidden xl:flex" : "flex"}`}>
          {/* New Conversation Button */}
          <div className="p-4">
            <button className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-600">
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
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:placeholder:text-gray-500"
              />
            </div>
          </div>

          {/* Filter tabs */}
          <div className="px-4 pb-3 flex items-center gap-2">
            {filterTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveFilter(tab.value)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  activeFilter === tab.value
                    ? "bg-brand-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {filteredConversations.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
                No conversations found
              </div>
            )}
            {filteredConversations.map((conv) => {
              const isActive = conv.id === activeId;
              const status = statusStyles[conv.status];
              const priority = priorityStyles[conv.priority];

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
                    {/* Avatar */}
                    <div className={`${conv.clientColor} h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0`}>
                      {conv.clientInitial}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {conv.clientName}
                          </h4>
                          {conv.unreadCount > 0 && (
                            <span className="inline-flex items-center justify-center h-5 min-w-[20px] rounded-full bg-brand-500 px-1.5 text-[10px] font-bold text-white flex-shrink-0">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                          {conv.date}
                        </span>
                      </div>

                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                        {conv.subject}
                      </p>

                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5 line-clamp-1">
                        {conv.preview}
                      </p>

                      <div className="flex items-center gap-1.5 mt-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${status.bg} ${status.text}`}>
                          {status.label}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${priority.bg} ${priority.text}`}>
                          {priority.label}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* User info at bottom */}
          <div className="border-t border-gray-200 dark:border-gray-800 p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-brand-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
              AU
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">Admin User</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 truncate">admin@example.com</p>
            </div>
          </div>
        </div>

        {/* ── Right Panel: Chat View ────────────────────────────────────── */}
        <div className={`col-span-12 xl:col-span-8 flex flex-col min-h-0 ${showChatView ? "flex" : "hidden xl:flex"}`}>
          {/* Chat header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              {/* Back button — visible below xl */}
              <button
                onClick={handleBackToList}
                className="xl:hidden p-1.5 -ml-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
              >
                <LuArrowLeft className="h-5 w-5" />
              </button>
              <div className={`${activeConversation.clientColor} h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0`}>
                {activeConversation.clientInitial}
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                  {activeConversation.clientName}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {activeConversation.ticketId}
                  </span>
                  <span className="text-xs text-gray-300 dark:text-gray-600">•</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {activeConversation.category}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusStyles[activeConversation.status].bg} ${statusStyles[activeConversation.status].text}`}>
                  {statusStyles[activeConversation.status].label}
                </span>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${priorityStyles[activeConversation.priority].bg} ${priorityStyles[activeConversation.priority].text}`}>
                  {priorityStyles[activeConversation.priority].label} Priority
                </span>
              </div>
              <span className="hidden md:inline text-xs text-gray-400 dark:text-gray-500">
                Assigned to: {activeConversation.assignedTo}
              </span>

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
                    <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800">
                      Mark as Resolved
                    </button>
                    <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800">
                      Assign to...
                    </button>
                    <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800">
                      View Client Profile
                    </button>
                    <button className="w-full px-4 py-2 text-left text-sm text-error-600 hover:bg-gray-50 dark:hover:bg-gray-800">
                      Close Conversation
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar bg-gray-50/50 dark:bg-gray-900/50">
            {groupedMessages.map((group) => (
              <div key={group.date}>
                {/* Date separator */}
                <div className="flex items-center justify-center my-6">
                  <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-4 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                    {group.date}
                  </span>
                </div>

                {group.messages.map((msg) => {
                  const isAdmin = msg.sender === "admin";
                  return (
                    <div
                      key={msg.id}
                      className={`flex mb-4 ${isAdmin ? "justify-end" : "justify-start"}`}
                    >
                      {/* Client avatar on left */}
                      {!isAdmin && (
                        <div className={`${activeConversation.clientColor} h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 mr-3 mt-1`}>
                          {activeConversation.clientInitial}
                        </div>
                      )}

                      <div className={`max-w-[70%]`}>
                        {/* Author name */}
                        <p className={`text-xs font-medium mb-1 ${isAdmin ? "text-right text-gray-500 dark:text-gray-400" : "text-gray-500 dark:text-gray-400"}`}>
                          {msg.author}
                        </p>

                        {/* Message bubble */}
                        <div
                          className={`rounded-2xl px-4 py-3 ${
                            isAdmin
                              ? "bg-brand-500 text-white rounded-br-md"
                              : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-bl-md"
                          }`}
                        >
                          <p className="text-sm leading-relaxed">{msg.text}</p>
                        </div>

                        {/* Timestamp */}
                        <div className={`flex items-center gap-1.5 mt-1.5 ${isAdmin ? "justify-end" : ""}`}>
                          <span className="text-[11px] text-gray-400 dark:text-gray-500">
                            {msg.time}
                          </span>
                          {isAdmin && msg.read && (
                            <LiaCheckDoubleSolid className="h-4 w-4 text-brand-400" />
                          )}
                        </div>
                      </div>

                      {/* Admin avatar on right */}
                      {isAdmin && (
                        <div className="h-8 w-8 rounded-full bg-brand-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 ml-3 mt-1">
                          E
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

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
                onChange={(e) => setMessageInput(e.target.value)}
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
              Press Enter to send, Shift + Enter for new line
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminMessagesContent;
