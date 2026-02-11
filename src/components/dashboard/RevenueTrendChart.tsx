import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { LuTrendingUp } from "react-icons/lu";
import type { RevenueData, TimeView } from "./types";

interface RevenueTrendChartProps {
  data: RevenueData[];
}

const CustomRevenueTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-900 p-3 rounded-lg shadow-theme-lg border border-gray-200 dark:border-gray-800">
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          {payload[0].payload.month}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Revenue: ${payload[0].value.toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

export const RevenueTrendChart: React.FC<RevenueTrendChartProps> = ({
  data,
}) => {
  const [revenueView, setRevenueView] = useState<TimeView>("monthly");

  return (
    <div className="relative overflow-hidden rounded-xl bg-white dark:bg-gray-900 p-6 shadow-theme-sm border border-gray-200 dark:border-gray-800">
      {/* Gradient Glow */}
      <div className="absolute -top-12 -left-12 w-48 h-48 bg-success-500/20 dark:bg-success-400/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Revenue Trend
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Monthly revenue performance in USD
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-gray-100 dark:bg-gray-800 p-0.5">
          {(["weekly", "monthly", "yearly"] as const).map((view) => (
            <button
              key={view}
              onClick={() => setRevenueView(view)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                revenueView === view
                  ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              {view.charAt(0).toUpperCase() + view.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="[&_*]:outline-none">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#12b76a" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#12b76a" stopOpacity={0.2} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e4e7ec"
              className="dark:opacity-20"
            />
            <XAxis
              dataKey="month"
              tick={{ fill: "#98a2b3", fontSize: 12 }}
              axisLine={{ stroke: "#e4e7ec" }}
              className="dark:opacity-50"
            />
            <YAxis
              tick={{ fill: "#98a2b3", fontSize: 12 }}
              axisLine={{ stroke: "#e4e7ec" }}
              className="dark:opacity-50"
              tickFormatter={(value) => `$${value / 1000}k`}
            />
            <Tooltip content={<CustomRevenueTooltip />} cursor={false} />
            <Bar
              dataKey="revenue"
              fill="url(#revenueGradient)"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-success-50 dark:bg-success-500/10">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Total Revenue
          </p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            $26,096
          </p>
        </div>
        <div className="p-4 rounded-lg bg-blue-light-50 dark:bg-blue-light-500/10">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Average/Month
          </p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            $6,524
          </p>
        </div>
        <div className="p-4 rounded-lg bg-theme-purple-500/10">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Growth Rate
          </p>
          <div className="flex items-center gap-1">
            <LuTrendingUp className="w-4 h-4 text-theme-purple-500" />
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              +166%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
