"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { LuCheck, LuChevronDown } from "react-icons/lu";
import { Modal } from "@/components/ui/modal";
import { useModal } from "@/hooks/useModal";
import { MdOutlineAttachFile, MdOutlineSend } from "react-icons/md";

type TicketStatus = "open" | "in-progress" | "resolved";
type TicketPriority = "high" | "medium" | "low";

interface TicketItem {
  id: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: string;
  created: string;
  updated: string;
}

const tickets: TicketItem[] = [
  {
    id: "TKT-001",
    subject: "Unable to download tax computation",
    status: "open",
    priority: "high",
    category: "Technical Issue",
    created: "6/1/2026",
    updated: "6/1/2026",
  },
  {
    id: "TKT-002",
    subject: "Request for meeting to discuss tax planning",
    status: "in-progress",
    priority: "medium",
    category: "General Inquiry",
    created: "4/1/2026",
    updated: "5/1/2026",
  },
  {
    id: "TKT-003",
    subject: "Question about director fees",
    status: "resolved",
    priority: "low",
    category: "Accounting Query",
    created: "28/12/2025",
    updated: "30/12/2025",
  },
];

interface TicketDetail extends TicketItem {
  assignedTo: string;
  description: string;
  responses: {
    author: string;
    role: string;
    message: string;
    time: string;
    variant: "light" | "primary";
  }[];
}

const ticketDetails: Record<string, TicketDetail> = {
  "TKT-001": {
    id: "TKT-001",
    subject: "Unable to download tax computation",
    status: "open",
    priority: "high",
    category: "Technical Issue",
    created: "6/1/2026",
    updated: "6/1/2026",
    assignedTo: "Emily Chan, CPA",
    description:
      "I am experiencing issues when trying to download the tax computation PDF from the Taxation module. The download button appears unresponsive and I receive no error message despite retrying on Chrome and Safari.",
    responses: [
      {
        author: "Emily Chan, CPA",
        role: "Support",
        message:
          "Thank you for reporting this issue. Our technical team is investigating the problem. In the meantime, I can email you the tax computation directly. Would that work for you?",
        time: "2026-01-06 10:45 AM",
        variant: "light",
      },
      {
        author: "David Wong",
        role: "Client",
        message:
          "Yes, that would be great. Please send it to my email. Thank you!",
        time: "2026-01-06 11:20 AM",
        variant: "primary",
      },
    ],
  },
};

const statusStyles: Record<
  TicketStatus,
  { label: string; bg: string; text: string }
> = {
  open: {
    label: "open",
    bg: "bg-red-50 dark:bg-red-500/10",
    text: "text-red-600 dark:text-red-400",
  },
  "in-progress": {
    label: "in-progress",
    bg: "bg-amber-50 dark:bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
  },
  resolved: {
    label: "resolved",
    bg: "bg-green-50 dark:bg-green-500/10",
    text: "text-green-600 dark:text-green-400",
  },
};

const priorityStyles: Record<
  TicketPriority,
  { label: string; bg: string; text: string }
> = {
  high: {
    label: "high",
    bg: "bg-red-50 dark:bg-red-500/10",
    text: "text-red-600 dark:text-red-400",
  },
  medium: {
    label: "medium",
    bg: "bg-amber-50 dark:bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
  },
  low: {
    label: "low",
    bg: "bg-blue-50 dark:bg-blue-500/10",
    text: "text-blue-600 dark:text-blue-400",
  },
};

const SupportTicketsTab: React.FC = () => {
  const categoryOptions = [
    { value: "technical", label: "Technical Issue" },
    { value: "accounting", label: "Accounting Query" },
    { value: "tax", label: "Tax Question" },
    { value: "general", label: "General Inquiry" },
    { value: "document", label: "Document Request" },
  ];
  const priorityOptions = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
  ];

  const [selectedCategory, setSelectedCategory] = useState(
    categoryOptions[0]
  );
  const [selectedPriority, setSelectedPriority] = useState(
    priorityOptions[0]
  );
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isPriorityOpen, setIsPriorityOpen] = useState(false);
  const categoryRef = useRef<HTMLDivElement | null>(null);
  const priorityRef = useRef<HTMLDivElement | null>(null);

  const { isOpen, openModal, closeModal } = useModal();
  const [activeTicket, setActiveTicket] = useState<TicketDetail | null>(null);

  const handleViewDetails = (ticket: TicketItem) => {
    setActiveTicket(ticketDetails[ticket.id] || null);
    openModal();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (categoryRef.current?.contains(target)) {
        return;
      }
      if (priorityRef.current?.contains(target)) {
        return;
      }
      setIsCategoryOpen(false);
      setIsPriorityOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const modalContent = useMemo(() => {
    if (!activeTicket) return null;

    const status = statusStyles[activeTicket.status];
    const priority = priorityStyles[activeTicket.priority];

    return (
      <div className="flex h-[calc(100vh-32px)] flex-col overflow-hidden rounded-[30px] bg-white shadow-[0px_25px_80px_rgba(15,23,42,0.15)] dark:bg-gray-900">
        <div className="sticky top-0 z-20 border-b border-gray-200 bg-white px-6 py-5 dark:border-gray-800 dark:bg-gray-900">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Support Ticket Details
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              View and manage your support ticket.
            </p>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                {activeTicket.id}
              </span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.text}`}
              >
                {status.label}
              </span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${priority.bg} ${priority.text}`}
              >
                {priority.label}
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6 lg:px-8 modal-scrollbar">
          <div className="space-y-5">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {activeTicket.subject}
            </h3>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 dark:border-gray-800 dark:bg-gray-800/40">
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-300">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Category
                  </p>
                  <p className="text-base font-semibold text-gray-900 dark:text-white">
                    {activeTicket.category}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Assigned To
                  </p>
                  <p className="text-base font-semibold text-gray-900 dark:text-white">
                    {activeTicket.assignedTo}
                  </p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-300">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Created
                  </p>
                  <p className="text-base font-semibold text-gray-900 dark:text-white">
                    {activeTicket.created}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Last Updated
                  </p>
                  <p className="text-base font-semibold text-gray-900 dark:text-white">
                    {activeTicket.updated}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-800 dark:text-white">
                Description
              </p>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-800/40 dark:text-gray-300">
                {activeTicket.description}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-800 dark:text-white">
                Activity & Responses
              </p>
              <div className="flex flex-col gap-3">
                {activeTicket.responses.map((response) => {
                  const alignment =
                    response.variant === "primary" ? "justify-end" : "justify-start";
                  return (
                    <div
                      key={response.time}
                      className={`flex w-full ${alignment}`}
                    >
                      <div
                        className={`flex min-w-[60%] max-w-[85%] flex-col gap-2 rounded-2xl border p-4 text-sm shadow-sm ${
                          response.variant === "primary"
                            ? "border-blue-600 bg-blue-600 text-white"
                            : "border-blue-200 bg-blue-50 text-gray-900 dark:text-white dark:bg-blue-900/30 dark:border-blue-500/30"
                        }`}
                      >
                        <p className="text-xs font-semibold">{response.author}</p>
                        <p className="text-sm leading-relaxed">{response.message}</p>
                        <p className="text-[11px] text-current/70 dark:text-white/70">
                          {response.time}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-800 dark:text-white">
                Add Response
              </p>
              <textarea
                placeholder="Type your response..."
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-blue-500 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                rows={3}
              />
              <div className="flex flex-wrap w-full justify-between items-center gap-3">
                <button className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-400 dark:border-gray-700 dark:text-gray-300">
                  <MdOutlineAttachFile className="h-4 w-4" />
                  Attach File
                </button>
                <button className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-700">
                  <MdOutlineSend className="h-4 w-4" />
                  Send Response
                </button>
              </div>
            </div>

            <div className="flex w-full justify-end flex-wrap gap-3">
              <button
                onClick={closeModal}
                className="rounded-full border border-gray-200 px-5 py-2 text-sm font-semibold text-gray-700 dark:text-white transition hover:border-gray-400"
              >
                Close
              </button>
              <button className="rounded-full border border-green-500 px-5 py-2 text-sm font-semibold text-green-600 transition hover:bg-green-50 dark:hover:bg-green-500/10">
                Mark as Resolved
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }, [activeTicket, closeModal]);

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <div className="col-span-12 xl:col-span-2 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          Support Tickets
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Track your support requests
        </p>

        <div className="space-y-4">
          {tickets.map((ticket) => {
            const status = statusStyles[ticket.status];
            const priority = priorityStyles[ticket.priority];

            return (
              <div
                key={ticket.id}
                className="rounded-xl border border-gray-200 dark:border-gray-700 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {ticket.id}
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.text}`}
                    >
                      {status.label}
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${priority.bg} ${priority.text}`}
                    >
                      {priority.label}
                    </span>
                  </div>
                  <button
                    onClick={() => handleViewDetails(ticket)}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    View Details
                  </button>
                </div>
                <h3 className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">
                  {ticket.subject}
                </h3>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <span>Category: {ticket.category}</span>
                  <span>Created: {ticket.created}</span>
                  <span>Updated: {ticket.updated}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="col-span-12 xl:col-span-1 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          Create New Ticket
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Submit a support request
        </p>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Subject
            </label>
            <input
              type="text"
              placeholder="Brief description of your issue"
              className="mt-2 h-11 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 shadow-theme-xs focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Category
            </label>
            <div className="relative mt-2" ref={categoryRef}>
              <button
                type="button"
                onClick={() => {
                  setIsCategoryOpen((open) => !open);
                  setIsPriorityOpen(false);
                }}
                className="inline-flex h-11 w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 shadow-theme-xs transition-colors hover:bg-gray-50 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                <span>{selectedCategory.label}</span>
                <LuChevronDown
                  className={`h-4 w-4 text-gray-500 transition-transform ${
                    isCategoryOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {isCategoryOpen && (
                <div className="absolute z-30 mt-2 w-full rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-900">
                  {categoryOptions.map((option) => {
                    const isSelected =
                      option.value === selectedCategory.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setSelectedCategory(option);
                          setIsCategoryOpen(false);
                        }}
                        className={`flex w-full items-center justify-between px-3 py-2 text-sm transition-colors ${
                          isSelected
                            ? "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300"
                            : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                        }`}
                      >
                        <span>{option.label}</span>
                        {isSelected && (
                          <LuCheck className="h-4 w-4 text-brand-500" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Priority
            </label>
            <div className="relative mt-2" ref={priorityRef}>
              <button
                type="button"
                onClick={() => {
                  setIsPriorityOpen((open) => !open);
                  setIsCategoryOpen(false);
                }}
                className="inline-flex h-11 w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 shadow-theme-xs transition-colors hover:bg-gray-50 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                <span>{selectedPriority.label}</span>
                <LuChevronDown
                  className={`h-4 w-4 text-gray-500 transition-transform ${
                    isPriorityOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {isPriorityOpen && (
                <div className="absolute z-20 mt-2 w-full rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-900">
                  {priorityOptions.map((option) => {
                    const isSelected =
                      option.value === selectedPriority.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setSelectedPriority(option);
                          setIsPriorityOpen(false);
                        }}
                        className={`flex w-full items-center justify-between px-3 py-2 text-sm transition-colors ${
                          isSelected
                            ? "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300"
                            : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                        }`}
                      >
                        <span>{option.label}</span>
                        {isSelected && (
                          <LuCheck className="h-4 w-4 text-brand-500" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Description
            </label>
            <textarea
              rows={4}
              placeholder="Provide details about your request..."
              className="mt-2 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 shadow-theme-xs focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            />
          </div>
          <button className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700">
            Submit Ticket
          </button>
        </div>
      </div>
      <Modal
        isOpen={isOpen && Boolean(activeTicket)}
        onClose={closeModal}
        className="max-w-[640px] m-0 h-[calc(100vh-32px)] p-0"
      >
        {modalContent}
      </Modal>
    </div>
  );
};

export default SupportTicketsTab;
