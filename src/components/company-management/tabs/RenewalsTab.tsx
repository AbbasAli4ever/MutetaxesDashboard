"use client";
import React from "react";
import { FaRegClock, FaRegCircleCheck } from "react-icons/fa6";
import { RiErrorWarningLine } from "react-icons/ri";
import { IconType } from "react-icons";

type RenewalStatus = "upcoming" | "pending" | "current";

interface Renewal {
  name: string;
  dueDate: string;
  amount: string;
  status: RenewalStatus;
}

// Mock data for renewals
const renewals: Renewal[] = [
  {
    name: "Business Registration",
    dueDate: "30/4/2026",
    amount: "HKD 2,200",
    status: "upcoming",
  },
  {
    name: "Annual Return Filing",
    dueDate: "1/3/2026",
    amount: "HKD 105",
    status: "pending",
  },
  {
    name: "Registered Office Renewal",
    dueDate: "31/12/2026",
    amount: "HKD 3,600",
    status: "current",
  },
];

const getStatusConfig = (status: RenewalStatus): {
  label: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  iconColor: string;
  icon: IconType;
} => {
  switch (status) {
    case "upcoming":
      return {
        label: "upcoming",
        bgColor: "bg-blue-50 dark:bg-blue-500/10",
        textColor: "text-blue-600 dark:text-blue-400",
        borderColor: "border-blue-200 dark:border-blue-500/20",
        iconColor: "text-blue-500",
        icon: FaRegClock,
      };
    case "pending":
      return {
        label: "pending",
        bgColor: "bg-amber-50 dark:bg-amber-500/10",
        textColor: "text-amber-600 dark:text-amber-400",
        borderColor: "border-amber-200 dark:border-amber-500/20",
        iconColor: "text-amber-500",
        icon: RiErrorWarningLine,
      };
    case "current":
      return {
        label: "current",
        bgColor: "bg-green-50 dark:bg-green-500/10",
        textColor: "text-green-600 dark:text-green-400",
        borderColor: "border-green-200 dark:border-green-500/20",
        iconColor: "text-green-500",
        icon: FaRegCircleCheck,
      };
  }
};

const RenewalsTab: React.FC = () => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          Renewals & Compliance
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Track statutory renewals and compliance requirements
        </p>
      </div>

      {/* Renewals List */}
      <div className="space-y-3">
        {renewals.map((renewal, index) => {
          const statusConfig = getStatusConfig(renewal.status);
          const StatusIcon = statusConfig.icon;

          return (
            <div
              key={index}
              className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`shrink-0 w-10 h-10 rounded-full ${statusConfig.bgColor} flex items-center justify-center`}
                >
                  <StatusIcon className={`w-5 h-5 ${statusConfig.iconColor}`} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {renewal.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>Due: {renewal.dueDate}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                    <span>{renewal.amount}</span>
                  </div>
                </div>
              </div>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${statusConfig.bgColor} ${statusConfig.textColor} ${statusConfig.borderColor}`}
              >
                {statusConfig.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RenewalsTab;
