"use client";
import React from "react";
import ReportList, { ReportItem } from "../ReportList";
import ReportsCallout from "../ReportsCallout";

const financialReports: ReportItem[] = [
  {
    name: "Profit & Loss Statement",
    period: "Q4 2025",
    format: "PDF",
    size: "234 KB",
    date: "5/1/2026",
    category: "financial",
  },
  {
    name: "Statement of Financial Position",
    period: "Q4 2025",
    format: "PDF",
    size: "198 KB",
    date: "5/1/2026",
    category: "financial",
  },
  {
    name: "Trial Balance",
    period: "December 2025",
    format: "Excel",
    size: "145 KB",
    date: "5/1/2026",
    category: "financial",
  },
  {
    name: "Cash Flow Statement",
    period: "Q4 2025",
    format: "PDF",
    size: "187 KB",
    date: "5/1/2026",
    category: "financial",
  },
];

const FinancialReportsTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <ReportList
        title="Financial Reports"
        description="Profit & Loss, Balance Sheet, Trial Balance, and Cash Flow statements"
        items={financialReports}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            Latest P&L Summary
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Q4 2025 Performance
          </p>
          <div className="mt-5 space-y-3 text-sm text-gray-600 dark:text-gray-300">
            <div className="flex items-center justify-between">
              <span>Revenue</span>
              <span className="font-semibold text-gray-800 dark:text-white">
                HKD 3,750,000
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Cost of Sales</span>
              <span className="font-semibold text-gray-800 dark:text-white">
                HKD 1,500,000
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Operating Expenses</span>
              <span className="font-semibold text-gray-800 dark:text-white">
                HKD 1,125,000
              </span>
            </div>
            <div className="pt-3 mt-3 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900 dark:text-white">
                  Net Profit
                </span>
                <span className="font-semibold text-emerald-600">
                  HKD 1,125,000
                </span>
              </div>
              <p className="mt-1 text-xs text-emerald-600">
                +15.3% vs Q3 2025
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            Balance Sheet Summary
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            As of December 31, 2025
          </p>
          <div className="mt-5 space-y-3 text-sm text-gray-600 dark:text-gray-300">
            <div className="flex items-center justify-between">
              <span>Total Assets</span>
              <span className="font-semibold text-gray-800 dark:text-white">
                HKD 8,750,000
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Total Liabilities</span>
              <span className="font-semibold text-gray-800 dark:text-white">
                HKD 2,450,000
              </span>
            </div>
            <div className="pt-3 mt-3 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900 dark:text-white">
                  Shareholders' Equity
                </span>
                <span className="font-semibold text-emerald-600">
                  HKD 6,300,000
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Debt-to-Equity Ratio: 0.39
              </p>
            </div>
          </div>
        </div>
      </div>

      <ReportsCallout />
    </div>
  );
};

export default FinancialReportsTab;
