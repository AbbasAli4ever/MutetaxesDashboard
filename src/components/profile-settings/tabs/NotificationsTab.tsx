"use client";
import React, { useState } from "react";
import { LuBell } from "react-icons/lu";

interface ToggleItem {
  title: string;
  description: string;
  defaultEnabled?: boolean;
}

const emailNotifications: ToggleItem[] = [
  {
    title: "New Reports Available",
    description: "Notify when new financial or tax reports are uploaded",
    defaultEnabled: true,
  },
  {
    title: "Upcoming Deadlines",
    description: "Remind me of tax and compliance deadlines",
    defaultEnabled: true,
  },
  {
    title: "Messages from Accountant",
    description: "Notify when you receive new messages",
    defaultEnabled: true,
  },
];

const smsNotifications: ToggleItem[] = [
  {
    title: "Urgent Deadline Alerts",
    description: "SMS alerts for critical deadlines (7 days or less)",
    defaultEnabled: false,
  },
  {
    title: "Payment Reminders",
    description: "SMS reminders for upcoming tax payments",
    defaultEnabled: true,
  },
];

const ToggleRow: React.FC<ToggleItem> = ({
  title,
  description,
  defaultEnabled = false,
}) => {
  const [enabled, setEnabled] = useState(defaultEnabled);

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
          <LuBell className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {title}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {description}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setEnabled((prev) => !prev)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          enabled
            ? "bg-[#4560ff] dark:bg-[#4560ff]"
            : "bg-gray-200 dark:bg-gray-700"
        }`}
        aria-pressed={enabled}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
            enabled ? "translate-x-5.5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
};

const NotificationsTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Email Notifications
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Choose what updates you want to receive via email
        </p>
        <div className="mt-5 space-y-4">
          {emailNotifications.map((item) => (
            <ToggleRow key={item.title} {...item} />
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          SMS Notifications
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Receive important alerts via SMS
        </p>
        <div className="mt-5 space-y-4">
          {smsNotifications.map((item) => (
            <ToggleRow key={item.title} {...item} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotificationsTab;
