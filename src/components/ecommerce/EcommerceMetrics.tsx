"use client";
import React from "react";
import { FaArrowTrendUp } from "react-icons/fa6";
import { FiFileText } from "react-icons/fi";
import { LuBuilding2, LuCalendar } from "react-icons/lu";

export const EcommerceMetrics = () => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      {/* Welcome Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          Welcome back, David!
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Here&apos;s what&apos;s happening with Tech Innovations Ltd
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Outstanding Tax */}
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Outstanding Tax
              </span>
              <h4 className="mt-2 text-2xl font-bold text-gray-800 dark:text-white">
                HKD 125,000
              </h4>
              <span className="mt-1 text-sm text-[#F97316]">+12%</span>
            </div>
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#FFF1E6]">
              <FaArrowTrendUp className="w-5 h-5 text-[#F97316]" />
            </div>
          </div>
        </div>

        {/* Pending Documents */}
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Pending Documents
              </span>
              <h4 className="mt-2 text-2xl font-bold text-gray-800 dark:text-white">
                3
              </h4>
              <span className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                -2
              </span>
            </div>
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#E6F4FF]">
              <FiFileText className="w-5 h-5 text-[#3B82F6]" />
            </div>
          </div>
        </div>

        {/* Active Companies */}
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Active Companies
              </span>
              <h4 className="mt-2 text-2xl font-bold text-gray-800 dark:text-white">
                3
              </h4>
              <span className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Under management
              </span>
            </div>
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#F3E8FF]">
              <LuBuilding2 className="w-5 h-5 text-[#A855F7]" />
            </div>
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Upcoming Deadlines
              </span>
              <h4 className="mt-2 text-2xl font-bold text-gray-800 dark:text-white">
                3
              </h4>
              <span className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                This month
              </span>
            </div>
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#E6FFED]">
              <LuCalendar className="w-5 h-5 text-[#22C55E]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
