"use client";

import React, { useEffect, useRef, useState } from "react";
import { MdOutlineRemoveRedEye } from "react-icons/md";
import { FaRegClock, FaRegCircleCheck, FaPlus } from "react-icons/fa6";
import { RiErrorWarningLine } from "react-icons/ri";
import { IconType } from "react-icons";
import { LuCheck, LuChevronDown, LuRefreshCw, LuX } from "react-icons/lu";
import { Modal } from "@/components/ui/modal";
import { useModal } from "@/hooks/useModal";
import {
  createCustomerServiceRequest,
  formatDateDisplay,
  getCustomerServiceRequest,
  getCustomerServiceRequestActivity,
  listCustomerServiceRequests,
  updateCustomerServiceRequest,
  withdrawCustomerServiceRequest,
  type CustomerServiceRequestActivityApi,
  type CustomerServiceRequestApi,
} from "@/components/company-management/customer-company-api";

type RequestStatus = "pending" | "in-progress" | "completed" | "rejected";

const getStatusConfig = (status: RequestStatus): {
  label: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  iconColor: string;
  icon: IconType;
} => {
  switch (status) {
    case "pending":
      return { label: "pending", bgColor: "bg-amber-50 dark:bg-amber-500/10", textColor: "text-amber-600 dark:text-amber-400", borderColor: "border-amber-200 dark:border-amber-500/20", iconColor: "text-amber-500", icon: RiErrorWarningLine };
    case "in-progress":
      return { label: "in-progress", bgColor: "bg-blue-50 dark:bg-blue-500/10", textColor: "text-blue-600 dark:text-blue-400", borderColor: "border-blue-200 dark:border-blue-500/20", iconColor: "text-blue-500", icon: FaRegClock };
    case "completed":
      return { label: "completed", bgColor: "bg-green-50 dark:bg-green-500/10", textColor: "text-green-600 dark:text-green-400", borderColor: "border-green-200 dark:border-green-500/20", iconColor: "text-green-500", icon: FaRegCircleCheck };
    case "rejected":
      return { label: "rejected", bgColor: "bg-red-50 dark:bg-red-500/10", textColor: "text-red-600 dark:text-red-400", borderColor: "border-red-200 dark:border-red-500/20", iconColor: "text-red-500", icon: LuX };
  }
};

const serviceTypes = [
  { value: "change_directors", label: "Change of Directors" },
  { value: "registered_address_update", label: "Registered Address Update" },
  { value: "share_transfer", label: "Share Transfer" },
  { value: "company_name_change", label: "Company Name Change" },
  { value: "other", label: "Other Corporate Service" },
];

export default function ServiceRequestsTab() {
  const { isOpen, openModal, closeModal } = useModal();
  const { isOpen: isWithdrawModalOpen, openModal: openWithdrawModal, closeModal: closeWithdrawModal } = useModal();
  const [requests, setRequests] = useState<CustomerServiceRequestApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingRequestId, setEditingRequestId] = useState<string | null>(null);
  const [selectedServiceType, setSelectedServiceType] = useState("");
  const [requestDetails, setRequestDetails] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [isServiceTypeOpen, setIsServiceTypeOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawTarget, setWithdrawTarget] = useState<CustomerServiceRequestApi | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [viewing, setViewing] = useState<CustomerServiceRequestApi | null>(null);
  const [activity, setActivity] = useState<CustomerServiceRequestActivityApi[]>([]);
  const [viewLoading, setViewLoading] = useState(false);
  const [apiUnavailable, setApiUnavailable] = useState(false);
  const serviceTypeRef = useRef<HTMLDivElement | null>(null);

  const selectedServiceLabel =
    serviceTypes.find((type) => type.value === selectedServiceType)?.label ??
    "Select a service type";

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
      setRequests(await listCustomerServiceRequests());
    } catch (err) {
      if (isUnavailableError(err)) {
        setApiUnavailable(true);
        setRequests([]);
      } else {
        setError(err instanceof Error ? err.message : "Failed to load service requests");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (serviceTypeRef.current && !serviceTypeRef.current.contains(event.target as Node)) {
        setIsServiceTypeOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const resetForm = () => {
    setFormMode("create");
    setEditingRequestId(null);
    setSelectedServiceType("");
    setRequestDetails("");
    setPriority("medium");
    setIsServiceTypeOpen(false);
    setActionError("");
  };

  const openCreateModal = () => {
    resetForm();
    setFormMode("create");
    openModal();
  };

  const openEditModal = (request: CustomerServiceRequestApi) => {
    const matchedServiceType = serviceTypes.find((item) => item.value === request.typeCode)
      ? request.typeCode
      : "other";
    setFormMode("edit");
    setEditingRequestId(request.id);
    setSelectedServiceType(matchedServiceType || "other");
    setRequestDetails(request.description || "");
    setPriority(request.priority || "medium");
    setIsServiceTypeOpen(false);
    setActionError("");
    openModal();
  };

  const handleCloseModal = () => {
    resetForm();
    closeModal();
  };

  const handleSubmitRequest = async () => {
    if (apiUnavailable) return;
    const service = serviceTypes.find((s) => s.value === selectedServiceType);
    if (!service || !requestDetails.trim()) return;
    setSubmitting(true);
    setActionError("");
    try {
      if (formMode === "edit") {
        if (!editingRequestId) return;
        await updateCustomerServiceRequest(editingRequestId, {
          description: requestDetails.trim(),
          priority,
        });
      } else {
        await createCustomerServiceRequest({
          type: service.label,
          typeCode: selectedServiceType === "other" ? "other" : selectedServiceType,
          description: requestDetails.trim(),
          priority,
        });
      }
      handleCloseModal();
      await load();
    } catch (err) {
      if (isUnavailableError(err)) {
        setApiUnavailable(true);
        handleCloseModal();
        return;
      }
      setActionError(
        err instanceof Error
          ? err.message
          : formMode === "edit"
            ? "Failed to update service request"
            : "Failed to submit service request"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const openWithdrawConfirm = (request: CustomerServiceRequestApi) => {
    setWithdrawTarget(request);
    setActionError("");
    openWithdrawModal();
  };

  const closeWithdrawConfirm = () => {
    setWithdrawTarget(null);
    closeWithdrawModal();
  };

  const handleWithdrawRequest = async () => {
    if (!withdrawTarget) return;
    setWithdrawing(true);
    setActionError("");
    try {
      await withdrawCustomerServiceRequest(withdrawTarget.id);
      closeWithdrawConfirm();
      await load();
    } catch (err) {
      if (isUnavailableError(err)) {
        setApiUnavailable(true);
        closeWithdrawConfirm();
        return;
      }
      setActionError(err instanceof Error ? err.message : "Failed to withdraw service request");
    } finally {
      setWithdrawing(false);
    }
  };

  const openView = async (id: string) => {
    if (apiUnavailable) return;
    setViewingId(id);
    setViewLoading(true);
    try {
      const [detail, act] = await Promise.all([
        getCustomerServiceRequest(id),
        getCustomerServiceRequestActivity(id).catch(() => []),
      ]);
      setViewing(detail);
      setActivity(act);
    } catch (err) {
      if (isUnavailableError(err)) {
        setApiUnavailable(true);
        setViewingId(null);
        setViewing(null);
        setActivity([]);
        return;
      }
      alert(err instanceof Error ? err.message : "Failed to load request details");
    } finally {
      setViewLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Service Requests</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Track your requests and submit new ones</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void load()}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <LuRefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={openCreateModal}
            disabled={apiUnavailable}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <FaPlus className="w-4 h-4" />
            New Request
          </button>
        </div>
      </div>

      {apiUnavailable ? (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-6 text-center">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Service Requests are not available yet</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Customer service request APIs are not implemented yet.</p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-error-200 bg-error-50 dark:border-error-500/20 dark:bg-error-500/10 p-4">
          <p className="text-sm text-error-700 dark:text-error-400">{error}</p>
        </div>
      ) : loading ? (
        <div className="py-10 flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <LuRefreshCw className="w-4 h-4 animate-spin" /> Loading service requests...
        </div>
      ) : requests.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No service requests yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {actionError ? (
            <div className="rounded-xl border border-error-200 bg-error-50 dark:border-error-500/20 dark:bg-error-500/10 p-4">
              <p className="text-sm text-error-700 dark:text-error-400">{actionError}</p>
            </div>
          ) : null}
          {requests.map((request) => {
            const statusConfig = getStatusConfig(request.status);
            const StatusIcon = statusConfig.icon;
            const canEditOrWithdraw = request.status === "pending";
            return (
              <div key={request.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`shrink-0 w-10 h-10 rounded-full ${statusConfig.bgColor} flex items-center justify-center`}>
                    <StatusIcon className={`w-5 h-5 ${statusConfig.iconColor}`} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{request.type}</h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusConfig.bgColor} ${statusConfig.textColor}`}>
                        {statusConfig.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate max-w-[520px]">{request.description}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>ID: {request.id}</span>
                      <span>Requested: {formatDateDisplay(request.requestedAt || request.createdAt)}</span>
                      <span>Updated: {formatDateDisplay(request.updatedAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {canEditOrWithdraw ? (
                    <>
                      <button
                        onClick={() => openEditModal(request)}
                        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-500/10 border border-brand-100 dark:border-brand-500/30 rounded-lg hover:bg-brand-100 dark:hover:bg-brand-500/20 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => openWithdrawConfirm(request)}
                        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/30 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                      >
                        Withdraw
                      </button>
                    </>
                  ) : null}
                  <button
                    onClick={() => void openView(request.id)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <MdOutlineRemoveRedEye className="w-4 h-4" />
                    View
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={isOpen} showCloseButton onClose={handleCloseModal} className="m-4 max-w-[640px] px-0">
        <div className="rounded-3xl bg-white pt-6 pb-8 px-6 sm:px-8 dark:bg-gray-900 space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {formMode === "edit" ? "Edit Service Request" : "Submit Service Request"}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formMode === "edit"
                ? "Update request details while the request is still pending."
                : "Submit a request for company amendments and corporate services"}
            </p>
          </div>

          {actionError ? (
            <div className="rounded-xl border border-error-200 bg-error-50 dark:border-error-500/20 dark:bg-error-500/10 p-3">
              <p className="text-sm text-error-700 dark:text-error-400">{actionError}</p>
            </div>
          ) : null}

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Service Type</label>
            <div className="relative" ref={serviceTypeRef}>
              <button
                type="button"
                disabled={formMode === "edit"}
                onClick={() => setIsServiceTypeOpen((prev) => !prev)}
                className="inline-flex h-12 w-full items-center justify-between rounded-2xl border border-transparent bg-gradient-to-r from-white via-slate-50 to-slate-100 px-4 text-sm font-semibold text-gray-900 shadow-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:opacity-60 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950 dark:text-white"
              >
                <span>{selectedServiceLabel}</span>
                <LuChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isServiceTypeOpen ? "rotate-180" : ""}`} />
              </button>
              {isServiceTypeOpen && (
                <div className="absolute z-30 mt-2 w-full rounded-2xl border border-gray-200 bg-white py-2 shadow-xl dark:border-gray-700 dark:bg-gray-900">
                  {serviceTypes.map((type) => {
                    const isSelected = type.value === selectedServiceType;
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => {
                          setSelectedServiceType(type.value);
                          setIsServiceTypeOpen(false);
                        }}
                        className={`flex w-full items-center justify-between px-4 py-2 text-sm transition-colors ${
                          isSelected
                            ? "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300"
                            : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                        }`}
                      >
                        <span>{type.label}</span>
                        {isSelected && <LuCheck className="h-4 w-4 text-brand-500" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            {formMode === "edit" ? (
              <p className="text-xs text-gray-500 dark:text-gray-400">Service type cannot be changed after request creation.</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as "low" | "medium" | "high")}
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Request Details</label>
            <textarea
              value={requestDetails}
              onChange={(event) => setRequestDetails(event.target.value)}
              placeholder="Please provide details of your request..."
              rows={4}
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600 placeholder:text-gray-400 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            File attachments are not yet supported on the customer service request API. Submit the request first and admin will advise next steps.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => void handleSubmitRequest()}
              disabled={submitting || !selectedServiceType || !requestDetails.trim()}
              type="button"
              className="inline-flex items-center justify-center min-w-[160px] rounded-2xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-400 disabled:opacity-50"
            >
              {submitting
                ? (formMode === "edit" ? "Updating..." : "Submitting...")
                : (formMode === "edit" ? "Save Changes" : "Submit Request")}
            </button>
            <button
              onClick={handleCloseModal}
              type="button"
              className="inline-flex items-center justify-center min-w-[160px] rounded-2xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-100"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={Boolean(viewingId)} showCloseButton onClose={() => { setViewingId(null); setViewing(null); setActivity([]); }} className="m-4 max-w-[720px] px-0">
        <div className="rounded-3xl bg-white pt-6 pb-8 px-6 sm:px-8 dark:bg-gray-900 space-y-5">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Service Request Details</h3>
            {viewing && <p className="text-sm text-gray-500 dark:text-gray-400">ID: {viewing.id}</p>}
          </div>

          {viewLoading ? (
            <div className="py-8 flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <LuRefreshCw className="w-4 h-4 animate-spin" /> Loading request...
            </div>
          ) : viewing ? (
            <>
              <div className="space-y-3 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="font-semibold text-gray-900 dark:text-white">{viewing.type}</h4>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">{viewing.status}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">{viewing.description}</p>
                <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                  <p>Priority: {viewing.priority || "medium"}</p>
                  <p>Requested: {formatDateDisplay(viewing.requestedAt || viewing.createdAt)}</p>
                  <p>Updated: {formatDateDisplay(viewing.updatedAt)}</p>
                  {viewing.adminNotes ? <p>Admin Notes: {viewing.adminNotes}</p> : null}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Activity</h4>
                <div className="space-y-2 max-h-56 overflow-auto">
                  {activity.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No activity yet.</p>
                  ) : activity.map((item) => (
                    <div key={item.id || `${item.actionType}-${item.createdAt}`} className="rounded-xl border border-gray-200 dark:border-gray-700 p-3">
                      <p className="text-sm text-gray-800 dark:text-gray-200">
                        {item.actionType?.replaceAll("_", " ") || "activity"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {(item.actor?.name || item.actor?.type || "System")} · {formatDateDisplay(item.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">No request details available.</p>
          )}
        </div>
      </Modal>

      <Modal isOpen={isWithdrawModalOpen} showCloseButton onClose={closeWithdrawConfirm} className="m-4 max-w-[520px] px-0">
        <div className="rounded-3xl bg-white pt-6 pb-8 px-6 sm:px-8 dark:bg-gray-900 space-y-5">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Withdraw Service Request</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              This will mark your pending request as rejected and remove it from active processing.
            </p>
          </div>

          {withdrawTarget ? (
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{withdrawTarget.type}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">ID: {withdrawTarget.id}</p>
            </div>
          ) : null}

          {actionError ? (
            <div className="rounded-xl border border-error-200 bg-error-50 dark:border-error-500/20 dark:bg-error-500/10 p-3">
              <p className="text-sm text-error-700 dark:text-error-400">{actionError}</p>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => void handleWithdrawRequest()}
              disabled={withdrawing || !withdrawTarget}
              type="button"
              className="inline-flex items-center justify-center min-w-[160px] rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 disabled:opacity-50"
            >
              {withdrawing ? "Withdrawing..." : "Confirm Withdraw"}
            </button>
            <button
              onClick={closeWithdrawConfirm}
              type="button"
              className="inline-flex items-center justify-center min-w-[160px] rounded-2xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-100"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
