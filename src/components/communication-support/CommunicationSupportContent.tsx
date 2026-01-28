"use client";
import React, { useState } from "react";
import MessagesTab from "./tabs/MessagesTab";
import SupportTicketsTab from "./tabs/SupportTicketsTab";
import SharedDocumentsTab from "./tabs/SharedDocumentsTab";
import AnnouncementsTab from "./tabs/AnnouncementsTab";
import SupportContactCard from "./SupportContactCard";

type TabType = "messages" | "tickets" | "documents" | "announcements";

const CommunicationSupportContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("messages");

  const tabs = [
    { id: "messages" as TabType, label: "Messages" },
    { id: "tickets" as TabType, label: "Support Tickets" },
    { id: "documents" as TabType, label: "Shared Documents" },
    { id: "announcements" as TabType, label: "Announcements" },
  ];

  const getTabClass = (tabId: TabType) =>
    activeTab === tabId
      ? "border-brand-500 text-brand-500 bg-white dark:bg-gray-900"
      : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300";

  const renderTabContent = () => {
    switch (activeTab) {
      case "tickets":
        return <SupportTicketsTab />;
      case "documents":
        return <SharedDocumentsTab />;
      case "announcements":
        return <AnnouncementsTab />;
      case "messages":
      default:
        return <MessagesTab />;
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Communication & Support
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Connect with your accountant and get support
        </p>
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

      <SupportContactCard />
    </div>
  );
};

export default CommunicationSupportContent;
