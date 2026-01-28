"use client";
import React from "react";
import { LuActivity, LuCircleCheck } from "react-icons/lu";

const activities = [
  {
    title: "Downloaded Q4 2025 Financial Reports",
    date: "2026-01-05 14:30",
    device: "Chrome on Windows",
    ip: "123.45.67.89",
  },
  {
    title: "Viewed Tax Computation 2024/25",
    date: "2026-01-03 11:20",
    device: "Safari on iPhone",
    ip: "123.45.67.89",
  },
  {
    title: "Sent message to accountant",
    date: "2026-01-03 10:15",
    device: "Chrome on Windows",
    ip: "123.45.67.89",
  },
  {
    title: "Logged in",
    date: "2026-01-03 10:05",
    device: "Chrome on Windows",
    ip: "123.45.67.89",
  },
  {
    title: "Downloaded Business Registration Certificate",
    date: "2025-12-28 16:45",
    device: "Chrome on Windows",
    ip: "123.45.67.89",
  },
];

const ActivityLogTab: React.FC = () => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
        Recent Activity
      </h2>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Your account activity and login history
      </p>

      <div className="mt-6 space-y-4">
        {activities.map((activity) => (
          <div
            key={activity.title}
            className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-gray-200 p-4 dark:border-gray-700"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                <LuActivity className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {activity.title}
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {activity.date} • {activity.device} • IP: {activity.ip}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-emerald-600">
              <LuCircleCheck className="h-5 w-5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityLogTab;
