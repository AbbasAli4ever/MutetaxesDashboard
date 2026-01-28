"use client";
import React from "react";

const SupportContactCard: React.FC = () => {
  return (
    <div className="rounded-2xl border border-[#A4F4CF] p-6 bg-[linear-gradient(90deg,#ECFDF5_0%,#F0FDFA_100%)] dark:border-gray-700 dark:bg-none dark:bg-gray-900">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Your Accountant
          </h3>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            Emily Chan, CPA
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Senior Accountant
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Email
          </h3>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            emily.chan@mutetaxes.hk
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Phone
          </h3>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            +852 2345 6789
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Office Hours: Mon-Fri, 9:00 AM - 6:00 PM
          </p>
        </div>
      </div>
    </div>
  );
};

export default SupportContactCard;
