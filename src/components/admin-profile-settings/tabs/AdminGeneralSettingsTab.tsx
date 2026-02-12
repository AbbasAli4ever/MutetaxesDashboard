"use client";
import React, { useState } from "react";

const AdminGeneralSettingsTab: React.FC = () => {
  const [systemName, setSystemName] = useState("Registration Management System");
  const [supportEmail, setSupportEmail] = useState("support@company.com");
  const [timeZone, setTimeZone] = useState("UTC-05:00 (Eastern Time)");

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          General Settings
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Configure system-wide settings
        </p>

        <div className="mt-6 space-y-5">
          <div>
            <label className="text-sm font-semibold text-gray-900 dark:text-white">
              System Name
            </label>
            <input
              type="text"
              value={systemName}
              onChange={(e) => setSystemName(e.target.value)}
              className="mt-2 h-11 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 text-sm text-gray-700 shadow-theme-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-900 dark:text-white">
              Support Email
            </label>
            <input
              type="email"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              className="mt-2 h-11 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 text-sm text-gray-700 shadow-theme-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-900 dark:text-white">
              Time Zone
            </label>
            <select
              value={timeZone}
              onChange={(e) => setTimeZone(e.target.value)}
              className="mt-2 h-11 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 text-sm text-gray-700 shadow-theme-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            >
              <option value="UTC-12:00 (Baker Island)">UTC-12:00 (Baker Island)</option>
              <option value="UTC-08:00 (Pacific Time)">UTC-08:00 (Pacific Time)</option>
              <option value="UTC-07:00 (Mountain Time)">UTC-07:00 (Mountain Time)</option>
              <option value="UTC-06:00 (Central Time)">UTC-06:00 (Central Time)</option>
              <option value="UTC-05:00 (Eastern Time)">UTC-05:00 (Eastern Time)</option>
              <option value="UTC+00:00 (GMT)">UTC+00:00 (GMT)</option>
              <option value="UTC+01:00 (Central European Time)">UTC+01:00 (Central European Time)</option>
              <option value="UTC+05:30 (India Standard Time)">UTC+05:30 (India Standard Time)</option>
              <option value="UTC+08:00 (Hong Kong Time)">UTC+08:00 (Hong Kong Time)</option>
              <option value="UTC+09:00 (Japan Standard Time)">UTC+09:00 (Japan Standard Time)</option>
            </select>
          </div>
        </div>

        <button className="mt-6 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-600">
          Save Changes
        </button>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          System Preferences
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Adjust system behavior and defaults
        </p>

        <div className="mt-5 space-y-4">
          {[
            {
              label: "Auto-approve Registrations",
              description: "Automatically approve new registrations after review",
            },
            {
              label: "Enable Audit Logging",
              description: "Log all admin actions for compliance purposes",
            },
            {
              label: "Maintenance Mode",
              description: "Temporarily disable user access for system updates",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 p-4 dark:border-gray-700"
            >
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {item.label}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {item.description}
                </p>
              </div>
              <ToggleSwitch defaultEnabled={idx === 1} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ToggleSwitch: React.FC<{ defaultEnabled?: boolean }> = ({
  defaultEnabled = false,
}) => {
  const [enabled, setEnabled] = useState(defaultEnabled);
  return (
    <button
      type="button"
      onClick={() => setEnabled((prev) => !prev)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-700"
      }`}
      aria-pressed={enabled}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
          enabled ? "translate-x-5.5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
};

export default AdminGeneralSettingsTab;
