"use client";
import React from "react";
import { FaRegCircleCheck, FaRegClock } from "react-icons/fa6";
import { IconType } from "react-icons";

type BookkeepingStatus = "completed" | "in-progress";

interface BookkeepingPeriod {
  month: string;
  entries: number;
  updated: string;
  status: BookkeepingStatus;
}

const bookkeepingPeriods: BookkeepingPeriod[] = [
  {
    month: "December 2025",
    entries: 127,
    updated: "5/1/2026",
    status: "completed",
  },
  {
    month: "November 2025",
    entries: 115,
    updated: "8/12/2025",
    status: "completed",
  },
  {
    month: "October 2025",
    entries: 132,
    updated: "10/11/2025",
    status: "completed",
  },
  {
    month: "September 2025",
    entries: 118,
    updated: "12/10/2025",
    status: "completed",
  },
];

const getStatusConfig = (status: BookkeepingStatus): {
  label: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  iconColor: string;
  icon: IconType;
} => {
  switch (status) {
    case "in-progress":
      return {
        label: "in-progress",
        bgColor: "bg-blue-50 dark:bg-blue-500/10",
        textColor: "text-blue-600 dark:text-blue-400",
        borderColor: "border-blue-200 dark:border-blue-500/20",
        iconColor: "text-blue-500",
        icon: FaRegClock,
      };
    case "completed":
    default:
      return {
        label: "completed",
        bgColor: "bg-green-50 dark:bg-green-500/10",
        textColor: "text-green-600 dark:text-green-400",
        borderColor: "border-green-200 dark:border-green-500/20",
        iconColor: "text-green-500",
        icon: FaRegCircleCheck,
      };
  }
};

const BookkeepingStatusTab: React.FC = () => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
        Bookkeeping Status
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Monthly bookkeeping completion status
      </p>

      <div className="space-y-3">
        {bookkeepingPeriods.map((period, index) => {
          const statusConfig = getStatusConfig(period.status);
          const StatusIcon = statusConfig.icon;

          return (
            <div
              key={`${period.month}-${index}`}
              className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`shrink-0 w-10 h-10 rounded-full ${statusConfig.bgColor} flex items-center justify-center`}
                >
                  <StatusIcon className={`w-5 h-5 ${statusConfig.iconColor}`} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {period.month}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>{period.entries} entries</span>
                    <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                    <span>Updated: {period.updated}</span>
                  </div>
                </div>
              </div>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${statusConfig.bgColor} ${statusConfig.textColor} ${statusConfig.borderColor}`}
              >
                {statusConfig.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BookkeepingStatusTab;
