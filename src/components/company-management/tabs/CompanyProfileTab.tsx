"use client";
import React from "react";
import Image from "next/image";
import { LuBuilding2, LuCalendar } from "react-icons/lu";
import { MdOutlineMailOutline } from "react-icons/md";
import { IoLocationOutline } from "react-icons/io5";
import { HiOutlineHashtag } from "react-icons/hi";
import { FiFileText, FiPhone } from "react-icons/fi";

// Mock data for the company
const companyData = {
  name: "Tech Innovations Ltd",
  registrationNumber: "12345678-000-01-26-5",
  incorporationDate: "15 January 2020",
  businessNature: "Information Technology Services",
  email: "info@techinnovations.hk",
  phone: "+852 2345 6789",
  address: "Unit 1234, 12/F, Office Tower, 123 Queen's Road Central, Hong Kong",
};

const directors = [
  {
    name: "David Wong",
    title: "Managing Director",
    id: "A1234567",
    since: "15/1/2020",
  },
  {
    name: "Sarah Chen",
    title: "Executive Director",
    id: "B9876543",
    since: "20/3/2021",
  },
];

const shareholders = [
  {
    name: "David Wong",
    shares: "5,000 Ordinary Shares",
    percentage: 50,
  },
  {
    name: "Sarah Chen",
    shares: "3,000 Ordinary Shares",
    percentage: 30,
  },
  {
    name: "Innovation Holdings Ltd",
    shares: "2,000 Ordinary Shares",
    percentage: 20,
  },
];

const CompanyProfileTab: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Company Information Card */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          Company Information
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Basic details about your company
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Company Name */}
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Company Name
            </p>
            <div className="flex items-center gap-3">
              <span className="text-gray-400 dark:text-gray-500">
                <LuBuilding2 className="w-5 h-5" />
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {companyData.name}
              </span>
            </div>
          </div>

          {/* Business Registration Number */}
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Business Registration Number
            </p>
            <div className="flex items-center gap-3">
              <span className="text-gray-400 dark:text-gray-500">
                <HiOutlineHashtag className="w-5 h-5" />
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {companyData.registrationNumber}
              </span>
            </div>
          </div>

          {/* Incorporation Date */}
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Incorporation Date
            </p>
            <div className="flex items-center gap-3">
              <span className="text-gray-400 dark:text-gray-500">
                <LuCalendar className="w-5 h-5" />
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {companyData.incorporationDate}
              </span>
            </div>
          </div>

          {/* Business Nature */}
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Business Nature
            </p>
            <div className="flex items-center gap-3">
              <span className="text-gray-400 dark:text-gray-500">
                <FiFileText className="w-5 h-5" />
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {companyData.businessNature}
              </span>
            </div>
          </div>

          {/* Email */}
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Email
            </p>
            <div className="flex items-center gap-3">
              <span className="text-gray-400 dark:text-gray-500">
                <MdOutlineMailOutline className="w-5 h-5" />
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {companyData.email}
              </span>
            </div>
          </div>

          {/* Phone */}
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Phone
            </p>
            <div className="flex items-center gap-3">
              <span className="text-gray-400 dark:text-gray-500">
                <FiPhone className="w-5 h-5" />
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {companyData.phone}
              </span>
            </div>
          </div>

          {/* Registered Office Address - Full Width */}
          <div className="md:col-span-2">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Registered Office Address
            </p>
            <div className="flex items-center gap-3">
              <span className="text-gray-400 dark:text-gray-500">
                <IoLocationOutline className="w-5 h-5" />
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {companyData.address}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Directors and Shareholders Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Directors Card */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            Directors
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Company directors information
          </p>

          <div className="space-y-3">
            {directors.map((director, index) => (
              <div
                key={index}
                className="rounded-xl border border-gray-200 dark:border-gray-700 p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center">
                    <Image
                      src="/images/user/users.svg"
                      alt="Users"
                      width={20}
                      height={20}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      {director.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {director.title}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>
                        <span className="text-gray-400">ID:</span>{" "}
                        <span className="text-gray-700 dark:text-gray-300">{director.id}</span>
                      </span>
                      <span>
                        <span className="text-gray-400">Since:</span>{" "}
                        <span className="text-gray-700 dark:text-gray-300">{director.since}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shareholders Card */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            Shareholders
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Share ownership structure
          </p>

          <div className="space-y-3">
            {shareholders.map((shareholder, index) => (
              <div
                key={index}
                className="rounded-xl border border-gray-200 dark:border-gray-700 p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      {shareholder.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {shareholder.shares}
                    </p>
                  </div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                    {shareholder.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyProfileTab;
