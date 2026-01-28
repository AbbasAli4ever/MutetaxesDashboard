"use client";
import React, { useEffect, useRef, useState } from "react";
import {
  LuBadgeDollarSign,
  LuCalendarDays,
  LuCheck,
  LuChevronDown,
  LuTriangleAlert,
} from "react-icons/lu";
import TaxFilingsTab from "./tabs/TaxFilingsTab";
import DeadlinesTab from "./tabs/DeadlinesTab";
import PaymentsTab from "./tabs/PaymentsTab";
import ComputationsTab from "./tabs/ComputationsTab";
import TaxationAlert from "./TaxationAlert";

type TabType = "filings" | "deadlines" | "payments" | "computations";

const metrics = [
  {
    title: "Current Year Tax",
    value: "HKD 754,050",
    subtext: "Year 2024/25",
    icon: LuBadgeDollarSign,
    iconBg: "bg-blue-50 dark:bg-blue-500/10",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  {
    title: "Pending Filings",
    value: "1",
    subtext: "Due in 24 days",
    icon: LuTriangleAlert,
    iconBg: "bg-amber-50 dark:bg-amber-500/10",
    iconColor: "text-amber-500",
  },
  {
    title: "Upcoming Deadlines",
    value: "3",
    subtext: "This quarter",
    icon: LuCalendarDays,
    iconBg: "bg-purple-50 dark:bg-purple-500/10",
    iconColor: "text-purple-600 dark:text-purple-400",
  },
];

const TaxationContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("filings");
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
    { id: "filings" as TabType, label: "Tax Filings" },
    { id: "deadlines" as TabType, label: "Deadlines" },
    { id: "payments" as TabType, label: "Payments" },
    { id: "computations" as TabType, label: "Computations" },
  ];

  const getTabClass = (tabId: TabType) =>
    activeTab === tabId
      ? "border-brand-500 text-brand-500 bg-white dark:bg-gray-900"
      : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300";

  const renderTabContent = () => {
    switch (activeTab) {
      case "deadlines":
        return <DeadlinesTab />;
      case "payments":
        return <PaymentsTab />;
      case "computations":
        return <ComputationsTab />;
      case "filings":
      default:
        return <TaxFilingsTab />;
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
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Taxation
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your Hong Kong tax obligations
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 mb-6">
        {metrics.map((metric) => {
          const MetricIcon = metric.icon;
          return (
            <div
              key={metric.title}
              className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {metric.title}
                  </span>
                  <h4 className="mt-2 text-2xl font-bold text-gray-800 dark:text-white">
                    {metric.value}
                  </h4>
                  <p
                    className={`mt-1 text-sm ${
                      metric.title === "Pending Filings"
                        ? "text-red-500"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {metric.subtext}
                  </p>
                </div>
                <div
                  className={`flex items-center justify-center w-12 h-12 rounded-full ${metric.iconBg}`}
                >
                  <MetricIcon className={`w-5 h-5 ${metric.iconColor}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

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

      <div className="mb-6">{renderTabContent()}</div>

      <TaxationAlert />
    </div>
  );
};

export default TaxationContent;
