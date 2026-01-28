"use client";
import React from "react";
import { FiFileText } from "react-icons/fi";

interface Activity {
  id: number;
  title: string;
  description: string;
  date: string;
  tag: string;
}

const activities: Activity[] = [
  {
    id: 1,
    title: "Q4 2025 Financial Reports",
    description: "Profit & Loss and Balance Sheet uploaded",
    date: "5 January 2026",
    tag: "report",
  },
  {
    id: 2,
    title: "Tax Computation Completed",
    description: "Profits Tax computation for 2024/25",
    date: "3 January 2026",
    tag: "tax",
  },
  {
    id: 3,
    title: "Bank Reconciliation",
    description: "December 2025 reconciliation completed",
    date: "28 December 2025",
    tag: "accounting",
  },
];

export default function RecentActivities() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] h-full flex flex-col">
      {/* Header */}
      <div className="mb-1">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
          Recent Activities
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Latest updates and reports
        </p>
      </div>

      {/* Activities List */}
      <div className="mt-5 space-y-3 flex-1">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start gap-3 rounded-xl border border-gray-200 p-3 dark:border-gray-700">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
              <FiFileText className="h-5 w-5 text-emerald-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-medium text-gray-800 dark:text-white">
                  {activity.title}
                </h4>
                <span className="inline-flex items-center rounded-md border border-gray-200 bg-white px-2 py-0.5 text-xs font-medium text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                  {activity.tag}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {activity.description}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {activity.date}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
