"use client";
import React from "react";
import {
  LuCircleCheck,
  LuClock,
  LuFileText,
  LuTriangleAlert,
} from "react-icons/lu";
import { MdOutlineFileDownload, MdOutlineRemoveRedEye } from "react-icons/md";
import { IconType } from "react-icons";

type FilingStatus = "pending" | "filed" | "completed";

interface FilingItem {
  title: string;
  status: FilingStatus;
  dueDate: string;
  assessableProfit: string;
  taxPayable: string;
  filedOn?: string;
}

const pendingFiling: FilingItem = {
  title: "Profits Tax Return - 2024/25",
  status: "pending",
  dueDate: "31/1/2026",
  assessableProfit: "HKD 4,570,000",
  taxPayable: "HKD 754,050",
};

const filings: FilingItem[] = [
  {
    title: "Profits Tax Return - 2023/24",
    status: "filed",
    dueDate: "31/1/2025",
    assessableProfit: "HKD 3,850,000",
    taxPayable: "HKD 635,250",
    filedOn: "15/1/2025",
  },
  {
    title: "Profits Tax Return - 2022/23",
    status: "completed",
    dueDate: "31/1/2024",
    assessableProfit: "HKD 3,250,000",
    taxPayable: "HKD 536,250",
    filedOn: "10/1/2024",
  },
];

const getStatusConfig = (
  status: FilingStatus
): {
  label: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  iconColor: string;
  icon: IconType;
} => {
  switch (status) {
    case "filed":
      return {
        label: "filed",
        bgColor: "bg-blue-50 dark:bg-blue-500/10",
        textColor: "text-blue-600 dark:text-blue-400",
        borderColor: "border-blue-200 dark:border-blue-500/20",
        iconColor: "text-blue-500",
        icon: LuFileText,
      };
    case "completed":
      return {
        label: "completed",
        bgColor: "bg-green-50 dark:bg-green-500/10",
        textColor: "text-green-600 dark:text-green-400",
        borderColor: "border-green-200 dark:border-green-500/20",
        iconColor: "text-green-500",
        icon: LuCircleCheck,
      };
    case "pending":
    default:
      return {
        label: "pending",
        bgColor: "bg-amber-50 dark:bg-amber-500/10",
        textColor: "text-amber-600 dark:text-amber-400",
        borderColor: "border-amber-200 dark:border-amber-500/20",
        iconColor: "text-amber-500",
        icon: LuTriangleAlert,
      };
  }
};

const TaxFilingsTab: React.FC = () => {
  const pendingConfig = getStatusConfig(pendingFiling.status);
  const PendingIcon = pendingConfig.icon;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
        Tax Filing Status
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Track your Profits Tax Returns and submissions
      </p>

      <div className="space-y-4">
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div
                className={`shrink-0 w-10 h-10 rounded-full ${pendingConfig.bgColor} flex items-center justify-center`}
              >
                <PendingIcon className={`w-5 h-5 ${pendingConfig.iconColor}`} />
              </div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {pendingFiling.title}
                </h3>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${pendingConfig.bgColor} ${pendingConfig.textColor}`}
                >
                  {pendingConfig.label}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Due Date
              </p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {pendingFiling.dueDate}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Assessable Profit
              </p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {pendingFiling.assessableProfit}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Tax Payable
              </p>
              <p className="text-sm font-medium text-blue-600">
                {pendingFiling.taxPayable}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Days Left
              </p>
              <p className="text-sm font-medium text-red-500">24 days</p>
            </div>
          </div>

          <div className="mt-4 border-t border-gray-100 dark:border-gray-800 pt-4">
            <button className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700">
              Contact Accountant to File
            </button>
          </div>
        </div>

        {filings.map((filing) => {
          const statusConfig = getStatusConfig(filing.status);
          const StatusIcon = statusConfig.icon;

          return (
            <div
              key={filing.title}
              className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between rounded-xl border border-gray-200 dark:border-gray-700 p-4"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`shrink-0 w-10 h-10 rounded-full ${statusConfig.bgColor} flex items-center justify-center`}
                >
                  <StatusIcon className={`w-5 h-5 ${statusConfig.iconColor}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      {filing.title}
                    </h3>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusConfig.bgColor} ${statusConfig.textColor}`}
                    >
                      {statusConfig.label}
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-1 gap-3 text-xs text-gray-500 dark:text-gray-400 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <span className="block text-gray-400">Due Date</span>
                      <span className="text-gray-900 dark:text-white">
                        {filing.dueDate}
                      </span>
                    </div>
                    <div>
                      <span className="block text-gray-400">
                        Assessable Profit
                      </span>
                      <span className="text-gray-900 dark:text-white">
                        {filing.assessableProfit}
                      </span>
                    </div>
                    <div>
                      <span className="block text-gray-400">Tax Payable</span>
                      <span className="text-blue-600">{filing.taxPayable}</span>
                    </div>
                    <div>
                      <span className="block text-gray-400">Filed On</span>
                      <span className="text-gray-900 dark:text-white">
                        {filing.filedOn}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <MdOutlineRemoveRedEye className="w-4 h-4" />
                  View
                </button>
                <button className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <MdOutlineFileDownload className="w-4 h-4" />
                  Download
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TaxFilingsTab;
