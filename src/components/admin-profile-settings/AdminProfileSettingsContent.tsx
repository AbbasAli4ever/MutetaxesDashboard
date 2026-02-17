"use client";
import React, { useState } from "react";
import { LuLock } from "react-icons/lu";
import AdminProfileTab from "./tabs/AdminProfileTab";
import AdminSecurityTab from "./tabs/AdminSecurityTab";
import AdminRoleManagementTab from "./tabs/AdminRoleManagementTab";
import AdminGeneralSettingsTab from "./tabs/AdminGeneralSettingsTab";
import AdminNotificationsTab from "./tabs/AdminNotificationsTab";
import { usePermissions } from "@/hooks/usePermissions";

type TabType = "profile" | "security" | "role-management" | "general-settings" | "notifications";

const AdminProfileSettingsContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("profile");
  const { hasModuleAccess } = usePermissions();
  const hasAdminSettingsAccess = hasModuleAccess("BADGE_CREATION");

  const tabs: { id: TabType; label: string; adminOnly: boolean }[] = [
    { id: "profile", label: "Profile", adminOnly: false },
    { id: "security", label: "Security", adminOnly: false },
    { id: "role-management", label: "Role Management", adminOnly: true },
    { id: "general-settings", label: "General Settings", adminOnly: true },
    { id: "notifications", label: "Notifications", adminOnly: true },
  ];

  const getTabClass = (tab: { id: TabType; adminOnly: boolean }) => {
    const isDisabled = tab.adminOnly && !hasAdminSettingsAccess;
    if (isDisabled) {
      return "opacity-40 cursor-not-allowed text-gray-400 dark:text-gray-600";
    }
    return activeTab === tab.id
      ? "border-brand-500 text-brand-500 bg-white dark:bg-gray-900"
      : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300";
  };

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
          {tabs.map((tab) => {
            const isDisabled = tab.adminOnly && !hasAdminSettingsAccess;
            return (
              <button
                key={tab.id}
                onClick={() => !isDisabled && setActiveTab(tab.id)}
                disabled={isDisabled}
                title={isDisabled ? "You don't have permission to access this tab" : undefined}
                className={`flex-1 px-1 xl:px-4 py-2.5 text-sm font-medium rounded-md transition-all duration-200 flex items-center justify-center gap-1.5 ${getTabClass(
                  tab
                )} ${activeTab === tab.id ? "shadow-sm" : ""}`}
              >
                {isDisabled && <LuLock className="w-3.5 h-3.5" />}
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>{renderTabContent()}</div>
    </div>
  );
};

export default AdminProfileSettingsContent;
