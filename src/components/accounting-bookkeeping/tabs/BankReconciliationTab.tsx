"use client";
import React from "react";
import { FaRegCircleCheck, FaRegClock } from "react-icons/fa6";
import { IconType } from "react-icons";

type ReconciliationStatus = "reconciled" | "pending";

interface BankAccount {
  name: string;
  account: string;
  lastReconciled: string;
  balance: string;
  status: ReconciliationStatus;
}

const bankAccounts: BankAccount[] = [
  {
    name: "HSBC - Main Operating Account",
    account: "****1234",
    lastReconciled: "31/12/2025",
    balance: "HKD 1,850,000",
    status: "reconciled",
  },
  {
    name: "Standard Chartered - Savings Account",
    account: "****5678",
    lastReconciled: "31/12/2025",
    balance: "HKD 600,000",
    status: "reconciled",
  },
  {
    name: "Bank of China - HKD Account",
    account: "****9012",
    lastReconciled: "28/12/2025",
    balance: "HKD 0",
    status: "pending",
  },
];

const getStatusConfig = (status: ReconciliationStatus): {
  label: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  iconColor: string;
  icon: IconType;
} => {
  switch (status) {
    case "pending":
      return {
        label: "pending",
        bgColor: "bg-orange-50 dark:bg-orange-500/10",
        textColor: "text-orange-600 dark:text-orange-400",
        borderColor: "border-orange-200 dark:border-orange-500/20",
        iconColor: "text-orange-500",
        icon: FaRegClock,
      };
    case "reconciled":
    default:
      return {
        label: "reconciled",
        bgColor: "bg-green-50 dark:bg-green-500/10",
        textColor: "text-green-600 dark:text-green-400",
        borderColor: "border-green-200 dark:border-green-500/20",
        iconColor: "text-green-500",
        icon: FaRegCircleCheck,
      };
  }
};

const BankReconciliationTab: React.FC = () => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
        Bank Reconciliation
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Status of bank account reconciliations
      </p>

      <div className="space-y-3">
        {bankAccounts.map((account, index) => {
          const statusConfig = getStatusConfig(account.status);
          const StatusIcon = statusConfig.icon;

          return (
            <div
              key={`${account.name}-${index}`}
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
                    {account.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>Account: {account.account}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                    <span>Last reconciled: {account.lastReconciled}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {account.balance}
                </p>
                <span
                  className={`mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${statusConfig.bgColor} ${statusConfig.textColor} ${statusConfig.borderColor}`}
                >
                  {statusConfig.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BankReconciliationTab;
