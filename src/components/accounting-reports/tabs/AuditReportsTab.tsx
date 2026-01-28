"use client";
import React from "react";
import ReportList, { ReportItem } from "../ReportList";
import ReportsCallout from "../ReportsCallout";
import { LuBadgeCheck } from "react-icons/lu";

const auditReports: ReportItem[] = [
  {
    name: "Audited Financial Statements",
    period: "FY 2024",
    format: "PDF",
    size: "1.2 MB",
    date: "15/6/2025",
    category: "audit",
  },
  {
    name: "Auditor's Report",
    period: "FY 2024",
    format: "PDF",
    size: "234 KB",
    date: "15/6/2025",
    category: "audit",
  },
  {
    name: "Management Letter",
    period: "FY 2024",
    format: "PDF",
    size: "178 KB",
    date: "15/6/2025",
    category: "audit",
  },
];

const AuditReportsTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <ReportList
        title="Audit Reports"
        description="Audited financial statements and auditor's reports"
        items={auditReports}
      />

      <div className="rounded-2xl border border-blue-100 bg-blue-50/50 dark:border-gray-800 dark:bg-white/[0.03] p-6">
        <div className="flex items-start gap-4">
          <div className="shrink-0 w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center">
            <LuBadgeCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Audit Opinion
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              The financial statements for FY 2024 received an{" "}
              <span className="text-emerald-600 font-medium">
                Unqualified Opinion
              </span>{" "}
              from our auditors. The statements present a true and fair view of
              the company's financial position.
            </p>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Audit completed by: ABC Audit Firm - Date: June 15, 2025
            </p>
          </div>
        </div>
      </div>

      <ReportsCallout />
    </div>
  );
};

export default AuditReportsTab;
