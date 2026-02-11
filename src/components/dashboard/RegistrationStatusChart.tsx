import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { LuArrowUpRight } from "react-icons/lu";
import type { RegistrationStatusData } from "./types";

interface RegistrationStatusChartProps {
  data: RegistrationStatusData[];
  colors: string[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-900 p-3 rounded-lg shadow-theme-lg border border-gray-200 dark:border-gray-800">
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          {payload[0].name}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Count: {payload[0].payload.count}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Percentage: {payload[0].value}%
        </p>
      </div>
    );
  }
  return null;
};

export const RegistrationStatusChart: React.FC<
  RegistrationStatusChartProps
> = ({ data, colors }) => {

  return (
    <div className="relative overflow-hidden rounded-xl bg-white dark:bg-gray-900 p-6 shadow-theme-sm border border-gray-200 dark:border-gray-800">
      {/* Gradient Glow */}
      <div className="absolute -top-12 -left-12 w-48 h-48 bg-brand-500/20 dark:bg-brand-400/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Registration Status Distribution
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Current breakdown of all registrations
          </p>
        </div>
        <button className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
          <LuArrowUpRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      <div className="relative flex items-center justify-center [&_*]:outline-none">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              cornerRadius={8}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        {data.map((item, index) => (
          <div key={index} className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: colors[index] }}
              />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                {item.name}
              </span>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {item.count}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
