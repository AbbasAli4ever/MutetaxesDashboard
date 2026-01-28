"use client";
import React, { useState } from "react";
import {
  MdOutlineFileDownload,
  MdOutlineFileUpload,
  MdOutlineRemoveRedEye,
} from "react-icons/md";
import { Modal } from "@/components/ui/modal";
import { useModal } from "@/hooks/useModal";

interface ComputationItem {
  year: string;
  netProfit: string;
  disallowableItems: string;
  allowances: string;
  assessableProfit: string;
  taxPayable: string;
}

interface ComputationDetail {
  year: string;
  companyName: string;
  accountingPeriod: string;
  datePrepared: string;
  netProfit: string;
  disallowableItems: { label: string; value: string }[];
  disallowableTotal: string;
  allowances: { label: string; value: string }[];
  allowancesTotal: string;
  adjustedProfit: string;
  assessableProfit: string;
  taxPayable: string;
  totalTax: string;
  taxBreakdown: {
    title: string;
    subtitle: string;
    calculation: string;
    value: string;
    variant: "green" | "amber";
  }[];
  effectiveRate: string;
  notes: string[];
}

const computations: ComputationItem[] = [
  {
    year: "2024/25",
    netProfit: "HKD 4,500,000",
    disallowableItems: "HKD 250,000",
    allowances: "HKD 180,000",
    assessableProfit: "HKD 4,750,000",
    taxPayable: "HKD 754,050",
  },
  {
    year: "2023/24",
    netProfit: "HKD 3,800,000",
    disallowableItems: "HKD 180,000",
    allowances: "HKD 130,000",
    assessableProfit: "HKD 3,850,000",
    taxPayable: "HKD 635,250",
  },
];

const computationDetails: Record<string, ComputationDetail> = {
  "2024/25": {
    year: "2024/25",
    companyName: "Tech Innovations Limited",
    accountingPeriod: "01/04/2024 - 31/03/2025",
    datePrepared: "26/01/2026",
    netProfit: "HKD 4,500,000",
    disallowableItems: [
      { label: "Depreciation", value: "HKD 100,000" },
      { label: "Entertainment expenses", value: "HKD 70,000" },
      { label: "Donations (non-approved)", value: "HKD 40,000" },
      { label: "Legal fees (capital nature)", value: "HKD 40,000" },
    ],
    disallowableTotal: "HKD 250,000",
    allowances: [
      { label: "Plant & Machinery - Initial Allowance", value: "HKD 90,000" },
      { label: "Plant & Machinery - Annual Allowance", value: "HKD 60,000" },
      { label: "Commercial Building Allowance", value: "HKD 30,000" },
    ],
    allowancesTotal: "HKD 180,000",
    adjustedProfit: "HKD 4,750,000",
    assessableProfit: "HKD 4,750,000",
    taxPayable: "HKD 754,050",
    totalTax: "HKD 754,050",
    taxBreakdown: [
      {
        title: "First HKD 2,000,000",
        subtitle: "@ 8.25% (Concessionary Rate)",
        calculation: "HKD 2,000,000 × 8.25%",
        value: "HKD 165,000",
        variant: "green",
      },
      {
        title: "Remaining Profit",
        subtitle: "@ 16.5% (Standard Rate)",
        calculation: "HKD 2,750,000 × 16.5%",
        value: "HKD 589,050",
        variant: "amber",
      },
    ],
    effectiveRate: "16.50%",
    notes: [
      "The two-tier profits tax system continues to apply beyond 2018/19.",
      "The first HKD 2,000,000 of assessable profits is taxed at 8.25% for corporations.",
      "Profits exceeding HKD 2,000,000 are taxed at the standard rate of 16.5%.",
      "Only one entity in a connected group can elect for the two-tier rates.",
    ],
  },
  "2023/24": {
    year: "2023/24",
    companyName: "Tech Innovations Limited",
    accountingPeriod: "01/04/2024 - 31/03/2025",
    datePrepared: "26/01/2026",
    netProfit: "HKD 3,800,000",
    disallowableItems: [
      { label: "Depreciation", value: "HKD 95,000" },
      { label: "Entertainment expenses", value: "HKD 60,000" },
      { label: "Donations (non-approved)", value: "HKD 15,000" },
      { label: "Legal fees (capital nature)", value: "HKD 10,000" },
    ],
    disallowableTotal: "HKD 180,000",
    allowances: [
      { label: "Plant & Machinery - Initial Allowance", value: "HKD 60,000" },
      { label: "Plant & Machinery - Annual Allowance", value: "HKD 38,000" },
      { label: "Commercial Building Allowance", value: "HKD 32,000" },
    ],
    allowancesTotal: "HKD 130,000",
    adjustedProfit: "HKD 3,980,000",
    assessableProfit: "HKD 3,850,000",
    taxPayable: "HKD 635,250",
    totalTax: "HKD 635,250",
    taxBreakdown: [
      {
        title: "First HKD 2,000,000",
        subtitle: "@ 8.25% (Concessionary Rate)",
        calculation: "HKD 2,000,000 × 8.25%",
        value: "HKD 165,000",
        variant: "green",
      },
      {
        title: "Remaining Profit",
        subtitle: "@ 16.5% (Standard Rate)",
        calculation: "HKD 1,850,000 × 16.5%",
        value: "HKD 305,250",
        variant: "amber",
      },
    ],
    effectiveRate: "16.50%",
    notes: [
      "The two-tier profits tax system continues to apply beyond 2018/19.",
      "The first HKD 2,000,000 of assessable profits is taxed at 8.25% for corporations.",
      "Profits exceeding HKD 2,000,000 are taxed at the standard rate of 16.5%.",
      "Only one entity in a connected group can elect for the two-tier rates.",
    ],
  },
};

const ComputationsTab: React.FC = () => {
  const { isOpen, openModal, closeModal } = useModal();
  const [activeDetail, setActiveDetail] = useState<ComputationDetail | null>(
    null
  );

  const handleOpenDetail = (year: string) => {
    setActiveDetail(computationDetails[year]);
    openModal();
  };

  const handleCloseDetail = () => {
    closeModal();
    setActiveDetail(null);
  };

  const modalIsOpen = isOpen && Boolean(activeDetail);

  return (
    <div className="space-y-6">
      {computations.map((item) => (
        <div
          key={item.year}
          className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Tax Computation - {item.year}
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Detailed breakdown of Profits Tax calculation
          </p>

          <div className="mt-5 space-y-3">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800/40 p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Net Profit (per accounts)
                </p>
                <p className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
                  {item.netProfit}
                </p>
              </div>
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800/40 p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Add: Disallowable Items
                </p>
                <p className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
                  {item.disallowableItems}
                </p>
              </div>
            </div>
            <div className="rounded-xl bg-gray-50 dark:bg-gray-800/40 p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Less: Tax Allowances
              </p>
              <p className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
                {item.allowances}
              </p>
            </div>
            <div className="rounded-xl bg-blue-50 dark:bg-blue-500/10 p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  Assessable Profit
                </p>
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {item.assessableProfit}
              </p>
            </div>
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-500/10 p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  Tax Payable
                </p>
                <p className="text-[10px] text-emerald-600/80">
                  @ 16.5% tax rate
                </p>
              </div>
              <p className="text-sm font-semibold text-emerald-600">
                {item.taxPayable}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => handleOpenDetail(item.year)}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <MdOutlineRemoveRedEye className="h-4 w-4" />
              View Full Computation
            </button>
            <button className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800">
              <MdOutlineFileDownload className="h-4 w-4" />
              Download PDF
            </button>
          </div>
        </div>
      ))}

      <Modal
        isOpen={modalIsOpen}
        onClose={handleCloseDetail}
        className="max-w-[640px] m-0 h-[calc(100vh-32px)] p-0"
      >
        {activeDetail && (
          <div className="flex h-[calc(100vh-32px)] flex-col overflow-hidden rounded-[30px] bg-white shadow-[0px_25px_80px_rgba(15,23,42,0.15)] dark:bg-gray-900">
            <div className="border-b border-gray-200 px-6 py-5 dark:border-gray-800">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
                  Profits Tax Computation
                </p>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {`Profits Tax Computation - ${activeDetail.year}`}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Comprehensive breakdown of Hong Kong Profits Tax.
                </p>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6 lg:px-8 modal-scrollbar">
              <div className="space-y-6">
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 shadow-sm dark:border-gray-800 dark:bg-gray-800/40">
                  <div className="grid grid-cols-2 gap-3 text-sm text-gray-500 dark:text-gray-400">
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                        Company
                      </p>
                      <p className="text-base font-semibold text-gray-900 dark:text-white">
                        {activeDetail.companyName}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                        Year of Assessment
                      </p>
                      <p className="text-base font-semibold text-gray-900 dark:text-white">
                        {activeDetail.year}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-gray-500 dark:text-gray-400">
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                        Accounting Period
                      </p>
                      <p className="text-base font-semibold text-gray-900 dark:text-white">
                        {activeDetail.accountingPeriod}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                        Date Prepared
                      </p>
                      <p className="text-base font-semibold text-gray-900 dark:text-white">
                        {activeDetail.datePrepared}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <section className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 dark:border-gray-800 dark:bg-gray-800/40">
                    <p className="text-sm font-semibold text-gray-800 dark:text-white">
                      Step 1: Net Profit per Financial Statements
                    </p>
                    <div className="mt-3 flex flex-col gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <div className="flex items-center justify-between rounded-xl bg-white/80 dark:bg-gray-800/40 px-3 py-2">
                        <span className="text-gray-500 dark:text-gray-400">
                          Net Profit for the year (per audited accounts)
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {activeDetail.netProfit}
                        </span>
                      </div>
                    </div>
                  </section>

                  <section className="rounded-2xl border border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-gray-900/60">
                    <div className="text-sm font-semibold text-gray-800 dark:text-white">
                      Step 2: Add Back Disallowable Items
                    </div>
                    <div className="mt-3 space-y-2">
                      {activeDetail.disallowableItems.map((row) => (
                        <div
                          key={row.label}
                          className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300"
                        >
                          <span>{row.label}</span>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {row.value}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-sm font-semibold text-gray-900 dark:border-gray-800 dark:text-white">
                      <span>Total Disallowable Items</span>
                      <span>{activeDetail.disallowableTotal}</span>
                    </div>
                  </section>

                  <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-4 dark:border-blue-500/30 dark:bg-blue-500/10">
                    <div className="text-sm font-semibold text-blue-600 dark:text-blue-300">
                      Adjusted Profit (before allowances)
                    </div>
                    <p className="mt-3 text-lg font-semibold text-gray-900 dark:text-white">
                      {activeDetail.adjustedProfit}
                    </p>
                  </div>

                  <section className="rounded-2xl border border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-gray-900/60">
                    <div className="text-sm font-semibold text-gray-800 dark:text-white">
                      Step 3: Less Tax Allowances
                    </div>
                    <div className="mt-3 space-y-2">
                      {activeDetail.allowances.map((row) => (
                        <div
                          key={row.label}
                          className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300"
                        >
                          <span>{row.label}</span>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {row.value}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-sm font-semibold text-red-600 dark:border-gray-800">
                      <span>Total Tax Allowances</span>
                      <span className="text-red-600 ">
                        ({activeDetail.allowancesTotal})
                      </span>
                    </div>
                  </section>

                  <div className="grid gap-3 lg:grid-cols-2">
                    <div className="rounded-2xl border border-blue-500 bg-blue-600 dark:bg-blue-500/30 dark:border-blue-500/30 px-4 py-4 text-white shadow-lg">
                      <div className="text-sm font-semibold">Assessable Profit</div>
                      <p className="text-lg font-bold">
                        {activeDetail.assessableProfit}
                      </p>
                      <p className="text-xs text-blue-100">Subject to Profits Tax</p>
                    </div>
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-700 shadow-sm dark:border-emerald-500/30 dark:bg-emerald-900/30 dark:text-emerald-200">
                      <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                        Tax Payable
                      </div>
                      <p className="mt-2 text-2xl font-bold text-emerald-700">
                        {activeDetail.taxPayable}
                      </p>
                      <p className="text-xs font-medium text-emerald-600">
                        @ 16.5% tax rate
                      </p>
                    </div>
                  </div>

                  <section className="space-y-3 rounded-2xl border border-gray-200 bg-white/80 px-4 py-4 dark:border-gray-800 dark:bg-gray-900/60">
                    <p className="text-sm font-semibold text-gray-800 dark:text-white">
                      Step 4: Tax Calculation (Two-Tier Rates)
                    </p>
                    <div className="space-y-3">
                      {activeDetail.taxBreakdown.map((row) => (
                        <div
                          key={row.title}
                          className={`rounded-2xl border px-4 py-3 text-sm ${
                            row.variant == "green"
                              ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-900/30 dark:text-emerald-200"
                              : "bg-amber-50 border-amber-200 text-amber-700 dark:border-amber-500/30 dark:bg-amber-900/30 dark:text-amber-200"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">{row.title}</span>
                            <span className="text-base font-semibold">{row.value}</span>
                          </div>
                          <p className="text-[11px] text-current/70">{row.subtitle}</p>
                          <p className="mt-1 text-[11px] text-current/70">
                            {row.calculation}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>

                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 shadow-md dark:border-emerald-500/40 dark:bg-emerald-900/30">
                    <div className="flex items-center justify-between text-sm font-semibold text-gray-900 dark:text-white">
                      <div>
                        <p>Total Profits Tax Payable</p>
                        <p className="text-xs text-emerald-700">
                          Year of Assessment {activeDetail.year}
                        </p>
                      </div>
                      <p className="text-2xl font-bold text-emerald-700">
                        {activeDetail.totalTax}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-900/60">
                    <p className="font-semibold text-gray-800 dark:text-white">
                      Effective Tax Rate
                    </p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {activeDetail.effectiveRate}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-blue-100 bg-blue-50/80 px-4 py-4 text-sm text-gray-700 dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-100">
                    <div className="flex items-start gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-500 dark:text-white">
                        i
                      </div>
                      <div className="space-y-2 text-xs">
                        {activeDetail.notes.map((note) => (
                          <p key={note}>{note}</p>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap w-full justify-end gap-3">
                    <button
                      onClick={handleCloseDetail}
                      className="rounded-full border border-gray-200 px-5 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-400 dark:text-white"
                    >
                      Close
                    </button>
                    <button className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-5 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-400 dark:text-white">
                      <MdOutlineFileDownload className="h-4 w-4" />
                      Download PDF
                    </button>
                    <button className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-700 dark:text-white">
                      <MdOutlineFileUpload className="h-4 w-4" />
                      Generate Report
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
};

export default ComputationsTab;
