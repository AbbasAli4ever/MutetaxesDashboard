"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  LuSearch,
  LuPlus,
  LuEye,
  LuPaperclip,
  LuPencil,
  LuSend,
  LuX,
  LuChevronDown,
  LuCheck,
} from "react-icons/lu";
import { FaRegUser } from "react-icons/fa";

// ── Types ──────────────────────────────────────────────────────────────────────
type TicketStatus = "Open" | "In Progress" | "Resolved";
type TicketPriority = "High" | "Medium" | "Low";

interface Message {
  id: number;
  sender: "admin" | "client";
  author: string;
  text: string;
  date: string;
}

interface Ticket {
  id: string;
  title: string;
  client: string;
  priority: TicketPriority;
  status: TicketStatus;
  created: string;
  assignedTo: string;
  messages: Message[];
}

// ── Style maps ─────────────────────────────────────────────────────────────────
const statusStyles: Record<TicketStatus, string> = {
  Open: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  "In Progress": "bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400",
  Resolved: "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400",
};

const priorityStyles: Record<TicketPriority, string> = {
  High: "bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-400",
  Medium: "bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400",
  Low: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
};

// ── Dummy data ─────────────────────────────────────────────────────────────────
const initialTickets: Ticket[] = [
  {
    id: "TKT-001",
    title: "Document verification issue",
    client: "John Doe",
    priority: "High",
    status: "Open",
    created: "2026-01-27",
    assignedTo: "Emily Rodriguez",
    messages: [
      { id: 1, sender: "client", author: "John Doe", text: "Hello, I'm having trouble verifying my business documents. The system keeps rejecting my EIN certificate.", date: "Jan 27" },
      { id: 2, sender: "admin", author: "Emily Rodriguez", text: "Hi John! I've reviewed your case. It appears the document format needs to be PDF. Could you please re-upload in PDF format?", date: "Jan 27" },
      { id: 3, sender: "client", author: "John Doe", text: "Thank you! I've just uploaded the PDF version. Could you please check if it's acceptable now?", date: "Jan 27" },
    ],
  },
  {
    id: "TKT-002",
    title: "Payment confirmation needed",
    client: "Jane Smith",
    priority: "Medium",
    status: "In Progress",
    created: "2026-01-26",
    assignedTo: "Emily Rodriguez",
    messages: [
      { id: 4, sender: "client", author: "Jane Smith", text: "Hi, I made a payment yesterday but haven't received a confirmation email yet. Can you check?", date: "Jan 26" },
      { id: 5, sender: "admin", author: "Emily Rodriguez", text: "Hi Jane! I can see your payment was processed successfully. The confirmation email has been resent to your registered email address.", date: "Jan 26" },
      { id: 6, sender: "client", author: "Jane Smith", text: "Got it now, thank you so much!", date: "Jan 26" },
    ],
  },
  {
    id: "TKT-003",
    title: "Status update request",
    client: "Tech Innovations Inc",
    priority: "Low",
    status: "Resolved",
    created: "2026-01-24",
    assignedTo: "Emily Rodriguez",
    messages: [
      { id: 7, sender: "client", author: "Tech Innovations Inc", text: "Could you provide an update on our company registration? We submitted the documents last week.", date: "Jan 24" },
      { id: 8, sender: "admin", author: "Emily Rodriguez", text: "Your registration has been completed and approved. You should receive the confirmation documents via email shortly.", date: "Jan 24" },
    ],
  },
  {
    id: "TKT-004",
    title: "Compliance document upload error",
    client: "Robert Williams",
    priority: "High",
    status: "Open",
    created: "2026-01-23",
    assignedTo: "Emily Rodriguez",
    messages: [
      { id: 9, sender: "client", author: "Robert Williams", text: "I need help uploading compliance documents. The portal keeps timing out when I try to upload files larger than 5MB.", date: "Jan 23" },
      { id: 10, sender: "admin", author: "Emily Rodriguez", text: "I'm sorry for the inconvenience. We're aware of the upload size limitation. Could you try compressing the files or splitting them into smaller parts?", date: "Jan 23" },
      { id: 11, sender: "client", author: "Robert Williams", text: "I tried that but some documents can't be split. Is there an alternative way to submit them?", date: "Jan 23" },
    ],
  },
  {
    id: "TKT-005",
    title: "Account setup assistance",
    client: "Lisa Anderson",
    priority: "Low",
    status: "Resolved",
    created: "2026-01-22",
    assignedTo: "Emily Rodriguez",
    messages: [
      { id: 12, sender: "client", author: "Lisa Anderson", text: "Hi, I need help setting up my account. I'm not sure how to configure the tax settings.", date: "Jan 22" },
      { id: 13, sender: "admin", author: "Emily Rodriguez", text: "Sure! Go to Settings > Tax Configuration. I've also sent you a step-by-step guide via email.", date: "Jan 22" },
      { id: 14, sender: "client", author: "Lisa Anderson", text: "Thank you for your help! That worked perfectly.", date: "Jan 22" },
    ],
  },
  {
    id: "TKT-006",
    title: "Tax filing query",
    client: "Michael Chen",
    priority: "Medium",
    status: "In Progress",
    created: "2026-01-21",
    assignedTo: "Emily Rodriguez",
    messages: [
      { id: 15, sender: "client", author: "Michael Chen", text: "I have questions about the tax filing deadline. Is there any extension available for this quarter?", date: "Jan 21" },
      { id: 16, sender: "admin", author: "Emily Rodriguez", text: "The standard deadline is March 31st. However, you can apply for an extension through the portal. Would you like me to guide you through the process?", date: "Jan 21" },
    ],
  },
];

const ASSIGNEES = [
  "Emily Rodriguez",
  "James Carter",
  "Sarah Mitchell",
  "David Lee",
  "Unassigned",
];

// ── Custom Select ──────────────────────────────────────────────────────────
const CustomSelect: React.FC<{
  value: string;
  options: string[];
  onChange: (val: string) => void;
}> = ({ value, options, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex w-full items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-normal text-gray-800 transition-all hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-gray-600"
      >
        <span>{value}</span>
        <LuChevronDown className={`h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-99999 mt-1.5 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-theme-lg dark:border-gray-700 dark:bg-gray-800">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => { onChange(opt); setOpen(false); }}
              className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${
                opt === value
                  ? "bg-gray-100 text-gray-900 dark:bg-gray-700/60 dark:text-white"
                  : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/40"
              }`}
            >
              <span>{opt}</span>
              {opt === value && <LuCheck className="h-4 w-4 shrink-0 text-gray-500 dark:text-gray-400" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Edit Ticket Modal ───────────────────────────────────────────────────────
const EditTicketModal: React.FC<{
  ticket: Ticket;
  onClose: () => void;
  onSave: (updated: Ticket) => void;
}> = ({ ticket, onClose, onSave }) => {
  const [title, setTitle] = useState(ticket.title);
  const [priority, setPriority] = useState<TicketPriority>(ticket.priority);
  const [status, setStatus] = useState<TicketStatus>(ticket.status);
  const [assignedTo, setAssignedTo] = useState(ticket.assignedTo);

  const handleUpdate = () => {
    onSave({ ...ticket, title: title.trim() || ticket.title, priority, status, assignedTo });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-99999 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900">

        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <LuPencil className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Edit Ticket</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Update the details of the selected ticket</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-colors"
          >
            <LuX className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <div>
            <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-2 h-11 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">Priority</label>
            <div className="mt-2">
              <CustomSelect
                value={priority}
                options={["High", "Medium", "Low"]}
                onChange={(val) => setPriority(val as TicketPriority)}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">Status</label>
            <div className="mt-2">
              <CustomSelect
                value={status}
                options={["Open", "In Progress", "Resolved"]}
                onChange={(val) => setStatus(val as TicketStatus)}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">Assigned To</label>
            <div className="mt-2">
              <CustomSelect
                value={assignedTo}
                options={ASSIGNEES}
                onChange={(val) => setAssignedTo(val)}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <button
            onClick={handleUpdate}
            className="w-full rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-600"
          >
            Update Ticket
          </button>
        </div>
      </div>
    </div>
  );
};

const autoReplies = [
  "Thank you for your response. I'll review and get back to you shortly.",
  "Understood. Let me check on that for you right away.",
  "I appreciate the quick reply. I'll update the ticket status accordingly.",
  "Got it. Is there anything else you need help with?",
];

// ── Component ──────────────────────────────────────────────────────────────────
const AdminSupportTicketsContent: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const replyTimeouts = useRef<number[]>([]);

  const openCount = tickets.filter((t) => t.status === "Open").length;
  const inProgressCount = tickets.filter((t) => t.status === "In Progress").length;
  const resolvedCount = tickets.filter((t) => t.status === "Resolved").length;

  const filteredTickets = useMemo(() => {
    if (!searchQuery.trim()) return tickets;
    const q = searchQuery.toLowerCase();
    return tickets.filter(
      (t) =>
        t.id.toLowerCase().includes(q) ||
        t.title.toLowerCase().includes(q) ||
        t.client.toLowerCase().includes(q) ||
        t.assignedTo.toLowerCase().includes(q)
    );
  }, [searchQuery, tickets]);

  // Live ticket from state (stays in sync with messages)
  const currentTicket = useMemo(() => {
    if (!activeTicketId) return null;
    return tickets.find((t) => t.id === activeTicketId) ?? null;
  }, [activeTicketId, tickets]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentTicket?.messages.length]);

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      replyTimeouts.current.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (activeTicketId) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [activeTicketId]);

  const handleOpenTicket = (ticket: Ticket) => {
    setActiveTicketId(ticket.id);
    setMessageInput("");
  };

  const handleCloseModal = () => {
    setActiveTicketId(null);
    setMessageInput("");
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = messageInput.trim();
    if (!trimmed || !currentTicket) return;

    const ticketId = currentTicket.id;
    const clientName = currentTicket.client;
    const lastDate = currentTicket.messages[currentTicket.messages.length - 1]?.date ?? "Today";

    const newMsg: Message = {
      id: Date.now(),
      sender: "admin",
      author: "Emily Rodriguez",
      text: trimmed,
      date: lastDate,
    };

    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId ? { ...t, messages: [...t.messages, newMsg] } : t
      )
    );
    setMessageInput("");

    // Auto-reply from client
    const timeoutId = window.setTimeout(() => {
      const replyText = autoReplies[Math.floor(Math.random() * autoReplies.length)];
      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticketId
            ? {
                ...t,
                messages: [
                  ...t.messages,
                  {
                    id: Date.now() + 1,
                    sender: "client",
                    author: clientName,
                    text: replyText,
                    date: lastDate,
                  },
                ],
              }
            : t
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Support Tickets</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Manage client support requests and issues</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-600 self-start sm:self-auto">
          <LuPlus className="h-4 w-4" />
          New Ticket
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-theme-sm">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Open Tickets</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-3">{openCount}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Awaiting response</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-theme-sm">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">In Progress</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-3">{inProgressCount}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Being worked on</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-theme-sm">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Resolved</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-3">{resolvedCount}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">This week</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white relative max-w-[720px] lg:max-w-[680px] xl:max-w-full dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-theme-sm">
        {/* Search */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="relative max-w-md">
            <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:placeholder:text-gray-500"
            />
          </div>
        </div>

        {/* Table content */}
        <div className="max-w-[720px] lg:max-w-[700px] xl:max-w-full overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                {["ID", "Title", "Client", "Priority", "Status", "Created", "Assigned To", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-sm text-gray-400 dark:text-gray-500">
                    No tickets found
                  </td>
                </tr>
              ) : (
                filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{ticket.id}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{ticket.title}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{ticket.client}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${priorityStyles[ticket.priority]}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${statusStyles[ticket.status]}`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{ticket.created}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{ticket.assignedTo}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingTicket(ticket)}
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-colors"
                        >
                          <LuPencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleOpenTicket(ticket)}
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-colors"
                        >
                          <LuEye className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Edit Ticket Modal ─────────────────────────────────────────────── */}
      {editingTicket && (
        <EditTicketModal
          ticket={editingTicket}
          onClose={() => setEditingTicket(null)}
          onSave={(updated) => {
            setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
            setEditingTicket(null);
          }}
        />
      )}

      {/* ── Ticket Conversation Modal ──────────────────────────────────────── */}
      {currentTicket && (
        <div className="fixed inset-0 z-99999 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-gray-400/50 backdrop-blur-[7px]"
            onClick={handleCloseModal}
          />

          {/* Modal */}
          <div
            className="relative w-full max-w-lg mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-theme-xl flex flex-col"
            style={{ maxHeight: "calc(100vh - 64px)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">{currentTicket.id}</h2>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${priorityStyles[currentTicket.priority]}`}>
                    {currentTicket.priority}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${statusStyles[currentTicket.status]}`}>
                    {currentTicket.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {currentTicket.title} - {currentTicket.client}
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-colors flex-shrink-0 ml-4"
              >
                <LuX className="h-5 w-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar min-h-0" style={{ maxHeight: "400px" }}>
              <div className="space-y-4">
                {currentTicket.messages.map((msg) => {
                  const isAdmin = msg.sender === "admin";
                  return (
                    <div key={msg.id}>
                      <div className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                        {/* Client icon */}
                        {!isAdmin && (
                          <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 flex-shrink-0 mr-3 mt-1">
                            <FaRegUser className="h-3.5 w-3.5" />
                          </div>
                        )}

                        <div className="max-w-[80%]">
                          <div
                            className={`rounded-2xl px-4 py-3 ${
                              isAdmin
                                ? "bg-brand-500 text-white rounded-br-md"
                                : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-md"
                            }`}
                          >
                            <p className={`text-xs font-semibold mb-1 ${isAdmin ? "text-white/80" : "text-gray-700 dark:text-gray-300"}`}>
                              {msg.author}
                            </p>
                            <p className="text-sm leading-relaxed">{msg.text}</p>
                          </div>
                          <p className={`text-[11px] text-gray-400 dark:text-gray-500 mt-1.5 ${isAdmin ? "text-right" : ""}`}>
                            {msg.date}
                          </p>
                        </div>

                        {/* Admin icon */}
                        {isAdmin && (
                          <div className="h-8 w-8 rounded-full bg-brand-100 dark:bg-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400 flex-shrink-0 ml-3 mt-1">
                            <FaRegUser className="h-3.5 w-3.5" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Message Input */}
            <div className="border-t border-gray-200 dark:border-gray-800 px-6 py-4 flex-shrink-0">
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
                  className="flex-1 h-11 rounded-lg border border-gray-200 bg-gray-50 px-4 text-sm text-gray-700 placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:placeholder:text-gray-500"
                />

                <button
                  type="submit"
                  disabled={!messageInput.trim()}
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                >
                  <LuSend className="h-4 w-4" />
                  Send
                </button>
              </form>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2">
                Press Enter to send, Shift + Enter for new line
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSupportTicketsContent;
