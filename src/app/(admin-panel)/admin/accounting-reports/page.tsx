"use client";

import { useState, useRef, useEffect } from "react";
import PageAccessGuard from "@/components/common/PageAccessGuard";
import ComingSoonOverlay from "@/components/common/ComingSoonOverlay";
import {
  LuCircleCheck,
  LuShieldCheck,
  LuTriangleAlert,
  LuSearch,
  LuSlidersHorizontal,
  LuChevronDown,
  LuCheck,
} from "react-icons/lu";

type ComplianceStatus = "compliant" | "pending-review" | "non-compliant";

interface ComplianceCheck {
  id: string;
  registrationId: string;
  client: string;
  checkType: string;
  status: ComplianceStatus;
  lastChecked: string;
  notes: string;
}

const complianceData: ComplianceCheck[] = [
  {
    id: "CMP-001",
    registrationId: "REG-001",
    client: "John Doe",
    checkType: "Identity Verification",
    status: "pending-review",
    lastChecked: "2026-01-27",
    notes: "Awaiting additional documentation",
  },
  {
    id: "CMP-002",
    registrationId: "REG-002",
    client: "Jane Smith",
    checkType: "AML Screening",
    status: "compliant",
    lastChecked: "2026-01-26",
    notes: "All checks passed",
  },
  {
    id: "CMP-003",
    registrationId: "REG-003",
    client: "Tech Innovations Inc",
    checkType: "Business Verification",
    status: "compliant",
    lastChecked: "2026-01-25",
    notes: "Verified successfully",
  },
  {
    id: "CMP-004",
    registrationId: "REG-004",
    client: "Green Solutions",
    checkType: "Tax ID Verification",
    status: "compliant",
    lastChecked: "2026-01-24",
    notes: "No issues found",
  },
];

const statusOptions = [
  { value: "All Statuses", label: "All Statuses", icon: null },
  { value: "Compliant", label: "Compliant", icon: <LuCircleCheck className="w-4 h-4 text-success-500" /> },
  { value: "Pending Review", label: "Pending Review", icon: <LuShieldCheck className="w-4 h-4 text-orange-500" /> },
  { value: "Non-Compliant", label: "Non-Compliant", icon: <LuTriangleAlert className="w-4 h-4 text-error-500" /> },
];

const checkTypes = [
  "All Check Types",
  "Identity Verification",
  "AML Screening",
  "Business Verification",
  "Tax ID Verification",
];

const statCards = [
  {
    label: "Compliant",
    count: 3,
    sub: "All checks passed",
    icon: <LuCircleCheck className="w-6 h-6 text-success-500" />,
    border: "border-success-200 dark:border-success-500/20",
  },
  {
    label: "Pending Review",
    count: 1,
    sub: "Awaiting verification",
    icon: <LuShieldCheck className="w-6 h-6 text-orange-500" />,
    border: "border-orange-200 dark:border-orange-500/20",
  },
  {
    label: "Non-Compliant",
    count: 0,
    sub: "Requires immediate action",
    icon: <LuTriangleAlert className="w-6 h-6 text-error-500" />,
    border: "border-error-200 dark:border-error-500/20",
  },
];

function CustomDropdown({
  options,
  value,
  onChange,
  withIcons = false,
}: {
  options: typeof statusOptions | string[];
  value: string;
  onChange: (v: string) => void;
  withIcons?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const normalised = (options as (typeof statusOptions[0] | string)[]).map((o) =>
    typeof o === "string" ? { value: o, label: o, icon: null } : (o as (typeof statusOptions)[0])
  );
  const active = normalised.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative w-full">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 rounded-lg text-sm font-semibold text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
      >
        <span>{active?.label ?? value}</span>
        <LuChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute z-50 top-full mt-1.5 left-0 w-full min-w-[220px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-theme-lg overflow-hidden">
          {normalised.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${
                value === opt.value
                  ? "bg-gray-100 dark:bg-gray-700/60 text-gray-900 dark:text-white"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/40"
              }`}
            >
              <span className="flex items-center gap-2.5">
                {withIcons && opt.icon}
                {opt.label}
              </span>
              {value === opt.value && <LuCheck className="w-4 h-4 text-gray-500 dark:text-gray-400 shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminCompliance() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("All Statuses");
  const [selectedCheckType, setSelectedCheckType] = useState("All Check Types");

  const getStatusStyle = (status: ComplianceStatus) => {
    switch (status) {
      case "compliant": return "bg-success-500 text-white";
      case "pending-review": return "bg-orange-500 text-white";
      case "non-compliant": return "bg-error-500 text-white";
    }
  };

  const formatStatus = (status: ComplianceStatus) => {
    switch (status) {
      case "compliant": return "Compliant";
      case "pending-review": return "Pending Review";
      case "non-compliant": return "Non-Compliant";
    }
  };

  const filtered = complianceData.filter((item) => {
    const matchesSearch =
      item.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.registrationId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === "All Statuses" || formatStatus(item.status) === selectedStatus;
    const matchesCheckType = selectedCheckType === "All Check Types" || item.checkType === selectedCheckType;
    return matchesSearch && matchesStatus && matchesCheckType;
  });

  return (
    <PageAccessGuard module="COMPLIANCE">
      <ComingSoonOverlay title="Coming Soon" subtitle="Admin compliance reports are under development.">
        <div className="space-y-6 w-full">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Compliance</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Monitor compliance checks and regulations</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {statCards.map((card) => (
              <div key={card.label} className={`rounded-xl border ${card.border} bg-white dark:bg-gray-900 p-5 shadow-theme-sm`}>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{card.label}</span>
                  {card.icon}
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{card.count}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{card.sub}</p>
              </div>
            ))}
          </div>

          <div className="w-full max-w-[720px] lg:max-w-[680px] xl:max-w-full rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-theme-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Compliance Checks</h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
              showFilters
                ? "bg-brand-50 border-brand-200 text-brand-600 dark:bg-brand-500/10 dark:border-brand-500/30 dark:text-brand-400"
                : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            <LuSlidersHorizontal className="w-4 h-4" />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </button>
        </div>

        <div className="px-6 pt-5 pb-4 space-y-4">
          <div className="relative">
            <LuSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by client name, registration ID, or compliance ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
            />
          </div>

          {showFilters && (
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Status</label>
                <CustomDropdown options={statusOptions} value={selectedStatus} onChange={setSelectedStatus} withIcons />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Check Type</label>
                <CustomDropdown options={checkTypes} value={selectedCheckType} onChange={setSelectedCheckType} />
              </div>
            </div>
          )}

          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing <span className="font-semibold text-gray-900 dark:text-white">{filtered.length}</span> of{" "}
            <span className="font-semibold text-gray-900 dark:text-white">{complianceData.length}</span> compliance checks
          </p>
        </div>

        <div className="max-w-[720px] lg:max-w-[700px] xl:max-w-full overflow-x-auto">
          <table className="w-full min-w-max">
            <thead>
              <tr className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">ID</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">Registration ID</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">Client</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">Check Type</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">Last Checked</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap"><span className="text-sm font-semibold text-gray-900 dark:text-white">{item.id}</span></td>
                  <td className="px-4 py-3 whitespace-nowrap"><span className="text-sm text-gray-700 dark:text-gray-300">{item.registrationId}</span></td>
                  <td className="px-4 py-3 whitespace-nowrap"><span className="text-sm text-gray-700 dark:text-gray-300">{item.client}</span></td>
                  <td className="px-4 py-3 whitespace-nowrap"><span className="text-sm text-gray-700 dark:text-gray-300">{item.checkType}</span></td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-semibold ${getStatusStyle(item.status)}`}>
                      {formatStatus(item.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap"><span className="text-sm text-gray-700 dark:text-gray-300">{item.lastChecked}</span></td>
                  <td className="px-4 py-3"><span className="text-sm text-gray-600 dark:text-gray-400">{item.notes}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-12 text-center">
              <LuSearch className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No compliance checks found</p>
            </div>
          )}
        </div>
          </div>
        </div>
      </ComingSoonOverlay>
    </PageAccessGuard>
  );
}
