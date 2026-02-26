"use client";

import React from "react";
import { LuBuilding2, LuCalendar } from "react-icons/lu";
import { MdOutlineMailOutline } from "react-icons/md";
import { IoLocationOutline } from "react-icons/io5";
import { HiOutlineHashtag } from "react-icons/hi";
import { FiFileText, FiPhone } from "react-icons/fi";
import { LuRefreshCw, LuUser } from "react-icons/lu";
import {
  formatDateDisplay,
  getCustomerProfileBundle,
  type CustomerStakeholderApi,
} from "@/components/company-management/customer-company-api";

function stakeholderName(s: CustomerStakeholderApi) {
  return s.fullName || s.companyName || "—";
}

export default function CompanyProfileTab() {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [profileData, setProfileData] = React.useState<{
    companyName: string;
    registrationNumber: string;
    incorporationDate: string;
    businessNature: string;
    email: string;
    phone: string;
    address: string;
  }>({
    companyName: "—",
    registrationNumber: "—",
    incorporationDate: "—",
    businessNature: "—",
    email: "—",
    phone: "—",
    address: "—",
  });
  const [directors, setDirectors] = React.useState<CustomerStakeholderApi[]>([]);
  const [shareholders, setShareholders] = React.useState<CustomerStakeholderApi[]>([]);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { profile, stakeholders, latestRegistration } = await getCustomerProfileBundle();
      setProfileData({
        companyName: profile?.companyName || latestRegistration?.proposedCompanyName || "—",
        registrationNumber: profile?.businessRegistrationNumber || "—",
        incorporationDate: formatDateDisplay(profile?.incorporationDate),
        businessNature: profile?.businessNature || "—",
        email: profile?.businessEmail || latestRegistration?.applicantEmail || "—",
        phone: profile?.phoneNumber || latestRegistration?.applicantPhone || "—",
        address: profile?.registeredOfficeAddress || "—",
      });
      setDirectors(stakeholders.filter((s) => s.roles?.includes("director")));
      setShareholders(stakeholders.filter((s) => s.roles?.includes("shareholder")));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load company profile");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <LuRefreshCw className="w-4 h-4 animate-spin" />
          Loading company information...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-error-200 bg-error-50 dark:border-error-500/20 dark:bg-error-500/10 p-6 space-y-3">
        <p className="text-sm text-error-700 dark:text-error-400">{error}</p>
        <button
          onClick={() => void load()}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg"
        >
          <LuRefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Company Information</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Basic details uploaded by the admin</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Info label="Company Name" icon={<LuBuilding2 className="w-5 h-5" />} value={profileData.companyName} />
          <Info label="Business Registration Number" icon={<HiOutlineHashtag className="w-5 h-5" />} value={profileData.registrationNumber} />
          <Info label="Incorporation Date" icon={<LuCalendar className="w-5 h-5" />} value={profileData.incorporationDate} />
          <Info label="Business Nature" icon={<FiFileText className="w-5 h-5" />} value={profileData.businessNature} />
          <Info label="Email" icon={<MdOutlineMailOutline className="w-5 h-5" />} value={profileData.email} />
          <Info label="Phone" icon={<FiPhone className="w-5 h-5" />} value={profileData.phone} />
          <div className="md:col-span-2">
            <Info label="Registered Office Address" icon={<IoLocationOutline className="w-5 h-5" />} value={profileData.address} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Directors</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Company directors information</p>
          <div className="space-y-3">
            {directors.length === 0 ? (
              <EmptyText text="No directors available" />
            ) : directors.map((director) => (
              <div key={director.id} className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center">
                    <LuUser className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{stakeholderName(director)}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {director.type === "corporate" ? "Corporate Director" : "Director"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Shareholders</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Share ownership structure</p>
          <div className="space-y-3">
            {shareholders.length === 0 ? (
              <EmptyText text="No shareholders available" />
            ) : shareholders.map((shareholder) => (
              <div key={shareholder.id} className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{stakeholderName(shareholder)}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {shareholder.numberOfShares != null ? `${shareholder.numberOfShares.toLocaleString()} Shares` : "—"}
                    </p>
                  </div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                    {Number(shareholder.sharePercentage ?? 0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ label, icon, value }: { label: string; icon: React.ReactNode; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{label}</p>
      <div className="flex items-center gap-3">
        <span className="text-gray-400 dark:text-gray-500">{icon}</span>
        <span className="text-sm font-medium text-gray-900 dark:text-white break-words">{value || "—"}</span>
      </div>
    </div>
  );
}

function EmptyText({ text }: { text: string }) {
  return <p className="text-sm text-gray-500 dark:text-gray-400">{text}</p>;
}

