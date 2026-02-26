"use client";

import React from "react";
import { FaRegClock, FaRegCircleCheck } from "react-icons/fa6";
import { RiErrorWarningLine } from "react-icons/ri";
import { IconType } from "react-icons";
import { LuRefreshCw } from "react-icons/lu";
import {
  formatAmountDisplay,
  formatDateDisplay,
  listCustomerRenewals,
  type CustomerRenewalApi,
} from "@/components/company-management/customer-company-api";

type RenewalStatus = "upcoming" | "pending" | "current" | "overdue";

const getStatusConfig = (status: RenewalStatus): {
  label: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  iconColor: string;
  icon: IconType;
} => {
  switch (status) {
    case "upcoming":
      return { label: "upcoming", bgColor: "bg-blue-50 dark:bg-blue-500/10", textColor: "text-blue-600 dark:text-blue-400", borderColor: "border-blue-200 dark:border-blue-500/20", iconColor: "text-blue-500", icon: FaRegClock };
    case "pending":
      return { label: "pending", bgColor: "bg-amber-50 dark:bg-amber-500/10", textColor: "text-amber-600 dark:text-amber-400", borderColor: "border-amber-200 dark:border-amber-500/20", iconColor: "text-amber-500", icon: RiErrorWarningLine };
    case "current":
      return { label: "current", bgColor: "bg-green-50 dark:bg-green-500/10", textColor: "text-green-600 dark:text-green-400", borderColor: "border-green-200 dark:border-green-500/20", iconColor: "text-green-500", icon: FaRegCircleCheck };
    case "overdue":
      return { label: "overdue", bgColor: "bg-red-50 dark:bg-red-500/10", textColor: "text-red-600 dark:text-red-400", borderColor: "border-red-200 dark:border-red-500/20", iconColor: "text-red-500", icon: RiErrorWarningLine };
  }
};

export default function RenewalsTab() {
  const [renewals, setRenewals] = React.useState<CustomerRenewalApi[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [apiUnavailable, setApiUnavailable] = React.useState(false);

  function isUnavailableError(err: unknown) {
    const msg = err instanceof Error ? err.message.toLowerCase() : "";
    return (
      msg.includes("404") ||
      msg.includes("not found") ||
      msg.includes("501") ||
      msg.includes("not implemented") ||
      msg.includes("cannot get") ||
      msg.includes("route")
    );
  }

  const load = React.useCallback(async () => {
    setLoading(true);
    setError("");
    setApiUnavailable(false);
    try {
      setRenewals(await listCustomerRenewals());
    } catch (err) {
      if (isUnavailableError(err)) {
        setApiUnavailable(true);
        setRenewals([]);
      } else {
        setError(err instanceof Error ? err.message : "Failed to load renewals");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Renewals & Compliance</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Renewals posted by admin for your company</p>
        </div>
        <button
          onClick={() => void load()}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <LuRefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {apiUnavailable ? (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-6 text-center">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Renewals are not available yet</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Customer renewals APIs are not implemented yet.</p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-error-200 bg-error-50 dark:border-error-500/20 dark:bg-error-500/10 p-4">
          <p className="text-sm text-error-700 dark:text-error-400">{error}</p>
        </div>
      ) : loading ? (
        <div className="py-10 flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <LuRefreshCw className="w-4 h-4 animate-spin" /> Loading renewals...
        </div>
      ) : renewals.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No renewals available</p>
        </div>
      ) : (
        <div className="space-y-3">
          {renewals.map((renewal) => {
            const statusConfig = getStatusConfig(renewal.status);
            const StatusIcon = statusConfig.icon;
            const amount = formatAmountDisplay(renewal.amount, renewal.amountDisplay);
            return (
              <div key={renewal.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`shrink-0 w-10 h-10 rounded-full ${statusConfig.bgColor} flex items-center justify-center`}>
                    <StatusIcon className={`w-5 h-5 ${statusConfig.iconColor}`} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{renewal.name}</h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>Due: {formatDateDisplay(renewal.dueDate)}</span>
                      {amount && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                          <span>{amount}</span>
                        </>
                      )}
                    </div>
                    {renewal.notes && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{renewal.notes}</p>
                    )}
                  </div>
                </div>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${statusConfig.bgColor} ${statusConfig.textColor} ${statusConfig.borderColor}`}>
                  {statusConfig.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
