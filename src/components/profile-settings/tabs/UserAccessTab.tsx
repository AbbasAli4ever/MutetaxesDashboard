"use client";
import React from "react";
import { LuShield } from "react-icons/lu";

const users = [
  {
    name: "David Wong",
    email: "david.wong@techinnovations.hk",
    role: "Primary Admin",
    lastLogin: "2026-01-06 09:30",
    status: "active",
    initials: "D",
  },
  {
    name: "Sarah Chen",
    email: "sarah.chen@techinnovations.hk",
    role: "Viewer",
    lastLogin: "2026-01-05 15:20",
    status: "active",
    initials: "S",
  },
  {
    name: "Michael Tam",
    email: "michael.tam@techinnovations.hk",
    role: "Finance Manager",
    lastLogin: "2026-01-04 11:10",
    status: "active",
    initials: "M",
  },
];

const UserAccessTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              User Access Management
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Manage who can access your company portal
            </p>
          </div>
          <button className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700">
            Invite User
          </button>
        </div>

        <div className="mt-6 space-y-4">
          {users.map((user) => (
            <div
              key={user.email}
              className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-gray-200 p-4 dark:border-gray-700"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold">
                  {user.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {user.email}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {user.role} - Last login: {user.lastLogin}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
                  {user.status}
                </span>
                <button className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800">
                  Manage
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5 dark:border-blue-500/20 dark:bg-blue-500/10">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
            <LuShield className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              Access Control
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              You can assign different permission levels to users: Admin (full
              access), Finance Manager (accounting and tax), or Viewer (read-only
              access).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserAccessTab;
