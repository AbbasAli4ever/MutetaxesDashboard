"use client";
import React, { useMemo, useState } from "react";
import ReportList, { ReportItem } from "../ReportList";
import ReportsCallout from "../ReportsCallout";
import { Modal } from "@/components/ui/modal";
import { useModal } from "@/hooks/useModal";
import { MdOutlineFileDownload, MdOutlinePrint } from "react-icons/md";

const allReports: ReportItem[] = [
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

interface ReportDetail {
  name: string;
  period: string;
  generatedOn: string;
  info: { label: string; value: string }[];
  sections: {
    title: string;
    rows: { label: string; value: string }[];
    totalLabel: string;
    totalValue: string;
    totalAccent?: string;
  }[];
  grossProfit: { value: string; margin: string };
  operatingExpenses: {
    rows: { label: string; value: string }[];
    total: string;
  };
  netProfit: { value: string; note: string };
  keyMetrics: { label: string; value: string }[];
}

const reportDetails: Record<string, ReportDetail> = {
  "Profit & Loss Statement": {
    name: "Profit & Loss Statement",
    period: "Q4 2025",
    generatedOn: "5/1/2026",
    info: [
      { label: "Report Type", value: "financial" },
      { label: "Format", value: "PDF" },
      { label: "File Size", value: "234 KB" },
      { label: "Period", value: "Q4 2025" },
    ],
    sections: [
      {
        title: "Revenue",
        rows: [
          { label: "Product Sales", value: "HKD 2,850,000" },
          { label: "Service Revenue", value: "HKD 900,000" },
        ],
        totalLabel: "Total Revenue",
        totalValue: "HKD 3,750,000",
      },
      {
        title: "Cost of Sales",
        rows: [
          { label: "Direct Materials", value: "HKD 850,000" },
          { label: "Direct Labor", value: "HKD 450,000" },
          { label: "Manufacturing Overhead", value: "HKD 200,000" },
        ],
        totalLabel: "Total Cost of Sales",
        totalValue: "(HKD 1,500,000)",
        totalAccent: "text-red-600",
      },
    ],
    grossProfit: { value: "HKD 2,250,000", margin: "Gross Margin: 60.0%" },
    operatingExpenses: {
      rows: [
        { label: "Salaries & Wages", value: "HKD 650,000" },
        { label: "Rent & Utilities", value: "HKD 180,000" },
        { label: "Marketing & Advertising", value: "HKD 125,000" },
        { label: "Professional Fees", value: "HKD 85,000" },
        { label: "Depreciation", value: "HKD 45,000" },
        { label: "Other Expenses", value: "HKD 40,000" },
      ],
      total: "(HKD 1,125,000)",
    },
    netProfit: { value: "HKD 1,125,000", note: "For the period ended December 31, 2025" },
    keyMetrics: [
      { label: "Net Profit Margin", value: "30.0%" },
      { label: "Operating Margin", value: "30.0%" },
      { label: "Gross Margin", value: "60.0%" },
    ],
  },
};

const AllReportsTab: React.FC = () => {
  const { isOpen, openModal, closeModal } = useModal();
  const [activeReport, setActiveReport] = useState<ReportDetail | null>(null);

  const handleView = (report: ReportItem) => {
    setActiveReport(reportDetails[report.name] || null);
    openModal();
  };

  const modalIsOpen = isOpen && Boolean(activeReport);

  const modalContent = useMemo(() => {
    if (!activeReport) return null;
    return (
      <div className="flex h-[calc(100vh-32px)] flex-col overflow-hidden rounded-[30px] bg-white shadow-[0px_25px_80px_rgba(15,23,42,0.15)] dark:bg-gray-900">
          <div className="sticky top-0 z-20 border-b border-gray-200 bg-white px-6 py-5 dark:border-gray-800 dark:bg-gray-900">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {activeReport.name}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {activeReport.period} • Generated on {activeReport.generatedOn}
            </p>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6 lg:px-8 modal-scrollbar">
          <div className="space-y-5">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-800/40">
              <div className="grid grid-cols-2 gap-3 text-sm text-gray-500 dark:text-gray-400">
                {activeReport.info.map((info) => (
                  <div key={info.label}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      {info.label}
                    </p>
                    <p className="text-base font-semibold text-gray-900 dark:text-white">
                      {info.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {activeReport.sections.map((section) => (
              <div
                key={section.title}
                className="rounded-2xl border border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-gray-900/60"
              >
                <p className="text-sm font-semibold text-gray-800 dark:text-white">
                  {section.title}
                </p>
                <div className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  {section.rows.map((row) => (
                    <div key={row.label} className="flex items-center justify-between">
                      <span>{row.label}</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>
                <div
                  className={`mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-sm font-semibold dark:border-gray-800 ${section.totalAccent || "text-gray-900 dark:text-white"}`}
                >
                  <span>{section.totalLabel}</span>
                  <span>{section.totalValue}</span>
                </div>
              </div>
            ))}

            <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-4 dark:border-blue-500/30 dark:bg-blue-500/10">
              <div className="text-sm font-semibold text-blue-600 dark:text-blue-300">
                Gross Profit
              </div>
              <div className="mt-3 flex items-center justify-between text-lg font-semibold text-gray-900 dark:text-white">
                <span>{activeReport.grossProfit.value}</span>
                <span className="text-sm font-normal">{activeReport.grossProfit.margin}</span>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-gray-900/60">
              <p className="text-sm font-semibold text-gray-800 dark:text-white">
                Operating Expenses
              </p>
              <div className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-300">
                {activeReport.operatingExpenses.rows.map((row) => (
                  <div key={row.label} className="flex items-center justify-between">
                    <span>{row.label}</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-sm font-semibold text-red-600 dark:border-gray-800">
                <span>Total Operating Expenses</span>
                <span>{activeReport.operatingExpenses.total}</span>
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 dark:border-emerald-500/40 dark:bg-emerald-900/30">
              <div className="text-sm font-semibold text-gray-900 dark:text-white">Net Profit</div>
              <div className="mt-2 text-2xl font-bold text-emerald-700">
                {activeReport.netProfit.value}
              </div>
              <p className="text-xs text-emerald-600">{activeReport.netProfit.note}</p>
              <p className="text-xs text-emerald-600 mt-2">↗ +15.3% vs previous quarter</p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-blue-50 px-4 py-4 dark:border-gray-800 dark:bg-gray-900/60">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                Key Performance Metrics
              </p>
              <div className="mt-3 grid grid-cols-3 gap-3 text-sm text-gray-900 dark:text-white">
                {activeReport.keyMetrics.map((metric) => (
                  <div
                    key={metric.label}
                    className="flex flex-col gap-1 rounded-lg bg-white/80 px-3 py-2 dark:bg-gray-800"
                  >
                    <span className="text-xs uppercase text-gray-500 dark:text-gray-400">
                      {metric.label}
                    </span>
                    <span className="text-lg font-semibold">{metric.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap w-full justify-end gap-3">
              <button
                onClick={closeModal}
                className="rounded-full border border-gray-200 px-5 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-400 dark:text-white"
              >
                Close
              </button>
              <button className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-5 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-400 dark:text-white">
                <MdOutlinePrint className="h-4 w-4" />
                Print Preview
              </button>
              <button className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-700">
                <MdOutlineFileDownload className="h-4 w-4" />
                Download PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }, [activeReport, closeModal]);

  return (
    <div className="space-y-6">
      <ReportList
        title="All Reports"
        description="Complete list of available reports"
        items={allReports}
        onView={handleView}
      />
      <ReportsCallout />

      <Modal
        isOpen={modalIsOpen}
        onClose={closeModal}
        className="max-w-[640px] m-0 h-[calc(100vh-32px)] p-0"
      >
        {modalContent}
      </Modal>
    </div>
  );
};

export default AllReportsTab;
