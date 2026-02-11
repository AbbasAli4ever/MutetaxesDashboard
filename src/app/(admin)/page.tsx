"use client";

import { useRole } from "@/context/RoleContext";

// User dashboard imports
import { EcommerceMetrics } from "@/components/ecommerce/EcommerceMetrics";
import StatisticsChart from "@/components/ecommerce/StatisticsChart";
import UpcomingDeadlines from "@/components/ecommerce/UpcomingDeadlines";
import RecentActivities from "@/components/ecommerce/RecentActivities";
import ComplianceStatus from "@/components/ecommerce/ComplianceStatus";
import AssistanceAlert from "@/components/ecommerce/AssistanceAlert";

// Admin dashboard imports
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

function UserDashboard() {
  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12 space-y-6">
        <EcommerceMetrics />
      </div>

      <div className="col-span-12">
        <StatisticsChart />
      </div>

      <div className="col-span-12 grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <UpcomingDeadlines />
        <RecentActivities />
        <ComplianceStatus />
      </div>

      <div className="col-span-12">
        <AssistanceAlert />
      </div>
    </div>
  );
}

function AdminDashboard() {
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

export default function Home() {
  const { role } = useRole();
  return role === "admin" ? <AdminDashboard /> : <UserDashboard />;
}
