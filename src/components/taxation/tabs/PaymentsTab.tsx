"use client";
import React from "react";
import { LuCircleCheck, LuClock } from "react-icons/lu";
import { IconType } from "react-icons";

type PaymentStatus = "paid" | "pending";

interface PaymentItem {
  title: string;
  dueDate: string;
  paidDate?: string;
  amount: string;
  status: PaymentStatus;
}

const payments: PaymentItem[] = [
  {
    title: "Profits Tax - 2023/24 Final Assessment",
    dueDate: "31/12/2025",
    paidDate: "15/12/2025",
    amount: "HKD 635,250",
    status: "paid",
  },
  {
    title: "Provisional Tax - 2024/25 First Installment",
    dueDate: "30/9/2025",
    paidDate: "20/9/2025",
    amount: "HKD 377,025",
    status: "paid",
  },
  {
    title: "Provisional Tax - 2024/25 Second Installment",
    dueDate: "28/2/2026",
    amount: "HKD 377,025",
    status: "pending",
  },
];

const getStatusConfig = (
  status: PaymentStatus
): {
  label: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  iconColor: string;
  icon: IconType;
} => {
  switch (status) {
    case "paid":
      return {
        label: "paid",
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
        icon: LuClock,
      };
  }
};

const PaymentsTab: React.FC = () => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
        Tax Payments
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        History and upcoming tax payment obligations
      </p>

      <div className="space-y-4">
        {payments.map((payment) => {
          const statusConfig = getStatusConfig(payment.status);
          const StatusIcon = statusConfig.icon;

          return (
            <div
              key={payment.title}
              className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between rounded-xl border border-gray-200 dark:border-gray-700 p-4"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`shrink-0 w-10 h-10 rounded-full ${statusConfig.bgColor} flex items-center justify-center`}
                >
                  <StatusIcon className={`w-5 h-5 ${statusConfig.iconColor}`} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {payment.title}
                  </h3>
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    <span>Due: {payment.dueDate}</span>
                    {payment.paidDate ? (
                      <span className="ml-3 text-green-600">
                        Paid: {payment.paidDate}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {payment.amount}
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

export default PaymentsTab;
