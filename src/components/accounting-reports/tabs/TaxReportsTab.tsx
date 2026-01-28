"use client";
import React from "react";
import ReportList, { ReportItem } from "../ReportList";
import ReportsCallout from "../ReportsCallout";

const taxReports: ReportItem[] = [
  {
    name: "Profits Tax Computation",
    period: "2024/25",
    format: "PDF",
    size: "312 KB",
    date: "3/1/2026",
    category: "tax",
  },
  {
    name: "Tax Filing Summary",
    period: "2024/25",
    format: "PDF",
    size: "156 KB",
    date: "3/1/2026",
    category: "tax",
  },
  {
    name: "Tax Supporting Schedules",
    period: "2024/25",
    format: "Excel",
    size: "423 KB",
    date: "3/1/2026",
    category: "tax",
  },
];

const TaxReportsTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <ReportList
        title="Tax Reports"
        description="Profits tax computations, filing summaries, and supporting schedules"
        items={taxReports}
      />

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
          Tax Computation Summary (2024/25)
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Profits Tax calculation breakdown
        </p>
        <div className="mt-5 space-y-3 text-sm text-gray-600 dark:text-gray-300">
          <div className="flex items-center justify-between">
            <span>Net Profit (per accounts)</span>
            <span className="font-semibold text-gray-800 dark:text-white">
              HKD 4,500,000
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Add: Disallowable Items</span>
            <span className="font-semibold text-gray-800 dark:text-white">
              HKD 250,000
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Less: Tax Allowances</span>
            <span className="font-semibold text-gray-800 dark:text-white">
              HKD 180,000
            </span>
          </div>
          <div className="pt-3 mt-3 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-900 dark:text-white">
                Assessable Profit
              </span>
              <span className="font-semibold text-gray-900 dark:text-white">
                HKD 4,570,000
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span>Tax Payable (16.5%)</span>
              <span className="font-semibold text-blue-600">
                HKD 754,050
              </span>
            </div>
          </div>
        </div>
      </div>

      <ReportsCallout />
    </div>
  );
};

export default TaxReportsTab;
