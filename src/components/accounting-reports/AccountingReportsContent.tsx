"use client";
import React, { useEffect, useRef, useState } from "react";
import {
  LuChartBar,
  LuChartPie,
  LuCheck,
  LuChevronDown,
  LuFileText,
} from "react-icons/lu";
import { FiFilter } from "react-icons/fi";
import AllReportsTab from "./tabs/AllReportsTab";
import FinancialReportsTab from "./tabs/FinancialReportsTab";
import TaxReportsTab from "./tabs/TaxReportsTab";
import AuditReportsTab from "./tabs/AuditReportsTab";
import { FaRegChartBar } from "react-icons/fa";


type TabType = "all" | "financial" | "tax" | "audit";

const reportSummary = [
  {
    title: "Financial Reports",
    count: "4",
    subtitle: "Available reports",
    icon: FaRegChartBar,
    iconBg: "bg-green-50 dark:bg-green-500/10",
    iconColor: "text-green-600 dark:text-green-400",
  },
  {
    title: "Tax Reports",
    count: "3",
    subtitle: "Available reports",
    icon: LuFileText,
    iconBg: "bg-blue-50 dark:bg-blue-500/10",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  {
    title: "Audit Reports",
    count: "3",
    subtitle: "Available reports",
    icon: LuChartPie,
    iconBg: "bg-purple-50 dark:bg-purple-500/10",
    iconColor: "text-purple-600 dark:text-purple-400",
  },
];

const AccountingReportsContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("all");
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
    { id: "all" as TabType, label: "All Reports" },
    { id: "financial" as TabType, label: "Financial" },
    { id: "tax" as TabType, label: "Tax" },
    { id: "audit" as TabType, label: "Audit" },
  ];

  const getTabClass = (tabId: TabType) =>
    activeTab === tabId
      ? "border-brand-500 text-brand-500 bg-white dark:bg-gray-900"
      : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300";

  const renderTabContent = () => {
    switch (activeTab) {
      case "financial":
        return <FinancialReportsTab />;
      case "tax":
        return <TaxReportsTab />;
      case "audit":
        return <AuditReportsTab />;
      case "all":
      default:
        return <AllReportsTab />;
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
            Accounting Reports
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            View and download financial, tax, and audit reports
          </p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
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
          <button className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <FiFilter className="w-4 h-4" />
            Filter
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {reportSummary.map((card) => {
          const CardIcon = card.icon;
          return (
            <div
              key={card.title}
              className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {card.title}
                  </span>
                  <h4 className="mt-2 text-2xl font-bold text-gray-800 dark:text-white">
                    {card.count}
                  </h4>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {card.subtitle}
                  </p>
                </div>
                <div
                  className={`flex items-center justify-center w-12 h-12 rounded-full ${card.iconBg}`}
                >
                  <CardIcon className={`w-5 h-5 ${card.iconColor}`} />
                </div>
              </div>
            </div>
          );
        })}
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
      <div>{renderTabContent()}</div>
    </div>
  );
};

export default AccountingReportsContent;
