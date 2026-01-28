"use client";
import React from "react";
import { FaArrowTrendUp, FaArrowTrendDown } from "react-icons/fa6";

// Mock data for recent transactions
const transactions = [
  {
    id: 1,
    title: "Software License Renewal",
    category: "Operating Expenses",
    date: "28/12/2025",
    amount: "HKD 25,000",
    type: "expense" as const,
  },
  {
    id: 2,
    title: "Client Payment - ABC Corp",
    category: "Revenue",
    date: "27/12/2025",
    amount: "HKD 185,000",
    type: "income" as const,
  },
  {
    id: 3,
    title: "Office Rent - January",
    category: "Rent",
    date: "26/12/2025",
    amount: "HKD 45,000",
    type: "expense" as const,
  },
  {
    id: 4,
    title: "Consulting Services - XYZ Ltd",
    category: "Revenue",
    date: "24/12/2025",
    amount: "HKD 95,000",
    type: "income" as const,
  },
  {
    id: 5,
    title: "Employee Salaries",
    category: "Payroll",
    date: "20/12/2025",
    amount: "HKD 350,000",
    type: "expense" as const,
  },
];

const RecentTransactionsTab: React.FC = () => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
        Recent Transactions
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Latest income and expense entries
      </p>

      <div className="space-y-3">
        {transactions.map((transaction) => (
          <div
            key={transaction.id}
            className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center gap-4">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  transaction.type === "income"
                    ? "bg-green-50 dark:bg-green-500/10"
                    : "bg-red-50 dark:bg-red-500/10"
                }`}
              >
                {transaction.type === "income" ? (
                  <FaArrowTrendUp className="w-4 h-4 text-green-500" />
                ) : (
                  <FaArrowTrendDown className="w-4 h-4 text-red-500" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {transaction.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {transaction.category} • {transaction.date}
                </p>
              </div>
            </div>
            <span
              className={`text-sm font-semibold ${
                transaction.type === "income"
                  ? "text-green-500"
                  : "text-red-500"
              }`}
            >
              {transaction.type === "income" ? "+" : "-"}
              {transaction.amount}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentTransactionsTab;
