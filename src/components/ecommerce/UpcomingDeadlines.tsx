"use client";
import React from "react";
import { GoAlertFill } from "react-icons/go";
import { LuClock } from "react-icons/lu";
import { FiArrowRight } from "react-icons/fi";

interface Deadline {
  id: number;
  title: string;
  dueDate: string;
  daysRemaining: number;
  isUrgent: boolean;
}

const deadlines: Deadline[] = [
  {
    id: 1,
    title: "Profits Tax Return Filing",
    dueDate: "31 January 2026",
    daysRemaining: 12,
    isUrgent: true,
  },
  {
    id: 2,
    title: "Business Registration Renewal",
    dueDate: "15 February 2026",
    daysRemaining: 27,
    isUrgent: false,
  },
  {
    id: 3,
    title: "Annual Return Filing",
    dueDate: "1 March 2026",
    daysRemaining: 41,
    isUrgent: false,
  },
];

export default function UpcomingDeadlines() {
  const pendingCount = deadlines.length;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] h-full flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between mb-1">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Upcoming Deadlines
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Important dates to remember
          </p>
        </div>
        <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {pendingCount} Pending
        </span>
      </div>

      {/* Deadlines List */}
      <div className="mt-5 space-y-3 flex-1">
        {deadlines.map((deadline) => (
          <div key={deadline.id} className="flex items-start gap-3 rounded-xl border border-gray-200 p-3 dark:border-gray-700">
            <div
              className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
                deadline.isUrgent
                  ? "bg-red-50 dark:bg-red-900/20"
                  : "bg-amber-50 dark:bg-amber-900/20"
              }`}
            >
              {deadline.isUrgent ? (
                <GoAlertFill className="h-5 w-5 text-red-500" />
              ) : (
                <LuClock className="h-5 w-5 text-amber-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-800 dark:text-white">
                {deadline.title}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Due: {deadline.dueDate}
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400">
                {deadline.daysRemaining} days remaining
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Button */}
      <button className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
        View All Deadlines
        <FiArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
