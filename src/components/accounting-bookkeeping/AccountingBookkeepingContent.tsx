"use client";
import React, { useEffect, useRef, useState } from "react";
import { FaArrowTrendUp, FaArrowTrendDown } from "react-icons/fa6";
import { BsCashCoin } from "react-icons/bs";
import {
  LuCalculator,
  LuCheck,
  LuChevronDown,
  LuFileSpreadsheet,
  LuReceipt,
} from "react-icons/lu";
import RecentTransactionsTab from "./tabs/RecentTransactionsTab";
import BankReconciliationTab from "./tabs/BankReconciliationTab";
import BookkeepingStatusTab from "./tabs/BookkeepingStatusTab";

type TabType = "transactions" | "reconciliation" | "status";

// Mock data for metric cards
const metricsData = {
  totalIncome: {
    value: "HKD 1,250,000",
    change: "+12.5%",
    isPositive: true,
  },
  totalExpenses: {
    value: "HKD 875,000",
    change: "+8.3%",
    isPositive: false,
  },
  netProfit: {
    value: "HKD 375,000",
    margin: "30%",
  },
  cashBalance: {
    value: "HKD 2,450,000",
    change: "+5.2%",
    isPositive: true,
  },
};

const accountsSummary = {
  receivable: {
    amount: "HKD 325,000",
    description: "Outstanding customer payments",
    count: "5 outstanding invoices",
  },
  payable: {
    amount: "HKD 185,000",
    description: "Outstanding supplier payments",
    count: "3 pending bills",
  },
};

const AccountingBookkeepingContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("transactions");
  const [isPeriodOpen, setIsPeriodOpen] = useState(false);
  const periodRef = useRef<HTMLDivElement | null>(null);

  const periods = [
    { value: "all", label: "All Periods" },
    { value: "fy2024", label: "FY 2024" },
    { value: "fy2025", label: "FY 2025" },
    { value: "q42025", label: "Q4 2025" },
  ];
  const [selectedPeriod, setSelectedPeriod] = useState(periods[0]);

  const tabs = [
    { id: "transactions" as TabType, label: "Recent Transactions" },
    { id: "reconciliation" as TabType, label: "Bank Reconciliation" },
    { id: "status" as TabType, label: "Bookkeeping Status" },
  ];

  const getTabClass = (tabId: TabType) =>
    activeTab === tabId
      ? "border-brand-500 text-brand-500 bg-white dark:bg-gray-900"
      : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300";

  const renderTabContent = () => {
    switch (activeTab) {
      case "transactions":
        return <RecentTransactionsTab />;
      case "reconciliation":
        return <BankReconciliationTab />;
      case "status":
        return <BookkeepingStatusTab />;
      default:
        return <RecentTransactionsTab />;
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        periodRef.current &&
        !periodRef.current.contains(event.target as Node)
      ) {
        setIsPeriodOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Accounting & Bookkeeping
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Track your financial records and transactions
          </p>
        </div>
        <div className="relative w-full sm:w-44" ref={periodRef}>
          <button
            type="button"
            onClick={() => setIsPeriodOpen((open) => !open)}
            className="inline-flex h-10 w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 shadow-theme-xs transition-colors hover:bg-gray-50 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <span>{selectedPeriod.label}</span>
            <LuChevronDown
              className={`h-4 w-4 text-gray-500 transition-transform ${
                isPeriodOpen ? "rotate-180" : ""
              }`}
            />
          </button>
          {isPeriodOpen && (
            <div className="absolute right-0 z-20 mt-2 w-full rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-900">
              {periods.map((period) => {
                const isSelected = period.value === selectedPeriod.value;
                return (
                  <button
                    key={period.value}
                    type="button"
                    onClick={() => {
                      setSelectedPeriod(period);
                      setIsPeriodOpen(false);
                    }}
                    className={`flex w-full items-center justify-between px-3 py-2 text-sm transition-colors ${
                      isSelected
                        ? "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300"
                        : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                    }`}
                  >
                    <span>{period.label}</span>
                    {isSelected && (
                      <LuCheck className="h-4 w-4 text-brand-500" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {/* Total Income */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-5">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Total Income
              </span>
              <h4 className="mt-2 text-2xl font-bold text-gray-800 dark:text-white">
                {metricsData.totalIncome.value}
              </h4>
              <div className="flex items-center gap-1 mt-1">
                <FaArrowTrendUp className="w-3 h-3 text-green-500" />
                <span className="text-sm text-green-500">
                  {metricsData.totalIncome.change}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-50 dark:bg-green-500/10">
              <FaArrowTrendUp className="w-5 h-5 text-green-500" />
            </div>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-5">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Total Expenses
              </span>
              <h4 className="mt-2 text-2xl font-bold text-gray-800 dark:text-white">
                {metricsData.totalExpenses.value}
              </h4>
              <div className="flex items-center gap-1 mt-1">
                <FaArrowTrendDown className="w-3 h-3 text-red-500" />
                <span className="text-sm text-red-500">
                  {metricsData.totalExpenses.change}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 dark:bg-red-500/10">
              <FaArrowTrendDown className="w-5 h-5 text-red-500" />
            </div>
          </div>
        </div>

        {/* Net Profit */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-5">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Net Profit
              </span>
              <h4 className="mt-2 text-2xl font-bold text-gray-800 dark:text-white">
                {metricsData.netProfit.value}
              </h4>
              <div className="mt-1">
                <span className="text-xs text-gray-400 dark:text-gray-500">Margin:</span>{" "}
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {metricsData.netProfit.margin}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-500/10">
              <LuCalculator className="w-5 h-5 text-blue-500" />
            </div>
          </div>
        </div>

        {/* Cash Balance */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-5">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Cash Balance
              </span>
              <h4 className="mt-2 text-2xl font-bold text-gray-800 dark:text-white">
                {metricsData.cashBalance.value}
              </h4>
              <div className="flex items-center gap-1 mt-1">
                <FaArrowTrendUp className="w-3 h-3 text-green-500" />
                <span className="text-sm text-green-500">
                  {metricsData.cashBalance.change}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-50 dark:bg-green-500/10">
              <BsCashCoin className="w-5 h-5 text-green-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-md transition-all duration-200 ${getTabClass(
                tab.id
              )} ${activeTab === tab.id ? "shadow-sm" : ""}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="mb-6">{renderTabContent()}</div>

      {/* Bottom Cards - Accounts Receivable & Payable */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Accounts Receivable */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            Accounts Receivable
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {accountsSummary.receivable.description}
          </p>
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-500/10">
              <LuReceipt className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                {accountsSummary.receivable.amount}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {accountsSummary.receivable.count}
              </p>
            </div>
          </div>
        </div>

        {/* Accounts Payable */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            Accounts Payable
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {accountsSummary.payable.description}
          </p>
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-500/10">
              <LuFileSpreadsheet className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                {accountsSummary.payable.amount}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {accountsSummary.payable.count}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountingBookkeepingContent;
