"use client";

import React, { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { API_BASE_URL, authFetch } from "@/lib/auth";
import {
  LuArrowLeft,
  LuBuilding2,
  LuCalendar,
  LuFileText,
  LuDownload,
  LuUpload,
  LuPencil,
  LuCheck,
  LuX,
  LuUser,
  LuUsers,
  LuPlus,
  LuTrash2,
  LuClock,
  LuTriangleAlert,
  LuCircleCheck,
  LuEye,
  LuRefreshCw,
  LuBriefcase,
} from "react-icons/lu";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface AdminCustomerSummaryApi {
  id: number;
  name: string;
  email: string;
  type: "CUSTOMER";
  active: boolean;
  lastActive: string | null;
  user?: {
    id?: number;
    name?: string | null;
    email?: string | null;
    active?: boolean;
    type?: string;
  } | null;
  customer?: {
    id?: number;
    name?: string | null;
    email?: string | null;
    active?: boolean;
    type?: string;
  } | null;
  latestRegistration?: {
    id: string;
    status: "pending" | "in-progress" | "completed";
    proposedCompanyName?: string | null;
    createdAt?: string;
    updatedAt?: string;
  } | null;
  hasCompanyProfile?: boolean;
}

interface CustomerCompanyProfileApi {
  id: string;
  customerId: number;
  registrationId: string | null;
  companyName: string;
  businessNature: string;
  businessEmail: string;
  phoneNumber: string;
  registeredOfficeAddress: string;
  companyType: string | null;
  countryOfIncorporation: string | null;
  businessRegistrationNumber: string | null;
  incorporationDate: string | null;
  status?: string | null;
}

interface CustomerStakeholderApi {
  id: number;
  registrationId: string;
  type: "individual" | "corporate";
  roles: ("shareholder" | "director")[];
  fullName: string | null;
  companyName: string | null;
  registrationNumber: string | null;
  numberOfShares: number | null;
  sharePercentage: number | null;
}

interface CustomerDocumentApi {
  id: string;
  customerId: number;
  registrationId: string | null;
  stakeholderId: number | null;
  category: string;
  documentType: string | null;
  name: string;
  fileName: string | null;
  fileUrl?: string | null;
  publicUrl?: string | null;
  mimeType: string | null;
  fileSize: number | null;
  status: "pending_upload" | "uploaded" | "failed" | "deleted";
  createdAt: string;
}

interface CompanyProfile {
  companyName: string;
  registrationNumber: string;
  incorporationDate: string;
  businessNature: string;
  email: string;
  phone: string;
  address: string;
  companyType: string;
  country: string;
}

interface Director {
  id: string;
  stakeholderId?: number;
  registrationId?: string;
  sourceType?: "individual" | "corporate";
  sourceRoles?: ("shareholder" | "director")[];
  name: string;
  title: string;
  idNumber: string;
  since: string;
}

interface Shareholder {
  id: string;
  stakeholderId?: number;
  registrationId?: string;
  sourceType?: "individual" | "corporate";
  sourceRoles?: ("shareholder" | "director")[];
  name: string;
  shares: string;
  percentage: number;
}

interface CompanyDocument {
  id: string;
  registrationId?: string | null;
  documentType?: string | null;
  rawSizeBytes?: number | null;
  status?: string;
  name: string;
  category: string;
  size: string;
  date: string;
  url?: string;
}

interface AdminRenewalApi {
  id: string;
  customerId: number;
  name: string;
  renewalType: string | null;
  dueDate: string;
  amount?: {
    currency?: string | null;
    minor?: number | null;
  } | null;
  amountDisplay?: string | null;
  status: "upcoming" | "pending" | "current" | "overdue";
  notes?: string | null;
  lastNotifiedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface AdminServiceRequestApi {
  id: string;
  customerId: number;
  type: string;
  typeCode?: string | null;
  description: string;
  status: "pending" | "in-progress" | "completed" | "rejected";
  priority?: "low" | "medium" | "high" | null;
  requestedByUserId?: number | null;
  assignedToAdminId?: number | null;
  adminNotes?: string | null;
  internalNotes?: string | null;
  requestedAt?: string | null;
  resolvedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface AdminServiceRequestActivityApi {
  id?: string;
  action?: string;
  field?: string;
  oldValue?: unknown;
  newValue?: unknown;
  createdAt?: string;
  actorName?: string | null;
  actorType?: string | null;
  description?: string | null;
}

interface Renewal {
  id: string;
  renewalType?: string | null;
  notes?: string;
  name: string;
  dueDate: string;
  amount: string;
  status: "upcoming" | "pending" | "current" | "overdue";
}

interface ServiceRequest {
  id: string;
  type: string;
  typeCode?: string | null;
  priority?: "low" | "medium" | "high";
  assignedToAdminId?: number | null;
  internalNotes?: string;
  description: string;
  status: "pending" | "in-progress" | "completed" | "rejected";
  requestedDate: string;
  updatedDate: string;
  adminNotes?: string;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDateDisplay(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-GB");
}

function splitFullName(name: string) {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
  };
}

function getSummaryName(summary: AdminCustomerSummaryApi): string {
  return (
    summary.name ||
    summary.user?.name ||
    summary.customer?.name ||
    ""
  );
}

function getSummaryEmail(summary: AdminCustomerSummaryApi): string {
  return (
    summary.email ||
    summary.user?.email ||
    summary.customer?.email ||
    ""
  );
}

async function authJson<T = unknown>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await authFetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      data?.error?.message ||
      data?.error ||
      data?.message ||
      `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data as T;
}

// ─── Shared UI primitives ──────────────────────────────────────────────────────

const inputCls = "w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all";

function Field({ label, value, editing, onChange, as = "input", fullWidth = false }: {
  label: string; value: string; editing: boolean;
  onChange?: (v: string) => void; as?: "input" | "textarea"; fullWidth?: boolean;
}) {
  return (
    <div className={fullWidth ? "md:col-span-2" : ""}>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 font-medium">{label}</p>
      {editing ? (
        as === "textarea" ? (
          <textarea value={value} onChange={(e) => onChange?.(e.target.value)} rows={2} className={inputCls + " resize-none"} />
        ) : (
          <input type="text" value={value} onChange={(e) => onChange?.(e.target.value)} className={inputCls} />
        )
      ) : (
        <p className="text-sm font-medium text-gray-900 dark:text-white py-1">
          {value || <span className="text-gray-400 italic font-normal">—</span>}
        </p>
      )}
    </div>
  );
}

function SectionCard({ title, subtitle, icon: Icon, children, onEdit, onSave, onCancel, editing, saving }: {
  title: string; subtitle?: string; icon: React.ElementType; children: React.ReactNode;
  onEdit?: () => void; onSave?: () => void; onCancel?: () => void;
  editing?: boolean; saving?: boolean;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-theme-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center">
            <Icon className="w-[18px] h-[18px] text-brand-600 dark:text-brand-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
            {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {onEdit && (
          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <button onClick={onCancel} disabled={saving} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50">
                  <LuX className="w-3.5 h-3.5" /> Cancel
                </button>
                <button onClick={onSave} disabled={saving} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-brand-500 hover:bg-brand-600 disabled:opacity-50 rounded-lg transition-colors">
                  {saving ? <LuRefreshCw className="w-3.5 h-3.5 animate-spin" /> : <LuCheck className="w-3.5 h-3.5" />}
                  {saving ? "Saving…" : "Save"}
                </button>
              </>
            ) : (
              <button onClick={onEdit} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-brand-300 hover:text-brand-600 dark:hover:border-brand-600 dark:hover:text-brand-400 transition-colors">
                <LuPencil className="w-3.5 h-3.5" /> Edit
              </button>
            )}
          </div>
        )}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// ─── Tab: Company Profile ──────────────────────────────────────────────────────

function CompanyProfileTab({ profile, directors, shareholders, onSaveProfile, onSaveDirectors, onSaveShareholders }: {
  profile: CompanyProfile;
  directors: Director[];
  shareholders: Shareholder[];
  onSaveProfile?: (profile: CompanyProfile) => Promise<void>;
  onSaveDirectors?: (directors: Director[]) => Promise<void>;
  onSaveShareholders?: (shareholders: Shareholder[]) => Promise<void>;
}) {
  const [editingProfile, setEditingProfile] = useState(false);
  const [draftProfile, setDraftProfile] = useState(profile);
  const [savingProfile, setSavingProfile] = useState(false);

  const [editingDirectors, setEditingDirectors] = useState(false);
  const [draftDirectors, setDraftDirectors] = useState<Director[]>(directors);
  const [savingDirectors, setSavingDirectors] = useState(false);

  const [editingShareholders, setEditingShareholders] = useState(false);
  const [draftShareholders, setDraftShareholders] = useState<Shareholder[]>(shareholders);
  const [savingShareholders, setSavingShareholders] = useState(false);

  function setP(k: keyof CompanyProfile) { return (v: string) => setDraftProfile((p) => ({ ...p, [k]: v })); }

  React.useEffect(() => { setDraftProfile(profile); }, [profile]);
  React.useEffect(() => { setDraftDirectors(directors); }, [directors]);
  React.useEffect(() => { setDraftShareholders(shareholders); }, [shareholders]);

  async function saveProfile() {
    setSavingProfile(true);
    try {
      await onSaveProfile?.(draftProfile);
      setEditingProfile(false);
    } finally {
      setSavingProfile(false);
    }
  }

  async function saveDirectors() {
    setSavingDirectors(true);
    try {
      await onSaveDirectors?.(draftDirectors);
      setEditingDirectors(false);
    } finally {
      setSavingDirectors(false);
    }
  }

  async function saveShareholders() {
    setSavingShareholders(true);
    try {
      await onSaveShareholders?.(draftShareholders);
      setEditingShareholders(false);
    } finally {
      setSavingShareholders(false);
    }
  }

  function updateDirector(idx: number, k: keyof Director, v: string) {
    setDraftDirectors((d) => d.map((item, i) => i === idx ? { ...item, [k]: v } : item));
  }

  function removeDirector(idx: number) {
    setDraftDirectors((d) => d.filter((_, i) => i !== idx));
  }

  function addDirector() {
    setDraftDirectors((d) => [...d, { id: `dir-new-${Date.now()}`, name: "", title: "", idNumber: "", since: "" }]);
  }

  function updateShareholder(idx: number, k: keyof Shareholder, v: string | number) {
    setDraftShareholders((d) => d.map((item, i) => i === idx ? { ...item, [k]: v } : item));
  }

  function removeShareholder(idx: number) {
    setDraftShareholders((d) => d.filter((_, i) => i !== idx));
  }

  function addShareholder() {
    setDraftShareholders((d) => [...d, { id: `sh-new-${Date.now()}`, name: "", shares: "", percentage: 0 }]);
  }

  return (
    <div className="space-y-6">
      {/* Company Information */}
      <SectionCard
        title="Company Information"
        subtitle="Basic details about the company"
        icon={LuBuilding2}
        editing={editingProfile}
        saving={savingProfile}
        onEdit={() => { setDraftProfile(profile); setEditingProfile(true); }}
        onSave={() => { void saveProfile(); }}
        onCancel={() => setEditingProfile(false)}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Company Name"              value={draftProfile.companyName}       editing={editingProfile} onChange={setP("companyName")} />
          <Field label="Business Registration No." value={draftProfile.registrationNumber} editing={editingProfile} onChange={setP("registrationNumber")} />
          <Field label="Incorporation Date"        value={draftProfile.incorporationDate}  editing={editingProfile} onChange={setP("incorporationDate")} />
          <Field label="Business Nature"           value={draftProfile.businessNature}     editing={editingProfile} onChange={setP("businessNature")} />
          <Field label="Business Email"            value={draftProfile.email}              editing={editingProfile} onChange={setP("email")} />
          <Field label="Phone Number"              value={draftProfile.phone}              editing={editingProfile} onChange={setP("phone")} />
          <Field label="Company Type"              value={draftProfile.companyType}        editing={editingProfile} onChange={setP("companyType")} />
          <Field label="Country of Incorporation"  value={draftProfile.country}            editing={editingProfile} onChange={setP("country")} />
          <Field label="Registered Office Address" value={draftProfile.address}            editing={editingProfile} onChange={setP("address")} as="textarea" fullWidth />
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Directors */}
        <SectionCard
          title="Directors"
          subtitle="Company directors information"
          icon={LuUser}
          editing={editingDirectors}
          saving={savingDirectors}
          onEdit={() => { setDraftDirectors(directors); setEditingDirectors(true); }}
        onSave={() => { void saveDirectors(); }}
          onCancel={() => setEditingDirectors(false)}
        >
          <div className="space-y-3">
            {draftDirectors.map((d, i) => (
              <div key={d.id} className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                {editingDirectors ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <input value={d.name} onChange={(e) => updateDirector(i, "name", e.target.value)} placeholder="Full Name" className={inputCls} />
                      <button onClick={() => removeDirector(i)} className="p-1.5 text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10 rounded-lg transition-colors shrink-0">
                        <LuTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <input value={d.title} onChange={(e) => updateDirector(i, "title", e.target.value)} placeholder="Title (e.g. Managing Director)" className={inputCls} />
                    <div className="grid grid-cols-2 gap-2">
                      <input value={d.idNumber} onChange={(e) => updateDirector(i, "idNumber", e.target.value)} placeholder="ID Number" className={inputCls} />
                      <input value={d.since} onChange={(e) => updateDirector(i, "since", e.target.value)} placeholder="Since (e.g. 15/1/2020)" className={inputCls} />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center shrink-0">
                      <LuUser className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{d.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{d.title}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {editingDirectors && (
              <button onClick={addDirector} className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-xs font-medium text-gray-500 dark:text-gray-400 hover:border-brand-400 hover:text-brand-600 dark:hover:border-brand-500 dark:hover:text-brand-400 transition-colors">
                <LuPlus className="w-4 h-4" /> Add Director
              </button>
            )}
          </div>
        </SectionCard>

        {/* Shareholders */}
        <SectionCard
          title="Shareholders"
          subtitle="Share ownership structure"
          icon={LuUsers}
          editing={editingShareholders}
          saving={savingShareholders}
          onEdit={() => { setDraftShareholders(shareholders); setEditingShareholders(true); }}
        onSave={() => { void saveShareholders(); }}
          onCancel={() => setEditingShareholders(false)}
        >
          <div className="space-y-3">
            {draftShareholders.map((s, i) => (
              <div key={s.id} className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                {editingShareholders ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <input value={s.name} onChange={(e) => updateShareholder(i, "name", e.target.value)} placeholder="Shareholder Name" className={inputCls} />
                      <button onClick={() => removeShareholder(i)} className="p-1.5 text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10 rounded-lg transition-colors shrink-0">
                        <LuTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input value={s.shares} onChange={(e) => updateShareholder(i, "shares", e.target.value)} placeholder="e.g. 5,000 Ordinary Shares" className={inputCls} />
                      <div className="relative">
                        <input type="number" min={0} max={100} value={s.percentage} onChange={(e) => updateShareholder(i, "percentage", Number(e.target.value))} placeholder="%" className={inputCls + " pr-7"} />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{s.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.shares}</p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-semibold bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                      {s.percentage}%
                    </span>
                  </div>
                )}
              </div>
            ))}
            {editingShareholders && (
              <button onClick={addShareholder} className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-xs font-medium text-gray-500 dark:text-gray-400 hover:border-brand-400 hover:text-brand-600 dark:hover:border-brand-500 dark:hover:text-brand-400 transition-colors">
                <LuPlus className="w-4 h-4" /> Add Shareholder
              </button>
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

// ─── Tab: Documents ────────────────────────────────────────────────────────────

function DocumentsTab({
  docs,
  onUploadDocument,
  onDeleteDocument,
  onDownloadDocument,
  onPreviewDocument,
  loading,
}: {
  docs: CompanyDocument[];
  onUploadDocument?: (input: { file: File; name: string; category: string; documentType?: string }) => Promise<void>;
  onDeleteDocument?: (id: string) => Promise<void>;
  onDownloadDocument?: (doc: CompanyDocument) => Promise<void>;
  onPreviewDocument?: (doc: CompanyDocument) => Promise<void>;
  loading?: boolean;
}) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newDocName, setNewDocName] = useState("");
  const [newDocCategory, setNewDocCategory] = useState("");
  const [newDocType, setNewDocType] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const DOC_CATEGORIES = [
    "Incorporation", "Registration", "Constitution", "Shares",
    "Statutory", "Tax", "Banking", "Other",
  ];
  const DOC_TYPES = [
    { label: "Auto / None", value: "" },
    { label: "Certificate of Incorporation", value: "certificate_of_incorporation" },
    { label: "Business Registration", value: "business_registration_certificate" },
    { label: "Articles of Association", value: "articles_of_association" },
    { label: "Annual Return", value: "annual_return" },
    { label: "Board Resolution", value: "board_resolution" },
    { label: "Other", value: "other" },
  ];

  function openUploadModal() {
    setPendingFile(null);
    setNewDocName("");
    setNewDocCategory("Other");
    setNewDocType("");
    setShowUploadModal(true);
  }

  function handleDocTypeChange(value: string) {
    setNewDocType(value);
    const selected = DOC_TYPES.find((t) => t.value === value);
    if (!selected) return;

    // Auto-fill a human-readable name for known document types.
    if (value && value !== "other") {
      setNewDocName(selected.label);
    }
    // For "Other", keep current name so admin can type a custom one.
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setPendingFile(file);
    setNewDocName(file.name.replace(/\.[^.]+$/, ""));
    setNewDocCategory("Other");
    setShowUploadModal(true);
  }

  async function handleUploadConfirm() {
    if (!pendingFile) return;
    if (newDocType === "other" && !newDocName.trim()) return;
    setUploading(true);
    try {
      const effectiveDocType = newDocType || undefined;
      const typeLabel = DOC_TYPES.find((t) => t.value === newDocType)?.label;
      const effectiveName =
        newDocType && newDocType !== "other"
          ? (typeLabel && typeLabel !== "Auto / None" ? typeLabel : newDocName.trim())
          : newDocName.trim();

      await onUploadDocument?.({
        file: pendingFile,
        name: effectiveName,
        category: newDocCategory || "Other",
        documentType: effectiveDocType,
      });
      setUploading(false);
      setShowUploadModal(false);
      setPendingFile(null);
      setNewDocName("");
      setNewDocCategory("");
      setNewDocType("");
    } catch (err) {
      setUploading(false);
      alert(err instanceof Error ? err.message : "Failed to upload document");
    }
  }

  async function handleRemove(id: string) {
    setDeletingId(id);
    try {
      await onDeleteDocument?.(id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete document");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleDownload(doc: CompanyDocument) {
    setDownloadingId(doc.id);
    try {
      await onDownloadDocument?.(doc);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to download document");
    } finally {
      setDownloadingId(null);
    }
  }

  async function handlePreview(doc: CompanyDocument) {
    setPreviewingId(doc.id);
    try {
      await onPreviewDocument?.(doc);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to preview document");
    } finally {
      setPreviewingId(null);
    }
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-theme-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center">
            <LuFileText className="w-[18px] h-[18px] text-brand-600 dark:text-brand-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Company Documents</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Upload statutory documents visible to the customer</p>
          </div>
        </div>
        <button
          onClick={openUploadModal}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors"
        >
          <LuUpload className="w-4 h-4" /> Upload Document
        </button>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="py-12 text-center">
            <LuRefreshCw className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-3 animate-spin" />
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Loading documents…</p>
          </div>
        ) : docs.length === 0 ? (
          <div className="py-12 text-center">
            <LuFileText className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No documents uploaded yet</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Click Upload Document to add company files</p>
          </div>
        ) : (
          <div className="space-y-3">
            {docs.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center shrink-0">
                    <LuFileText className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{doc.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {doc.category} · {doc.size} · {doc.date}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => void handlePreview(doc)}
                    disabled={previewingId === doc.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    <LuEye className="w-3.5 h-3.5" /> {previewingId === doc.id ? "Loading..." : "Preview"}
                  </button>
                  <button
                    onClick={() => void handleDownload(doc)}
                    disabled={downloadingId === doc.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    <LuDownload className="w-3.5 h-3.5" /> {downloadingId === doc.id ? "Loading..." : "Download"}
                  </button>
                  <button onClick={() => void handleRemove(doc.id)} disabled={deletingId === doc.id} className="p-1.5 text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50">
                    <LuTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload confirm modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Upload Document</h3>
              <button onClick={() => { setShowUploadModal(false); setPendingFile(null); }} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors">
                <LuX className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={handleFileSelect} />
              {pendingFile ? (
                <div className="flex items-center gap-3 p-3 bg-brand-50 dark:bg-brand-500/10 rounded-lg border border-brand-200 dark:border-brand-500/30">
                  <LuFileText className="w-5 h-5 text-brand-600 dark:text-brand-400 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{pendingFile.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{formatBytes(pendingFile.size)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1.5 text-xs font-medium text-brand-600 dark:text-brand-400 bg-white dark:bg-gray-800 border border-brand-200 dark:border-brand-500/30 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"
                  >
                    Replace
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-brand-400 dark:hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/5 text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-all text-xs font-medium"
                >
                  <LuUpload className="w-4 h-4" /> Choose file (PDF/JPG/PNG/WEBP)
                </button>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Document Type (optional)</label>
                <select value={newDocType} onChange={(e) => handleDocTypeChange(e.target.value)} className={inputCls}>
                  {DOC_TYPES.map((t) => <option key={t.value || "none"} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              {newDocType === "other" && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                    Document Name <span className="text-error-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newDocName}
                    onChange={(e) => setNewDocName(e.target.value)}
                    placeholder="Enter custom document name"
                    className={inputCls}
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Category</label>
                <select value={newDocCategory} onChange={(e) => setNewDocCategory(e.target.value)} className={inputCls}>
                  {DOC_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              <button onClick={() => { setShowUploadModal(false); setPendingFile(null); }} className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancel</button>
              <button onClick={handleUploadConfirm} disabled={uploading || !pendingFile || (newDocType === "other" && !newDocName.trim())} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 disabled:opacity-50 rounded-lg transition-colors">
                {uploading ? <LuRefreshCw className="w-4 h-4 animate-spin" /> : <LuUpload className="w-4 h-4" />}
                {uploading ? "Uploading…" : "Upload"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Renewals ─────────────────────────────────────────────────────────────

const RENEWAL_STATUS_CONFIG = {
  upcoming: { label: "Upcoming", icon: LuClock,          cls: "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400",   iconCls: "text-brand-500" },
  pending:  { label: "Pending",  icon: LuTriangleAlert,  cls: "bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400", iconCls: "text-orange-500" },
  current:  { label: "Current",  icon: LuCircleCheck,    cls: "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400", iconCls: "text-success-500" },
  overdue:  { label: "Overdue",  icon: LuTriangleAlert,  cls: "bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-400",    iconCls: "text-error-500" },
};

function RenewalsTab({
  renewals,
  onCreateRenewal,
  onUpdateRenewal,
  onDeleteRenewal,
  loading,
}: {
  renewals: Renewal[];
  onCreateRenewal?: (payload: { name: string; dueDate: string; amount: string; status: Renewal["status"]; renewalType?: string; notes?: string }) => Promise<void>;
  onUpdateRenewal?: (id: string, payload: Partial<{ name: string; dueDate: string; amount: string; status: Renewal["status"]; renewalType?: string; notes?: string }>) => Promise<void>;
  onDeleteRenewal?: (id: string) => Promise<void>;
  loading?: boolean;
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<Renewal>>({});
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function openAdd() { setDraft({ name: "", dueDate: "", amount: "", status: "upcoming" }); setShowAddModal(true); }

  async function saveNew() {
    if (!draft.name?.trim()) return;
    setSaving(true);
    try {
      await onCreateRenewal?.({
        name: draft.name!,
        dueDate: draft.dueDate || "",
        amount: draft.amount || "",
        status: (draft.status as Renewal["status"]) || "upcoming",
        renewalType: draft.renewalType || undefined,
        notes: draft.notes || undefined,
      });
      setShowAddModal(false);
      setDraft({});
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create renewal");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(r: Renewal) { setEditingId(r.id); setDraft({ ...r }); }
  function cancelEdit() { setEditingId(null); setDraft({}); }
  async function saveEdit(id: string) {
    setSaving(true);
    try {
      await onUpdateRenewal?.(id, {
        name: typeof draft.name === "string" ? draft.name : undefined,
        dueDate: typeof draft.dueDate === "string" ? draft.dueDate : undefined,
        amount: typeof draft.amount === "string" ? draft.amount : undefined,
        status: draft.status as Renewal["status"] | undefined,
        renewalType: typeof draft.renewalType === "string" ? draft.renewalType : undefined,
        notes: typeof draft.notes === "string" ? draft.notes : undefined,
      });
      setEditingId(null);
      setDraft({});
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update renewal");
    } finally {
      setSaving(false);
    }
  }

  async function removeRenewal(id: string) {
    setDeletingId(id);
    try {
      await onDeleteRenewal?.(id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete renewal");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-theme-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center">
            <LuCalendar className="w-[18px] h-[18px] text-brand-600 dark:text-brand-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Renewals & Compliance</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Track statutory renewals and notify the customer</p>
          </div>
        </div>
        <button onClick={openAdd} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors">
          <LuPlus className="w-4 h-4" /> Add Renewal
        </button>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="py-12 text-center">
            <LuRefreshCw className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-3 animate-spin" />
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Loading renewals…</p>
          </div>
        ) : renewals.length === 0 ? (
          <div className="py-12 text-center">
            <LuCalendar className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No renewals added yet</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Add renewals to notify the customer</p>
          </div>
        ) : (
          <div className="space-y-3">
            {renewals.map((r) => {
              const cfg = RENEWAL_STATUS_CONFIG[r.status];
              const Icon = cfg.icon;
              const isEditing = editingId === r.id;

              return (
                <div key={r.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                  {isEditing ? (
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-3 mr-3">
                      <input value={draft.name ?? ""} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} placeholder="Renewal name" className={inputCls} />
                      <input value={draft.dueDate ?? ""} onChange={(e) => setDraft((d) => ({ ...d, dueDate: e.target.value }))} placeholder="Due date" className={inputCls} />
                      <input value={draft.amount ?? ""} onChange={(e) => setDraft((d) => ({ ...d, amount: e.target.value }))} placeholder="Amount (e.g. HKD 2,200)" className={inputCls} />
                      <select value={draft.status ?? "upcoming"} onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value as Renewal["status"] }))} className={inputCls}>
                        {Object.entries(RENEWAL_STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.cls.split(" ").slice(0, 2).join(" ")} bg-opacity-10`}>
                        <Icon className={`w-5 h-5 ${cfg.iconCls}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{r.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          Due: {r.dueDate}{r.amount ? ` · ${r.amount}` : ""}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    {isEditing ? (
                      <>
                        <button onClick={cancelEdit} disabled={saving} className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"><LuX className="w-4 h-4" /></button>
                        <button onClick={() => void saveEdit(r.id)} disabled={saving} className="p-1.5 text-success-600 hover:bg-success-50 dark:hover:bg-success-500/10 rounded-lg transition-colors disabled:opacity-50"><LuCheck className="w-4 h-4" /></button>
                      </>
                    ) : (
                      <>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.cls}`}>{cfg.label}</span>
                        <button onClick={() => startEdit(r)} className="p-1.5 text-gray-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                          <LuPencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => void removeRenewal(r.id)} disabled={deletingId === r.id} className="p-1.5 text-gray-400 hover:text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50">
                          {deletingId === r.id ? <LuRefreshCw className="w-4 h-4 animate-spin" /> : <LuTrash2 className="w-4 h-4" />}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Renewal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Add Renewal</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors"><LuX className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Renewal Name <span className="text-error-500">*</span></label>
                <input value={draft.name ?? ""} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} placeholder="e.g. Business Registration" className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Due Date</label>
                  <input value={draft.dueDate ?? ""} onChange={(e) => setDraft((d) => ({ ...d, dueDate: e.target.value }))} placeholder="e.g. 30/4/2026" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Amount</label>
                  <input value={draft.amount ?? ""} onChange={(e) => setDraft((d) => ({ ...d, amount: e.target.value }))} placeholder="e.g. HKD 2,200" className={inputCls} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Status</label>
                <select value={draft.status ?? "upcoming"} onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value as Renewal["status"] }))} className={inputCls}>
                  {Object.entries(RENEWAL_STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancel</button>
              <button onClick={() => void saveNew()} disabled={saving || !draft.name?.trim()} className="px-4 py-2 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 disabled:opacity-50 rounded-lg transition-colors">
                {saving ? "Saving…" : "Add Renewal"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Service Requests ────────────────────────────────────────────────────

const SR_STATUS_CONFIG = {
  pending:        { label: "Pending",     cls: "bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400",  icon: LuClock },
  "in-progress":  { label: "In Progress", cls: "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400",     icon: LuRefreshCw },
  completed:      { label: "Completed",   cls: "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400", icon: LuCircleCheck },
  rejected:       { label: "Rejected",    cls: "bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-400",       icon: LuX },
};

function ServiceRequestsTab({
  requests,
  onViewRequest,
  onSaveRequest,
  loading,
}: {
  requests: ServiceRequest[];
  onViewRequest?: (id: string) => Promise<{ request: ServiceRequest; activity?: AdminServiceRequestActivityApi[] }>;
  onSaveRequest?: (id: string, payload: Partial<Pick<ServiceRequest, "status" | "adminNotes" | "internalNotes" | "assignedToAdminId" | "priority">>) => Promise<void>;
  loading?: boolean;
}) {
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [adminNotesDraft, setAdminNotesDraft] = useState("");
  const [internalNotesDraft, setInternalNotesDraft] = useState("");
  const [statusDraft, setStatusDraft] = useState<ServiceRequest["status"]>("pending");
  const [priorityDraft, setPriorityDraft] = useState<NonNullable<ServiceRequest["priority"]>>("medium");
  const [viewLoading, setViewLoading] = useState(false);
  const [savingView, setSavingView] = useState(false);
  const [viewingData, setViewingData] = useState<ServiceRequest | null>(null);
  const [viewingActivity, setViewingActivity] = useState<AdminServiceRequestActivityApi[]>([]);

  const viewing = viewingData ?? requests.find((r) => r.id === viewingId) ?? null;

  async function openView(r: ServiceRequest) {
    setViewingId(r.id);
    setViewLoading(true);
    try {
      const detail = await onViewRequest?.(r.id);
      const resolved = detail?.request ?? r;
      setViewingData(resolved);
      setViewingActivity(detail?.activity ?? []);
      setAdminNotesDraft(resolved.adminNotes ?? "");
      setInternalNotesDraft(resolved.internalNotes ?? "");
      setStatusDraft(resolved.status);
      setPriorityDraft(resolved.priority ?? "medium");
    } catch (err) {
      setViewingData(r);
      setViewingActivity([]);
      setAdminNotesDraft(r.adminNotes ?? "");
      setInternalNotesDraft(r.internalNotes ?? "");
      setStatusDraft(r.status);
      setPriorityDraft(r.priority ?? "medium");
      alert(err instanceof Error ? err.message : "Failed to load request details");
    } finally {
      setViewLoading(false);
    }
  }

  async function saveView() {
    if (!viewingId) return;
    setSavingView(true);
    try {
      await onSaveRequest?.(viewingId, {
        status: statusDraft,
        adminNotes: adminNotesDraft,
        internalNotes: internalNotesDraft,
        priority: priorityDraft,
      });
      setViewingId(null);
      setViewingData(null);
      setViewingActivity([]);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save service request");
    } finally {
      setSavingView(false);
    }
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-theme-sm overflow-hidden">
      <div className="flex items-center px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 gap-3">
        <div className="w-9 h-9 rounded-lg bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center">
          <LuBriefcase className="w-[18px] h-[18px] text-brand-600 dark:text-brand-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Service Requests</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Review and resolve customer service requests</p>
        </div>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="py-12 text-center">
            <LuRefreshCw className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-3 animate-spin" />
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Loading service requests…</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="py-12 text-center">
            <LuBriefcase className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No service requests yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((r) => {
              const cfg = SR_STATUS_CONFIG[r.status];
              const Icon = cfg.icon;
              return (
                <div key={r.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{r.type}</p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.cls}`}>{cfg.label}</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate max-w-sm">{r.description}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">
                        ID: {r.id} · Requested: {r.requestedDate} · Updated: {r.updatedDate}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => void openView(r)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-brand-300 hover:text-brand-600 dark:hover:border-brand-600 dark:hover:text-brand-400 transition-colors shrink-0 ml-3"
                  >
                    <LuEye className="w-3.5 h-3.5" /> View
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* View / Resolve Modal */}
      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{viewing.type}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">ID: {viewing.id}</p>
              </div>
              <button onClick={() => setViewingId(null)} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors"><LuX className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-5">
              {viewLoading ? (
                <div className="py-8 text-center">
                  <LuRefreshCw className="w-6 h-6 mx-auto text-gray-400 mb-2 animate-spin" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">Loading request details…</p>
                </div>
              ) : (
              <>
              {/* Request details */}
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Request Description</p>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-700 dark:text-gray-300">{viewing.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                <span>Requested: <span className="font-medium text-gray-700 dark:text-gray-300">{viewing.requestedDate}</span></span>
                <span>Updated: <span className="font-medium text-gray-700 dark:text-gray-300">{viewing.updatedDate}</span></span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Priority</label>
                  <select value={priorityDraft} onChange={(e) => setPriorityDraft(e.target.value as NonNullable<ServiceRequest["priority"]>)} className={inputCls}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Assigned Admin ID</p>
                  <div className="p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300">
                    {viewing.assignedToAdminId ?? "Unassigned"}
                  </div>
                </div>
              </div>
              {/* Status */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Update Status</label>
                <select value={statusDraft} onChange={(e) => setStatusDraft(e.target.value as ServiceRequest["status"])} className={inputCls}>
                  {Object.entries(SR_STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              {/* Admin notes */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Admin Notes (visible to customer)</label>
                <textarea value={adminNotesDraft} onChange={(e) => setAdminNotesDraft(e.target.value)} rows={3} placeholder="Add notes or resolution details…" className={inputCls + " resize-none"} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Internal Notes (admin only)</label>
                <textarea value={internalNotesDraft} onChange={(e) => setInternalNotesDraft(e.target.value)} rows={3} placeholder="Internal handling notes…" className={inputCls + " resize-none"} />
              </div>
              {viewingActivity.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Activity</p>
                  <div className="max-h-40 overflow-auto space-y-2 pr-1">
                    {viewingActivity.slice(0, 10).map((a, idx) => (
                      <div key={a.id || `${a.createdAt || "t"}-${idx}`} className="text-xs p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                        <p className="text-gray-700 dark:text-gray-300">
                          {a.description || a.action || "Activity update"}
                        </p>
                        <p className="text-gray-400 dark:text-gray-500 mt-0.5">
                          {[a.actorName || a.actorType, formatDateDisplay(a.createdAt)].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              </>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              <button onClick={() => setViewingId(null)} className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancel</button>
              <button onClick={() => void saveView()} disabled={viewLoading || savingView} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 disabled:opacity-50 rounded-lg transition-colors">
                <LuCheck className="w-4 h-4" /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Detail Page ──────────────────────────────────────────────────────────

const TABS = [
  { key: "profile",          label: "Company Profile" },
  { key: "documents",        label: "Documents" },
  { key: "renewals",         label: "Renewals" },
  { key: "service-requests", label: "Service Requests" },
] as const;

type TabKey = typeof TABS[number]["key"];

const AVATAR_COLORS = [
  "bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300",
  "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
];

function getStatusStyle(s: string) {
  if (s === "completed")   return "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400";
  if (s === "in-progress") return "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400";
  return "bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400";
}

function mapCompanyProfileToUi(profile: CustomerCompanyProfileApi | null, fallback: Partial<CompanyProfile> = {}): CompanyProfile {
  return {
    companyName: profile?.companyName ?? fallback.companyName ?? "",
    registrationNumber: profile?.businessRegistrationNumber ?? fallback.registrationNumber ?? "",
    incorporationDate: profile?.incorporationDate ? formatDateDisplay(profile.incorporationDate) : (fallback.incorporationDate ?? ""),
    businessNature: profile?.businessNature ?? fallback.businessNature ?? "",
    email: profile?.businessEmail ?? fallback.email ?? "",
    phone: profile?.phoneNumber ?? fallback.phone ?? "",
    address: profile?.registeredOfficeAddress ?? fallback.address ?? "",
    companyType: profile?.companyType ?? fallback.companyType ?? "",
    country: profile?.countryOfIncorporation ?? fallback.country ?? "",
  };
}

function stakeholderName(s: CustomerStakeholderApi) {
  return s.fullName || s.companyName || "";
}

function mapStakeholdersToDirectors(stakeholders: CustomerStakeholderApi[]): Director[] {
  return stakeholders
    .filter((s) => s.roles.includes("director"))
    .map((s) => ({
      id: String(s.id),
      stakeholderId: s.id,
      registrationId: s.registrationId,
      sourceType: s.type,
      sourceRoles: s.roles,
      name: stakeholderName(s),
      title: s.type === "corporate" ? "Corporate Director" : "Director",
      idNumber: s.registrationNumber || "",
      since: "",
    }));
}

function mapStakeholdersToShareholders(stakeholders: CustomerStakeholderApi[]): Shareholder[] {
  return stakeholders
    .filter((s) => s.roles.includes("shareholder"))
    .map((s) => ({
      id: String(s.id),
      stakeholderId: s.id,
      registrationId: s.registrationId,
      sourceType: s.type,
      sourceRoles: s.roles,
      name: stakeholderName(s),
      shares: s.numberOfShares != null ? `${s.numberOfShares.toLocaleString()} Shares` : "",
      percentage: Number(s.sharePercentage ?? 0),
    }));
}

function mapDocumentsToUi(docs: CustomerDocumentApi[]): CompanyDocument[] {
  return docs
    .filter((d) => d.status !== "deleted")
    .map((d) => ({
      id: d.id,
      registrationId: d.registrationId,
      documentType: d.documentType,
      rawSizeBytes: d.fileSize,
      status: d.status,
      name: d.name,
      category: d.category,
      size: d.fileSize ? formatBytes(d.fileSize) : "—",
      date: formatDateDisplay(d.createdAt),
      url: d.fileUrl || d.publicUrl || undefined,
    }));
}

function parseShareCountFromLabel(value: string): number | undefined {
  const digits = value.replace(/[^\d]/g, "");
  if (!digits) return undefined;
  const parsed = Number(digits);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toOptionalString(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function toApiDateString(value: string): string | undefined {
  const raw = value.trim();
  if (!raw) return undefined;

  // Already API format
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  // DD/MM/YYYY or D/M/YYYY
  const slash = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) {
    const [, dd, mm, yyyy] = slash;
    return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  }

  // Fallback to Date parse
  const d = new Date(raw);
  if (!Number.isNaN(d.getTime())) {
    return d.toISOString().slice(0, 10);
  }

  return undefined;
}

function formatMoneyMinorToDisplay(amount?: { currency?: string | null; minor?: number | null } | null, amountDisplay?: string | null) {
  if (amountDisplay) return amountDisplay;
  if (!amount || amount.minor == null) return "";
  const currency = (amount.currency || "USD").toUpperCase();
  return `${currency} ${(amount.minor / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function parseAmountDisplayInput(value: string): { currency: string; minor: number } {
  const raw = value.trim();
  if (!raw) return { currency: "HKD", minor: 0 };

  const codeMatch = raw.match(/\b([A-Za-z]{3})\b/);
  const currency = (codeMatch?.[1] || "HKD").toUpperCase();
  const numeric = raw.replace(/[^0-9.]/g, "");
  const major = Number(numeric || "0");
  const minor = Number.isFinite(major) ? Math.round(major * 100) : 0;
  return { currency, minor };
}

function mapRenewalsToUi(rows: AdminRenewalApi[]): Renewal[] {
  return rows.map((r) => ({
    id: r.id,
    renewalType: r.renewalType ?? null,
    notes: r.notes ?? "",
    name: r.name,
    dueDate: formatDateDisplay(r.dueDate),
    amount: formatMoneyMinorToDisplay(r.amount, r.amountDisplay),
    status: r.status,
  }));
}

function mapServiceRequestsToUi(rows: AdminServiceRequestApi[]): ServiceRequest[] {
  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    typeCode: r.typeCode ?? null,
    priority: r.priority ?? undefined,
    assignedToAdminId: r.assignedToAdminId ?? null,
    internalNotes: r.internalNotes ?? "",
    description: r.description,
    status: r.status,
    requestedDate: formatDateDisplay(r.requestedAt || r.createdAt),
    updatedDate: formatDateDisplay(r.updatedAt),
    adminNotes: r.adminNotes ?? "",
  }));
}

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = Number(params.id);
  const [activeTab, setActiveTab] = useState<TabKey>("profile");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<AdminCustomerSummaryApi | null>(null);
  const [companyProfileApi, setCompanyProfileApi] = useState<CustomerCompanyProfileApi | null>(null);
  const [stakeholdersApi, setStakeholdersApi] = useState<CustomerStakeholderApi[]>([]);
  const [docs, setDocs] = useState<CompanyDocument[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [documentsApi, setDocumentsApi] = useState<CustomerDocumentApi[]>([]);
  const [renewalsApi, setRenewalsApi] = useState<AdminRenewalApi[]>([]);
  const [renewals, setRenewals] = useState<Renewal[]>([]);
  const [renewalsLoading, setRenewalsLoading] = useState(false);
  const [serviceRequestsApi, setServiceRequestsApi] = useState<AdminServiceRequestApi[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [serviceRequestsLoading, setServiceRequestsLoading] = useState(false);

  const latestRegistrationId = summary?.latestRegistration?.id ?? companyProfileApi?.registrationId ?? null;

  const loadDocuments = React.useCallback(async () => {
    setDocsLoading(true);
    try {
      const res = await authJson<{ data?: CustomerDocumentApi[]; meta?: { total?: number } } | { documents?: CustomerDocumentApi[] }>(
        `${API_BASE_URL}/api/v1/admin/customers/${customerId}/documents?limit=100&page=1&sortBy=createdAt&sortOrder=desc`
      );
      const rows = Array.isArray((res as { data?: unknown }).data)
        ? ((res as { data: CustomerDocumentApi[] }).data)
        : Array.isArray((res as { documents?: unknown }).documents)
          ? ((res as { documents: CustomerDocumentApi[] }).documents)
          : [];
      setDocumentsApi(rows);
      setDocs(mapDocumentsToUi(rows));
    } finally {
      setDocsLoading(false);
    }
  }, [customerId]);

  const loadRenewals = React.useCallback(async () => {
    setRenewalsLoading(true);
    try {
      const res = await authJson<{ data?: AdminRenewalApi[] } | { renewals?: AdminRenewalApi[] }>(
        `${API_BASE_URL}/api/v1/admin/customers/${customerId}/renewals?limit=100&page=1&sortBy=dueDate&sortOrder=asc`
      );
      const rows = Array.isArray((res as { data?: unknown }).data)
        ? (res as { data: AdminRenewalApi[] }).data
        : Array.isArray((res as { renewals?: unknown }).renewals)
          ? (res as { renewals: AdminRenewalApi[] }).renewals
          : [];
      setRenewalsApi(rows);
      setRenewals(mapRenewalsToUi(rows));
    } finally {
      setRenewalsLoading(false);
    }
  }, [customerId]);

  const loadServiceRequests = React.useCallback(async () => {
    setServiceRequestsLoading(true);
    try {
      const res = await authJson<{ data?: AdminServiceRequestApi[] } | { requests?: AdminServiceRequestApi[] }>(
        `${API_BASE_URL}/api/v1/admin/customers/${customerId}/service-requests?limit=100&page=1&sortBy=requestedAt&sortOrder=desc`
      );
      const rows = Array.isArray((res as { data?: unknown }).data)
        ? (res as { data: AdminServiceRequestApi[] }).data
        : Array.isArray((res as { requests?: unknown }).requests)
          ? (res as { requests: AdminServiceRequestApi[] }).requests
          : [];
      setServiceRequestsApi(rows);
      setServiceRequests(mapServiceRequestsToUi(rows));
    } finally {
      setServiceRequestsLoading(false);
    }
  }, [customerId]);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!Number.isFinite(customerId)) {
        setError("Invalid customer ID.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const [summaryRes, companyProfileRes, stakeholdersRes] = await Promise.all([
          authJson<{ data?: AdminCustomerSummaryApi }>(`${API_BASE_URL}/api/v1/admin/customers/${customerId}`),
          authFetch(`${API_BASE_URL}/api/v1/admin/customers/${customerId}/company-profile`),
          authJson<{ data?: CustomerStakeholderApi[] }>(`${API_BASE_URL}/api/v1/admin/customers/${customerId}/stakeholders?limit=100&page=1`),
        ]);

        let companyProfile: CustomerCompanyProfileApi | null = null;
        if (companyProfileRes.ok) {
          const companyProfileData = await companyProfileRes.json().catch(() => ({}));
          companyProfile = companyProfileData.data ?? null;
        } else if (companyProfileRes.status !== 404) {
          const errData = await companyProfileRes.json().catch(() => ({}));
          throw new Error(errData?.error?.message || errData?.error || "Failed to load company profile");
        }

        if (cancelled) return;

        setSummary(summaryRes.data ?? null);
        setCompanyProfileApi(companyProfile);
        setStakeholdersApi(stakeholdersRes.data ?? []);

        await Promise.all([loadDocuments(), loadRenewals(), loadServiceRequests()]);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load customer details");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [customerId, loadDocuments, loadRenewals, loadServiceRequests]);

  if (loading) {
    return (
      <div className="space-y-4">
        <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
          <LuArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl">
          <div className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <LuRefreshCw className="w-4 h-4 animate-spin" /> Loading customer details...
          </div>
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="space-y-4">
        <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
          <LuArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="p-6 bg-error-50 dark:bg-error-500/10 border border-error-200 dark:border-error-500/20 rounded-xl">
          <p className="text-sm font-medium text-error-700 dark:text-error-400">{error || "Customer not found."}</p>
        </div>
      </div>
    );
  }

  const resolvedSummaryName = getSummaryName(summary);
  const resolvedSummaryEmail = getSummaryEmail(summary);
  const nameParts = splitFullName(resolvedSummaryName);
  const customer = {
    id: summary.id ?? summary.user?.id ?? summary.customer?.id ?? customerId,
    firstName: nameParts.firstName,
    lastName: nameParts.lastName,
    email: resolvedSummaryEmail,
    companyName:
      companyProfileApi?.companyName ||
      summary.latestRegistration?.proposedCompanyName ||
      "—",
    companyType: companyProfileApi?.companyType || "",
    countryOfIncorporation: companyProfileApi?.countryOfIncorporation || "",
    registrationStatus: summary.latestRegistration?.status || "pending",
    active: Boolean(summary.active ?? summary.user?.active ?? summary.customer?.active),
  };

  const initials = `${(customer.firstName || "?").charAt(0)}${(customer.lastName || "").charAt(0)}`.toUpperCase();
  const avatarCls = AVATAR_COLORS[customer.id % AVATAR_COLORS.length];

  const initialProfile = mapCompanyProfileToUi(companyProfileApi, {
    companyName: customer.companyName,
    email: customer.email,
    companyType: customer.companyType || "",
    country: customer.countryOfIncorporation || "",
  });

  const initialDirectors = mapStakeholdersToDirectors(stakeholdersApi);
  const initialShareholders = mapStakeholdersToShareholders(stakeholdersApi);

  async function handleSaveCompanyProfile(next: CompanyProfile) {
    const payload: Record<string, unknown> = {
      companyName: next.companyName.trim(),
      businessNature: next.businessNature.trim(),
      businessEmail: next.email.trim(),
      phoneNumber: next.phone.trim(),
      registeredOfficeAddress: next.address.trim(),
    };

    const companyType = toOptionalString(next.companyType);
    const countryOfIncorporation = toOptionalString(next.country);
    const businessRegistrationNumber = toOptionalString(next.registrationNumber);
    const incorporationDate = toApiDateString(next.incorporationDate);

    if (companyType) payload.companyType = companyType;
    if (countryOfIncorporation) payload.countryOfIncorporation = countryOfIncorporation;
    if (businessRegistrationNumber) payload.businessRegistrationNumber = businessRegistrationNumber;
    if (incorporationDate) payload.incorporationDate = incorporationDate;
    if (latestRegistrationId) payload.registrationId = latestRegistrationId;

    let profile: CustomerCompanyProfileApi | null = null;
    try {
      const created = await authJson<{ data?: CustomerCompanyProfileApi }>(`${API_BASE_URL}/api/v1/admin/customers/${customerId}/company-profile`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      profile = created.data ?? null;
    } catch {
      const updated = await authJson<{ data?: CustomerCompanyProfileApi }>(`${API_BASE_URL}/api/v1/admin/customers/${customerId}/company-profile`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      profile = updated.data ?? null;
    }
    setCompanyProfileApi(profile);
  }

  async function handleSaveDirectors(nextDirectors: Director[]) {
    const originalIds = new Set(initialDirectors.map((d) => d.stakeholderId).filter((v): v is number => typeof v === "number"));
    const incomingIds = new Set(nextDirectors.map((d) => d.stakeholderId).filter((v): v is number => typeof v === "number"));

    for (const director of nextDirectors) {
      const payload = {
        registrationId: director.registrationId || latestRegistrationId || undefined,
        type: director.sourceType || "individual",
        roles: ["director"] as const,
        fullName: director.name || null,
        companyName: null,
        registrationNumber: director.idNumber || null,
      };

      if (director.stakeholderId) {
        await authJson(`${API_BASE_URL}/api/v1/admin/customers/${customerId}/stakeholders/${director.stakeholderId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await authJson(`${API_BASE_URL}/api/v1/admin/customers/${customerId}/stakeholders`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
    }

    for (const oldId of originalIds) {
      if (!incomingIds.has(oldId)) {
        await authJson(`${API_BASE_URL}/api/v1/admin/customers/${customerId}/stakeholders/${oldId}`, { method: "DELETE" });
      }
    }

    const reloaded = await authJson<{ data?: CustomerStakeholderApi[] }>(`${API_BASE_URL}/api/v1/admin/customers/${customerId}/stakeholders?limit=100&page=1`);
    setStakeholdersApi(reloaded.data ?? []);
  }

  async function handleSaveShareholders(nextShareholders: Shareholder[]) {
    const originalIds = new Set(initialShareholders.map((s) => s.stakeholderId).filter((v): v is number => typeof v === "number"));
    const incomingIds = new Set(nextShareholders.map((s) => s.stakeholderId).filter((v): v is number => typeof v === "number"));

    for (const sh of nextShareholders) {
      const payload = {
        registrationId: sh.registrationId || latestRegistrationId || undefined,
        type: sh.sourceType || "individual",
        roles: ["shareholder"] as const,
        fullName: sh.name || null,
        companyName: null,
        numberOfShares: parseShareCountFromLabel(sh.shares) ?? null,
        sharePercentage: Number.isFinite(sh.percentage) ? sh.percentage : null,
      };

      if (sh.stakeholderId) {
        await authJson(`${API_BASE_URL}/api/v1/admin/customers/${customerId}/stakeholders/${sh.stakeholderId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await authJson(`${API_BASE_URL}/api/v1/admin/customers/${customerId}/stakeholders`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
    }

    for (const oldId of originalIds) {
      if (!incomingIds.has(oldId)) {
        await authJson(`${API_BASE_URL}/api/v1/admin/customers/${customerId}/stakeholders/${oldId}`, { method: "DELETE" });
      }
    }

    const reloaded = await authJson<{ data?: CustomerStakeholderApi[] }>(`${API_BASE_URL}/api/v1/admin/customers/${customerId}/stakeholders?limit=100&page=1`);
    setStakeholdersApi(reloaded.data ?? []);
  }

  async function handleUploadCompanyDocument(input: { file: File; name: string; category: string; documentType?: string }) {
    const initPayload: Record<string, unknown> = {
      name: input.name,
      category: input.category,
      fileName: input.file.name,
      mimeType: input.file.type,
      fileSize: input.file.size,
      registrationId: latestRegistrationId || undefined,
    };
    if (input.documentType) initPayload.documentType = input.documentType;

    const init = await authJson<{ data: { documentId: string; uploadUrl: string; uploadMethod?: string; requiredHeaders?: Record<string, string> } }>(
      `${API_BASE_URL}/api/v1/admin/customers/${customerId}/documents/upload-init`,
      {
        method: "POST",
        body: JSON.stringify(initPayload),
      }
    );

    const uploadHeaders = new Headers(init.data.requiredHeaders || {});
    if (!uploadHeaders.has("Content-Type") && input.file.type) uploadHeaders.set("Content-Type", input.file.type);
    const uploadRes = await fetch(init.data.uploadUrl, {
      method: init.data.uploadMethod || "PUT",
      headers: uploadHeaders,
      body: input.file,
    });
    if (!uploadRes.ok) throw new Error(`Upload failed (${uploadRes.status})`);

    const etag = uploadRes.headers.get("etag");
    await authJson(`${API_BASE_URL}/api/v1/admin/customers/${customerId}/documents/${init.data.documentId}/upload-complete`, {
      method: "POST",
      body: JSON.stringify(etag ? { etag } : {}),
    });

    await loadDocuments();
  }

  async function handleDeleteCompanyDocument(documentId: string) {
    await authJson(`${API_BASE_URL}/api/v1/admin/customers/${customerId}/documents/${documentId}`, {
      method: "DELETE",
    });
    await loadDocuments();
  }

  async function handleCreateRenewal(input: { name: string; dueDate: string; amount: string; status: Renewal["status"]; renewalType?: string; notes?: string }) {
    const dueDate = toApiDateString(input.dueDate);
    if (!dueDate) throw new Error("Valid due date is required (YYYY-MM-DD or DD/MM/YYYY).");
    const amount = parseAmountDisplayInput(input.amount);
    const payload: Record<string, unknown> = {
      name: input.name.trim(),
      dueDate,
      amount,
      status: input.status,
    };
    if (input.renewalType?.trim()) payload.renewalType = input.renewalType.trim();
    if (input.notes?.trim()) payload.notes = input.notes.trim();

    await authJson(`${API_BASE_URL}/api/v1/admin/customers/${customerId}/renewals`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    await loadRenewals();
  }

  async function handleUpdateRenewal(
    renewalId: string,
    input: Partial<{ name: string; dueDate: string; amount: string; status: Renewal["status"]; renewalType?: string; notes?: string }>
  ) {
    const payload: Record<string, unknown> = {};
    if (typeof input.name === "string" && input.name.trim()) payload.name = input.name.trim();
    if (typeof input.dueDate === "string") {
      const dueDate = toApiDateString(input.dueDate);
      if (dueDate) payload.dueDate = dueDate;
    }
    if (typeof input.amount === "string") payload.amount = parseAmountDisplayInput(input.amount);
    if (input.status) payload.status = input.status;
    if (typeof input.renewalType === "string") payload.renewalType = input.renewalType.trim() || null;
    if (typeof input.notes === "string") payload.notes = input.notes.trim() || null;
    if (Object.keys(payload).length === 0) return;

    await authJson(`${API_BASE_URL}/api/v1/admin/customers/${customerId}/renewals/${renewalId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    await loadRenewals();
  }

  async function handleDeleteRenewal(renewalId: string) {
    await authJson(`${API_BASE_URL}/api/v1/admin/customers/${customerId}/renewals/${renewalId}`, {
      method: "DELETE",
    });
    await loadRenewals();
  }

  async function handleViewServiceRequest(requestId: string): Promise<{ request: ServiceRequest; activity?: AdminServiceRequestActivityApi[] }> {
    const [detailRes, activityRes] = await Promise.all([
      authJson<{ data?: AdminServiceRequestApi }>(
        `${API_BASE_URL}/api/v1/admin/customers/${customerId}/service-requests/${requestId}`
      ),
      authJson<{ data?: AdminServiceRequestActivityApi[] }>(
        `${API_BASE_URL}/api/v1/admin/customers/${customerId}/service-requests/${requestId}/activity`
      ).catch(() => ({ data: [] })),
    ]);

    const detail = detailRes.data;
    if (!detail) throw new Error("Service request details not found");
    return {
      request: mapServiceRequestsToUi([detail])[0],
      activity: activityRes.data ?? [],
    };
  }

  async function handleSaveServiceRequest(
    requestId: string,
    input: Partial<Pick<ServiceRequest, "status" | "adminNotes" | "internalNotes" | "assignedToAdminId" | "priority">>
  ) {
    const payload: Record<string, unknown> = {};
    if (input.status) payload.status = input.status;
    if (typeof input.adminNotes === "string") payload.adminNotes = input.adminNotes.trim() || null;
    if (typeof input.internalNotes === "string") payload.internalNotes = input.internalNotes.trim() || null;
    if (typeof input.assignedToAdminId === "number") payload.assignedToAdminId = input.assignedToAdminId;
    if (input.assignedToAdminId === null) payload.assignedToAdminId = null;
    if (input.priority) payload.priority = input.priority;
    if (Object.keys(payload).length === 0) return;

    await authJson(`${API_BASE_URL}/api/v1/admin/customers/${customerId}/service-requests/${requestId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    await loadServiceRequests();
  }

  async function getCompanyDocumentUrl(doc: CompanyDocument) {
    if (doc.status === "pending_upload") {
      throw new Error("Document is still uploading and cannot be downloaded yet.");
    }

    let downloadUrl: string | undefined;

    try {
      const res = await authJson<
        { data?: { downloadUrl?: string; signedUrl?: string; url?: string } } |
        { downloadUrl?: string; signedUrl?: string; url?: string }
      >(
        `${API_BASE_URL}/api/v1/admin/customers/${customerId}/documents/${doc.id}/download-url`
      );
      const anyRes = res as {
        data?: { downloadUrl?: string; signedUrl?: string; url?: string };
        downloadUrl?: string;
        signedUrl?: string;
        url?: string;
      };
      downloadUrl =
        anyRes.data?.downloadUrl ||
        anyRes.data?.signedUrl ||
        anyRes.data?.url ||
        anyRes.downloadUrl ||
        anyRes.signedUrl ||
        anyRes.url;
    } catch {
      // Fallback to file URL from list response if signed download endpoint is unavailable/fails.
      downloadUrl = doc.url;
    }

    if (!downloadUrl) throw new Error("Download URL not available for this document");

    return downloadUrl;
  }

  function getDownloadFileName(doc: CompanyDocument) {
    const trimmed = doc.name.trim() || "document";
    const hasExtension = /\.[a-zA-Z0-9]{2,8}$/.test(trimmed);
    if (hasExtension) return trimmed;

    const extByType: Record<string, string> = {
      certificate_of_incorporation: ".pdf",
      business_registration_certificate: ".pdf",
      articles_of_association: ".pdf",
      annual_return: ".pdf",
      board_resolution: ".pdf",
    };
    return `${trimmed}${extByType[doc.documentType || ""] || ""}`;
  }

  async function handlePreviewCompanyDocument(doc: CompanyDocument) {
    const previewUrl = await getCompanyDocumentUrl(doc);
    const anchor = document.createElement("a");
    anchor.href = previewUrl;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }

  async function handleDownloadCompanyDocument(doc: CompanyDocument) {
    const downloadUrl = await getCompanyDocumentUrl(doc);

    try {
      const res = await fetch(downloadUrl);
      if (!res.ok) throw new Error(`Download failed (${res.status})`);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = getDownloadFileName(doc);
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      return;
    } catch {
      // Fallback if blob download is blocked by CORS/browser restrictions.
    }

    const anchor = document.createElement("a");
    anchor.href = downloadUrl;
    anchor.download = getDownloadFileName(doc);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <LuArrowLeft className="w-5 h-5" />
          </button>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${avatarCls}`}>
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {customer.firstName} {customer.lastName}
              </h1>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${customer.active ? "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400" : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"}`}>
                {customer.active ? "Active" : "Inactive"}
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusStyle(customer.registrationStatus)}`}>
                {customer.registrationStatus.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {customer.email} · {customer.companyName}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center p-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-theme-xs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
              activeTab === tab.key
                ? "bg-white dark:bg-gray-800 text-brand-600 dark:text-brand-400 shadow-theme-sm border border-gray-200 dark:border-gray-700"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "profile" && (
        <CompanyProfileTab
          profile={initialProfile}
          directors={initialDirectors}
          shareholders={initialShareholders}
          onSaveProfile={handleSaveCompanyProfile}
          onSaveDirectors={handleSaveDirectors}
          onSaveShareholders={handleSaveShareholders}
        />
      )}
      {activeTab === "documents" && (
        <DocumentsTab
          docs={docs}
          loading={docsLoading}
          onUploadDocument={handleUploadCompanyDocument}
          onDeleteDocument={handleDeleteCompanyDocument}
          onPreviewDocument={handlePreviewCompanyDocument}
          onDownloadDocument={handleDownloadCompanyDocument}
        />
      )}
      {activeTab === "renewals" && (
        <RenewalsTab
          renewals={renewals}
          loading={renewalsLoading}
          onCreateRenewal={handleCreateRenewal}
          onUpdateRenewal={handleUpdateRenewal}
          onDeleteRenewal={handleDeleteRenewal}
        />
      )}
      {activeTab === "service-requests" && (
        <ServiceRequestsTab
          requests={serviceRequests}
          loading={serviceRequestsLoading}
          onViewRequest={handleViewServiceRequest}
          onSaveRequest={handleSaveServiceRequest}
        />
      )}
    </div>
  );
}
