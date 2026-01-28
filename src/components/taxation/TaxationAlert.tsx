"use client";
import React from "react";
import { LuTriangleAlert } from "react-icons/lu";

const TaxationAlert: React.FC = () => {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50/70 p-6 dark:border-red-900/40 dark:bg-red-900/10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300">
          <LuTriangleAlert className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            Urgent: Tax Filing Deadline Approaching
          </h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Your Profits Tax Return for 2024/25 is due on January 31, 2026.
            Please ensure all necessary documents are submitted to your
            accountant as soon as possible.
          </p>
          <button className="mt-4 inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700">
            Contact Accountant Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaxationAlert;
