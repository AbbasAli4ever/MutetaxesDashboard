"use client";
import React from "react";
import { LuBell } from "react-icons/lu";

interface AnnouncementItem {
  title: string;
  description: string;
  date: string;
  tag: string;
}

const announcements: AnnouncementItem[] = [
  {
    title: "Important: Tax Filing Deadlines for 2024/25",
    description:
      "Please be reminded that Profits Tax Returns for the year of assessment 2024/25 are due by January 31, 2026. Kindly ensure all supporting documents are submitted to us by January 20, 2026.",
    date: "15 December 2025",
    tag: "Tax Updates",
  },
  {
    title: "Office Closure - Lunar New Year Holiday",
    description:
      "Our office will be closed from January 28 to February 2, 2026 for the Lunar New Year holiday. We will resume normal operations on February 3, 2026.",
    date: "1 December 2025",
    tag: "Office Announcement",
  },
  {
    title: "New Features on Client Portal",
    description:
      "We have added new features to the portal including mobile responsiveness and real-time notifications. Please update your notification preferences in your profile settings.",
    date: "20 November 2025",
    tag: "System Update",
  },
];

const AnnouncementsTab: React.FC = () => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
        Firm Announcements
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Important updates and notifications
      </p>

      <div className="space-y-4">
        {announcements.map((announcement) => (
          <div
            key={announcement.title}
            className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between rounded-xl border border-gray-200 dark:border-gray-700 p-4"
          >
            <div className="flex gap-4">
              <div className="shrink-0 w-10 h-10 rounded-full bg-green-50 dark:bg-green-500/10 flex items-center justify-center">
                <LuBell className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {announcement.title}
                </h3>
                <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                  {announcement.description}
                </p>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  {announcement.date}
                </p>
              </div>
            </div>
            <span className="inline-flex items-center rounded-full border text-nowrap border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 dark:border-gray-700 dark:text-gray-300">
              {announcement.tag}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnnouncementsTab;
