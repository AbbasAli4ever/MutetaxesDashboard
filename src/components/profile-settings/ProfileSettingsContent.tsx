"use client";
import React, { useState } from "react";
import ProfileTab from "./tabs/ProfileTab";
import SecurityTab from "./tabs/SecurityTab";
import NotificationsTab from "./tabs/NotificationsTab";
import UserAccessTab from "./tabs/UserAccessTab";
import ActivityLogTab from "./tabs/ActivityLogTab";

type TabType = "profile" | "security" | "notifications" | "access" | "activity";

const ProfileSettingsContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("profile");

  const tabs = [
    { id: "profile" as TabType, label: "Profile" },
    { id: "security" as TabType, label: "Security" },
    { id: "notifications" as TabType, label: "Notifications" },
    { id: "access" as TabType, label: "User Access" },
    { id: "activity" as TabType, label: "Activity Log" },
  ];

  const getTabClass = (tabId: TabType) =>
    activeTab === tabId
      ? "border-brand-500 text-brand-500 bg-white dark:bg-gray-900"
      : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300";

  const renderTabContent = () => {
    switch (activeTab) {
      case "security":
        return <SecurityTab />;
      case "notifications":
        return <NotificationsTab />;
      case "access":
        return <UserAccessTab />;
      case "activity":
        return <ActivityLogTab />;
      case "profile":
      default:
        return <ProfileTab />;
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Profile & Settings
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage your account and preferences
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

      <div>{renderTabContent()}</div>
    </div>
  );
};

export default ProfileSettingsContent;
