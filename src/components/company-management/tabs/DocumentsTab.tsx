"use client";

import React from "react";
import { FiFileText } from "react-icons/fi";
import { MdOutlineFileDownload } from "react-icons/md";
import { LuRefreshCw } from "react-icons/lu";
import {
  formatBytes,
  formatDateDisplay,
  getCustomerDocumentDownloadUrl,
  listCustomerDocuments,
  type CustomerDocumentApi,
} from "@/components/company-management/customer-company-api";

export default function DocumentsTab() {
  const [documents, setDocuments] = React.useState<CustomerDocumentApi[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [downloadingId, setDownloadingId] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setDocuments(await listCustomerDocuments());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const handleDownload = React.useCallback(async (doc: CustomerDocumentApi) => {
    if (doc.status === "pending_upload") {
      alert("Document is still uploading and not available yet.");
      return;
    }
    setDownloadingId(doc.id);
    try {
      const url =
        (await getCustomerDocumentDownloadUrl(doc.id)) ||
        doc.fileUrl ||
        doc.publicUrl ||
        null;
      if (!url) throw new Error("Download URL not available");

      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Download failed (${res.status})`);
        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = objectUrl;
        a.download = doc.fileName || doc.name || "document";
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      } catch {
        const a = document.createElement("a");
        a.href = url;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to download document");
    } finally {
      setDownloadingId(null);
    }
  }, []);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Company Documents</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">View and download documents uploaded by admin</p>
        </div>
        <button
          onClick={() => void load()}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <LuRefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-error-200 bg-error-50 dark:border-error-500/20 dark:bg-error-500/10 p-4">
          <p className="text-sm text-error-700 dark:text-error-400">{error}</p>
        </div>
      ) : loading ? (
        <div className="py-10 flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <LuRefreshCw className="w-4 h-4 animate-spin" /> Loading documents...
        </div>
      ) : documents.length === 0 ? (
        <div className="py-10 text-center">
          <FiFileText className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No documents uploaded yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="shrink-0 w-10 h-10 rounded-lg bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center">
                  <FiFileText className="w-5 h-5 text-brand-500" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{doc.name}</h3>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>{doc.category}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                    <span>{formatBytes(doc.fileSize)}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                    <span>{formatDateDisplay(doc.createdAt)}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => void handleDownload(doc)}
                disabled={downloadingId === doc.id}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                {downloadingId === doc.id ? <LuRefreshCw className="w-4 h-4 animate-spin" /> : <MdOutlineFileDownload className="w-4 h-4" />}
                {downloadingId === doc.id ? "Loading..." : "Download"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

