"use client";
import React from "react";
import { MdOutlineFileDownload, MdOutlineRemoveRedEye } from "react-icons/md";
import { LuChartBar, LuChartPie, LuFileText } from "react-icons/lu";
import { IconType } from "react-icons";
import { FaRegChartBar } from "react-icons/fa";


export type ReportCategory = "financial" | "tax" | "audit";

export interface ReportItem {
  name: string;
  period: string;
  format: string;
  size: string;
  date: string;
  category: ReportCategory;
}

interface ReportListProps {
  title: string;
  description: string;
  items: ReportItem[];
  onView?: (item: ReportItem) => void;
}

const categoryConfig: Record<
  ReportCategory,
  { icon: IconType; bgColor: string; iconColor: string }
> = {
  financial: {
    icon: FaRegChartBar,
    bgColor: "bg-green-50 dark:bg-green-500/10",
    iconColor: "text-green-600 dark:text-green-400",
  },
  tax: {
    icon: LuFileText,
    bgColor: "bg-blue-50 dark:bg-blue-500/10",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  audit: {
    icon: LuChartPie,
    bgColor: "bg-purple-50 dark:bg-purple-500/10",
    iconColor: "text-purple-600 dark:text-purple-400",
  },
};

const ReportList: React.FC<ReportListProps> = ({
  title,
  description,
  items,
  onView,
}) => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
        {title}
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        {description}
      </p>

      <div className="space-y-3">
        {items.map((report, index) => {
          const config = categoryConfig[report.category];
          const CategoryIcon = config.icon;

          return (
            <div
              key={`${report.name}-${index}`}
              className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`shrink-0 w-10 h-10 rounded-lg ${config.bgColor} flex items-center justify-center`}
                >
                  <CategoryIcon className={`w-5 h-5 ${config.iconColor}`} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {report.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>{report.period}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                    <span>{report.format}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                    <span>{report.size}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                    <span>{report.date}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
              <button
                onClick={() => onView?.(report)}
                type="button"
                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                  <MdOutlineRemoveRedEye className="w-4 h-4" />
                  View
                </button>
                <button className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors">
                  <MdOutlineFileDownload className="w-4 h-4" />
                  Download
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ReportList;
