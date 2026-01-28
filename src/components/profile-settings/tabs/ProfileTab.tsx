"use client";
import React from "react";
import {
  LuBriefcase,
  LuBuilding2,
  LuMail,
  LuPhone,
  LuUser,
} from "react-icons/lu";
import { FaRegUser } from "react-icons/fa";


const ProfileTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Personal Information
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Update your personal details
        </p>

        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xl font-semibold">
              D
            </div>
            <div>
              <button className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800">
                Change Photo
              </button>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                JPG, PNG or GIF (max 2MB)
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Full Name
            </label>
            <div className="relative mt-2">
              <FaRegUser className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                defaultValue="David Wong"
                className="h-11 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm text-gray-700 shadow-theme-xs focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Email Address
            </label>
            <div className="relative mt-2">
              <LuMail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                defaultValue="SUFIANASLAM@GMAIL.COM"
                className="h-11 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm text-gray-700 shadow-theme-xs focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Phone Number
            </label>
            <div className="relative mt-2">
              <LuPhone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                defaultValue="+852 9876 5432"
                className="h-11 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm text-gray-700 shadow-theme-xs focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Job Title
            </label>
            <div className="relative mt-2">
              <LuBriefcase className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                defaultValue="Managing Director"
                className="h-11 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm text-gray-700 shadow-theme-xs focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700">
            Save Changes
          </button>
          <button className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800">
            Cancel
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Company Information
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Your company details (managed by your accountant)
        </p>

        <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="flex items-start gap-3">
            <LuBuilding2 className="mt-0.5 h-4 w-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Company Name
              </p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Tech Innovations Ltd
              </p>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Business Registration Number
            </p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              12345678-000-01-26-5
            </p>
          </div>
          <div>
            <div className="flex items-start gap-3">
            <FaRegUser className="mt-0.5 h-4 w-4 text-gray-400" />
            <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Account Manager
            </p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              Emily Chan, CPA
            </p>
            </div>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Account Status
            </p>
            <span className="mt-1 inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
              Active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileTab;
