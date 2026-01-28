"use client";
import React, { useEffect, useRef, useState } from "react";
import { MdOutlineRemoveRedEye } from "react-icons/md";
import { FaRegClock, FaRegCircleCheck, FaPlus } from "react-icons/fa6";
import { RiErrorWarningLine } from "react-icons/ri";
import { IconType } from "react-icons";
import { LuCheck, LuChevronDown } from "react-icons/lu";
import { Modal } from "@/components/ui/modal";
import { useModal } from "@/hooks/useModal";
import { BsUpload } from "react-icons/bs";


type RequestStatus = "pending" | "in-progress" | "completed";

interface ServiceRequest {
  title: string;
  description: string;
  id: string;
  requestedDate: string;
  updatedDate: string;
  status: RequestStatus;
}

// Mock data for service requests
const serviceRequests: ServiceRequest[] = [
  {
    title: "Change of Directors",
    description: "Request to appoint new director - Michael Lee",
    id: "SR-2026-001",
    requestedDate: "5/1/2026",
    updatedDate: "6/1/2026",
    status: "pending",
  },
  {
    title: "Registered Address Update",
    description: "Update registered office address to new premises",
    id: "SR-2025-045",
    requestedDate: "20/12/2025",
    updatedDate: "4/1/2026",
    status: "in-progress",
  },
  {
    title: "Share Transfer",
    description: "Transfer 1000 shares from David Wong to Sarah Chen",
    id: "SR-2025-038",
    requestedDate: "10/12/2025",
    updatedDate: "28/12/2025",
    status: "completed",
  },
  {
    title: "Company Name Change",
    description: "Changed company name from Tech Ltd to Tech Innovations Ltd",
    id: "SR-2025-029",
    requestedDate: "15/11/2025",
    updatedDate: "30/11/2025",
    status: "completed",
  },
];

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
      return {
        label: "pending",
        bgColor: "bg-amber-50 dark:bg-amber-500/10",
        textColor: "text-amber-600 dark:text-amber-400",
        borderColor: "border-amber-200 dark:border-amber-500/20",
        iconColor: "text-amber-500",
        icon: RiErrorWarningLine,
      };
    case "in-progress":
      return {
        label: "in-progress",
        bgColor: "bg-blue-50 dark:bg-blue-500/10",
        textColor: "text-blue-600 dark:text-blue-400",
        borderColor: "border-blue-200 dark:border-blue-500/20",
        iconColor: "text-blue-500",
        icon: FaRegClock,
      };
    case "completed":
      return {
        label: "completed",
        bgColor: "bg-green-50 dark:bg-green-500/10",
        textColor: "text-green-600 dark:text-green-400",
        borderColor: "border-green-200 dark:border-green-500/20",
        iconColor: "text-green-500",
        icon: FaRegCircleCheck,
      };
  }
};

const ServiceRequestsTab: React.FC = () => {
  const { isOpen, openModal, closeModal } = useModal();
  const [selectedServiceType, setSelectedServiceType] = useState("");
  const [requestDetails, setRequestDetails] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

  const serviceTypes = [
    { value: "change-of-directors", label: "Change of Directors" },
    { value: "registered-address", label: "Registered Address Update" },
    { value: "share-transfer", label: "Share Transfer" },
    { value: "name-change", label: "Company Name Change" },
    { value: "other", label: "Other Corporate Service" },
  ];
  const [isServiceTypeOpen, setIsServiceTypeOpen] = useState(false);
  const serviceTypeRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const selectedServiceLabel =
    serviceTypes.find((type) => type.value === selectedServiceType)?.label ??
    "Select a service type";

  const resetForm = () => {
    setSelectedServiceType("");
    setRequestDetails("");
    setAttachedFiles([]);
    setIsServiceTypeOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        serviceTypeRef.current &&
        !serviceTypeRef.current.contains(event.target as Node)
      ) {
        setIsServiceTypeOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCloseModal = () => {
    resetForm();
    closeModal();
  };

  const handleSubmitRequest = () => {
    console.log("Submitting service request", {
      serviceType: selectedServiceType,
      requestDetails,
      attachedFiles,
    });
    handleCloseModal();
  };

  const handleSaveDraft = () => {
    console.log("Saving service request draft", {
      serviceType: selectedServiceType,
      requestDetails,
      attachedFiles,
    });
    handleCloseModal();
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    setAttachedFiles((prev) => [...prev, ...Array.from(files)]);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            Service Requests
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Track and manage your service requests
          </p>
        </div>
        <button
          onClick={openModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <FaPlus className="w-4 h-4" />
          New Request
        </button>
      </div>

      {/* Service Requests List */}
      <div className="space-y-3">
        {serviceRequests.map((request, index) => {
          const statusConfig = getStatusConfig(request.status);
          const StatusIcon = statusConfig.icon;

          return (
            <div
              key={index}
              className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`shrink-0 w-10 h-10 rounded-full ${statusConfig.bgColor} flex items-center justify-center`}
                >
                  <StatusIcon className={`w-5 h-5 ${statusConfig.iconColor}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      {request.title}
                    </h3>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusConfig.bgColor} ${statusConfig.textColor}`}
                    >
                      {statusConfig.label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    {request.description}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>
                      <span className="text-gray-400">ID:</span>{" "}
                      <span className="text-gray-700 dark:text-gray-300">
                        {request.id}
                      </span>
                    </span>
                    <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                    <span>
                      <span className="text-gray-400">Requested:</span>{" "}
                      <span className="text-gray-700 dark:text-gray-300">
                        {request.requestedDate}
                      </span>
                    </span>
                    <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                    <span>
                      <span className="text-gray-400">Updated:</span>{" "}
                      <span className="text-gray-700 dark:text-gray-300">
                        {request.updatedDate}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
              <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <MdOutlineRemoveRedEye className="w-4 h-4" />
                View
              </button>
            </div>
          );
        })}
      </div>
      <Modal
        isOpen={isOpen}
        showCloseButton
        onClose={handleCloseModal}
        className="m-4 max-w-[640px] px-0"
      >
        <div className="rounded-3xl bg-white pt-6 pb-8 px-6 sm:px-8 dark:bg-gray-900 space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Submit Service Request
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Submit a request for company amendments and corporate services
            </p>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="service-type"
              className="text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              Service Type
            </label>
            <div className="relative" ref={serviceTypeRef}>
              <button
                type="button"
                onClick={() => setIsServiceTypeOpen((prev) => !prev)}
                className="inline-flex h-12 w-full items-center justify-between rounded-2xl border border-transparent bg-gradient-to-r from-white via-slate-50 to-slate-100 px-4 text-sm font-semibold text-gray-900 shadow-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950 dark:text-white"
              >
                <span>{selectedServiceLabel}</span>
                <LuChevronDown
                  className={`h-4 w-4 text-gray-500 transition-transform ${
                    isServiceTypeOpen ? "rotate-180" : ""
                  }`}
                />
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
                        {isSelected && (
                          <LuCheck className="h-4 w-4 text-brand-500" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="service-notes"
              className="text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              Request Details
            </label>
            <textarea
              id="service-notes"
              value={requestDetails}
              onChange={(event) => setRequestDetails(event.target.value)}
              placeholder="Please provide details of your request..."
              rows={4}
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600 placeholder:text-gray-400 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
              Attach Supporting Documents
            </label>
            <div
              onClick={handleUploadClick}
              className="relative flex min-h-[150px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500 transition hover:border-brand-400 hover:bg-white dark:border-gray-700 dark:bg-gray-900 dark:hover:border-brand-400"
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={(event) => handleFiles(event.target.files)}
                className="hidden"
              />
              <div className="flex flex-col items-center gap-3">
                
                  <BsUpload className="h-7 w-7" />
               
                <p className="text-sm font-semibold text-gray-800 dark:text-white">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-400">
                  PDF, DOC, DOCX, JPG, PNG (max 10MB)
                </p>
              </div>
              {attachedFiles.length > 0 && (
                <div className="mt-4 w-full rounded-lg bg-white/70 px-3 py-2 text-xs text-gray-500 dark:bg-white/5">
                  {attachedFiles.map((file, index) => (
                    <div key={`${file.name}-${index}`} className="flex justify-between">
                      <span className="truncate">{file.name}</span>
                      <span className="text-brand-500">Ready</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={handleSubmitRequest}
              type="button"
              className="inline-flex items-center justify-center min-w-[160px] rounded-2xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-400"
            >
              Submit Request
            </button>
            <button
              onClick={handleSaveDraft}
              type="button"
              className="inline-flex items-center justify-center min-w-[160px] rounded-2xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-100"
            >
              Save as Draft
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ServiceRequestsTab;
