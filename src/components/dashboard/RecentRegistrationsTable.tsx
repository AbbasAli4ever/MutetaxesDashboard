import React from "react";
import type { Registration } from "./types";

interface RecentRegistrationsTableProps {
  data: Registration[];
}

export const RecentRegistrationsTable: React.FC<
  RecentRegistrationsTableProps
> = ({ data }) => {
  const getStatusColor = (status: Registration["status"]) => {
    switch (status) {
      case "completed":
        return "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400";
      case "pending":
        return "bg-blue-light-50 text-blue-light-700 dark:bg-blue-light-500/10 dark:text-blue-light-400";
      case "in-progress":
        return "bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400";
      default:
        return "bg-gray-50 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400";
    }
  };

  const getStatusDotColor = (status: Registration["status"]) => {
    switch (status) {
      case "completed":
        return "bg-success-500";
      case "pending":
        return "bg-blue-light-500";
      case "in-progress":
        return "bg-warning-500";
      default:
        return "bg-gray-500";
    }
  };

  const formatStatus = (status: string) => {
    return status
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="relative overflow-hidden rounded-xl bg-white dark:bg-gray-900 p-6 shadow-theme-sm border border-gray-200 dark:border-gray-800">
      {/* Gradient Glow */}
      <div className="absolute -top-12 -left-12 w-48 h-48 bg-blue-light-500/20 dark:bg-blue-light-400/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Registrations
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Latest registration submissions
          </p>
        </div>
        <button className="px-4 py-2 text-sm font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300 transition-colors">
          View All
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800">
              <th className="pb-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Name
              </th>
              <th className="pb-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Type
              </th>
              <th className="pb-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Registration ID
              </th>
              <th className="pb-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Date
              </th>
              <th className="pb-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {data.map((registration) => (
              <tr
                key={registration.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <td className="py-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${getStatusDotColor(
                        registration.status
                      )}`}
                    />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {registration.name}
                    </span>
                  </div>
                </td>
                <td className="py-4">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {registration.type}
                  </span>
                </td>
                <td className="py-4">
                  <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
                    {registration.id}
                  </span>
                </td>
                <td className="py-4">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {registration.date}
                  </span>
                </td>
                <td className="py-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${getStatusColor(
                      registration.status
                    )}`}
                  >
                    {formatStatus(registration.status)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
