"use client";
import React, { useState } from "react";
import AdminProfileTab from "./tabs/AdminProfileTab";
import AdminSecurityTab from "./tabs/AdminSecurityTab";
import AdminRoleManagementTab from "./tabs/AdminRoleManagementTab";
import AdminGeneralSettingsTab from "./tabs/AdminGeneralSettingsTab";
import AdminNotificationsTab from "./tabs/AdminNotificationsTab";

type TabType = "profile" | "security" | "role-management" | "general-settings" | "notifications";

const AdminProfileSettingsContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("profile");

  const tabs = [
    { id: "profile" as TabType, label: "Profile" },
    { id: "security" as TabType, label: "Security" },
    { id: "role-management" as TabType, label: "Role Management" },
    { id: "general-settings" as TabType, label: "General Settings" },
    { id: "notifications" as TabType, label: "Notifications" },
  ];

  const getTabClass = (tabId: TabType) =>
    activeTab === tabId
      ? "border-brand-500 text-brand-500 bg-white dark:bg-gray-900"
      : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300";

  const renderTabContent = () => {
    switch (activeTab) {
      case "security":
        return <AdminSecurityTab />;
      case "role-management":
        return <AdminRoleManagementTab />;
      case "general-settings":
        return <AdminGeneralSettingsTab />;
      case "notifications":
        return <AdminNotificationsTab />;
      case "profile":
      default:
        return <AdminProfileTab />;
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage system settings and role permissions
        </p>
      </div>

      <div className="mb-6">
        <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-1 xl:px-4 py-2.5 text-sm font-medium rounded-md transition-all duration-200 ${getTabClass(
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

export default AdminProfileSettingsContent;
