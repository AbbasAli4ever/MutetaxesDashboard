"use client";
import React from "react";
import { FiArrowRight, FiCheck } from "react-icons/fi";

interface ComplianceItem {
  id: number;
  title: string;
  nextDate: string | null;
  status: "valid" | "active" | "filed" | "pending";
}

const complianceItems: ComplianceItem[] = [
  {
    id: 1,
    title: "Business Registration",
    nextDate: "2026-04-30",
    status: "valid",
  },
  {
    id: 2,
    title: "Company Incorporation",
    nextDate: null,
    status: "active",
  },
  {
    id: 3,
    title: "Annual Return",
    nextDate: "2026-03-01",
    status: "filed",
  },
  {
    id: 4,
    title: "Audit Report",
    nextDate: null,
    status: "pending",
  },
];

const statusStyles = {
  valid: {
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  active: {
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  filed: {
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  pending: {
    bg: "bg-amber-50 dark:bg-amber-900/20",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-400",
  },
};

export default function ComplianceStatus() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] h-full flex flex-col">
      {/* Header */}
      <div className="mb-1">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
          Compliance Status
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Your company&apos;s regulatory status
        </p>
      </div>

      {/* Compliance List */}
      <div className="mt-5 space-y-3 flex-1">
        {complianceItems.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 p-3 dark:border-gray-700"
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                  item.status === "pending"
                    ? "bg-amber-50 dark:bg-amber-900/20"
                    : "bg-emerald-50 dark:bg-emerald-900/20"
                }`}
              >
                <FiCheck
                  className={`h-4 w-4 ${
                    item.status === "pending"
                      ? "text-amber-500"
                      : "text-emerald-500"
                  }`}
                />
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-800 dark:text-white">
                  {item.title}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {item.nextDate ? `Next: ${item.nextDate}` : item.status === "pending" ? "Action Required" : "Next: N/A"}
                </p>
              </div>
            </div>
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${statusStyles[item.status].bg} ${statusStyles[item.status].text} ${statusStyles[item.status].border}`}
            >
              {item.status}
            </span>
          </div>
        ))}
      </div>

      {/* Footer Button */}
      <button className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
        Manage Compliance
        <FiArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
