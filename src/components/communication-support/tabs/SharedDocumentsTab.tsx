"use client";
import React, { useEffect, useRef, useState } from "react";
import { LuCheck, LuChevronDown, LuFileText, LuUpload } from "react-icons/lu";
import { MdOutlineFileDownload } from "react-icons/md";
import { Modal } from "@/components/ui/modal";
import { useModal } from "@/hooks/useModal";
import { BsUpload } from "react-icons/bs";

interface DocumentItem {
  name: string;
  uploader: string;
  size: string;
  date: string;
  tag: string;
}

const documents: DocumentItem[] = [
  {
    name: "Tax Planning Guide 2026.pdf",
    uploader: "Emily Chan, CPA",
    size: "1.2 MB",
    date: "2/1/2026",
    tag: "Guide",
  },
  {
    name: "Invoice Template.xlsx",
    uploader: "Emily Chan, CPA",
    size: "45 KB",
    date: "15/12/2025",
    tag: "Template",
  },
  {
    name: "Rental Agreement - Office.pdf",
    uploader: "You",
    size: "567 KB",
    date: "10/12/2025",
    tag: "Document",
  },
];

const SharedDocumentsTab: React.FC = () => {
  const { isOpen, openModal, closeModal } = useModal();
  const [selectedDocCategory, setSelectedDocCategory] = useState("");
  const [description, setDescription] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const categoryRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const docCategories = [
    { value: "tax-report", label: "Tax Report" },
    { value: "agreement", label: "Agreement" },
    { value: "invoice", label: "Invoice" },
    { value: "utilities", label: "Utility Document" },
    { value: "other", label: "Other" },
  ];

  const selectedCategoryLabel =
    docCategories.find((category) => category.value === selectedDocCategory)
      ?.label ?? "Select a document category";

  const resetForm = () => {
    setSelectedDocCategory("");
    setDescription("");
    setAttachedFiles([]);
    setIsCategoryOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
        setIsCategoryOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCloseModal = () => {
    resetForm();
    closeModal();
  };

  const handleSubmit = () => {
    console.log("Uploading document", {
      category: selectedDocCategory,
      description,
      files: attachedFiles,
    });
    handleCloseModal();
  };

  const handleSaveDraft = () => {
    console.log("Saving document draft", {
      category: selectedDocCategory,
      description,
      files: attachedFiles,
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Shared Documents
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Files shared between you and your accountant
          </p>
        </div>
        <button
          onClick={openModal}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
        >
          <LuUpload className="h-4 w-4" />
          Upload Document
        </button>
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
              Upload Document
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Share supporting files with your accountant securely
            </p>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="doc-category"
              className="text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              Document Category
            </label>
            <div className="relative" ref={categoryRef}>
              <button
                type="button"
                onClick={() => setIsCategoryOpen((prev) => !prev)}
                className="inline-flex h-12 w-full items-center justify-between rounded-2xl border border-transparent bg-gradient-to-r from-white via-slate-50 to-slate-100 px-4 text-sm font-semibold text-gray-900 shadow-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950 dark:text-white"
              >
                <span>{selectedCategoryLabel}</span>
                <LuChevronDown
                  className={`h-4 w-4 text-gray-500 transition-transform ${
                    isCategoryOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {isCategoryOpen && (
                <div className="absolute z-30 mt-2 w-full rounded-2xl border border-gray-200 bg-white py-2 shadow-xl dark:border-gray-700 dark:bg-gray-900">
                  {docCategories.map((category) => {
                    const isSelected = category.value === selectedDocCategory;
                    return (
                      <button
                        key={category.value}
                        type="button"
                        onClick={() => {
                          setSelectedDocCategory(category.value);
                          setIsCategoryOpen(false);
                        }}
                        className={`flex w-full items-center justify-between px-4 py-2 text-sm transition-colors ${
                          isSelected
                            ? "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300"
                            : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                        }`}
                      >
                        <span>{category.label}</span>
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
              htmlFor="document-description"
              className="text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              Description
            </label>
            <textarea
              id="document-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Let us know what this file is for..."
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
              className="relative flex min-h-[150px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500 transition hover:border-emerald-500 hover:bg-white dark:border-gray-700 dark:bg-gray-900 dark:hover:border-emerald-500"
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={(event) => handleFiles(event.target.files)}
                className="hidden"
              />
              <div className="flex flex-col items-center gap-3">
                
                  <BsUpload className="h-7 w-7 text-emerald-500" />
                
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
                    <div
                      key={`${file.name}-${index}`}
                      className="flex justify-between"
                    >
                      <span className="truncate">{file.name}</span>
                      <span className="text-emerald-500">Ready</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={handleSubmit}
              type="button"
              className="inline-flex items-center justify-center min-w-[160px] rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              Submit Document
            </button>
            <button
              onClick={handleSaveDraft}
              type="button"
              className="inline-flex items-center justify-center min-w-[160px] rounded-2xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            >
              Save as Draft
            </button>
          </div>
        </div>
      </Modal>

      <div className="mt-6 space-y-4">
        {documents.map((doc) => (
          <div
            key={doc.name}
            className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-gray-200 dark:border-gray-700 p-4"
          >
            <div className="flex items-center gap-4">
              <div className="shrink-0 w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                <LuFileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {doc.name}
                </h3>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>Uploaded by: {doc.uploader}</span>
                  <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                  <span>{doc.size}</span>
                  <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                  <span>{doc.date}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 dark:border-gray-700 dark:text-gray-300">
                {doc.tag}
              </span>
              <button className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800">
                <MdOutlineFileDownload className="h-4 w-4" />
                Download
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SharedDocumentsTab;
