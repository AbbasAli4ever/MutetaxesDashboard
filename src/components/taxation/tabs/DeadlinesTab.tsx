"use client";
import React from "react";
import { LuCalendarClock, LuClock, LuTriangleAlert } from "react-icons/lu";
import { IconType } from "react-icons";

type DeadlinePriority = "urgent" | "high" | "medium";

interface DeadlineItem {
  title: string;
  description: string;
  dueDate: string;
  remaining: string;
  priority: DeadlinePriority;
}

const deadlines: DeadlineItem[] = [
  {
    title: "Profits Tax Return Filing",
    description: "Submit Profits Tax Return for 2024/25",
    dueDate: "31/1/2026",
    remaining: "24 days remaining",
    priority: "urgent",
  },
  {
    title: "Provisional Tax Payment",
    description: "Second installment for 2024/25",
    dueDate: "28/2/2026",
    remaining: "52 days remaining",
    priority: "high",
  },
  {
    title: "Employer's Return",
    description: "IR56B forms submission",
    dueDate: "30/4/2026",
    remaining: "113 days remaining",
    priority: "medium",
  },
];

const getPriorityConfig = (
  priority: DeadlinePriority
): {
  label: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  iconColor: string;
  icon: IconType;
  accent: string;
} => {
  switch (priority) {
    case "urgent":
      return {
        label: "urgent",
        bgColor: "bg-red-50 dark:bg-red-500/10",
        textColor: "text-red-600 dark:text-red-400",
        borderColor: "border-red-200 dark:border-red-500/20",
        iconColor: "text-red-500",
        icon: LuTriangleAlert,
        accent: "text-red-500",
      };
    case "high":
      return {
        label: "high",
        bgColor: "bg-amber-50 dark:bg-amber-500/10",
        textColor: "text-amber-600 dark:text-amber-400",
        borderColor: "border-amber-200 dark:border-amber-500/20",
        iconColor: "text-amber-500",
        icon: LuClock,
        accent: "text-amber-600",
      };
    case "medium":
    default:
      return {
        label: "medium",
        bgColor: "bg-blue-50 dark:bg-blue-500/10",
        textColor: "text-blue-600 dark:text-blue-400",
        borderColor: "border-blue-200 dark:border-blue-500/20",
        iconColor: "text-blue-500",
        icon: LuCalendarClock,
        accent: "text-blue-600",
      };
  }
};

const DeadlinesTab: React.FC = () => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
        Upcoming Tax Deadlines
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Important dates for tax compliance
      </p>

      <div className="space-y-4">
        {deadlines.map((deadline) => {
          const config = getPriorityConfig(deadline.priority);
          const PriorityIcon = config.icon;

          return (
            <div
              key={deadline.title}
              className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between rounded-xl border border-gray-200 dark:border-gray-700 p-4"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`shrink-0 w-10 h-10 rounded-full ${config.bgColor} flex items-center justify-center`}
                >
                  <PriorityIcon className={`w-5 h-5 ${config.iconColor}`} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {deadline.title}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {deadline.description}
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>Due: {deadline.dueDate}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                    <span className={config.accent}>{deadline.remaining}</span>
                  </div>
                </div>
              </div>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${config.bgColor} ${config.textColor} ${config.borderColor}`}
              >
                {config.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DeadlinesTab;
