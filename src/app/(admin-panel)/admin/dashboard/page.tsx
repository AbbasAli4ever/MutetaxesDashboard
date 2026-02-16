"use client";

import {
  StatCard,
  RegistrationStatusChart,
  RegistrationsTrendChart,
  RevenueTrendChart,
  RecentRegistrationsTable,
  statCardsData,
  registrationStatusData,
  registrationTrendData,
  revenueTrendData,
  recentRegistrationsData,
  PIE_COLORS,
} from "@/components/dashboard";

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Welcome back, Admin User
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <span className="font-medium">Last updated</span>
          <span className="text-gray-900 dark:text-white font-semibold">
            Just now
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCardsData.map((card, index) => (
          <StatCard key={index} data={card} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <RegistrationStatusChart
          data={registrationStatusData}
          colors={PIE_COLORS}
        />
        <RegistrationsTrendChart data={registrationTrendData} />
      </div>

      <RevenueTrendChart data={revenueTrendData} />

      <RecentRegistrationsTable data={recentRegistrationsData} />
    </div>
  );
}
