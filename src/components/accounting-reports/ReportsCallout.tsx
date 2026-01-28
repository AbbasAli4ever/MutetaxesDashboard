"use client";
import React from "react";
import { MdOutlineFileDownload } from "react-icons/md";

const ReportsCallout: React.FC = () => {
  return (
    <div className="rounded-2xl border border-[#A4F4CF] p-5 bg-[linear-gradient(90deg,#ECFDF5_0%,#F0FDFA_100%)] dark:border-gray-700 dark:bg-none dark:bg-gray-900">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Need all reports?
          </h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Download a complete package of all available reports for your
            records
          </p>
        </div>
        <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#009966] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-600 whitespace-nowrap">
          <MdOutlineFileDownload className="w-4 h-4" />
          Download All Reports
        </button>
      </div>
    </div>
  );
};

export default ReportsCallout;
