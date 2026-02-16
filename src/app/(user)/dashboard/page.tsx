"use client";

// User dashboard imports
import { EcommerceMetrics } from "@/components/ecommerce/EcommerceMetrics";
import StatisticsChart from "@/components/ecommerce/StatisticsChart";
import UpcomingDeadlines from "@/components/ecommerce/UpcomingDeadlines";
import RecentActivities from "@/components/ecommerce/RecentActivities";
import ComplianceStatus from "@/components/ecommerce/ComplianceStatus";
import AssistanceAlert from "@/components/ecommerce/AssistanceAlert";

export default function UserDashboard() {
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
