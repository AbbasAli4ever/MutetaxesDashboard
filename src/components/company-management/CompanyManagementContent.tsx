"use client";
import React, { useState } from "react";
import CompanyProfileTab from "./tabs/CompanyProfileTab";
import DocumentsTab from "./tabs/DocumentsTab";
import RenewalsTab from "./tabs/RenewalsTab";
import ServiceRequestsTab from "./tabs/ServiceRequestsTab";

type TabType = "profile" | "documents" | "renewals" | "requests";

const CompanyManagementContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("profile");

  const tabs = [
    { id: "profile" as TabType, label: "Company Profile" },
    { id: "documents" as TabType, label: "Documents" },
    { id: "renewals" as TabType, label: "Renewals" },
    { id: "requests" as TabType, label: "Service Requests" },
  ];

  const getTabClass = (tabId: TabType) =>
    activeTab === tabId
      ? "border-brand-500 text-brand-500 bg-white dark:bg-gray-900"
      : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300";

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return <CompanyProfileTab />;
      case "documents":
        return <DocumentsTab />;
      case "renewals":
        return <RenewalsTab />;
      case "requests":
        return <ServiceRequestsTab />;
      default:
        return <CompanyProfileTab />;
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Company Management
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage your company information and documents
        </p>
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
              )} ${
                activeTab === tab.id
                  ? "shadow-sm"
                  : ""
              }`}
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

export default CompanyManagementContent;
