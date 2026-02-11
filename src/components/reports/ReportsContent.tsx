"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  LuFileText,
  LuDollarSign,
  LuUsers,
  LuTrendingUp,
  LuDownload,
} from "react-icons/lu";

const performanceTrendData = [
  { month: "Sep", registrations: 18, efficiency: 50 },
  { month: "Oct", registrations: 22, efficiency: 52 },
  { month: "Nov", registrations: 24, efficiency: 53 },
  { month: "Dec", registrations: 30, efficiency: 56 },
  { month: "Jan", registrations: 46, efficiency: 59 },
];

const revenueGrowthData = [
  { month: "Sep", revenue: 6200 },
  { month: "Oct", revenue: 6900 },
  { month: "Nov", revenue: 7400 },
  { month: "Dec", revenue: 10200 },
  { month: "Jan", revenue: 13100 },
];

const reportCards = [
  {
    title: "Monthly Registration Report",
    description: "Complete overview of all registrations for the current month",
    lastGenerated: "2026-01-28",
    icon: <LuFileText className="w-6 h-6 text-brand-500" />,
    iconBg: "bg-brand-50 dark:bg-brand-500/10",
  },
  {
    title: "Revenue Analysis Report",
    description: "Financial breakdown and revenue trends",
    lastGenerated: "2026-01-27",
    icon: <LuDollarSign className="w-6 h-6 text-brand-500" />,
    iconBg: "bg-brand-50 dark:bg-brand-500/10",
  },
  {
    title: "User Performance Report",
    description: "Team productivity and registration handling metrics",
    lastGenerated: "2026-01-26",
    icon: <LuUsers className="w-6 h-6 text-brand-500" />,
    iconBg: "bg-brand-50 dark:bg-brand-500/10",
  },
  {
    title: "Compliance Summary Report",
    description: "Overview of compliance checks and status",
    lastGenerated: "2026-01-25",
    icon: <LuTrendingUp className="w-6 h-6 text-brand-500" />,
    iconBg: "bg-brand-50 dark:bg-brand-500/10",
  },
];

const CustomLineTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-theme-lg p-3 text-sm">
        <p className="font-semibold text-gray-900 dark:text-white mb-1">
          {label}
        </p>
        {payload.map((p: any) => (
          <p key={p.dataKey} style={{ color: p.color }}>
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-theme-lg p-3 text-sm">
        <p className="font-semibold text-gray-900 dark:text-white mb-1">
          {label}
        </p>
        <p className="text-success-600 dark:text-success-400">
          Revenue: ${payload[0].value.toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

export default function ReportsContent() {
  return (
    <div className="space-y-6 w-full">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Reports &amp; Analytics
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Generate and download comprehensive reports
        </p>
      </div>

      {/* Report Cards — 2×2 grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {reportCards.map((card) => (
          <div
            key={card.title}
            className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-theme-sm p-5 flex flex-col gap-4"
          >
            {/* Top row: icon + title/description */}
            <div className="flex items-start gap-4">
              <div
                className={`shrink-0 w-11 h-11 rounded-lg flex items-center justify-center ${card.iconBg}`}
              >
                {card.icon}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white leading-snug">
                  {card.title}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {card.description}
                </p>
              </div>
            </div>

            {/* Bottom row: last generated + download button */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Last generated:{" "}
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  {card.lastGenerated}
                </span>
              </span>
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-700 dark:bg-gray-100 dark:hover:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-lg transition-colors">
                <LuDownload className="w-4 h-4" />
                Download
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

        {/* Performance Trend — dual-axis line chart */}
        <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-theme-sm p-6">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-5">
            Performance Trend
          </h3>
          <div className="[&_*]:outline-none">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart
                data={performanceTrendData}
                margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e4e7ec"
                  className="dark:opacity-20"
                  horizontal={true}
                  vertical={true}
                  yAxisId="left"
                />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#98a2b3", fontSize: 12 }}
                  axisLine={{ stroke: "#e4e7ec" }}
                  tickLine={{ stroke: "#e4e7ec" }}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fill: "#98a2b3", fontSize: 12 }}
                  axisLine={{ stroke: "#e4e7ec" }}
                  tickLine={{ stroke: "#e4e7ec" }}
                  domain={[0, 60]}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fill: "#98a2b3", fontSize: 12 }}
                  axisLine={{ stroke: "#e4e7ec" }}
                  tickLine={{ stroke: "#e4e7ec" }}
                  domain={[0, 100]}
                />
                <Tooltip content={<CustomLineTooltip />} />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="registrations"
                  name="Registrations"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  dot={{ fill: "#2563eb", r: 4, stroke: "#fff", strokeWidth: 2 }}
                  activeDot={{ r: 6, stroke: "#fff", strokeWidth: 2 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="efficiency"
                  name="Efficiency %"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ fill: "#10b981", r: 4, stroke: "#fff", strokeWidth: 2 }}
                  activeDot={{ r: 6, stroke: "#fff", strokeWidth: 2 }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {value}
                    </span>
                  )}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Growth — bar chart */}
        <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-theme-sm p-6">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-5">
            Revenue Growth
          </h3>
          <div className="[&_*]:outline-none">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={revenueGrowthData}
                margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
                barSize={48}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e4e7ec"
                  className="dark:opacity-20"
                  horizontal={true}
                  vertical={true}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#98a2b3", fontSize: 12 }}
                  axisLine={{ stroke: "#e4e7ec" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#98a2b3", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) =>
                    v === 0 ? "0" : `${(v / 1000).toFixed(0)}k`
                  }
                  domain={[0, 14000]}
                  ticks={[0, 3500, 7000, 10500, 14000]}
                />
                <Tooltip content={<CustomBarTooltip />} cursor={{ fill: "transparent" }} />
                <Bar
                  dataKey="revenue"
                  name="Revenue ($)"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  cursor="default"
                />
                <Legend
                  iconType="square"
                  iconSize={10}
                  formatter={(value) => (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {value}
                    </span>
                  )}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
