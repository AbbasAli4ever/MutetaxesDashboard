"use client";

import React from "react";
import { LuBuilding2, LuMail } from "react-icons/lu";
import { FaRegUser } from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";
import {
  formatDateDisplay,
  getCustomerProfileBundle,
} from "@/components/company-management/customer-company-api";

type CompanyInfo = {
  companyName: string;
  registrationNumber: string;
  incorporationDate: string;
  companyType: string;
  country: string;
  address: string;
  accountStatus: string;
};

const disabledInputCls =
  "h-11 w-full rounded-lg border border-gray-200 bg-gray-100 pl-9 pr-3 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 cursor-not-allowed";

const ProfileTab: React.FC = () => {
  const { user } = useAuth();
  const [loadingCompany, setLoadingCompany] = React.useState(true);
  const [companyError, setCompanyError] = React.useState("");
  const [companyInfo, setCompanyInfo] = React.useState<CompanyInfo>({
    companyName: "—",
    registrationNumber: "—",
    incorporationDate: "—",
    companyType: "—",
    country: "—",
    address: "—",
    accountStatus: "Active",
  });

  const fullName = user?.name || "—";
  const email = user?.email || "—";

  const loadCompanyInfo = React.useCallback(async () => {
    setLoadingCompany(true);
    setCompanyError("");
    try {
      const { profile, latestRegistration } = await getCustomerProfileBundle();
      setCompanyInfo({
        companyName: profile?.companyName || latestRegistration?.proposedCompanyName || "—",
        registrationNumber: profile?.businessRegistrationNumber || "—",
        incorporationDate: formatDateDisplay(profile?.incorporationDate),
        companyType: profile?.companyType || latestRegistration?.companyType || "—",
        country: profile?.countryOfIncorporation || latestRegistration?.countryOfIncorporation || "—",
        address: profile?.registeredOfficeAddress || "—",
        accountStatus: "Active",
      });
    } catch (err) {
      setCompanyError(err instanceof Error ? err.message : "Failed to load company information");
    } finally {
      setLoadingCompany(false);
    }
  }, []);

  React.useEffect(() => {
    void loadCompanyInfo();
  }, [loadCompanyInfo]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Personal Information
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Your account details (managed by admin)
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Full Name
            </label>
            <div className="relative mt-2">
              <FaRegUser className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input type="text" value={fullName} disabled className={disabledInputCls} />
            </div>
            <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
              You cannot change your full name from the customer portal.
            </p>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Email Address
            </label>
            <div className="relative mt-2">
              <LuMail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input type="email" value={email} disabled className={disabledInputCls} />
            </div>
            <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
              You cannot change your email address from the customer portal.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Company Information
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Company information uploaded by admin
        </p>

        {companyError ? (
          <div className="mt-5 rounded-xl border border-error-200 bg-error-50 dark:border-error-500/20 dark:bg-error-500/10 p-4">
            <p className="text-sm text-error-700 dark:text-error-400">{companyError}</p>
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2">
            <InfoRow icon={<LuBuilding2 className="mt-0.5 h-4 w-4 text-gray-400" />} label="Company Name" value={loadingCompany ? "Loading..." : companyInfo.companyName} />
            <InfoRow label="Business Registration Number" value={loadingCompany ? "Loading..." : companyInfo.registrationNumber} />
            <InfoRow label="Incorporation Date" value={loadingCompany ? "Loading..." : companyInfo.incorporationDate} />
            <InfoRow label="Company Type" value={loadingCompany ? "Loading..." : companyInfo.companyType} />
            <InfoRow label="Country" value={loadingCompany ? "Loading..." : companyInfo.country} />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Account Status</p>
              <span className={`mt-1 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                companyInfo.accountStatus === "Inactive"
                  ? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                  : "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300"
              }`}>
                {companyInfo.accountStatus}
              </span>
            </div>
            <div className="md:col-span-2">
              <InfoRow label="Registered Office Address" value={loadingCompany ? "Loading..." : companyInfo.address} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function InfoRow({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  if (icon) {
    return (
      <div className="flex items-start gap-3">
        {icon}
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
          <p className="text-sm font-medium text-gray-900 dark:text-white break-words">{value}</p>
        </div>
      </div>
    );
  }
  return (
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-sm font-medium text-gray-900 dark:text-white break-words">{value}</p>
    </div>
  );
}

export default ProfileTab;
