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
} from "react-icons/lu";
import PageAccessGuard from "@/components/common/PageAccessGuard";
import {
  ModulePermissionProvider,
  useModulePermission,
} from "@/context/PermissionContext";

// ─── Types ──────────────────────────────────────────────────────────────────

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

// ─── Mock Data ───────────────────────────────────────────────────────────────

const mockRegistration: RegistrationDetail = {
  id: "REG-001",
  status: "pending",
  assignedTo: "Sarah Johnson",
  submittedDate: "2026-01-25",
  lastUpdated: "2026-01-27",
  applicant: {
    firstName: "Abbas",
    lastName: "Ali",
    email: "abbas@swiftnine.com",
    phone: "+65-23874837467",
  },
  company: {
    countryOfIncorporation: "Hong Kong",
    type: "Private Limited Company",
    proposedCompanyName: "Blabla",
    alternativeNames: ["Alt Name 1", "", ""],
    natureOfBusiness: ["E-Commerce"],
    businessScope: "Trading",
    businessScopeDescription:
      "International trading of goods and services across multiple markets.",
  },
  shareCapital: {
    currency: "HKD",
    totalAmount: 10000,
    totalShares: 10000,
  },
  persons: [
    {
      id: "person-001",
      type: "individual",
      roles: ["shareholder", "director"],
      fullName: "Abbas",
      companyName: "",
      countryOfIncorporation: null,
      registrationNumber: null,
      nationality: "Hong Kong",
      email: "abbas@swiftnine.com",
      phone: "+852-839847983475",
      residentialAddress: {
        street: "jhsdgsyaugd",
        city: "Lahore",
        state: "uyudfisg",
        postalCode: "78498",
        country: "Hong Kong",
      },
      shareholding: { shares: 10000, percentage: 100 },
      documents: {
        passport: { key: "1", url: "#", fileName: "passport.png", mimeType: "image/png", size: 1058131 },
        selfie: { key: "2", url: "#", fileName: "selfie.png", mimeType: "image/png", size: 902184 },
        addressProof: { key: "3", url: "#", fileName: "address_proof.jpg", mimeType: "image/jpeg", size: 7036831 },
        certificate_of_incorporation: null,
        business_license: null,
        others: null,
      },
    },
    {
      id: "person-002",
      type: "individual",
      roles: ["director"],
      fullName: "Sarah Johnson",
      companyName: "",
      countryOfIncorporation: null,
      registrationNumber: null,
      nationality: "United States",
      email: "sarah@example.com",
      phone: "+1-555-0100",
      residentialAddress: { street: "123 Main St", city: "New York", state: "NY", postalCode: "10001", country: "USA" },
      shareholding: { shares: 0, percentage: 0 },
      documents: {
        passport: null, selfie: null, addressProof: null,
        certificate_of_incorporation: null, business_license: null, others: null,
      },
    },
  ],
  services: {
    banking: { providers: ["Airwallex", "Payoneer"], preferredProvider: "Airwallex" },
    additionalServices: ["Annual Secretarial Service", "Accounting & Bookkeeping"],
  },
  billing: {
    name: "Abbas Ali",
    email: "abbas@swiftnine.com",
    phone: "+852-7598475885",
    address: { street: "hsdugsuyd jhsgdjhs jsgdhj", city: "Lahore", state: "hdsuhdui", postalCode: "785985", country: "Hong Kong" },
    paymentMethod: "Credit Card",
  },
  complianceAccepted: { isAccepted: true, timestamp: "1771413297342" },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatTimestamp(ts: string) {
  const n = parseInt(ts, 10);
  if (isNaN(n)) return ts;
  return new Date(n).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
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

function SectionCard({
  icon: Icon, title, subtitle, editing, onEdit, onSave, onCancel, children, canEdit = true, extraHeader,
}: {
  icon: React.ElementType; title: string; subtitle?: string;
  editing: boolean; onEdit: () => void; onSave: () => void; onCancel: () => void;
  children: React.ReactNode; canEdit?: boolean; extraHeader?: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-theme-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 gap-3 flex-wrap">
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
                <button onClick={onCancel} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <LuX className="w-3.5 h-3.5" /> Cancel
                </button>
                <button onClick={onSave} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors">
                  <LuCheck className="w-3.5 h-3.5" /> Save
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
  label, value, editing, onChange, type = "text", fullWidth = false, as = "input",
}: {
  label: string; value: string; editing: boolean; onChange: (v: string) => void;
  type?: string; fullWidth?: boolean; as?: "input" | "textarea";
}) {
  return (
    <div className={fullWidth ? "col-span-full" : ""}>
      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">{label}</label>
      {editing ? (
        as === "textarea" ? (
          <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} className={inputCls + " resize-none"} />
        ) : (
          <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className={inputCls} />
        )
      ) : (
        <p className="text-sm font-medium text-gray-900 dark:text-white py-1">
          {value || <span className="text-gray-400 dark:text-gray-600 font-normal italic">—</span>}
        </p>
      )}
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

function StatusBadge({ status }: { status: RegistrationDetail["status"] }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${getStatusStyle(status)}`}>
      {formatStatus(status)}
    </span>
  );
}

// ─── Allocation Progress Bar ─────────────────────────────────────────────────

function AllocationBar({ allocated, total, shareholders }: { allocated: number; total: number; shareholders: number }) {
  const pct = total > 0 ? Math.min((allocated / total) * 100, 100) : 0;
  const exact100 = Math.round(pct) === 100 && allocated === total;
  const over = allocated > total;

  const barColor = over
    ? "bg-error-500"
    : exact100
      ? "bg-success-500"
      : pct >= 50
        ? "bg-warning-500"
        : "bg-error-500";

  const labelColor = over
    ? "text-error-600 dark:text-error-400"
    : exact100
      ? "text-success-600 dark:text-success-400"
      : pct >= 50
        ? "text-warning-600 dark:text-warning-400"
        : "text-error-600 dark:text-error-400";

  const bgColor = over
    ? "bg-error-50 dark:bg-error-500/10 border-error-200 dark:border-error-500/20"
    : exact100
      ? "bg-success-50 dark:bg-success-500/10 border-success-200 dark:border-success-500/20"
      : pct >= 50
        ? "bg-warning-50 dark:bg-warning-500/10 border-warning-200 dark:border-warning-500/20"
        : "bg-error-50 dark:bg-error-500/10 border-error-200 dark:border-error-500/20";

  return (
    <div className={`mt-5 p-4 rounded-xl border ${bgColor} transition-all`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Share Allocation</span>
        <span className={`text-xs font-bold ${labelColor}`}>
          {allocated.toLocaleString()} / {total.toLocaleString()} shares ({pct.toFixed(1)}%)
        </span>
      </div>
      <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <div className="flex items-center justify-between mt-2">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {shareholders} shareholder{shareholders !== 1 ? "s" : ""}
        </p>
        {!exact100 && !over && (
          <p className={`text-xs font-medium ${labelColor}`}>
            {(total - allocated).toLocaleString()} shares unallocated
          </p>
        )}
        {over && (
          <p className="text-xs font-medium text-error-600 dark:text-error-400 flex items-center gap-1">
            <LuTriangleAlert className="w-3 h-3" /> Over-allocated by {(allocated - total).toLocaleString()} shares
          </p>
        )}
        {exact100 && (
          <p className="text-xs font-medium text-success-600 dark:text-success-400 flex items-center gap-1">
            <LuCheck className="w-3 h-3" /> Fully allocated
          </p>
        )}
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
    documents: {
      passport: null, selfie: null, addressProof: null,
      certificate_of_incorporation: null, business_license: null, others: null,
    },
  };
}

// ─── Share Capital: Add Shareholder dropdown (from non-shareholders) ──────────
// Lists all persons who don't yet have the "shareholder" role.

function ShareCapitalAddDropdown({
  allPersons,
  totalShares,
  remaining,
  onAdd,
}: {
  allPersons: Person[];
  totalShares: number;
  remaining: number;
  onAdd: (personId: string, shares: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [sharesInput, setSharesInput] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  // Only show persons who already have the shareholder role but have 0 shares allocated
  const candidates = allPersons.filter(
    (p) => p.roles.includes("shareholder") && p.shareholding.shares === 0
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const maxShares = remaining;
  const minShares = Math.max(1, Math.ceil(totalShares * 0.01));

  const handleAdd = () => {
    const shares = parseInt(sharesInput, 10);
    if (!selectedId || isNaN(shares) || shares < minShares || shares > maxShares) return;
    onAdd(selectedId, shares);
    setOpen(false);
    setSelectedId("");
    setSharesInput("");
  };

  if (remaining <= 0) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors"
      >
        <LuPlus className="w-3.5 h-3.5" />
        Add Shareholder
        <LuChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 w-72 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-theme-lg p-4 space-y-3">
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Assign shareholder from existing persons</p>
          {candidates.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-gray-500 italic py-1">
              All current shareholders are already in the distribution. Add more shareholders in the Shareholders section first.
            </p>
          ) : (
            <>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Select Person</label>
                <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className={inputCls}>
                  <option value="">— choose —</option>
                  {candidates.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName || p.companyName} ({p.roles.join(", ") || "no role"})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Shares to assign{" "}
                  <span className="text-gray-400 dark:text-gray-500">
                    (min {minShares.toLocaleString()} · max {maxShares.toLocaleString()})
                  </span>
                </label>
                <input
                  type="number"
                  value={sharesInput}
                  onChange={(e) => setSharesInput(e.target.value)}
                  min={minShares}
                  max={maxShares}
                  placeholder={String(Math.floor(maxShares / 2))}
                  className={inputCls}
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setOpen(false)} className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  Cancel
                </button>
                <button
                  onClick={handleAdd}
                  disabled={!selectedId || !sharesInput || parseInt(sharesInput) < minShares || parseInt(sharesInput) > maxShares}
                  className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-brand-500 hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  Add
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Shareholders section: Add dropdown (from directors or new) ───────────────

function AddPersonDropdown({
  label,
  candidates,        // persons that can be quick-added (directors for shareholders, shareholders for directors)
  candidateRole,     // the role to grant when quick-adding ("shareholder" | "director")
  newRole,           // role to set on a brand-new person
  onAddExisting,     // add role to an existing person
  onAddNew,          // add a completely new person
}: {
  label: string;
  candidates: Person[];
  candidateRole: string;
  newRole: string;
  onAddExisting: (personId: string) => void;
  onAddNew: (person: Person) => void;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [selectedId, setSelectedId] = useState("");
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleAdd = () => {
    if (mode === "existing") {
      if (!selectedId) return;
      onAddExisting(selectedId);
    } else {
      if (!newName.trim()) return;
      const p = blankPerson(newRole);
      onAddNew({ ...p, fullName: newName.trim(), email: newEmail.trim() });
    }
    setOpen(false);
    setSelectedId("");
    setNewName("");
    setNewEmail("");
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors"
      >
        <LuPlus className="w-3.5 h-3.5" />
        {label}
        <LuChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-theme-lg p-4 space-y-3">
          {/* Mode tabs */}
          <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 text-xs font-medium">
            <button
              onClick={() => setMode("existing")}
              className={`flex-1 py-1.5 transition-colors ${mode === "existing" ? "bg-brand-500 text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"}`}
            >
              From {candidateRole === "director" ? "Directors" : "Shareholders"}
            </button>
            <button
              onClick={() => setMode("new")}
              className={`flex-1 py-1.5 transition-colors ${mode === "new" ? "bg-brand-500 text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"}`}
            >
              Add New
            </button>
          </div>

          {mode === "existing" ? (
            candidates.length === 0 ? (
              <p className="text-xs text-gray-500 dark:text-gray-400 italic text-center py-2">
                No {candidateRole === "director" ? "directors" : "shareholders"} available to add.
              </p>
            ) : (
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Select from {candidateRole === "director" ? "Directors" : "Shareholders"}
                </label>
                <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className={inputCls}>
                  <option value="">— choose —</option>
                  {candidates.map((p) => (
                    <option key={p.id} value={p.id}>{p.fullName || p.companyName}</option>
                  ))}
                </select>
              </div>
            )
          ) : (
            <div className="space-y-2">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Full Name *</label>
                <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. John Smith" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Email</label>
                <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="email@example.com" className={inputCls} />
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button onClick={() => setOpen(false)} className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={mode === "existing" ? !selectedId : !newName.trim()}
              className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-brand-500 hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Section: Applicant Information ──────────────────────────────────────────

function ApplicantSection({ data, onSave }: { data: RegistrationDetail["applicant"]; onSave: (d: RegistrationDetail["applicant"]) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(data);
  const set = (k: keyof typeof draft) => (v: string) => setDraft((p) => ({ ...p, [k]: v }));

  return (
    <SectionCard icon={LuUser} title="Applicant Information" subtitle="Primary contact details"
      editing={editing}
      onEdit={() => { setDraft(data); setEditing(true); }}
      onSave={() => { onSave(draft); setEditing(false); }}
      onCancel={() => setEditing(false)}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
        <Field label="First Name" value={editing ? draft.firstName : data.firstName} editing={editing} onChange={set("firstName")} />
        <Field label="Last Name" value={editing ? draft.lastName : data.lastName} editing={editing} onChange={set("lastName")} />
        <Field label="Email" type="email" value={editing ? draft.email : data.email} editing={editing} onChange={set("email")} />
        <Field label="Phone" type="tel" value={editing ? draft.phone : data.phone} editing={editing} onChange={set("phone")} />
      </div>
    </SectionCard>
  );
}

// ─── Section: Company Information ────────────────────────────────────────────

function CompanySection({ data, onSave }: { data: RegistrationDetail["company"]; onSave: (d: RegistrationDetail["company"]) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(data);
  const set = (k: keyof typeof draft) => (v: string) => setDraft((p) => ({ ...p, [k]: v }));
  const display = editing ? draft : data;

  return (
    <SectionCard icon={LuBuilding2} title="Company Information" subtitle="Incorporation details"
      editing={editing}
      onEdit={() => { setDraft(data); setEditing(true); }}
      onSave={() => { onSave(draft); setEditing(false); }}
      onCancel={() => setEditing(false)}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
        <Field label="Country of Incorporation" value={display.countryOfIncorporation} editing={editing} onChange={set("countryOfIncorporation")} />
        <Field label="Company Type" value={display.type} editing={editing} onChange={set("type")} />
        <Field label="Proposed Company Name" value={display.proposedCompanyName} editing={editing} onChange={set("proposedCompanyName")} />
        <Field label="Business Scope" value={display.businessScope} editing={editing} onChange={set("businessScope")} />

        <div className="col-span-full">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Alternative Names</label>
          {editing ? (
            <div className="grid grid-cols-3 gap-3">
              {draft.alternativeNames.map((name, i) => (
                <input key={i} type="text" value={name} placeholder={`Alternative name ${i + 1}`}
                  onChange={(e) => { const u = [...draft.alternativeNames]; u[i] = e.target.value; setDraft((p) => ({ ...p, alternativeNames: u })); }}
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
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Nature of Business</label>
          <div className="flex flex-wrap gap-2">
            {display.natureOfBusiness.map((b, i) => (
              <span key={i} className="px-2.5 py-1 text-xs font-medium bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-400 rounded-md">{b}</span>
            ))}
          </div>
        </div>

        <Field label="Business Scope Description" value={display.businessScopeDescription} editing={editing} onChange={set("businessScopeDescription")} fullWidth as="textarea" />
      </div>
    </SectionCard>
  );
}

// ─── Section: Share Capital ───────────────────────────────────────────────────

function ShareCapitalSection({
  data, persons, onSave, onPersonsChange,
}: {
  data: RegistrationDetail["shareCapital"];
  persons: Person[];
  onSave: (d: RegistrationDetail["shareCapital"]) => void;
  onPersonsChange: (p: Person[]) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(data);
  const [draftPersons, setDraftPersons] = useState(persons);

  const display = editing ? draft : data;
  const displayPersons = editing ? draftPersons : persons;
  const shareholders = displayPersons.filter((p) => p.roles.includes("shareholder"));
  const allocated = shareholders.reduce((s, p) => s + p.shareholding.shares, 0);
  const remaining = display.totalShares - allocated;

  // Update a shareholder's shares and recalculate percentages
  const updateShares = (id: string, shares: number) => {
    const clamped = Math.max(0, shares);
    const updated = draftPersons.map((p) =>
      p.id === id && p.roles.includes("shareholder")
        ? { ...p, shareholding: { shares: clamped, percentage: 0 } }
        : p
    );
    setDraftPersons(recalcPercentages(updated, draft.totalShares));
  };

  // Re-add a shareholder (who already has the role but 0 shares) to the distribution
  const addShareholder = (personId: string, shares: number) => {
    const updated = draftPersons.map((p) =>
      p.id === personId ? { ...p, shareholding: { shares, percentage: 0 } } : p
    );
    setDraftPersons(recalcPercentages(updated, draft.totalShares));
  };

  // Zero out shares for the removed person but keep the shareholder role so they can be re-added
  const removeShareholder = (id: string) => {
    const updated = draftPersons.map((p) =>
      p.id === id ? { ...p, shareholding: { shares: 0, percentage: 0 } } : p
    );
    setDraftPersons(recalcPercentages(updated, draft.totalShares));
  };

  const canSave = remaining === 0 && allocated === draft.totalShares;

  return (
    <SectionCard
      icon={LuFileChartPie}
      title="Share Capital"
      subtitle="Capital structure & shareholder distribution"
      editing={editing}
      onEdit={() => { setDraft(data); setDraftPersons(persons); setEditing(true); }}
      onSave={() => {
        if (!canSave) return;
        onSave(draft);
        onPersonsChange(draftPersons);
        setEditing(false);
      }}
      onCancel={() => setEditing(false)}
    >
      {/* Capital fields */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Currency</label>
          {editing ? (
            <select value={draft.currency} onChange={(e) => setDraft((p) => ({ ...p, currency: e.target.value }))} className={inputCls}>
              <option>HKD</option><option>USD</option><option>SGD</option>
            </select>
          ) : (
            <p className="text-sm font-medium text-gray-900 dark:text-white py-1">{display.currency}</p>
          )}
        </div>
        <Field label="Total Share Capital" type="number" value={String(display.totalAmount)} editing={editing}
          onChange={(v) => setDraft((p) => ({ ...p, totalAmount: isNaN(Number(v)) ? p.totalAmount : Number(v) }))} />
        <Field label="Total Shares Issued" type="number" value={String(display.totalShares)} editing={editing}
          onChange={(v) => {
            const n = isNaN(Number(v)) ? draft.totalShares : Number(v);
            setDraft((p) => ({ ...p, totalShares: n }));
            setDraftPersons((prev) => recalcPercentages(prev, n));
          }} />
      </div>

      {/* Shareholder share distribution table */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Shareholder Distribution
          </p>
          {editing && (
            <ShareCapitalAddDropdown
              allPersons={draftPersons}
              totalShares={draft.totalShares}
              remaining={remaining}
              onAdd={addShareholder}
            />
          )}
        </div>

        {shareholders.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-600 italic py-2">No shareholders added yet.</p>
        ) : (
          <div className="space-y-2">
            {shareholders.map((person) => {
              const pct = display.totalShares > 0
                ? ((person.shareholding.shares / display.totalShares) * 100).toFixed(2)
                : "0.00";
              const minShares = Math.max(1, Math.ceil(display.totalShares * 0.01));
              const isOnlyShareholder = shareholders.length === 1;

              return (
                <div key={person.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                  {/* Avatar */}
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-500/20 flex items-center justify-center text-xs font-bold text-brand-600 dark:text-brand-400">
                    {(person.fullName || person.companyName || "?")[0].toUpperCase()}
                  </div>

                  {/* Name + role */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {person.fullName || person.companyName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{person.type}</p>
                  </div>

                  {/* Shares input or display */}
                  {editing ? (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="w-32">
                        <input
                          type="number"
                          value={person.shareholding.shares}
                          min={minShares}
                          max={display.totalShares}
                          onChange={(e) => updateShares(person.id, parseInt(e.target.value, 10) || 0)}
                          className={inputCls + " text-center"}
                        />
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 w-12 text-right font-medium">
                        {((person.shareholding.shares / display.totalShares) * 100).toFixed(1)}%
                      </span>
                      {!isOnlyShareholder && (
                        <button
                          onClick={() => removeShareholder(person.id)}
                          className="p-1.5 text-error-500 hover:text-error-600 hover:bg-error-50 dark:hover:bg-error-500/10 rounded-lg transition-colors"
                          title="Remove shareholder"
                        >
                          <LuTrash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                          {person.shareholding.shares.toLocaleString()}
                        </p>
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

        {/* Remaining row (edit mode only) */}
        {editing && remaining !== 0 && (
          <div className={`mt-2 flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium ${remaining > 0 ? "bg-warning-50 dark:bg-warning-500/10 text-warning-700 dark:text-warning-400" : "bg-error-50 dark:bg-error-500/10 text-error-700 dark:text-error-400"}`}>
            <span className="flex items-center gap-1.5">
              <LuTriangleAlert className="w-3.5 h-3.5" />
              {remaining > 0 ? `${remaining.toLocaleString()} shares unallocated — must reach 100% to save` : `Over-allocated by ${Math.abs(remaining).toLocaleString()} shares`}
            </span>
            <span>{Math.abs(remaining).toLocaleString()} shares</span>
          </div>
        )}
      </div>

      {/* Allocation bar */}
      <AllocationBar allocated={allocated} total={display.totalShares} shareholders={shareholders.length} />

      {/* Save blocked hint */}
      {editing && !canSave && (
        <p className="mt-3 text-xs text-center text-warning-600 dark:text-warning-400 font-medium">
          Allocate exactly 100% of shares across all shareholders before saving.
        </p>
      )}
    </SectionCard>
  );
}

// ─── Person detail card (used in Shareholders & Directors) ───────────────────

function PersonCard({
  person, index, editing, totalShares, onPersonChange, onRemove, canRemove,
}: {
  person: Person; index: number; editing: boolean; totalShares: number;
  onPersonChange: (p: Person) => void; onRemove: () => void; canRemove: boolean;
}) {
  const set = (k: keyof Person) => (v: string) => onPersonChange({ ...person, [k]: v });
  const setAddr = (k: keyof Person["residentialAddress"]) => (v: string) =>
    onPersonChange({ ...person, residentialAddress: { ...person.residentialAddress, [k]: v } });

  const docLabels: Record<string, string> = {
    passport: "Passport / ID", selfie: "Passport Holding Selfie", addressProof: "Proof of Address",
    certificate_of_incorporation: "Certificate of Incorporation", business_license: "Business License", others: "Other Documents",
  };
  const docs = Object.entries(person.documents).filter(([, v]) => v !== null).map(([k, v]) => ({ label: docLabels[k] || k, doc: v as DocumentFile }));

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-visible">
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/60 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-500/20 flex items-center justify-center text-xs font-bold text-brand-600 dark:text-brand-400">
            {index + 1}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {person.fullName || person.companyName || `Person ${index + 1}`}
            </p>
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
            <button
              onClick={onRemove}
              disabled={!canRemove}
              title={canRemove ? "Remove" : "At least one entry must remain"}
              className="p-1.5 text-error-500 hover:text-error-600 hover:bg-error-50 dark:hover:bg-error-500/10 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              <LuTrash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-5">
        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Personal Information</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            <Field label="Full Name" value={person.fullName} editing={editing} onChange={set("fullName")} />
            <Field label="Nationality" value={person.nationality} editing={editing} onChange={set("nationality")} />
            <Field label="Email" type="email" value={person.email} editing={editing} onChange={set("email")} />
            <Field label="Phone" type="tel" value={person.phone} editing={editing} onChange={set("phone")} />
          </div>
        </div>

        {/* Shareholding display (read-only in this section, managed in Share Capital) */}
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
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{person.shareholding.percentage.toFixed(2)}%</p>
              </div>
              {totalShares > 0 && (
                <>
                  <div className="w-px h-8 bg-gray-200 dark:bg-gray-700" />
                  <div className="flex-1">
                    <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-500 rounded-full" style={{ width: `${person.shareholding.percentage}%` }} />
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
            <Field label="Street Address" value={person.residentialAddress.street} editing={editing} onChange={setAddr("street")} fullWidth />
            <Field label="City" value={person.residentialAddress.city} editing={editing} onChange={setAddr("city")} />
            <Field label="State / Province" value={person.residentialAddress.state} editing={editing} onChange={setAddr("state")} />
            <Field label="Postal Code" value={person.residentialAddress.postalCode} editing={editing} onChange={setAddr("postalCode")} />
            <Field label="Country" value={person.residentialAddress.country} editing={editing} onChange={setAddr("country")} />
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

function ShareholdersSection({ persons, totalShares, onSave }: { persons: Person[]; totalShares: number; onSave: (p: Person[]) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(persons);

  const draftShareholders = draft.filter((p) => p.roles.includes("shareholder"));
  const displayPersons = editing ? draft : persons;
  const displayShareholders = displayPersons.filter((p) => p.roles.includes("shareholder"));

  // Directors who are not already shareholders (candidates to quick-add)
  const directorCandidates = draft.filter(
    (p) => p.roles.includes("director") && !p.roles.includes("shareholder")
  );

  const updatePerson = (id: string, updated: Person) =>
    setDraft((prev) => prev.map((p) => (p.id === id ? updated : p)));

  // Remove shareholder entirely from the list
  const removeShareholder = (id: string) =>
    setDraft((prev) => prev.filter((p) => p.id !== id));

  // Promote an existing director to also be a shareholder; ensure at least 1 share
  const addExistingShareholder = (personId: string) =>
    setDraft((prev) =>
      prev.map((p) =>
        p.id === personId && !p.roles.includes("shareholder")
          ? { ...p, roles: [...p.roles, "shareholder"], shareholding: { shares: Math.max(1, p.shareholding.shares), percentage: 0 } }
          : p
      )
    );

  // Add a completely new person as shareholder; ensure at least 1 share
  const addNewShareholder = (person: Person) =>
    setDraft((prev) => [
      ...prev,
      { ...person, shareholding: { shares: Math.max(1, person.shareholding.shares), percentage: 0 } },
    ]);

  return (
    <SectionCard
      icon={LuUsers}
      title="Shareholders"
      subtitle="Detailed shareholder information"
      editing={editing}
      onEdit={() => { setDraft(persons); setEditing(true); }}
      onSave={() => { onSave(draft); setEditing(false); }}
      onCancel={() => setEditing(false)}
      extraHeader={
        editing ? (
          <AddPersonDropdown
            label="Add Shareholder"
            candidates={directorCandidates}
            candidateRole="director"
            newRole="shareholder"
            onAddExisting={addExistingShareholder}
            onAddNew={addNewShareholder}
          />
        ) : undefined
      }
    >
      <div className="space-y-4">
        {displayShareholders.map((p, i) => {
          const draftPerson = draft.find((d) => d.id === p.id) || p;
          return (
            <PersonCard
              key={p.id}
              person={editing ? draftPerson : p}
              index={i}
              editing={editing}
              totalShares={totalShares}
              onPersonChange={(updated) => updatePerson(p.id, updated)}
              onRemove={() => removeShareholder(p.id)}
              canRemove={draftShareholders.length > 1}
            />
          );
        })}
        {displayShareholders.length === 0 && (
          <p className="text-sm text-gray-400 dark:text-gray-600 italic">No shareholders found.</p>
        )}
      </div>
    </SectionCard>
  );
}

// ─── Section: Directors ───────────────────────────────────────────────────────

function DirectorsSection({ persons, totalShares, onSave }: { persons: Person[]; totalShares: number; onSave: (p: Person[]) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(persons);

  const draftDirectors = draft.filter((p) => p.roles.includes("director"));
  const displayPersons = editing ? draft : persons;
  const displayDirectors = displayPersons.filter((p) => p.roles.includes("director"));

  // Shareholders who are not already directors (candidates to quick-add)
  const shareholderCandidates = draft.filter(
    (p) => p.roles.includes("shareholder") && !p.roles.includes("director")
  );

  const updatePerson = (id: string, updated: Person) =>
    setDraft((prev) => prev.map((p) => (p.id === id ? updated : p)));

  // Remove director entirely from the list
  const removeDirector = (id: string) =>
    setDraft((prev) => prev.filter((p) => p.id !== id));

  // Promote an existing shareholder to also be a director
  const addExistingDirector = (personId: string) =>
    setDraft((prev) =>
      prev.map((p) =>
        p.id === personId && !p.roles.includes("director")
          ? { ...p, roles: [...p.roles, "director"] }
          : p
      )
    );

  // Add a completely new person as director
  const addNewDirector = (person: Person) =>
    setDraft((prev) => [...prev, person]);

  return (
    <SectionCard
      icon={LuUserCheck}
      title="Directors"
      subtitle="Company director information"
      editing={editing}
      onEdit={() => { setDraft(persons); setEditing(true); }}
      onSave={() => { onSave(draft); setEditing(false); }}
      onCancel={() => setEditing(false)}
      extraHeader={
        editing ? (
          <AddPersonDropdown
            label="Add Director"
            candidates={shareholderCandidates}
            candidateRole="shareholder"
            newRole="director"
            onAddExisting={addExistingDirector}
            onAddNew={addNewDirector}
          />
        ) : undefined
      }
    >
      <div className="space-y-4">
        {displayDirectors.map((p, i) => {
          const draftPerson = draft.find((d) => d.id === p.id) || p;
          return (
            <PersonCard
              key={p.id}
              person={editing ? draftPerson : p}
              index={i}
              editing={editing}
              totalShares={totalShares}
              onPersonChange={(updated) => updatePerson(p.id, updated)}
              onRemove={() => removeDirector(p.id)}
              canRemove={draftDirectors.length > 1}
            />
          );
        })}
        {displayDirectors.length === 0 && (
          <p className="text-sm text-gray-400 dark:text-gray-600 italic">No directors found.</p>
        )}
      </div>
    </SectionCard>
  );
}

// ─── Section: Services ────────────────────────────────────────────────────────

function ServicesSection({ data, onSave }: { data: RegistrationDetail["services"]; onSave: (d: RegistrationDetail["services"]) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(data);
  const display = editing ? draft : data;

  return (
    <SectionCard icon={LuBriefcase} title="Banking & Additional Services" subtitle="Selected service packages"
      editing={editing}
      onEdit={() => { setDraft(data); setEditing(true); }}
      onSave={() => { onSave(draft); setEditing(false); }}
      onCancel={() => setEditing(false)}
    >
      <div className="space-y-6">
        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Banking Services</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {display.banking.providers.map((p) => (
              <span key={p} className="px-3 py-1.5 text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg">{p}</span>
            ))}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Preferred Provider</label>
            {editing ? (
              <select value={draft.banking.preferredProvider}
                onChange={(e) => setDraft((p) => ({ ...p, banking: { ...p.banking, preferredProvider: e.target.value } }))}
                className={inputCls + " w-auto"}>
                {draft.banking.providers.map((pv) => <option key={pv}>{pv}</option>)}
              </select>
            ) : (
              <span className="px-3 py-1.5 text-sm font-semibold bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-400 rounded-lg">
                {display.banking.preferredProvider}
              </span>
            )}
          </div>
        </div>
        <div className="h-px bg-gray-200 dark:bg-gray-700" />
        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Additional Services</p>
          <div className="flex flex-wrap gap-2">
            {display.additionalServices.map((s) => (
              <span key={s} className="px-3 py-1.5 text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg">{s}</span>
            ))}
            {display.additionalServices.length === 0 && (
              <span className="text-sm text-gray-400 dark:text-gray-600 italic font-normal">None selected</span>
            )}
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

// ─── Section: Billing ─────────────────────────────────────────────────────────

function BillingSection({ data, onSave }: { data: RegistrationDetail["billing"]; onSave: (d: RegistrationDetail["billing"]) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(data);
  const set = (k: keyof Omit<typeof draft, "address">) => (v: string) => setDraft((p) => ({ ...p, [k]: v }));
  const setAddr = (k: keyof typeof draft.address) => (v: string) => setDraft((p) => ({ ...p, address: { ...p.address, [k]: v } }));
  const display = editing ? draft : data;

  return (
    <SectionCard icon={LuCreditCard} title="Billing Information" subtitle="Invoice and payment details"
      editing={editing}
      onEdit={() => { setDraft(data); setEditing(true); }}
      onSave={() => { onSave(draft); setEditing(false); }}
      onCancel={() => setEditing(false)}
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          <Field label="Company / Client Name" value={display.name} editing={editing} onChange={set("name")} />
          <Field label="Email" type="email" value={display.email} editing={editing} onChange={set("email")} />
          <Field label="Phone" type="tel" value={display.phone} editing={editing} onChange={set("phone")} />
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Payment Method</label>
            {editing ? (
              <select value={draft.paymentMethod} onChange={(e) => setDraft((p) => ({ ...p, paymentMethod: e.target.value }))} className={inputCls}>
                <option>Credit Card</option><option>Bank Transfer</option><option>PayPal</option>
              </select>
            ) : (
              <p className="text-sm font-medium text-gray-900 dark:text-white py-1">{display.paymentMethod}</p>
            )}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Billing Address</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            <Field label="Street Address" value={display.address.street} editing={editing} onChange={setAddr("street")} fullWidth />
            <Field label="City" value={display.address.city} editing={editing} onChange={setAddr("city")} />
            <Field label="State / Province" value={display.address.state} editing={editing} onChange={setAddr("state")} />
            <Field label="Postal Code" value={display.address.postalCode} editing={editing} onChange={setAddr("postalCode")} />
            <Field label="Country" value={display.address.country} editing={editing} onChange={setAddr("country")} />
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
      <div className="flex items-start gap-4 p-4 rounded-xl bg-success-50 dark:bg-success-500/10 border border-success-200 dark:border-success-500/20">
        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-success-100 dark:bg-success-500/20">
          <LuCheck className="w-4 h-4 text-success-600 dark:text-success-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-success-800 dark:text-success-300">Compliance Declaration Accepted</p>
          <p className="text-xs text-success-700 dark:text-success-400 mt-1">The applicant has read and agreed to the compliance declaration.</p>
          <p className="text-xs text-success-600 dark:text-success-500 mt-2">Accepted on {formatTimestamp(data.timestamp)}</p>
        </div>
      </div>
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

// ─── Main Page ────────────────────────────────────────────────────────────────

function RegistrationDetailContent({ id }: { id: string }) {
  const router = useRouter();
  const { can } = useModulePermission();
  const canUpdate = can("UPDATE");

  const [reg, setReg] = useState<RegistrationDetail>({ ...mockRegistration, id: id || mockRegistration.id });
  const [editingStatus, setEditingStatus] = useState(false);
  const [draftStatus, setDraftStatus] = useState(reg.status);

  // persons is the shared source of truth for both Share Capital and person sections
  const updatePersons = (p: Person[]) => setReg((r) => ({ ...r, persons: p }));

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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{reg.id}</h1>
              <StatusBadge status={reg.status} />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Submitted {reg.submittedDate} · Assigned to {reg.assignedTo}
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
                <button onClick={() => setEditingStatus(false)} className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors">
                  <LuX className="w-4 h-4" />
                </button>
                <button onClick={() => { setReg((r) => ({ ...r, status: draftStatus })); setEditingStatus(false); }}
                  className="px-3 py-2 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors">
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

      <ApplicantSection data={reg.applicant} onSave={(d) => setReg((r) => ({ ...r, applicant: d }))} />
      <CompanySection data={reg.company} onSave={(d) => setReg((r) => ({ ...r, company: d }))} />

      {/* Share Capital — owns person shareholding state */}
      <ShareCapitalSection
        data={reg.shareCapital}
        persons={reg.persons}
        onSave={(d) => setReg((r) => ({ ...r, shareCapital: d }))}
        onPersonsChange={updatePersons}
      />

      <ShareholdersSection persons={reg.persons} totalShares={reg.shareCapital.totalShares} onSave={updatePersons} />
      <DirectorsSection persons={reg.persons} totalShares={reg.shareCapital.totalShares} onSave={updatePersons} />
      <ServicesSection data={reg.services} onSave={(d) => setReg((r) => ({ ...r, services: d }))} />
      <BillingSection data={reg.billing} onSave={(d) => setReg((r) => ({ ...r, billing: d }))} />
      <ComplianceSection data={reg.complianceAccepted} />
    </div>
  );
}

export default function RegistrationDetailPage({ params }: { params: { id: string } }) {
  return (
    <PageAccessGuard module="REGISTRATIONS">
      <ModulePermissionProvider module="REGISTRATIONS">
        <RegistrationDetailContent id={params.id} />
      </ModulePermissionProvider>
    </PageAccessGuard>
  );
}
