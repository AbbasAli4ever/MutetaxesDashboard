import React from "react";
import { LuTrendingUp } from "react-icons/lu";
import type { StatCardData } from "./types";

interface StatCardProps {
  data: StatCardData;
}

export const StatCard: React.FC<StatCardProps> = ({ data }) => {
  return (
    <div className="relative overflow-hidden rounded-xl bg-white dark:bg-gray-900 p-6 shadow-theme-sm border border-gray-200 dark:border-gray-800 hover:shadow-theme-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex w-full items-center justify-between">
             <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {data.title}
          </p>
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-2 rounded-lg ${data.iconBg} ${data.iconColor}`}>
                <data.icon className="w-5 h-5" />
              </div>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {data.value}
          </p>
          <div className="flex items-center gap-1">
            {!data.alert ? (
              <>
                <span className="inline-flex items-center text-xs font-semibold text-success-600 dark:text-success-400">
                  <LuTrendingUp className="w-3 h-3 mr-1" />
                  {data.change}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {data.period}
                </span>
              </>
            ) : (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium text-warning-700 dark:text-warning-400 bg-warning-50 dark:bg-warning-500/10">
                {data.change}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
