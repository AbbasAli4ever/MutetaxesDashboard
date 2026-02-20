"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  LuFileText,
  LuEye,
  LuPencil,
  LuDownload,
  LuPlus,
  LuSearch,
  LuChevronDown,
  LuCheck,
  LuX,
  LuRefreshCw,
  LuCircleAlert,
  LuChevronLeft,
  LuChevronRight,
} from "react-icons/lu";
import {
  ModulePermissionProvider,
  useModulePermission,
} from "@/context/PermissionContext";
import PageAccessGuard from "@/components/common/PageAccessGuard";
import { authFetch, API_BASE_URL } from "@/lib/auth";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RegistrationDocument {
  id: number;
  registrationId: string;
  stakeholderId: number | null;
  documentType: string;
  fileKey: string | null;
  fileUrl: string;
  fileName: string | null;
  mimeType: string | null;
  fileSize: number | null;
  verificationStatus: "pending" | "approved" | "rejected";
  rejectionReason: string | null;
  uploadedBy: number | null;
  verifiedBy: number | null;
  createdAt: string;
}

interface Registration {
  id: string;
  clientName: string;
  clientEmail: string;
  phone: string;
  type: string;
  status: "pending" | "in-progress" | "completed";
  assignedTo: string;
  submittedDate: string;
  lastUpdated: string;
  documents: number;
  documentList: RegistrationDocument[];
}

interface RegistrationsResponse {
  success: boolean;
  total: number;
  page: number;
  limit: number;
  registrations: Registration[];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function RegisterButton() {
  const { can } = useModulePermission();
  const canCreate = can("CREATE");

  return (
    <a
      href="https://mutetaxes.com/company-formation"
      target="_blank"
      rel="noopener noreferrer"
      aria-disabled={!canCreate}
      tabIndex={!canCreate ? -1 : undefined}
      className={`inline-flex items-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg transition-colors ${!canCreate ? "opacity-40 cursor-not-allowed pointer-events-none" : ""}`}
    >
      <LuPlus className="w-5 h-5" />
      Register a New Company
    </a>
  );
}

function RegistrationActionsCell({
  onView,
  onEdit,
}: {
  onView: () => void;
  onEdit: () => void;
}) {
  const { can } = useModulePermission();
  const canRead = can("READ");
  const canUpdate = can("UPDATE");

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={canRead ? onView : undefined}
        disabled={!canRead}
        className="p-2 text-gray-600 hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-gray-600 dark:disabled:hover:text-gray-400"
        title="View"
      >
        <LuEye className="w-5 h-5" />
      </button>
      <button
        onClick={canUpdate ? onEdit : undefined}
        disabled={!canUpdate}
        className="p-2 text-gray-600 hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-gray-600 dark:disabled:hover:text-gray-400"
        title="Edit"
      >
        <LuPencil className="w-5 h-5" />
      </button>
      <button
        className="p-2 text-gray-600 hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-400 transition-colors"
        title="Download"
      >
        <LuDownload className="w-5 h-5" />
      </button>
    </div>
  );
}

// ─── Status helpers ───────────────────────────────────────────────────────────

const statusOptions = [
  { value: "All Status", label: "All Status" },
  { value: "pending", label: "Pending" },
  { value: "in-progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

function getStatusColor(status: Registration["status"]) {
  switch (status) {
    case "completed": return "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400";
    case "pending": return "bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400";
    case "in-progress": return "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400";
    default: return "bg-gray-50 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400";
  }
}

function formatStatus(status: string) {
  return status.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function formatDate(iso: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

// ─── Edit Status Modal ────────────────────────────────────────────────────────

function EditStatusModal({
  registration,
  onClose,
  onSaved,
}: {
  registration: Registration;
  onClose: () => void;
  onSaved: (updated: Registration) => void;
}) {
  const [status, setStatus] = useState<Registration["status"]>(registration.status);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (status === registration.status) { onClose(); return; }
    setSaving(true);
    setError("");
    try {
      const res = await authFetch(`${API_BASE_URL}/api/v1/registrations/${registration.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update status");
      onSaved({ ...registration, status, lastUpdated: new Date().toISOString() });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-sm bg-white dark:bg-gray-900 dark:border dark:border-gray-700 rounded-xl shadow-theme-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between p-5 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Update Status</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate max-w-[220px]">{registration.clientName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <LuX className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Registration["status"])}
              className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          {error && (
            <p className="text-xs text-error-600 dark:text-error-400 flex items-center gap-1.5">
              <LuCircleAlert className="w-3.5 h-3.5 flex-shrink-0" />{error}
            </p>
          )}
        </div>
        <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200 dark:border-gray-800">
          <button onClick={onClose} disabled={saving} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2">
            {saving && <LuRefreshCw className="w-3.5 h-3.5 animate-spin" />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const LIMIT = 20;

export default function Registrations() {
  const router = useRouter();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [editingRegistration, setEditingRegistration] = useState<Registration | null>(null);

  // ── Fetch registrations ──────────────────────────────────────────────────
  const fetchRegistrations = useCallback(async (pageNum: number, status: string) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (status !== "All Status") params.set("status", status);
      params.set("page", String(pageNum));
      params.set("limit", String(LIMIT));

      const res = await authFetch(`${API_BASE_URL}/api/v1/registrations?${params}`);
      const data: RegistrationsResponse = await res.json();

      if (!res.ok) throw new Error((data as { error?: string }).error || "Failed to fetch registrations");

      setRegistrations(data.registrations);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load registrations");
      setRegistrations([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRegistrations(page, selectedStatus);
  }, [page, selectedStatus, fetchRegistrations]);

  // Reset to page 1 when status filter changes
  const handleStatusChange = (value: string) => {
    setSelectedStatus(value);
    setPage(1);
    setIsDropdownOpen(false);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Client-side search filter (applied on top of server-side status filter)
  const filteredData = registrations.filter((reg) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      reg.clientName.toLowerCase().includes(q) ||
      reg.id.toLowerCase().includes(q) ||
      reg.clientEmail.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(total / LIMIT);

  const handleStatusSaved = (updated: Registration) => {
    setRegistrations((prev) => prev.map((r) => r.id === updated.id ? updated : r));
    setEditingRegistration(null);
  };

  return (
    <PageAccessGuard module="REGISTRATIONS">
      <ModulePermissionProvider module="REGISTRATIONS">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Registrations</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {loading ? "Loading..." : `${total} total registration${total !== 1 ? "s" : ""}`}
              </p>
            </div>
            <RegisterButton />
          </div>

          {/* Table card */}
          <div className="relative max-w-[720px] lg:max-w-[680px] xl:max-w-full rounded-xl bg-white dark:bg-gray-900 shadow-theme-sm border border-gray-200 dark:border-gray-800">
            {/* Toolbar */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="relative flex-1 max-w-md">
                  <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, ID, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                  />
                </div>
                <div className="flex items-center gap-3">
                  {/* Status filter */}
                  <div ref={dropdownRef} className="relative">
                    <button
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="flex items-center justify-between gap-3 pl-4 pr-3 py-2.5 min-w-[160px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                    >
                      <span>{selectedStatus === "All Status" ? "All Status" : formatStatus(selectedStatus)}</span>
                      <LuChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`} />
                    </button>
                    {isDropdownOpen && (
                      <div className="absolute z-50 mt-2 w-full min-w-[200px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-theme-lg overflow-hidden">
                        <div className="py-1">
                          {statusOptions.map((option) => (
                            <button
                              key={option.value}
                              onClick={() => handleStatusChange(option.value)}
                              className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium transition-colors ${
                                selectedStatus === option.value
                                  ? "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
                                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                              }`}
                            >
                              <span>{option.label}</span>
                              {selectedStatus === option.value && <LuCheck className="w-4 h-4 text-brand-500 dark:text-brand-400" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Refresh */}
                  <button
                    onClick={() => fetchRegistrations(page, selectedStatus)}
                    disabled={loading}
                    className="p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg transition-colors disabled:opacity-50"
                    title="Refresh"
                  >
                    <LuRefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                  </button>
                  <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors">
                    <LuDownload className="w-4 h-4" />
                    Export
                  </button>
                </div>
              </div>
            </div>

            {/* Error state */}
            {error && (
              <div className="m-6 p-4 bg-error-50 dark:bg-error-500/10 border border-error-200 dark:border-error-500/20 rounded-lg flex items-center gap-3">
                <LuCircleAlert className="w-5 h-5 text-error-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-error-700 dark:text-error-400">{error}</p>
                </div>
                <button
                  onClick={() => fetchRegistrations(page, selectedStatus)}
                  className="text-xs font-medium text-error-600 dark:text-error-400 hover:underline flex-shrink-0"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Table */}
            <div className="max-w-[720px] lg:max-w-[700px] xl:max-w-full overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                    {["ID", "Client Name", "Type", "Status", "Assigned To", "Submitted Date", "Documents", "Actions"].map((h) => (
                      <th key={h} className="px-4 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {loading ? (
                    // Skeleton rows
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        {Array.from({ length: 8 }).map((__, j) => (
                          <td key={j} className="px-4 py-4">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    filteredData.map((registration) => (
                      <tr key={registration.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="text-sm font-mono font-medium text-gray-900 dark:text-white truncate max-w-[140px] block" title={registration.id}>
                            {registration.id.slice(0, 8)}…
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{registration.clientName}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{registration.clientEmail}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-600 dark:text-gray-400">{registration.type || "—"}</span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${getStatusColor(registration.status)}`}>
                            {formatStatus(registration.status)}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-600 dark:text-gray-400">{registration.assignedTo || "Unassigned"}</span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-600 dark:text-gray-400">{formatDate(registration.submittedDate)}</span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <LuFileText className="w-4 h-4" />
                            <span>{registration.documents}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <RegistrationActionsCell
                            onView={() => router.push(`/admin/registrations/${registration.id}`)}
                            onEdit={() => setEditingRegistration(registration)}
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Empty state */}
            {!loading && !error && filteredData.length === 0 && (
              <div className="p-12 text-center">
                <LuFileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No registrations found</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {searchTerm ? "Try adjusting your search criteria" : "No registrations match the selected filter"}
                </p>
              </div>
            )}

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Page {page} of {totalPages} · {total} total
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <LuChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <LuChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Edit Status Modal */}
        {editingRegistration && (
          <EditStatusModal
            registration={editingRegistration}
            onClose={() => setEditingRegistration(null)}
            onSaved={handleStatusSaved}
          />
        )}
      </ModulePermissionProvider>
    </PageAccessGuard>
  );
}
