"use client";
import React, { useEffect, useRef, useState } from "react";
import { FiFileText } from "react-icons/fi";
import { MdOutlineFileDownload } from "react-icons/md";
import { LuCheck, LuChevronDown } from "react-icons/lu";
import { PlusIcon } from "@/icons";
import { Modal } from "@/components/ui/modal";
import { useModal } from "@/hooks/useModal";

// Mock data for documents
const documents = [
  {
    name: "Certificate of Incorporation",
    type: "Incorporation",
    size: "245 KB",
    date: "15/1/2020",
  },
  {
    name: "Business Registration Certificate",
    type: "Registration",
    size: "189 KB",
    date: "30/4/2025",
  },
  {
    name: "Memorandum & Articles of Association",
    type: "Constitution",
    size: "1.2 MB",
    date: "15/1/2020",
  },
  {
    name: "Share Certificates",
    type: "Shares",
    size: "456 KB",
    date: "20/3/2021",
  },
  {
    name: "Annual Return 2024",
    type: "Statutory",
    size: "678 KB",
    date: "15/3/2025",
  },
];

const DocumentsTab: React.FC = () => {
  const { isOpen, openModal, closeModal } = useModal();
  const [selectedDocumentType, setSelectedDocumentType] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");

  const documentTypes = [
    { value: "incorporation", label: "Certificate of Incorporation" },
    { value: "registration", label: "Business Registration Certificate" },
    { value: "constitution", label: "Memorandum & Articles of Association" },
    { value: "share-certificates", label: "Share Certificates" },
    { value: "annual-return", label: "Annual Return" },
  ];
  const [isDocumentTypeOpen, setIsDocumentTypeOpen] = useState(false);
  const documentTypeRef = useRef<HTMLDivElement | null>(null);
  const selectedDocumentLabel =
    documentTypes.find((type) => type.value === selectedDocumentType)?.label ??
    "Select a document type";

  const resetFormFields = () => {
    setSelectedDocumentType("");
    setAdditionalNotes("");
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        documentTypeRef.current &&
        !documentTypeRef.current.contains(event.target as Node)
      ) {
        setIsDocumentTypeOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCloseModal = () => {
    resetFormFields();
    closeModal();
  };

  const handleSubmitRequest = () => {
    console.log("Submitting document request", {
      documentType: selectedDocumentType,
      additionalNotes,
    });
    handleCloseModal();
  };

  const handleSaveDraft = () => {
    console.log("Saving document request draft", {
      documentType: selectedDocumentType,
      additionalNotes,
    });
    handleCloseModal();
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            Company Documents
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            View and download your statutory documents
          </p>
        </div>
        <button
          onClick={openModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          Request Document
        </button>
      </div>

      {/* Documents List */}
      <div className="space-y-3">
        {documents.map((doc, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="shrink-0 w-10 h-10 rounded-lg bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center">
                <FiFileText className="w-5 h-5 text-brand-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {doc.name}
                </h3>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>{doc.type}</span>
                  <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                  <span>{doc.size}</span>
                  <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                  <span>{doc.date}</span>
                </div>
              </div>
            </div>
            <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <MdOutlineFileDownload className="w-4 h-4" />
              Download
            </button>
          </div>
        ))}
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
              Submit Document Request
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Submit a request for company documents
            </p>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="document-type"
              className="text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              Document Type
            </label>
            <div className="relative" ref={documentTypeRef}>
              <button
                type="button"
                onClick={() => setIsDocumentTypeOpen((prev) => !prev)}
                className="inline-flex h-12 w-full items-center justify-between rounded-2xl border border-transparent bg-gradient-to-r from-white via-slate-50 to-slate-100 px-4 text-sm font-semibold text-gray-900 shadow-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950 dark:text-white"
              >
                <span>{selectedDocumentLabel}</span>
                <LuChevronDown
                  className={`h-4 w-4 text-gray-500 transition-transform ${
                    isDocumentTypeOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {isDocumentTypeOpen && (
                <div className="absolute z-30 mt-2 w-full rounded-2xl border border-gray-200 bg-white py-2 shadow-xl dark:border-gray-700 dark:bg-gray-900">
                  {documentTypes.map((type) => {
                    const isSelected = type.value === selectedDocumentType;
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => {
                          setSelectedDocumentType(type.value);
                          setIsDocumentTypeOpen(false);
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
              htmlFor="additional-notes"
              className="text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              Additional Notes (Optional)
            </label>
            <textarea
              id="additional-notes"
              value={additionalNotes}
              onChange={(event) => setAdditionalNotes(event.target.value)}
              placeholder="Provide any additional details about your document request..."
              rows={4}
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600 placeholder:text-gray-400 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
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

export default DocumentsTab;
