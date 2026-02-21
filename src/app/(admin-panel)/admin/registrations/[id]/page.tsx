"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  LuArrowLeft,
  LuPencil,
  LuCheck,
  LuX,
  LuFileText,
  LuDownload,
  LuUser,
  LuBuilding2,
  LuFileChartPie,
  LuUsers,
  LuUserCheck,
  LuBriefcase,
  LuCreditCard,
  LuShield,
  LuExternalLink,
  LuImage,
  LuPlus,
  LuTrash2,
  LuChevronDown,
  LuTriangleAlert,
  LuRefreshCw,
  LuCircleAlert,
} from "react-icons/lu";
import PageAccessGuard from "@/components/common/PageAccessGuard";
import {
  ModulePermissionProvider,
  useModulePermission,
} from "@/context/PermissionContext";
import { authFetch, API_BASE_URL } from "@/lib/auth";
import Checkbox from "@/components/form/input/Checkbox";
import Radio from "@/components/form/input/Radio";

// ─── Backend API types (flat shape from GET /api/v1/registrations/:id) ────────

interface ApiStakeholder {
  id: number;
  registrationId: string;
  type: "individual" | "corporate";
  roles: ("shareholder" | "director")[];
  fullName: string | null;
  nationality: string | null;
  email: string | null;
  phone: string | null;
  addressStreet: string | null;
  addressCity: string | null;
  addressState: string | null;
  addressPostalCode: string | null;
  addressCountry: string | null;
  companyName: string | null;
  countryOfIncorporation: string | null;
  registrationNumber: string | null;
  numberOfShares: number | null;
  sharePercentage: number | null;
  documents: ApiDocument[];
}

interface ApiDocument {
  id: number;
  registrationId: string;
  stakeholderId: number | null;
  documentType: "passport" | "selfie" | "addressProof" | "certificate_of_incorporation" | "business_license" | "others";
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

interface ApiRegistrationDetail {
  id: string;
  status: "pending" | "in-progress" | "completed";
  assignedToId: number | null;
  assignedTo: { id: number; name: string; email: string } | null;
  applicantFirstName: string;
  applicantLastName: string;
  applicantEmail: string;
  applicantPhone: string;
  countryOfIncorporation: string | null;
  companyType: string | null;
  proposedCompanyName: string;
  alternativeNames: string[];
  natureOfBusiness: string[];
  businessScope: string | null;
  businessScopeDescription: string | null;
  shareCapitalCurrency: string | null;
  shareCapitalAmount: number | null;
  totalShares: number | null;
  bankingProviders: string[];
  preferredBankingProvider: string | null;
  additionalServices: string[];
  billingName: string | null;
  billingEmail: string | null;
  billingPhone: string | null;
  billingStreet: string | null;
  billingCity: string | null;
  billingState: string | null;
  billingPostalCode: string | null;
  billingCountry: string | null;
  billingPaymentMethod: string | null;
  complianceAccepted: boolean;
  complianceTimestamp: string | null;
  createdAt: string;
  updatedAt: string;
  stakeholders: ApiStakeholder[];
  documents: ApiDocument[];
}

// ─── Internal UI types ────────────────────────────────────────────────────────

interface DocumentFile {
  key: string;
  url: string;
  fileName: string;
  mimeType: string;
  size: number;
}

interface Person {
  id: string;
  type: "individual" | "corporate";
  roles: string[];
  fullName: string;
  companyName: string;
  countryOfIncorporation: string | null;
  registrationNumber: string | null;
  nationality: string;
  email: string;
  phone: string;
  residentialAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  shareholding: {
    shares: number;
    percentage: number;
  };
  documents: {
    passport: DocumentFile | null;
    selfie: DocumentFile | null;
    addressProof: DocumentFile | null;
    certificate_of_incorporation: DocumentFile | null;
    business_license: DocumentFile | null;
    others: DocumentFile | null;
  };
}

interface RegistrationDetail {
  id: string;
  status: "pending" | "in-progress" | "completed";
  assignedTo: string;
  submittedDate: string;
  lastUpdated: string;
  applicant: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  company: {
    countryOfIncorporation: string;
    type: string;
    proposedCompanyName: string;
    alternativeNames: string[];
    natureOfBusiness: string[];
    businessScope: string;
    businessScopeDescription: string;
  };
  shareCapital: {
    currency: string;
    totalAmount: number;
    totalShares: number;
  };
  persons: Person[];
  services: {
    banking: {
      providers: string[];
      preferredProvider: string;
    };
    additionalServices: string[];
  };
  billing: {
    name: string;
    email: string;
    phone: string;
    address: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    paymentMethod: string;
  };
  complianceAccepted: {
    isAccepted: boolean;
    timestamp: string;
  };
}

// ─── Mapper: API → UI ────────────────────────────────────────────────────────

function apiDocToDocFile(doc: ApiDocument): DocumentFile {
  return {
    key: doc.fileKey || String(doc.id),
    url: doc.fileUrl,
    fileName: doc.fileName || "document",
    mimeType: doc.mimeType || "application/octet-stream",
    size: doc.fileSize || 0,
  };
}

function mapApiToUi(api: ApiRegistrationDetail): RegistrationDetail {
  // Build persons from stakeholders
  const persons: Person[] = api.stakeholders.map((s) => {
    // Group this stakeholder's documents by type
    const docsByType: Record<string, ApiDocument> = {};
    for (const d of s.documents) {
      docsByType[d.documentType] = d;
    }

    return {
      id: String(s.id),
      type: s.type,
      roles: s.roles,
      fullName: s.fullName || "",
      companyName: s.companyName || "",
      countryOfIncorporation: s.countryOfIncorporation,
      registrationNumber: s.registrationNumber,
      nationality: s.nationality || "",
      email: s.email || "",
      phone: s.phone || "",
      residentialAddress: {
        street: s.addressStreet || "",
        city: s.addressCity || "",
        state: s.addressState || "",
        postalCode: s.addressPostalCode || "",
        country: s.addressCountry || "",
      },
      shareholding: {
        shares: Number(s.numberOfShares) || 0,
        percentage: Number(s.sharePercentage) || 0,
      },
      documents: {
        passport: docsByType["passport"] ? apiDocToDocFile(docsByType["passport"]) : null,
        selfie: docsByType["selfie"] ? apiDocToDocFile(docsByType["selfie"]) : null,
        addressProof: docsByType["addressProof"] ? apiDocToDocFile(docsByType["addressProof"]) : null,
        certificate_of_incorporation: docsByType["certificate_of_incorporation"] ? apiDocToDocFile(docsByType["certificate_of_incorporation"]) : null,
        business_license: docsByType["business_license"] ? apiDocToDocFile(docsByType["business_license"]) : null,
        others: docsByType["others"] ? apiDocToDocFile(docsByType["others"]) : null,
      },
    };
  });

  return {
    id: api.id,
    status: api.status,
    assignedTo: api.assignedTo?.name || "Unassigned",
    submittedDate: api.createdAt,
    lastUpdated: api.updatedAt,
    applicant: {
      firstName: api.applicantFirstName,
      lastName: api.applicantLastName,
      email: api.applicantEmail,
      phone: api.applicantPhone,
    },
    company: {
      countryOfIncorporation: api.countryOfIncorporation || "",
      type: api.companyType || "",
      proposedCompanyName: api.proposedCompanyName,
      alternativeNames: api.alternativeNames || [],
      natureOfBusiness: api.natureOfBusiness || [],
      businessScope: api.businessScope || "",
      businessScopeDescription: api.businessScopeDescription || "",
    },
    shareCapital: {
      currency: api.shareCapitalCurrency || "HKD",
      totalAmount: api.shareCapitalAmount || 0,
      totalShares: api.totalShares || 0,
    },
    persons,
    services: {
      banking: {
        providers: api.bankingProviders || [],
        preferredProvider: api.preferredBankingProvider || "",
      },
      additionalServices: api.additionalServices || [],
    },
    billing: {
      name: api.billingName || "",
      email: api.billingEmail || "",
      phone: api.billingPhone || "",
      address: {
        street: api.billingStreet || "",
        city: api.billingCity || "",
        state: api.billingState || "",
        postalCode: api.billingPostalCode || "",
        country: api.billingCountry || "",
      },
      paymentMethod: api.billingPaymentMethod || "",
    },
    complianceAccepted: {
      isAccepted: api.complianceAccepted,
      timestamp: api.complianceTimestamp || "",
    },
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatTimestamp(ts: string) {
  if (!ts) return "—";
  // ISO date string
  const d = new Date(ts);
  if (!isNaN(d.getTime())) {
    return d.toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  }
  // Unix ms string (legacy)
  const n = parseInt(ts, 10);
  if (!isNaN(n)) {
    return new Date(n).toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  }
  return ts;
}

function getStatusStyle(status: RegistrationDetail["status"]) {
  switch (status) {
    case "completed": return "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400";
    case "pending": return "bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400";
    case "in-progress": return "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400";
  }
}

function formatStatus(status: string) {
  return status.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function recalcPercentages(persons: Person[], totalShares: number): Person[] {
  return persons.map((p) => {
    if (!p.roles.includes("shareholder")) return p;
    const pct = totalShares > 0 ? Math.round((p.shareholding.shares / totalShares) * 10000) / 100 : 0;
    return { ...p, shareholding: { ...p.shareholding, percentage: pct } };
  });
}

// ─── Shared UI Primitives ────────────────────────────────────────────────────

const inputCls = "w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all";
const inputErrCls = "w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-error-400 dark:border-error-500 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-error-400 focus:border-transparent transition-all";

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

function SectionCard({
  icon: Icon, title, subtitle, editing, onEdit, onSave, onCancel, children, canEdit = true, extraHeader, saveDisabled = false, saving = false, saveError = "",
}: {
  icon: React.ElementType; title: string; subtitle?: string;
  editing: boolean; onEdit: () => void; onSave: () => void; onCancel: () => void;
  children: React.ReactNode; canEdit?: boolean; extraHeader?: React.ReactNode; saveDisabled?: boolean;
  saving?: boolean; saveError?: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-theme-sm overflow-visible">
      <div className="flex items-center rounded-t-xl justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-brand-50 dark:bg-brand-500/10">
            <Icon className="w-[18px] h-[18px] text-brand-600 dark:text-brand-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h2>
            {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {extraHeader}
          {canEdit && (
            editing ? (
              <>
                {saveError && (
                  <span className="text-xs text-error-600 dark:text-error-400 flex items-center gap-1">
                    <LuCircleAlert className="w-3.5 h-3.5 shrink-0" />{saveError}
                  </span>
                )}
                <button onClick={onCancel} disabled={saving} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50">
                  <LuX className="w-3.5 h-3.5" /> Cancel
                </button>
                <button
                  onClick={saveDisabled || saving ? undefined : onSave}
                  disabled={saveDisabled || saving}
                  title={saveDisabled ? "Fix validation errors before saving" : undefined}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-brand-500 hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  {saving
                    ? <><LuRefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving…</>
                    : <><LuCheck className="w-3.5 h-3.5" /> Save</>
                  }
                </button>
              </>
            ) : (
              <button onClick={onEdit} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-brand-300 hover:text-brand-600 dark:hover:border-brand-600 dark:hover:text-brand-400 transition-colors">
                <LuPencil className="w-3.5 h-3.5" /> Edit
              </button>
            )
          )}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function Field({
  label, value, editing, onChange, type = "text", fullWidth = false, as = "input", required = false, error,
}: {
  label: string; value: string; editing: boolean; onChange: (v: string) => void;
  type?: string; fullWidth?: boolean; as?: "input" | "textarea"; required?: boolean; error?: string;
}) {
  const cls = error ? inputErrCls : inputCls;
  return (
    <div className={fullWidth ? "col-span-full" : ""}>
      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
        {label}{required && editing && <span className="text-error-500 ml-0.5">*</span>}
      </label>
      {editing ? (
        as === "textarea" ? (
          <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} className={cls + " resize-none"} />
        ) : (
          <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className={cls} />
        )
      ) : (
        <p className="text-sm font-medium text-gray-900 dark:text-white py-1">
          {value || <span className="text-gray-400 dark:text-gray-600 font-normal italic">—</span>}
        </p>
      )}
      {editing && error && <p className="mt-1 text-xs text-error-500 dark:text-error-400">{error}</p>}
    </div>
  );
}

function DocumentRow({ doc }: { doc: DocumentFile }) {
  const isImage = doc.mimeType.startsWith("image/");
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg group hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-md bg-brand-50 dark:bg-brand-500/10">
          {isImage ? <LuImage className="w-4 h-4 text-brand-500 dark:text-brand-400" /> : <LuFileText className="w-4 h-4 text-brand-500 dark:text-brand-400" />}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{doc.fileName}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{doc.mimeType} · {formatBytes(doc.size)}</p>
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0 ml-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <a href={doc.url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-gray-500 hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-400 rounded-lg hover:bg-white dark:hover:bg-gray-700 transition-colors" title="View">
          <LuExternalLink className="w-4 h-4" />
        </a>
        <button className="p-1.5 text-gray-500 hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-400 rounded-lg hover:bg-white dark:hover:bg-gray-700 transition-colors" title="Download">
          <LuDownload className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}


// ─── Allocation Progress Bar ─────────────────────────────────────────────────

function AllocationBar({ allocated, total, shareholders }: { allocated: number; total: number; shareholders: number }) {
  const pct = total > 0 ? Math.min((allocated / total) * 100, 100) : 0;
  const exact100 = Math.round(pct) === 100 && allocated === total;
  const over = allocated > total;

  const barColor = over ? "bg-error-500" : exact100 ? "bg-success-500" : pct >= 50 ? "bg-warning-500" : "bg-error-500";
  const labelColor = over ? "text-error-600 dark:text-error-400" : exact100 ? "text-success-600 dark:text-success-400" : pct >= 50 ? "text-warning-600 dark:text-warning-400" : "text-error-600 dark:text-error-400";
  const bgColor = over ? "bg-error-50 dark:bg-error-500/10 border-error-200 dark:border-error-500/20" : exact100 ? "bg-success-50 dark:bg-success-500/10 border-success-200 dark:border-success-500/20" : pct >= 50 ? "bg-warning-50 dark:bg-warning-500/10 border-warning-200 dark:border-warning-500/20" : "bg-error-50 dark:bg-error-500/10 border-error-200 dark:border-error-500/20";

  return (
    <div className={`mt-5 p-4 rounded-xl border ${bgColor} transition-all`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Share Allocation</span>
        <span className={`text-xs font-bold ${labelColor}`}>
          {allocated.toLocaleString()} / {total.toLocaleString()} shares ({pct.toFixed(1)}%)
        </span>
      </div>
      <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <div className="flex items-center justify-between mt-2">
        <p className="text-xs text-gray-500 dark:text-gray-400">{shareholders} shareholder{shareholders !== 1 ? "s" : ""}</p>
        {!exact100 && !over && <p className={`text-xs font-medium ${labelColor}`}>{(total - allocated).toLocaleString()} shares unallocated</p>}
        {over && <p className="text-xs font-medium text-error-600 dark:text-error-400 flex items-center gap-1"><LuTriangleAlert className="w-3 h-3" /> Over-allocated by {(allocated - total).toLocaleString()} shares</p>}
        {exact100 && <p className="text-xs font-medium text-success-600 dark:text-success-400 flex items-center gap-1"><LuCheck className="w-3 h-3" /> Fully allocated</p>}
      </div>
    </div>
  );
}

// ─── Blank person template ────────────────────────────────────────────────────

function blankPerson(role: string): Person {
  return {
    id: `person-new-${Date.now()}`,
    type: "individual",
    roles: [role],
    fullName: "",
    companyName: "",
    countryOfIncorporation: null,
    registrationNumber: null,
    nationality: "",
    email: "",
    phone: "",
    residentialAddress: { street: "", city: "", state: "", postalCode: "", country: "" },
    shareholding: { shares: 0, percentage: 0 },
    documents: { passport: null, selfie: null, addressProof: null, certificate_of_incorporation: null, business_license: null, others: null },
  };
}

// ─── Share Capital: Add Shareholder dropdown ──────────────────────────────────

function ShareCapitalAddDropdown({
  allPersons, totalShares, remaining, onAdd,
}: {
  allPersons: Person[]; totalShares: number; remaining: number; onAdd: (personId: string, shares: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [sharesInput, setSharesInput] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const candidates = allPersons.filter((p) => p.roles.includes("shareholder") && p.shareholding.shares === 0);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const maxShares = remaining;
  const minShares = Math.max(1, Math.ceil(totalShares * 0.01));

  const handleAdd = () => {
    const shares = parseInt(sharesInput, 10);
    if (!selectedId || isNaN(shares) || shares < minShares || shares > maxShares) return;
    onAdd(selectedId, shares);
    setOpen(false); setSelectedId(""); setSharesInput("");
  };

  if (remaining <= 0) return null;

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors">
        <LuPlus className="w-3.5 h-3.5" /> Add Shareholder <LuChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 w-72 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-theme-lg p-4 space-y-3">
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Assign shareholder from existing persons</p>
          {candidates.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-gray-500 italic py-1">All current shareholders are already in the distribution.</p>
          ) : (
            <>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Select Person</label>
                <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className={inputCls}>
                  <option value="">— choose —</option>
                  {candidates.map((p) => <option key={p.id} value={p.id}>{p.fullName || p.companyName} ({p.roles.join(", ")})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Shares (min {minShares.toLocaleString()} · max {maxShares.toLocaleString()})</label>
                <input type="number" value={sharesInput} onChange={(e) => setSharesInput(e.target.value)} min={minShares} max={maxShares} className={inputCls} />
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setOpen(false)} className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Cancel</button>
                <button onClick={handleAdd} disabled={!selectedId || !sharesInput || parseInt(sharesInput) < minShares || parseInt(sharesInput) > maxShares} className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-brand-500 hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors">Add</button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Add Person Dropdown ──────────────────────────────────────────────────────

function blankNewPerson() {
  return {
    type: "individual" as "individual" | "corporate",
    fullName: "", companyName: "", nationality: "", email: "", phone: "",
    street: "", city: "", state: "", postalCode: "", country: "",
    countryOfIncorporation: "", registrationNumber: "",
    shares: "",
  };
}

function AddPersonDropdown({
  label, candidates, candidateRole, newRole, onAddExisting, onAddNewWithAdjustments,
  totalShares, currentShareholders,
}: {
  label: string; candidates: Person[]; candidateRole: string; newRole: string;
  onAddExisting: (personId: string, adjustments: { id: string; shares: number }[], newShares: number) => void;
  onAddNewWithAdjustments: (person: Person, adjustedShareholders: { id: string; shares: number }[]) => void;
  totalShares?: number; currentShareholders?: Person[];
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [selectedId, setSelectedId] = useState("");
  const [existingShares, setExistingShares] = useState(""); // shares for the selected existing person
  const [form, setForm] = useState(blankNewPerson);
  const [touched, setTouched] = useState(false);
  // adjustedShares: map of personId → share count string (for existing shareholders)
  const [adjustedShares, setAdjustedShares] = useState<Record<string, string>>({});
  const ref = useRef<HTMLDivElement>(null);

  const isShareholder = newRole === "shareholder";
  const ts = totalShares ?? 0;
  const shareholders = currentShareholders ?? [];

  // Build the initial adjustedShares map from current shareholders
  const initAdjustedShares = () => {
    if (!isShareholder) return;
    const init: Record<string, string> = {};
    shareholders.filter((p) => p.roles.includes("shareholder")).forEach((p) => {
      init[p.id] = String(p.shareholding.shares);
    });
    setAdjustedShares(init);
    setExistingShares("");
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const set = (k: keyof ReturnType<typeof blankNewPerson>) => (v: string) => setForm((p) => ({ ...p, [k]: v }));

  // ── Existing tab share calculations ────────────────────────────────────────
  const existingSharesNum = parseInt(existingShares, 10);
  const existingAdjustedTotal = Object.values(adjustedShares).reduce((s, v) => s + (parseInt(v, 10) || 0), 0);
  const existingAvailableForNew = Math.max(0, ts - existingAdjustedTotal);
  const existingTotalAfterAdd = existingAdjustedTotal + (isNaN(existingSharesNum) ? 0 : existingSharesNum);
  const existingSumMatchesTotal = isShareholder ? existingTotalAfterAdd === ts : true;

  const existingShareErrors = {
    selected: !selectedId ? "Select a person" : "",
    shares: isShareholder
      ? (!existingShares.trim() ? "Required"
        : isNaN(existingSharesNum) || existingSharesNum <= 0 ? "Must be > 0"
        : existingSharesNum > existingAvailableForNew ? `Max ${existingAvailableForNew.toLocaleString()}`
        : "")
      : "",
    adjustments: isShareholder ? (() => {
      for (const p of shareholders.filter((p) => p.roles.includes("shareholder"))) {
        const v = parseInt(adjustedShares[p.id] ?? "", 10);
        if (isNaN(v) || v < 1) return `${p.fullName || p.companyName}: min 1 share`;
        if (v > p.shareholding.shares) return `${p.fullName || p.companyName}: cannot exceed ${p.shareholding.shares.toLocaleString()}`;
      }
      return "";
    })() : "",
  };
  const existingValid = !existingShareErrors.selected && !existingShareErrors.shares && !existingShareErrors.adjustments && existingSumMatchesTotal;

  // ── New tab share calculations ──────────────────────────────────────────────
  const adjustedTotal = Object.values(adjustedShares).reduce((s, v) => s + (parseInt(v, 10) || 0), 0);
  const sharesNum = parseInt(form.shares, 10);
  const availableForNew = Math.max(0, ts - adjustedTotal);

  const newErrors = {
    name: form.type === "individual" ? (!form.fullName.trim() ? "Required" : "") : (!form.companyName.trim() ? "Required" : ""),
    email: !form.email.trim() ? "Required" : !isValidEmail(form.email) ? "Invalid email" : "",
    phone: !form.phone.trim() ? "Required" : "",
    country: !form.country.trim() ? "Required" : "",
    shares: isShareholder
      ? (!form.shares.trim() ? "Required"
        : isNaN(sharesNum) || sharesNum <= 0 ? "Must be > 0"
        : sharesNum > availableForNew ? `Max ${availableForNew.toLocaleString()} (free up more from existing shareholders)`
        : "")
      : "",
    adjustments: isShareholder ? (() => {
      for (const p of shareholders.filter((p) => p.roles.includes("shareholder"))) {
        const v = parseInt(adjustedShares[p.id] ?? "", 10);
        if (isNaN(v) || v < 1) return `${p.fullName || p.companyName}: min 1 share`;
        if (v > p.shareholding.shares) return `${p.fullName || p.companyName}: cannot exceed their current ${p.shareholding.shares.toLocaleString()} shares`;
      }
      return "";
    })() : "",
  };
  const totalAfterAdd = adjustedTotal + (isNaN(sharesNum) ? 0 : sharesNum);
  const sumMatchesTotal = isShareholder ? totalAfterAdd === ts : true;
  const newValid = Object.values(newErrors).every((e) => !e) && sumMatchesTotal;

  const reset = () => {
    setForm(blankNewPerson()); setTouched(false); setSelectedId("");
    setAdjustedShares({}); setExistingShares("");
  };

  const handleAdd = () => {
    if (mode === "existing") {
      setTouched(true);
      if (isShareholder && !existingValid) return;
      if (!isShareholder && !selectedId) return;
      const adjustmentsList = isShareholder
        ? shareholders
            .filter((p) => p.roles.includes("shareholder"))
            .map((p) => ({ id: p.id, shares: parseInt(adjustedShares[p.id] ?? "0", 10) }))
        : [];
      onAddExisting(selectedId, adjustmentsList, isShareholder ? existingSharesNum : 0);
      reset();
      setOpen(false);
    } else {
      setTouched(true);
      if (!newValid) return;
      const p = blankPerson(newRole);
      const person: Person = {
        ...p,
        type: form.type,
        fullName: form.type === "individual" ? form.fullName.trim() : "",
        companyName: form.type === "corporate" ? form.companyName.trim() : "",
        countryOfIncorporation: form.countryOfIncorporation.trim() || null,
        registrationNumber: form.registrationNumber.trim() || null,
        nationality: form.nationality.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        residentialAddress: {
          street: form.street.trim(),
          city: form.city.trim(),
          state: form.state.trim(),
          postalCode: form.postalCode.trim(),
          country: form.country.trim(),
        },
        shareholding: { shares: isShareholder ? sharesNum : 0, percentage: 0 },
      };
      const adjustmentsList = isShareholder
        ? shareholders
            .filter((p) => p.roles.includes("shareholder"))
            .map((p) => ({ id: p.id, shares: parseInt(adjustedShares[p.id] ?? "0", 10) }))
        : [];
      onAddNewWithAdjustments(person, adjustmentsList);
      reset();
      setOpen(false);
    }
  };

  return (
    <div ref={ref} className="relative">
      <button onClick={() => { setOpen((o) => { if (!o) initAdjustedShares(); return !o; }); }} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors">
        <LuPlus className="w-3.5 h-3.5" /> {label} <LuChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 z-40 w-[420px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-theme-lg overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 text-xs font-medium">
            <button onClick={() => { setMode("existing"); initAdjustedShares(); }} className={`flex-1 py-2.5 transition-colors ${mode === "existing" ? "bg-brand-500 text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"}`}>
              From {candidateRole === "director" ? "Directors" : "Shareholders"}
            </button>
            <button onClick={() => { setMode("new"); initAdjustedShares(); }} className={`flex-1 py-2.5 transition-colors ${mode === "new" ? "bg-brand-500 text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"}`}>
              Add New
            </button>
          </div>

          <div className="p-4 space-y-3 max-h-[75vh] overflow-y-auto">
            {mode === "existing" ? (
              candidates.length === 0 ? (
                <p className="text-xs text-gray-500 dark:text-gray-400 italic text-center py-3">
                  No {candidateRole === "director" ? "directors" : "shareholders"} available.
                </p>
              ) : (
                <div className="space-y-3">
                  {/* Person selector */}
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Select Person</label>
                    <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className={touched && existingShareErrors.selected ? inputErrCls : inputCls}>
                      <option value="">— choose —</option>
                      {candidates.map((p) => <option key={p.id} value={p.id}>{p.fullName || p.companyName}</option>)}
                    </select>
                    {touched && existingShareErrors.selected && <p className="mt-1 text-xs text-error-500">{existingShareErrors.selected}</p>}
                  </div>

                  {/* Share allocation — only when adding as shareholder */}
                  {isShareholder && (
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700 space-y-3">
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Share Allocation</p>

                      {/* Existing shareholders — adjustable */}
                      {shareholders.filter((p) => p.roles.includes("shareholder")).length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Adjust existing shareholders to free up shares.</p>
                          {shareholders.filter((p) => p.roles.includes("shareholder")).map((p) => {
                            const current = parseInt(adjustedShares[p.id] ?? String(p.shareholding.shares), 10) || 0;
                            const original = p.shareholding.shares;
                            const freed = original - current;
                            const pct = ts > 0 ? ((current / ts) * 100).toFixed(1) : "0.0";
                            const hasErr = touched && (isNaN(current) || current < 1 || current > original);
                            return (
                              <div key={p.id} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                                <div className="w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-500/20 flex items-center justify-center text-[10px] font-bold text-brand-600 dark:text-brand-400 flex-shrink-0">
                                  {(p.fullName || p.companyName || "?")[0].toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{p.fullName || p.companyName}</p>
                                  <p className="text-[10px] text-gray-500 dark:text-gray-400">
                                    Original: {original.toLocaleString()} · New: {pct}%
                                    {freed > 0 && <span className="text-brand-500 font-medium"> · freed {freed.toLocaleString()}</span>}
                                  </p>
                                </div>
                                <div className="flex-shrink-0 w-24">
                                  <input
                                    type="number"
                                    value={adjustedShares[p.id] ?? String(original)}
                                    onChange={(e) => setAdjustedShares((prev) => ({ ...prev, [p.id]: e.target.value }))}
                                    min={1} max={original}
                                    className={(hasErr ? inputErrCls : inputCls) + " text-center text-xs py-1"}
                                  />
                                </div>
                              </div>
                            );
                          })}
                          {touched && existingShareErrors.adjustments && <p className="text-xs text-error-500">{existingShareErrors.adjustments}</p>}
                        </div>
                      )}

                      {/* New person's shares */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            Shares for Selected Person <span className="text-error-500">*</span>
                          </label>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${existingAvailableForNew > 0 ? "bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400" : "bg-error-50 dark:bg-error-500/10 text-error-600 dark:text-error-400"}`}>
                            {existingAvailableForNew.toLocaleString()} available
                          </span>
                        </div>
                        <input
                          type="number"
                          value={existingShares}
                          onChange={(e) => setExistingShares(e.target.value)}
                          placeholder={existingAvailableForNew > 0 ? `1 – ${existingAvailableForNew.toLocaleString()}` : "Free up shares above first"}
                          disabled={existingAvailableForNew <= 0}
                          min={1} max={existingAvailableForNew}
                          className={touched && existingShareErrors.shares ? inputErrCls : inputCls}
                        />
                        {touched && existingShareErrors.shares && <p className="mt-1 text-xs text-error-500">{existingShareErrors.shares}</p>}
                        {!isNaN(existingSharesNum) && existingSharesNum > 0 && ts > 0 && (
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">= {((existingSharesNum / ts) * 100).toFixed(2)}% ownership</p>
                        )}
                      </div>

                      {/* Live total bar */}
                      {ts > 0 && (
                        <div className={`p-2.5 rounded-lg border text-xs ${existingTotalAfterAdd === ts ? "bg-success-50 dark:bg-success-500/10 border-success-200 dark:border-success-500/20" : "bg-warning-50 dark:bg-warning-500/10 border-warning-200 dark:border-warning-500/20"}`}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className={`font-semibold ${existingTotalAfterAdd === ts ? "text-success-700 dark:text-success-400" : "text-warning-700 dark:text-warning-400"}`}>
                              {existingTotalAfterAdd === ts ? "✓ Total = 100%" : `Total: ${existingTotalAfterAdd.toLocaleString()} / ${ts.toLocaleString()}`}
                            </span>
                            {existingTotalAfterAdd !== ts && (
                              <span className="text-warning-600 dark:text-warning-400">
                                {existingTotalAfterAdd < ts ? `${(ts - existingTotalAfterAdd).toLocaleString()} unallocated` : `over by ${(existingTotalAfterAdd - ts).toLocaleString()}`}
                              </span>
                            )}
                          </div>
                          <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-300 ${existingTotalAfterAdd > ts ? "bg-error-500" : existingTotalAfterAdd === ts ? "bg-success-500" : "bg-warning-500"}`}
                              style={{ width: `${Math.min((existingTotalAfterAdd / ts) * 100, 100)}%` }} />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            ) : (
              <div className="space-y-3">
                {/* Type toggle */}
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">Person Type</label>
                  <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 text-xs font-medium">
                    <button onClick={() => set("type")("individual")} className={`flex-1 py-1.5 transition-colors ${form.type === "individual" ? "bg-brand-500 text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"}`}>Individual</button>
                    <button onClick={() => set("type")("corporate")} className={`flex-1 py-1.5 transition-colors ${form.type === "corporate" ? "bg-brand-500 text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"}`}>Corporate</button>
                  </div>
                </div>

                {/* Name row */}
                {form.type === "individual" ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Full Name <span className="text-error-500">*</span></label>
                      <input value={form.fullName} onChange={(e) => set("fullName")(e.target.value)} placeholder="e.g. John Smith" className={touched && newErrors.name ? inputErrCls : inputCls} />
                      {touched && newErrors.name && <p className="mt-1 text-xs text-error-500">{newErrors.name}</p>}
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Nationality</label>
                      <input value={form.nationality} onChange={(e) => set("nationality")(e.target.value)} placeholder="e.g. HK" className={inputCls} />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Company Name <span className="text-error-500">*</span></label>
                      <input value={form.companyName} onChange={(e) => set("companyName")(e.target.value)} placeholder="e.g. Acme Holdings Ltd" className={touched && newErrors.name ? inputErrCls : inputCls} />
                      {touched && newErrors.name && <p className="mt-1 text-xs text-error-500">{newErrors.name}</p>}
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Country of Inc.</label>
                      <input value={form.countryOfIncorporation} onChange={(e) => set("countryOfIncorporation")(e.target.value)} placeholder="e.g. HK" className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Reg. Number</label>
                      <input value={form.registrationNumber} onChange={(e) => set("registrationNumber")(e.target.value)} placeholder="e.g. 12345678" className={inputCls} />
                    </div>
                  </div>
                )}

                {/* Contact */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Email <span className="text-error-500">*</span></label>
                    <input type="email" value={form.email} onChange={(e) => set("email")(e.target.value)} placeholder="email@example.com" className={touched && newErrors.email ? inputErrCls : inputCls} />
                    {touched && newErrors.email && <p className="mt-1 text-xs text-error-500">{newErrors.email}</p>}
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Phone <span className="text-error-500">*</span></label>
                    <input type="tel" value={form.phone} onChange={(e) => set("phone")(e.target.value)} placeholder="+852..." className={touched && newErrors.phone ? inputErrCls : inputCls} />
                    {touched && newErrors.phone && <p className="mt-1 text-xs text-error-500">{newErrors.phone}</p>}
                  </div>
                </div>

                {/* Address */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Address</p>
                  <div className="space-y-2">
                    <input value={form.street} onChange={(e) => set("street")(e.target.value)} placeholder="Street address" className={inputCls} />
                    <div className="grid grid-cols-2 gap-2">
                      <input value={form.city} onChange={(e) => set("city")(e.target.value)} placeholder="City" className={inputCls} />
                      <input value={form.state} onChange={(e) => set("state")(e.target.value)} placeholder="State / Province" className={inputCls} />
                      <input value={form.postalCode} onChange={(e) => set("postalCode")(e.target.value)} placeholder="Postal code" className={inputCls} />
                      <div>
                        <input value={form.country} onChange={(e) => set("country")(e.target.value)} placeholder="Country *" className={touched && newErrors.country ? inputErrCls : inputCls} />
                        {touched && newErrors.country && <p className="mt-1 text-xs text-error-500">{newErrors.country}</p>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Shares + redistribution — only for shareholders */}
                {isShareholder && (
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700 space-y-3">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Share Allocation</p>

                    {/* Existing shareholders — adjustable */}
                    {shareholders.filter((p) => p.roles.includes("shareholder")).length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Adjust existing shareholders to free up shares for the new person.
                        </p>
                        {shareholders.filter((p) => p.roles.includes("shareholder")).map((p) => {
                          const current = parseInt(adjustedShares[p.id] ?? String(p.shareholding.shares), 10) || 0;
                          const original = p.shareholding.shares;
                          const freed = original - current;
                          const pct = ts > 0 ? ((current / ts) * 100).toFixed(1) : "0.0";
                          const hasErr = touched && (isNaN(current) || current < 1 || current > original);
                          return (
                            <div key={p.id} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                              <div className="w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-500/20 flex items-center justify-center text-[10px] font-bold text-brand-600 dark:text-brand-400 flex-shrink-0">
                                {(p.fullName || p.companyName || "?")[0].toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{p.fullName || p.companyName}</p>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400">
                                  Original: {original.toLocaleString()} · New: {pct}%
                                  {freed > 0 && <span className="text-brand-500 font-medium"> · freed {freed.toLocaleString()}</span>}
                                </p>
                              </div>
                              <div className="flex-shrink-0 w-24">
                                <input
                                  type="number"
                                  value={adjustedShares[p.id] ?? String(original)}
                                  onChange={(e) => setAdjustedShares((prev) => ({ ...prev, [p.id]: e.target.value }))}
                                  min={1}
                                  max={original}
                                  className={(hasErr ? inputErrCls : inputCls) + " text-center text-xs py-1"}
                                />
                              </div>
                            </div>
                          );
                        })}
                        {touched && newErrors.adjustments && (
                          <p className="text-xs text-error-500">{newErrors.adjustments}</p>
                        )}
                      </div>
                    )}

                    {/* New person's shares */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          New Shareholder's Shares <span className="text-error-500">*</span>
                        </label>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${availableForNew > 0 ? "bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400" : "bg-error-50 dark:bg-error-500/10 text-error-600 dark:text-error-400"}`}>
                          {availableForNew.toLocaleString()} available
                        </span>
                      </div>
                      <input
                        type="number"
                        value={form.shares}
                        onChange={(e) => set("shares")(e.target.value)}
                        placeholder={availableForNew > 0 ? `1 – ${availableForNew.toLocaleString()}` : "Free up shares above first"}
                        disabled={availableForNew <= 0}
                        min={1}
                        max={availableForNew}
                        className={touched && newErrors.shares ? inputErrCls : inputCls}
                      />
                      {touched && newErrors.shares && <p className="mt-1 text-xs text-error-500">{newErrors.shares}</p>}
                      {!isNaN(sharesNum) && sharesNum > 0 && ts > 0 && (
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          = {((sharesNum / ts) * 100).toFixed(2)}% ownership
                        </p>
                      )}
                    </div>

                    {/* Live total bar */}
                    {ts > 0 && (
                      <div className={`p-2.5 rounded-lg border text-xs ${totalAfterAdd === ts ? "bg-success-50 dark:bg-success-500/10 border-success-200 dark:border-success-500/20" : "bg-warning-50 dark:bg-warning-500/10 border-warning-200 dark:border-warning-500/20"}`}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`font-semibold ${totalAfterAdd === ts ? "text-success-700 dark:text-success-400" : "text-warning-700 dark:text-warning-400"}`}>
                            {totalAfterAdd === ts ? "✓ Total = 100%" : `Total: ${totalAfterAdd.toLocaleString()} / ${ts.toLocaleString()}`}
                          </span>
                          {totalAfterAdd !== ts && (
                            <span className="text-warning-600 dark:text-warning-400">
                              {totalAfterAdd < ts ? `${(ts - totalAfterAdd).toLocaleString()} unallocated` : `over by ${(totalAfterAdd - ts).toLocaleString()}`}
                            </span>
                          )}
                        </div>
                        <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${totalAfterAdd > ts ? "bg-error-500" : totalAfterAdd === ts ? "bg-success-500" : "bg-warning-500"}`}
                            style={{ width: `${Math.min((totalAfterAdd / ts) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer buttons */}
          <div className="flex gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
            <button onClick={() => { reset(); setOpen(false); }} className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={mode === "existing" ? !selectedId : false}
              className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-brand-500 hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              Add {newRole === "shareholder" ? "Shareholder" : "Director"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Section: Applicant Information ──────────────────────────────────────────

function ApplicantSection({ data, onSave }: { data: RegistrationDetail["applicant"]; onSave: (d: RegistrationDetail["applicant"]) => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(data);
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const set = (k: keyof typeof draft) => (v: string) => { setTouched(true); setDraft((p) => ({ ...p, [k]: v })); };

  const errors = {
    firstName: !draft.firstName.trim() ? "First name is required" : "",
    lastName: !draft.lastName.trim() ? "Last name is required" : "",
    email: !draft.email.trim() ? "Email is required" : !isValidEmail(draft.email) ? "Enter a valid email address" : "",
    phone: !draft.phone.trim() ? "Phone number is required" : "",
  };
  const isValid = Object.values(errors).every((e) => !e);

  const handleSave = async () => {
    setTouched(true);
    if (!isValid) return;
    setSaving(true); setSaveError("");
    try { await onSave(draft); setEditing(false); }
    catch (err) { setSaveError(err instanceof Error ? err.message : "Save failed"); }
    finally { setSaving(false); }
  };

  return (
    <SectionCard icon={LuUser} title="Applicant Information" subtitle="Primary contact details"
      editing={editing}
      onEdit={() => { setDraft(data); setTouched(false); setSaveError(""); setEditing(true); }}
      onSave={handleSave}
      onCancel={() => setEditing(false)}
      saveDisabled={editing && touched && !isValid}
      saving={saving} saveError={saveError}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
        <Field label="First Name" value={editing ? draft.firstName : data.firstName} editing={editing} onChange={set("firstName")} required error={touched ? errors.firstName : ""} />
        <Field label="Last Name" value={editing ? draft.lastName : data.lastName} editing={editing} onChange={set("lastName")} required error={touched ? errors.lastName : ""} />
        <Field label="Email" type="email" value={editing ? draft.email : data.email} editing={editing} onChange={set("email")} required error={touched ? errors.email : ""} />
        <Field label="Phone" type="tel" value={editing ? draft.phone : data.phone} editing={editing} onChange={set("phone")} required error={touched ? errors.phone : ""} />
      </div>
    </SectionCard>
  );
}

// ─── Section: Company Information ────────────────────────────────────────────

const BUSINESS_NATURE_OPTIONS = ["E-Commerce", "Consulting", "Services", "Trading", "IT / SaaS", "Import/Export"];

function CompanySection({ data, onSave }: { data: RegistrationDetail["company"]; onSave: (d: RegistrationDetail["company"]) => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(data);
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const set = (k: keyof typeof draft) => (v: string) => { setTouched(true); setDraft((p) => ({ ...p, [k]: v })); };
  const display = editing ? draft : data;

  const errors = {
    countryOfIncorporation: !draft.countryOfIncorporation.trim() ? "Country of incorporation is required" : "",
    proposedCompanyName: !draft.proposedCompanyName.trim() ? "Proposed company name is required" : "",
    natureOfBusiness: draft.natureOfBusiness.length === 0 ? "Select at least one nature of business" : "",
    businessScope: !draft.businessScope.trim() ? "Business scope is required" : "",
    businessScopeDescription: !draft.businessScopeDescription.trim() ? "Business scope description is required" : "",
  };
  const isValid = Object.values(errors).every((e) => !e);

  const toggleNature = (option: string) => {
    setTouched(true);
    setDraft((p) => ({
      ...p,
      natureOfBusiness: p.natureOfBusiness.includes(option)
        ? p.natureOfBusiness.filter((n) => n !== option)
        : [...p.natureOfBusiness, option],
    }));
  };

  const handleSave = async () => {
    setTouched(true);
    if (!isValid) return;
    setSaving(true); setSaveError("");
    try { await onSave(draft); setEditing(false); }
    catch (err) { setSaveError(err instanceof Error ? err.message : "Save failed"); }
    finally { setSaving(false); }
  };

  return (
    <SectionCard icon={LuBuilding2} title="Company Information" subtitle="Incorporation details"
      editing={editing}
      onEdit={() => { setDraft(data); setTouched(false); setSaveError(""); setEditing(true); }}
      onSave={handleSave}
      onCancel={() => setEditing(false)}
      saveDisabled={editing && touched && !isValid}
      saving={saving} saveError={saveError}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
        <Field label="Country of Incorporation" value={display.countryOfIncorporation} editing={editing} onChange={set("countryOfIncorporation")} required error={touched ? errors.countryOfIncorporation : ""} />
        <Field label="Company Type" value={display.type} editing={editing} onChange={set("type")} />
        <Field label="Proposed Company Name" value={display.proposedCompanyName} editing={editing} onChange={set("proposedCompanyName")} required error={touched ? errors.proposedCompanyName : ""} />
        <Field label="Business Scope" value={display.businessScope} editing={editing} onChange={set("businessScope")} required error={touched ? errors.businessScope : ""} />

        <div className="col-span-full">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Alternative Names</label>
          {editing ? (
            <div className="grid grid-cols-3 gap-3">
              {(draft.alternativeNames.length > 0 ? draft.alternativeNames : ["", "", ""]).map((name, i) => (
                <input key={i} type="text" value={name} placeholder={`Alternative name ${i + 1}`}
                  onChange={(e) => { const u = [...(draft.alternativeNames.length > 0 ? draft.alternativeNames : ["", "", ""])]; u[i] = e.target.value; setTouched(true); setDraft((p) => ({ ...p, alternativeNames: u })); }}
                  className={inputCls} />
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {data.alternativeNames.filter(Boolean).length > 0
                ? data.alternativeNames.filter(Boolean).map((n, i) => (
                  <span key={i} className="px-2.5 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md">{n}</span>
                ))
                : <span className="text-sm text-gray-400 dark:text-gray-600 italic font-normal">None provided</span>}
            </div>
          )}
        </div>

        <div className="col-span-full">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
            Nature of Business{editing && <span className="text-error-500 ml-0.5">*</span>}
          </label>
          {editing ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {BUSINESS_NATURE_OPTIONS.map((opt) => (
                  <Checkbox key={opt} label={opt} checked={draft.natureOfBusiness.includes(opt)} onChange={() => toggleNature(opt)} />
                ))}
              </div>
              {touched && errors.natureOfBusiness && <p className="mt-1 text-xs text-error-500 dark:text-error-400">{errors.natureOfBusiness}</p>}
            </>
          ) : (
            <div className="flex flex-wrap gap-2">
              {display.natureOfBusiness.length > 0
                ? display.natureOfBusiness.map((b, i) => (
                  <span key={i} className="px-2.5 py-1 text-xs font-medium bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-400 rounded-md">{b}</span>
                ))
                : <span className="text-sm text-gray-400 dark:text-gray-600 italic font-normal">None specified</span>}
            </div>
          )}
        </div>

        <Field label="Business Scope Description" value={display.businessScopeDescription} editing={editing} onChange={set("businessScopeDescription")} fullWidth as="textarea" required error={touched ? errors.businessScopeDescription : ""} />
      </div>
    </SectionCard>
  );
}

// ─── Section: Share Capital ───────────────────────────────────────────────────

function ShareCapitalSection({
  data, persons, onSave, onPersonsChange,
}: {
  data: RegistrationDetail["shareCapital"]; persons: Person[];
  onSave: (d: RegistrationDetail["shareCapital"], p: Person[]) => Promise<void>; onPersonsChange: (p: Person[]) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(data);
  const [draftPersons, setDraftPersons] = useState(persons);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const display = editing ? draft : data;
  const displayPersons = editing ? draftPersons : persons;
  const shareholders = displayPersons.filter((p) => p.roles.includes("shareholder"));
  const allocated = shareholders.reduce((s, p) => s + p.shareholding.shares, 0);
  const remaining = display.totalShares - allocated;

  const updateShares = (id: string, shares: number) => {
    const updated = draftPersons.map((p) => p.id === id && p.roles.includes("shareholder") ? { ...p, shareholding: { shares: Math.max(0, shares), percentage: 0 } } : p);
    setDraftPersons(recalcPercentages(updated, draft.totalShares));
  };

  const addShareholder = (personId: string, shares: number) => {
    const updated = draftPersons.map((p) => p.id === personId ? { ...p, shareholding: { shares, percentage: 0 } } : p);
    setDraftPersons(recalcPercentages(updated, draft.totalShares));
  };

  const removeShareholder = (id: string) => {
    const updated = draftPersons.map((p) => p.id === id ? { ...p, shareholding: { shares: 0, percentage: 0 } } : p);
    setDraftPersons(recalcPercentages(updated, draft.totalShares));
  };

  const fieldErrors = {
    totalAmount: draft.totalAmount <= 0 ? "Share capital amount must be greater than 0" : "",
    totalShares: draft.totalShares <= 0 ? "Total shares must be greater than 0" : "",
  };
  const fieldValid = Object.values(fieldErrors).every((e) => !e);
  const canSave = remaining === 0 && allocated === draft.totalShares && fieldValid;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true); setSaveError("");
    try { await onSave(draft, draftPersons); onPersonsChange(draftPersons); setEditing(false); }
    catch (err) { setSaveError(err instanceof Error ? err.message : "Save failed"); }
    finally { setSaving(false); }
  };

  return (
    <SectionCard icon={LuFileChartPie} title="Share Capital" subtitle="Capital structure & shareholder distribution"
      editing={editing}
      onEdit={() => { setDraft(data); setDraftPersons(persons); setSaveError(""); setEditing(true); }}
      onSave={handleSave}
      onCancel={() => setEditing(false)}
      saveDisabled={editing && !canSave}
      saving={saving} saveError={saveError}
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Currency</label>
          {editing ? (
            <select value={draft.currency} onChange={(e) => setDraft((p) => ({ ...p, currency: e.target.value }))} className={inputCls}>
              <option>HKD</option><option>USD</option><option>SGD</option>
            </select>
          ) : (
            <p className="text-sm font-medium text-gray-900 dark:text-white py-1">{display.currency || "—"}</p>
          )}
        </div>
        <Field label="Total Share Capital" type="number" value={String(display.totalAmount)} editing={editing} required error={fieldErrors.totalAmount}
          onChange={(v) => setDraft((p) => ({ ...p, totalAmount: isNaN(Number(v)) ? p.totalAmount : Number(v) }))} />
        <Field label="Total Shares Issued" type="number" value={String(display.totalShares)} editing={editing} required error={fieldErrors.totalShares}
          onChange={(v) => { const n = isNaN(Number(v)) ? draft.totalShares : Number(v); setDraft((p) => ({ ...p, totalShares: n })); setDraftPersons((prev) => recalcPercentages(prev, n)); }} />
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Shareholder Distribution</p>
          {editing && <ShareCapitalAddDropdown allPersons={draftPersons} totalShares={draft.totalShares} remaining={remaining} onAdd={addShareholder} />}
        </div>

        {shareholders.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-600 italic py-2">No shareholders added yet.</p>
        ) : (
          <div className="space-y-2">
            {shareholders.map((person) => {
              const pct = display.totalShares > 0 ? ((person.shareholding.shares / display.totalShares) * 100).toFixed(2) : "0.00";
              const minShares = Math.max(1, Math.ceil(display.totalShares * 0.01));
              const isOnlyShareholder = shareholders.length === 1;

              return (
                <div key={person.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-500/20 flex items-center justify-center text-xs font-bold text-brand-600 dark:text-brand-400">
                    {(person.fullName || person.companyName || "?")[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{person.fullName || person.companyName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{person.type}</p>
                  </div>
                  {editing ? (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="w-32">
                        <input type="number" value={person.shareholding.shares} min={minShares} max={display.totalShares}
                          onChange={(e) => updateShares(person.id, parseInt(e.target.value, 10) || 0)} className={inputCls + " text-center"} />
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 w-12 text-right font-medium">
                        {((person.shareholding.shares / display.totalShares) * 100).toFixed(1)}%
                      </span>
                      {!isOnlyShareholder && (
                        <button onClick={() => removeShareholder(person.id)} className="p-1.5 text-error-500 hover:text-error-600 hover:bg-error-50 dark:hover:bg-error-500/10 rounded-lg transition-colors" title="Remove">
                          <LuTrash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{person.shareholding.shares.toLocaleString()}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">shares</p>
                      </div>
                      <div className="text-right w-14">
                        <p className="text-sm font-bold text-brand-600 dark:text-brand-400">{pct}%</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">ownership</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {editing && remaining !== 0 && (
          <div className={`mt-2 flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium ${remaining > 0 ? "bg-warning-50 dark:bg-warning-500/10 text-warning-700 dark:text-warning-400" : "bg-error-50 dark:bg-error-500/10 text-error-700 dark:text-error-400"}`}>
            <span className="flex items-center gap-1.5"><LuTriangleAlert className="w-3.5 h-3.5" />
              {remaining > 0 ? `${remaining.toLocaleString()} shares unallocated — must reach 100% to save` : `Over-allocated by ${Math.abs(remaining).toLocaleString()} shares`}
            </span>
            <span>{Math.abs(remaining).toLocaleString()} shares</span>
          </div>
        )}
      </div>

      <AllocationBar allocated={allocated} total={display.totalShares} shareholders={shareholders.length} />

      {editing && !canSave && (
        <p className="mt-3 text-xs text-center text-warning-600 dark:text-warning-400 font-medium">
          Allocate exactly 100% of shares across all shareholders before saving.
        </p>
      )}
    </SectionCard>
  );
}

// ─── Person validation ────────────────────────────────────────────────────────

function validatePerson(person: Person) {
  const isIndividual = person.type === "individual";
  return {
    name: isIndividual ? (!person.fullName.trim() ? "Full name is required" : "") : (!person.companyName.trim() ? "Company name is required" : ""),
    nationality: isIndividual && !person.nationality.trim() ? "Nationality is required" : "",
    email: !person.email.trim() ? "Email is required" : !isValidEmail(person.email) ? "Enter a valid email address" : "",
    phone: !person.phone.trim() ? "Phone number is required" : "",
    street: !person.residentialAddress.street.trim() ? "Street address is required" : "",
    city: !person.residentialAddress.city.trim() ? "City is required" : "",
    postalCode: !person.residentialAddress.postalCode.trim() ? "Postal code is required" : "",
    country: !person.residentialAddress.country.trim() ? "Country is required" : "",
  };
}

function PersonCard({
  person, index, editing, totalShares, onPersonChange, onRemove, canRemove, showErrors = false,
}: {
  person: Person; index: number; editing: boolean; totalShares: number;
  onPersonChange: (p: Person) => void; onRemove: () => void; canRemove: boolean; showErrors?: boolean;
}) {
  const set = (k: keyof Person) => (v: string) => onPersonChange({ ...person, [k]: v });
  const setAddr = (k: keyof Person["residentialAddress"]) => (v: string) =>
    onPersonChange({ ...person, residentialAddress: { ...person.residentialAddress, [k]: v } });

  const errors = editing ? validatePerson(person) : {} as ReturnType<typeof validatePerson>;
  const show = editing && showErrors;

  const docLabels: Record<string, string> = {
    passport: "Passport / ID", selfie: "Passport Holding Selfie", addressProof: "Proof of Address",
    certificate_of_incorporation: "Certificate of Incorporation", business_license: "Business License", others: "Other Documents",
  };
  const docs = Object.entries(person.documents).filter(([, v]) => v !== null).map(([k, v]) => ({ label: docLabels[k] || k, doc: v as DocumentFile }));

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-visible">
      <div className="px-4 py-3 bg-gray-50 rounded-t-xl dark:bg-gray-800/60 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-500/20 flex items-center justify-center text-xs font-bold text-brand-600 dark:text-brand-400">{index + 1}</div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{person.fullName || person.companyName || `Person ${index + 1}`}</p>
            <div className="flex gap-1.5 mt-0.5">
              {person.roles.map((r) => (
                <span key={r} className="px-1.5 py-0.5 text-[10px] font-medium bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded capitalize">{r}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 capitalize">{person.type}</span>
          {editing && (
            <button onClick={onRemove} disabled={!canRemove} title={canRemove ? "Remove" : "At least one entry must remain"}
              className="p-1.5 text-error-500 hover:text-error-600 hover:bg-error-50 dark:hover:bg-error-500/10 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-colors">
              <LuTrash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-5">
        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Personal Information</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            <Field label="Full Name" value={person.fullName} editing={editing} onChange={set("fullName")} required error={show ? errors.name : ""} />
            <Field label="Nationality" value={person.nationality} editing={editing} onChange={set("nationality")} required={person.type === "individual"} error={show ? errors.nationality : ""} />
            <Field label="Email" type="email" value={person.email} editing={editing} onChange={set("email")} required error={show ? errors.email : ""} />
            <Field label="Phone" type="tel" value={person.phone} editing={editing} onChange={set("phone")} required error={show ? errors.phone : ""} />
          </div>
        </div>

        {person.roles.includes("shareholder") && (
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Shareholding</p>
            <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Shares</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{person.shareholding.shares.toLocaleString()}</p>
              </div>
              <div className="w-px h-8 bg-gray-200 dark:bg-gray-700" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Ownership</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{Number(person.shareholding.percentage).toFixed(2)}%</p>
              </div>
              {totalShares > 0 && (
                <>
                  <div className="w-px h-8 bg-gray-200 dark:bg-gray-700" />
                  <div className="flex-1">
                    <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-500 rounded-full" style={{ width: `${Math.min(person.shareholding.percentage, 100)}%` }} />
                    </div>
                  </div>
                </>
              )}
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-600 mt-1.5">Shareholding is managed in the Share Capital section.</p>
          </div>
        )}

        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Residential Address</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            <Field label="Street Address" value={person.residentialAddress.street} editing={editing} onChange={setAddr("street")} fullWidth required error={show ? errors.street : ""} />
            <Field label="City" value={person.residentialAddress.city} editing={editing} onChange={setAddr("city")} required error={show ? errors.city : ""} />
            <Field label="State / Province" value={person.residentialAddress.state} editing={editing} onChange={setAddr("state")} />
            <Field label="Postal Code" value={person.residentialAddress.postalCode} editing={editing} onChange={setAddr("postalCode")} required error={show ? errors.postalCode : ""} />
            <Field label="Country" value={person.residentialAddress.country} editing={editing} onChange={setAddr("country")} required error={show ? errors.country : ""} />
          </div>
        </div>

        {docs.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Uploaded Documents</p>
            <div className="space-y-2">
              {docs.map(({ label, doc }) => (
                <div key={label}>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
                  <DocumentRow doc={doc} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Section: Shareholders ────────────────────────────────────────────────────

function ShareholdersSection({
  persons, totalShares, onSave,
  sharedDraft, onSharedDraftChange,
}: {
  persons: Person[]; totalShares: number; onSave: (p: Person[]) => Promise<void>;
  sharedDraft: Person[] | null; onSharedDraftChange: (p: Person[]) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Use shared draft while editing so directors section stays in sync
  const draft = sharedDraft ?? persons;
  const setDraft = (updater: Person[] | ((prev: Person[]) => Person[])) => {
    const next = typeof updater === "function" ? updater(sharedDraft ?? persons) : updater;
    onSharedDraftChange(next);
  };

  const draftShareholders = draft.filter((p) => p.roles.includes("shareholder"));
  const displayPersons = editing ? draft : persons;
  const displayShareholders = displayPersons.filter((p) => p.roles.includes("shareholder"));
  const allPersonsValid = draftShareholders.every((p) => Object.values(validatePerson(p)).every((e) => !e));

  // Candidates = directors in shared draft that aren't already shareholders
  const directorCandidates = draft.filter((p) => p.roles.includes("director") && !p.roles.includes("shareholder"));

  const updatePerson = (id: string, updated: Person) => setDraft((prev) => prev.map((p) => (p.id === id ? updated : p)));
  const removeShareholder = (id: string) => setDraft((prev) => prev.filter((p) => p.id !== id));
  const addExistingShareholder = (personId: string, adjustments: { id: string; shares: number }[], newShares: number) => {
    setDraft((prev) => {
      let updated = prev.map((p) => {
        if (p.id === personId && !p.roles.includes("shareholder")) {
          return { ...p, roles: [...p.roles, "shareholder"], shareholding: { shares: newShares, percentage: 0 } };
        }
        const adj = adjustments.find((a) => a.id === p.id);
        return adj ? { ...p, shareholding: { shares: adj.shares, percentage: 0 } } : p;
      });
      return recalcPercentages(updated, totalShares);
    });
  };
  const addNewWithAdjustments = (person: Person, adjustments: { id: string; shares: number }[]) => {
    setDraft((prev) => {
      let updated = prev.map((p) => {
        const adj = adjustments.find((a) => a.id === p.id);
        return adj ? { ...p, shareholding: { shares: adj.shares, percentage: 0 } } : p;
      });
      updated = [...updated, { ...person, shareholding: { shares: person.shareholding.shares, percentage: 0 } }];
      return recalcPercentages(updated, totalShares);
    });
  };

  const handleSave = async () => {
    setTouched(true);
    if (!allPersonsValid) return;
    setSaving(true); setSaveError("");
    try { await onSave(draft); setEditing(false); }
    catch (err) { setSaveError(err instanceof Error ? err.message : "Save failed"); }
    finally { setSaving(false); }
  };

  return (
    <SectionCard icon={LuUsers} title="Shareholders" subtitle="Detailed shareholder information"
      editing={editing}
      onEdit={() => { onSharedDraftChange(persons); setTouched(false); setSaveError(""); setEditing(true); }}
      onSave={handleSave}
      onCancel={() => { onSharedDraftChange(persons); setEditing(false); }}
      saveDisabled={editing && touched && !allPersonsValid}
      saving={saving} saveError={saveError}
      extraHeader={editing ? (
        <AddPersonDropdown
          label="Add Shareholder" candidates={directorCandidates} candidateRole="director" newRole="shareholder"
          onAddExisting={addExistingShareholder} onAddNewWithAdjustments={addNewWithAdjustments}
          totalShares={totalShares} currentShareholders={draft}
        />
      ) : undefined}
    >
      <div className="space-y-4">
        {displayShareholders.map((p, i) => {
          const draftPerson = draft.find((d) => d.id === p.id) || p;
          return (
            <PersonCard key={p.id} person={editing ? draftPerson : p} index={i} editing={editing} totalShares={totalShares}
              onPersonChange={(updated) => { setTouched(true); updatePerson(p.id, updated); }}
              onRemove={() => removeShareholder(p.id)} canRemove={draftShareholders.length > 1} showErrors={touched} />
          );
        })}
        {displayShareholders.length === 0 && <p className="text-sm text-gray-400 dark:text-gray-600 italic">No shareholders found.</p>}
      </div>
    </SectionCard>
  );
}

// ─── Section: Directors ───────────────────────────────────────────────────────

function DirectorsSection({
  persons, totalShares, onSave,
  sharedDraft, onSharedDraftChange,
}: {
  persons: Person[]; totalShares: number; onSave: (p: Person[]) => Promise<void>;
  sharedDraft: Person[] | null; onSharedDraftChange: (p: Person[]) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Use shared draft while editing so shareholders section stays in sync
  const draft = sharedDraft ?? persons;
  const setDraft = (updater: Person[] | ((prev: Person[]) => Person[])) => {
    const next = typeof updater === "function" ? updater(sharedDraft ?? persons) : updater;
    onSharedDraftChange(next);
  };

  const draftDirectors = draft.filter((p) => p.roles.includes("director"));
  const displayPersons = editing ? draft : persons;
  const displayDirectors = displayPersons.filter((p) => p.roles.includes("director"));
  const allPersonsValid = draftDirectors.every((p) => Object.values(validatePerson(p)).every((e) => !e));

  // Candidates = shareholders in shared draft that aren't already directors
  const shareholderCandidates = draft.filter((p) => p.roles.includes("shareholder") && !p.roles.includes("director"));

  const updatePerson = (id: string, updated: Person) => setDraft((prev) => prev.map((p) => (p.id === id ? updated : p)));
  const removeDirector = (id: string) => setDraft((prev) => prev.filter((p) => p.id !== id));
  const addExistingDirector = (personId: string) =>
    setDraft((prev) => prev.map((p) => p.id === personId && !p.roles.includes("director") ? { ...p, roles: [...p.roles, "director"] } : p));
  const addNewDirectorWithAdjustments = (person: Person, adjustments: { id: string; shares: number }[]) => {
    setDraft((prev) => {
      // If the new person is also a shareholder (adjustments present), apply share redistribution
      if (adjustments.length > 0) {
        let updated = prev.map((p) => {
          const adj = adjustments.find((a) => a.id === p.id);
          return adj ? { ...p, shareholding: { shares: adj.shares, percentage: 0 } } : p;
        });
        updated = [...updated, { ...person, shareholding: { shares: person.shareholding.shares, percentage: 0 } }];
        return recalcPercentages(updated, totalShares);
      }
      return [...prev, person];
    });
  };

  const handleSave = async () => {
    setTouched(true);
    if (!allPersonsValid) return;
    setSaving(true); setSaveError("");
    try { await onSave(draft); setEditing(false); }
    catch (err) { setSaveError(err instanceof Error ? err.message : "Save failed"); }
    finally { setSaving(false); }
  };

  return (
    <SectionCard icon={LuUserCheck} title="Directors" subtitle="Company director information"
      editing={editing}
      onEdit={() => { onSharedDraftChange(persons); setTouched(false); setSaveError(""); setEditing(true); }}
      onSave={handleSave}
      onCancel={() => { onSharedDraftChange(persons); setEditing(false); }}
      saveDisabled={editing && touched && !allPersonsValid}
      saving={saving} saveError={saveError}
      extraHeader={editing ? (
        <AddPersonDropdown
          label="Add Director" candidates={shareholderCandidates} candidateRole="shareholder" newRole="director"
          onAddExisting={(personId) => addExistingDirector(personId)} onAddNewWithAdjustments={addNewDirectorWithAdjustments}
          totalShares={totalShares} currentShareholders={draft}
        />
      ) : undefined}
    >
      <div className="space-y-4">
        {displayDirectors.map((p, i) => {
          const draftPerson = draft.find((d) => d.id === p.id) || p;
          return (
            <PersonCard key={p.id} person={editing ? draftPerson : p} index={i} editing={editing} totalShares={totalShares}
              onPersonChange={(updated) => { setTouched(true); updatePerson(p.id, updated); }}
              onRemove={() => removeDirector(p.id)} canRemove={draftDirectors.length > 1} showErrors={touched} />
          );
        })}
        {displayDirectors.length === 0 && <p className="text-sm text-gray-400 dark:text-gray-600 italic">No directors found.</p>}
      </div>
    </SectionCard>
  );
}

// ─── Section: Services ────────────────────────────────────────────────────────

const BANKING_PROVIDER_OPTIONS = [
  "Airwallex", "PayPal", "Payoneer", "Currenxie", "Stripe", "Bank Account Assistance", "No Bank Account Needed",
];

const ADDITIONAL_SERVICE_OPTIONS = [
  "Annual Secretarial Service", "Registered Address Renewal",
  "Accounting & Bookkeeping", "Audit Arrangement",
  "BR Renewal Handling", "Virtual Office",
  "Phone Number / E-Fax", "Nominee Shareholder Service",
  "Nominee Director Service", "Compliance Support",
  "Visa Application Support", "PayPal / Stripe Setup Guidance",
];

function ServicesSection({ data, onSave }: { data: RegistrationDetail["services"]; onSave: (d: RegistrationDetail["services"]) => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(data);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const display = editing ? draft : data;

  const toggleBanking = (opt: string) => {
    setDraft((prev) => {
      const has = prev.banking.providers.includes(opt);
      const providers = has ? prev.banking.providers.filter((p) => p !== opt) : [...prev.banking.providers, opt];
      // If preferred provider was removed, reset to first available or empty
      const preferredProvider = providers.includes(prev.banking.preferredProvider)
        ? prev.banking.preferredProvider
        : providers[0] || "";
      return { ...prev, banking: { providers, preferredProvider } };
    });
  };

  const toggleService = (opt: string) => {
    setDraft((prev) => ({
      ...prev,
      additionalServices: prev.additionalServices.includes(opt)
        ? prev.additionalServices.filter((s) => s !== opt)
        : [...prev.additionalServices, opt],
    }));
  };

  const handleSave = async () => {
    setSaving(true); setSaveError("");
    try { await onSave(draft); setEditing(false); }
    catch (err) { setSaveError(err instanceof Error ? err.message : "Save failed"); }
    finally { setSaving(false); }
  };

  return (
    <SectionCard icon={LuBriefcase} title="Banking & Additional Services" subtitle="Selected service packages"
      editing={editing}
      onEdit={() => { setDraft(data); setSaveError(""); setEditing(true); }}
      onSave={handleSave}
      onCancel={() => setEditing(false)}
      saving={saving} saveError={saveError}
    >
      <div className="space-y-6">
        {/* Banking Providers */}
        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Bank Account Opening Services</p>
          {editing ? (
            <>
              <div className="grid grid-cols-2 gap-2">
                {BANKING_PROVIDER_OPTIONS.map((opt) => (
                  <div key={opt} className="p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <Checkbox label={opt} checked={draft.banking.providers.includes(opt)} onChange={() => toggleBanking(opt)} />
                  </div>
                ))}
              </div>
              {/* Preferred Provider — only if at least one selected */}
              {draft.banking.providers.length > 0 && (
                <div className="mt-4">
                  <p className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Preferred Provider</p>
                  <div className="flex flex-wrap gap-4">
                    {draft.banking.providers.map((pv) => (
                      <Radio key={pv} id={`pref-${pv}`} name="preferredProvider" value={pv} label={pv}
                        checked={draft.banking.preferredProvider === pv}
                        onChange={() => setDraft((p) => ({ ...p, banking: { ...p.banking, preferredProvider: pv } }))} />
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex flex-wrap gap-2 mb-3">
                {display.banking.providers.length > 0
                  ? display.banking.providers.map((p) => (
                    <span key={p} className="px-3 py-1.5 text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg">{p}</span>
                  ))
                  : <span className="text-sm text-gray-400 dark:text-gray-600 italic font-normal">None selected</span>}
              </div>
              {display.banking.preferredProvider && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Preferred Provider</label>
                  <span className="px-3 py-1.5 text-sm font-semibold bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-400 rounded-lg">
                    {display.banking.preferredProvider}
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        <div className="h-px bg-gray-200 dark:bg-gray-700" />

        {/* Additional Services */}
        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Additional Services</p>
          {editing ? (
            <div className="grid grid-cols-2 gap-2">
              {ADDITIONAL_SERVICE_OPTIONS.map((opt) => (
                <div key={opt} className="p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <Checkbox label={opt} checked={draft.additionalServices.includes(opt)} onChange={() => toggleService(opt)} />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {display.additionalServices.length > 0
                ? display.additionalServices.map((s) => (
                  <span key={s} className="px-3 py-1.5 text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg">{s}</span>
                ))
                : <span className="text-sm text-gray-400 dark:text-gray-600 italic font-normal">None selected</span>}
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">Service Selection Summary</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Banking Services: {display.banking.providers.length} selected · Additional Services: {display.additionalServices.length} selected
          </p>
        </div>
      </div>
    </SectionCard>
  );
}

// ─── Section: Billing ─────────────────────────────────────────────────────────

function BillingSection({ data, onSave }: { data: RegistrationDetail["billing"]; onSave: (d: RegistrationDetail["billing"]) => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(data);
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const set = (k: keyof Omit<typeof draft, "address">) => (v: string) => { setTouched(true); setDraft((p) => ({ ...p, [k]: v })); };
  const setAddr = (k: keyof typeof draft.address) => (v: string) => { setTouched(true); setDraft((p) => ({ ...p, address: { ...p.address, [k]: v } })); };
  const display = editing ? draft : data;

  const errors = {
    name: !draft.name.trim() ? "Company/client name is required" : "",
    email: !draft.email.trim() ? "Email is required" : !isValidEmail(draft.email) ? "Enter a valid email address" : "",
    phone: !draft.phone.trim() ? "Phone number is required" : "",
    street: !draft.address.street.trim() ? "Street address is required" : "",
    city: !draft.address.city.trim() ? "City is required" : "",
    postalCode: !draft.address.postalCode.trim() ? "Postal code is required" : "",
    country: !draft.address.country.trim() ? "Country is required" : "",
  };
  const isValid = Object.values(errors).every((e) => !e);

  const handleSave = async () => {
    setTouched(true);
    if (!isValid) return;
    setSaving(true); setSaveError("");
    try { await onSave(draft); setEditing(false); }
    catch (err) { setSaveError(err instanceof Error ? err.message : "Save failed"); }
    finally { setSaving(false); }
  };

  return (
    <SectionCard icon={LuCreditCard} title="Billing Information" subtitle="Invoice and payment details"
      editing={editing}
      onEdit={() => { setDraft(data); setTouched(false); setSaveError(""); setEditing(true); }}
      onSave={handleSave}
      onCancel={() => setEditing(false)}
      saveDisabled={editing && touched && !isValid}
      saving={saving} saveError={saveError}
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          <Field label="Company / Client Name" value={display.name} editing={editing} onChange={set("name")} required error={touched ? errors.name : ""} />
          <Field label="Email" type="email" value={display.email} editing={editing} onChange={set("email")} required error={touched ? errors.email : ""} />
          <Field label="Phone" type="tel" value={display.phone} editing={editing} onChange={set("phone")} required error={touched ? errors.phone : ""} />
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
              Payment Method{editing && <span className="text-error-500 ml-0.5">*</span>}
            </label>
            {editing ? (
              <select value={draft.paymentMethod} onChange={(e) => { setTouched(true); setDraft((p) => ({ ...p, paymentMethod: e.target.value })); }} className={inputCls}>
                <option>Credit Card</option><option>Bank Transfer</option><option>PayPal</option>
              </select>
            ) : (
              <p className="text-sm font-medium text-gray-900 dark:text-white py-1">{display.paymentMethod || "—"}</p>
            )}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Billing Address</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            <Field label="Street Address" value={display.address.street} editing={editing} onChange={setAddr("street")} fullWidth required error={touched ? errors.street : ""} />
            <Field label="City" value={display.address.city} editing={editing} onChange={setAddr("city")} required error={touched ? errors.city : ""} />
            <Field label="State / Province" value={display.address.state} editing={editing} onChange={setAddr("state")} />
            <Field label="Postal Code" value={display.address.postalCode} editing={editing} onChange={setAddr("postalCode")} required error={touched ? errors.postalCode : ""} />
            <Field label="Country" value={display.address.country} editing={editing} onChange={setAddr("country")} required error={touched ? errors.country : ""} />
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

// ─── Section: Compliance ──────────────────────────────────────────────────────

function ComplianceSection({ data }: { data: RegistrationDetail["complianceAccepted"] }) {
  return (
    <SectionCard icon={LuShield} title="Compliance Declaration" subtitle="Legal acknowledgement"
      editing={false} onEdit={() => {}} onSave={() => {}} onCancel={() => {}} canEdit={false}
    >
      {data.isAccepted ? (
        <div className="flex items-start gap-4 p-4 rounded-xl bg-success-50 dark:bg-success-500/10 border border-success-200 dark:border-success-500/20">
          <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-success-100 dark:bg-success-500/20">
            <LuCheck className="w-4 h-4 text-success-600 dark:text-success-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-success-800 dark:text-success-300">Compliance Declaration Accepted</p>
            <p className="text-xs text-success-700 dark:text-success-400 mt-1">The applicant has read and agreed to the compliance declaration.</p>
            {data.timestamp && <p className="text-xs text-success-600 dark:text-success-500 mt-2">Accepted on {formatTimestamp(data.timestamp)}</p>}
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-4 p-4 rounded-xl bg-warning-50 dark:bg-warning-500/10 border border-warning-200 dark:border-warning-500/20">
          <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-warning-100 dark:bg-warning-500/20">
            <LuTriangleAlert className="w-4 h-4 text-warning-600 dark:text-warning-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-warning-800 dark:text-warning-300">Compliance Not Yet Accepted</p>
            <p className="text-xs text-warning-700 dark:text-warning-400 mt-1">The applicant has not yet accepted the compliance declaration.</p>
          </div>
        </div>
      )}
      <div className="mt-4 space-y-2">
        {["Money laundering or terrorist financing", "Illegal trading of goods or services", "Activities prohibited under Hong Kong regulations", "Tax evasion or fraudulent activities"].map((item) => (
          <div key={item} className="flex items-center gap-2.5 text-sm text-gray-600 dark:text-gray-400">
            <LuX className="w-3.5 h-3.5 text-error-500 flex-shrink-0" /> {item}
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gray-200 dark:bg-gray-700" />
        <div className="space-y-2">
          <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
          <div className="h-5 w-40 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded" />
            <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function RegistrationDetailContent({ id }: { id: string }) {
  const router = useRouter();
  const { can } = useModulePermission();
  const canUpdate = can("UPDATE");

  const [reg, setReg] = useState<RegistrationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingStatus, setEditingStatus] = useState(false);
  const [draftStatus, setDraftStatus] = useState<RegistrationDetail["status"]>("pending");
  const [savingStatus, setSavingStatus] = useState(false);

  // Fetch registration detail from backend
  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await authFetch(`${API_BASE_URL}/api/v1/registrations/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Registration not found");
        const mapped = mapApiToUi(data.registration as ApiRegistrationDetail);
        setReg(mapped);
        setDraftStatus(mapped.status);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load registration");
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  const handleStatusSave = async () => {
    if (!reg || draftStatus === reg.status) { setEditingStatus(false); return; }
    setSavingStatus(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/v1/registrations/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: draftStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update status");
      setReg((r) => r ? { ...r, status: draftStatus } : r);
      setEditingStatus(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setSavingStatus(false);
    }
  };

  // ── PATCH helper ──────────────────────────────────────────────────────────
  const patchRegistration = async (body: Record<string, unknown>) => {
    const res = await authFetch(`${API_BASE_URL}/api/v1/registrations/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to save changes");
    return data;
  };

  // Serialise a Person to the nested shape the PATCH API expects
  const personToApiShape = (p: Person) => ({
    ...(isNaN(Number(p.id)) ? {} : { id: Number(p.id) }),
    type: p.type,
    roles: p.roles,
    fullName: p.fullName || null,
    companyName: p.companyName || null,
    countryOfIncorporation: p.countryOfIncorporation || null,
    registrationNumber: p.registrationNumber || null,
    nationality: p.nationality || null,
    email: p.email || null,
    phone: p.phone || null,
    residentialAddress: {
      street: p.residentialAddress.street || null,
      city: p.residentialAddress.city || null,
      state: p.residentialAddress.state || null,
      postalCode: p.residentialAddress.postalCode || null,
      country: p.residentialAddress.country || null,
    },
    shareholding: {
      shares: p.shareholding.shares,
      percentage: p.shareholding.percentage,
    },
  });

  const updatePersons = (p: Person[]) => setReg((r) => r ? { ...r, persons: p } : r);

  // Shared draft for Shareholders + Directors sections so they see each other's changes while editing
  const [sharedPersonsDraft, setSharedPersonsDraft] = useState<Person[] | null>(null);

  if (loading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <LuArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Registration Detail</h1>
        </div>
        <div className="p-6 bg-error-50 dark:bg-error-500/10 border border-error-200 dark:border-error-500/20 rounded-xl flex items-center gap-3">
          <LuCircleAlert className="w-5 h-5 text-error-500 flex-shrink-0" />
          <p className="text-sm font-medium text-error-700 dark:text-error-400">{error}</p>
          <button onClick={() => router.back()} className="ml-auto text-xs font-medium text-error-600 dark:text-error-400 hover:underline flex-shrink-0">Go back</button>
        </div>
      </div>
    );
  }

  if (!reg) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <LuArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold font-mono text-gray-900 dark:text-white">{reg.id.slice(0, 8)}…</h1>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${getStatusStyle(reg.status)}`}>
                {formatStatus(reg.status)}
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Submitted {formatTimestamp(reg.submittedDate)} · Assigned to <span className="font-medium">{reg.assignedTo}</span>
            </p>
          </div>
        </div>

        {canUpdate && (
          <div className="flex items-center gap-2">
            {editingStatus ? (
              <>
                <select value={draftStatus} onChange={(e) => setDraftStatus(e.target.value as RegistrationDetail["status"])}
                  className="px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all">
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
                <button onClick={() => setEditingStatus(false)} disabled={savingStatus} className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors disabled:opacity-50">
                  <LuX className="w-4 h-4" />
                </button>
                <button onClick={handleStatusSave} disabled={savingStatus}
                  className="px-3 py-2 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2">
                  {savingStatus && <LuRefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Update Status
                </button>
              </>
            ) : (
              <button onClick={() => { setDraftStatus(reg.status); setEditingStatus(true); }}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-brand-300 hover:text-brand-600 dark:hover:border-brand-600 dark:hover:text-brand-400 rounded-lg transition-colors">
                <LuPencil className="w-4 h-4" /> Update Status
              </button>
            )}
          </div>
        )}
      </div>

      {/* Sections */}
      <ApplicantSection
        data={reg.applicant}
        onSave={async (d) => {
          await patchRegistration({
            applicant: {
              firstName: d.firstName,
              lastName: d.lastName,
              email: d.email,
              phone: d.phone,
            },
          });
          setReg((r) => r ? { ...r, applicant: d } : r);
        }}
      />
      <CompanySection
        data={reg.company}
        onSave={async (d) => {
          await patchRegistration({
            company: {
              countryOfIncorporation: d.countryOfIncorporation,
              type: d.type,
              proposedCompanyName: d.proposedCompanyName,
              alternativeNames: d.alternativeNames,
              natureOfBusiness: d.natureOfBusiness,
              businessScope: d.businessScope,
              businessScopeDescription: d.businessScopeDescription,
            },
          });
          setReg((r) => r ? { ...r, company: d } : r);
        }}
      />

      <ShareCapitalSection
        data={reg.shareCapital}
        persons={reg.persons}
        onSave={async (d, p) => {
          await patchRegistration({
            shareCapital: {
              currency: d.currency,
              totalAmount: d.totalAmount,
              totalShares: d.totalShares,
            },
            persons: p.map(personToApiShape),
          });
          setReg((r) => r ? { ...r, shareCapital: d } : r);
          updatePersons(p);
        }}
        onPersonsChange={updatePersons}
      />

      <ShareholdersSection
        persons={reg.persons}
        totalShares={reg.shareCapital.totalShares}
        sharedDraft={sharedPersonsDraft}
        onSharedDraftChange={setSharedPersonsDraft}
        onSave={async (p) => {
          await patchRegistration({ persons: p.map(personToApiShape) });
          updatePersons(p);
          setSharedPersonsDraft(null);
        }}
      />
      <DirectorsSection
        persons={reg.persons}
        totalShares={reg.shareCapital.totalShares}
        sharedDraft={sharedPersonsDraft}
        onSharedDraftChange={setSharedPersonsDraft}
        onSave={async (p) => {
          await patchRegistration({ persons: p.map(personToApiShape) });
          updatePersons(p);
          setSharedPersonsDraft(null);
        }}
      />
      <ServicesSection
        data={reg.services}
        onSave={async (d) => {
          await patchRegistration({
            services: {
              banking: {
                providers: d.banking.providers,
                preferredProvider: d.banking.preferredProvider,
              },
              additionalServices: d.additionalServices,
            },
          });
          setReg((r) => r ? { ...r, services: d } : r);
        }}
      />
      <BillingSection
        data={reg.billing}
        onSave={async (d) => {
          await patchRegistration({
            billing: {
              name: d.name,
              email: d.email,
              phone: d.phone,
              address: {
                street: d.address.street,
                city: d.address.city,
                state: d.address.state,
                postalCode: d.address.postalCode,
                country: d.address.country,
              },
              paymentMethod: d.paymentMethod,
            },
          });
          setReg((r) => r ? { ...r, billing: d } : r);
        }}
      />
      <ComplianceSection data={reg.complianceAccepted} />
    </div>
  );
}

export default function RegistrationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  return (
    <PageAccessGuard module="REGISTRATIONS">
      <ModulePermissionProvider module="REGISTRATIONS">
        <RegistrationDetailContent id={id} />
      </ModulePermissionProvider>
    </PageAccessGuard>
  );
}
