"use client";

import React, { useState } from "react";
import { useRouter, useParams } from "next/navigation";
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

// ─── Dummy data lookup ─────────────────────────────────────────────────────────

const DUMMY_CUSTOMERS = [
  { id: 1,  firstName: "James",    lastName: "Whitfield",  email: "james.whitfield@gmail.com",    companyName: "Whitfield Holdings Ltd",      companyType: "Private Limited",  countryOfIncorporation: "Hong Kong",    registrationStatus: "completed",   active: true },
  { id: 2,  firstName: "Priya",    lastName: "Sharma",     email: "priya.sharma@techvision.io",   companyName: "TechVision Innovations",      companyType: "Private Limited",  countryOfIncorporation: "Singapore",   registrationStatus: "in-progress", active: true },
  { id: 3,  firstName: "Marcus",   lastName: "Chen",       email: "marcus.chen@alphagroup.hk",    companyName: "Alpha Group International",   companyType: "Public Limited",   countryOfIncorporation: "Hong Kong",   registrationStatus: "completed",   active: true },
  { id: 4,  firstName: "Fatima",   lastName: "Al-Hassan",  email: "fatima@alhassan-ventures.ae",  companyName: "Al-Hassan Ventures",          companyType: "LLC",              countryOfIncorporation: "UAE",         registrationStatus: "pending",     active: true },
  { id: 5,  firstName: "Oliver",   lastName: "Sutton",     email: "oliver.sutton@suttonlaw.co.uk",companyName: "Sutton Legal Consultancy",    companyType: "Partnership",      countryOfIncorporation: "UK",          registrationStatus: "completed",   active: false },
  { id: 6,  firstName: "Mei",      lastName: "Zhang",      email: "mei.zhang@zhanginvest.com",    companyName: "Zhang Investment Group",      companyType: "Private Limited",  countryOfIncorporation: "Hong Kong",   registrationStatus: "in-progress", active: true },
  { id: 7,  firstName: "Sebastien",lastName: "Dubois",     email: "s.dubois@europartners.fr",     companyName: "Euro Partners SAS",           companyType: "SAS",              countryOfIncorporation: "France",      registrationStatus: "pending",     active: true },
  { id: 8,  firstName: "Amara",    lastName: "Okonkwo",    email: "amara.okonkwo@nexafin.ng",     companyName: "NexaFin Solutions",           companyType: "Private Limited",  countryOfIncorporation: "Nigeria",     registrationStatus: "completed",   active: true },
  { id: 9,  firstName: "Daniel",   lastName: "Park",       email: "dpark@koreasmart.co.kr",       companyName: "Korea Smart Technology",      companyType: "Corporation",      countryOfIncorporation: "South Korea", registrationStatus: "in-progress", active: true },
  { id: 10, firstName: "Sofia",    lastName: "Monteiro",   email: "sofia.m@monteiro-group.br",    companyName: "Monteiro Group Ltda",         companyType: "Ltda",             countryOfIncorporation: "Brazil",      registrationStatus: "pending",     active: false },
  { id: 11, firstName: "Raj",      lastName: "Patel",      email: "raj.patel@pateltrade.in",      companyName: "Patel Trade & Commerce",      companyType: "Private Limited",  countryOfIncorporation: "India",       registrationStatus: "completed",   active: true },
  { id: 12, firstName: "Elena",    lastName: "Kovach",     email: "e.kovach@kovachcap.ua",        companyName: "Kovach Capital Partners",     companyType: "LLC",              countryOfIncorporation: "Ukraine",     registrationStatus: "in-progress", active: true },
  { id: 13, firstName: "Thomas",   lastName: "Bergmann",   email: "t.bergmann@bergmann-gmbh.de",  companyName: "Bergmann GmbH",               companyType: "GmbH",             countryOfIncorporation: "Germany",     registrationStatus: "completed",   active: true },
  { id: 14, firstName: "Laila",    lastName: "Rahimi",     email: "laila.rahimi@rahimire.ae",     companyName: "Rahimi Real Estate",          companyType: "LLC",              countryOfIncorporation: "UAE",         registrationStatus: "pending",     active: true },
  { id: 15, firstName: "Kevin",    lastName: "Osei",       email: "kevin.osei@oseilogistics.gh",  companyName: "Osei Logistics Ltd",          companyType: "Private Limited",  countryOfIncorporation: "Ghana",       registrationStatus: "completed",   active: true },
  { id: 16, firstName: "Yuki",     lastName: "Tanaka",     email: "yuki.tanaka@tanaka-hd.jp",     companyName: "Tanaka Holdings Co.",         companyType: "KK",               countryOfIncorporation: "Japan",       registrationStatus: "in-progress", active: true },
  { id: 17, firstName: "Camille",  lastName: "Fontaine",   email: "camille.f@fontainelux.fr",     companyName: "Fontaine Luxe SAS",           companyType: "SAS",              countryOfIncorporation: "France",      registrationStatus: "completed",   active: false },
  { id: 18, firstName: "Arjun",    lastName: "Mehta",      email: "arjun.mehta@mehtacorp.in",     companyName: "Mehta Corporation",           companyType: "Private Limited",  countryOfIncorporation: "India",       registrationStatus: "pending",     active: true },
  { id: 19, firstName: "Isabella", lastName: "Rossi",      email: "i.rossi@rossi-ventures.it",    companyName: "Rossi Ventures SpA",          companyType: "SpA",              countryOfIncorporation: "Italy",       registrationStatus: "completed",   active: true },
  { id: 20, firstName: "Ahmed",    lastName: "Al-Farsi",   email: "ahmed.alfarsi@alfarsico.om",   companyName: "Al-Farsi Investments Co.",    companyType: "LLC",              countryOfIncorporation: "Oman",        registrationStatus: "in-progress", active: true },
];

// ─── Types ─────────────────────────────────────────────────────────────────────

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
  name: string;
  title: string;
  idNumber: string;
  since: string;
}

interface Shareholder {
  id: string;
  name: string;
  shares: string;
  percentage: number;
}

interface CompanyDocument {
  id: string;
  name: string;
  category: string;
  size: string;
  date: string;
  url?: string;
}

interface Renewal {
  id: string;
  name: string;
  dueDate: string;
  amount: string;
  status: "upcoming" | "pending" | "current" | "overdue";
}

interface ServiceRequest {
  id: string;
  type: string;
  description: string;
  status: "pending" | "in-progress" | "completed" | "rejected";
  requestedDate: string;
  updatedDate: string;
  adminNotes?: string;
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

function CompanyProfileTab({ profile, directors, shareholders }: {
  profile: CompanyProfile;
  directors: Director[];
  shareholders: Shareholder[];
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

  function saveProfile() {
    setSavingProfile(true);
    setTimeout(() => { setSavingProfile(false); setEditingProfile(false); }, 600);
  }

  function saveDirectors() {
    setSavingDirectors(true);
    setTimeout(() => { setSavingDirectors(false); setEditingDirectors(false); }, 600);
  }

  function saveShareholders() {
    setSavingShareholders(true);
    setTimeout(() => { setSavingShareholders(false); setEditingShareholders(false); }, 600);
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
        onSave={saveProfile}
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
          onSave={saveDirectors}
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
                      <div className="flex items-center gap-4 mt-1.5 text-xs">
                        <span className="text-gray-500">ID: <span className="text-gray-700 dark:text-gray-300">{d.idNumber}</span></span>
                        <span className="text-gray-500">Since: <span className="text-gray-700 dark:text-gray-300">{d.since}</span></span>
                      </div>
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
          onSave={saveShareholders}
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

function DocumentsTab({ docs, onDocsChange }: { docs: CompanyDocument[]; onDocsChange: (d: CompanyDocument[]) => void }) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newDocName, setNewDocName] = useState("");
  const [newDocCategory, setNewDocCategory] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const DOC_CATEGORIES = [
    "Incorporation", "Registration", "Constitution", "Shares",
    "Statutory", "Tax", "Banking", "Other",
  ];

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setPendingFile(file);
    setNewDocName(file.name.replace(/\.[^.]+$/, ""));
    setNewDocCategory("Other");
    setShowUploadModal(true);
  }

  function formatBytes(b: number) {
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
    return `${(b / (1024 * 1024)).toFixed(1)} MB`;
  }

  function handleUploadConfirm() {
    if (!pendingFile || !newDocName.trim()) return;
    setUploading(true);
    setTimeout(() => {
      const newDoc: CompanyDocument = {
        id: `doc-${Date.now()}`,
        name: newDocName.trim(),
        category: newDocCategory || "Other",
        size: formatBytes(pendingFile.size),
        date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "numeric", year: "numeric" }),
      };
      onDocsChange([...docs, newDoc]);
      setUploading(false);
      setShowUploadModal(false);
      setPendingFile(null);
      setNewDocName("");
      setNewDocCategory("");
    }, 800);
  }

  function handleRemove(id: string) {
    onDocsChange(docs.filter((d) => d.id !== id));
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
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors"
        >
          <LuUpload className="w-4 h-4" /> Upload Document
        </button>
        <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={handleFileSelect} />
      </div>

      <div className="p-6">
        {docs.length === 0 ? (
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
                  <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <LuDownload className="w-3.5 h-3.5" /> Download
                  </button>
                  <button onClick={() => handleRemove(doc.id)} className="p-1.5 text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                    <LuTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload confirm modal */}
      {showUploadModal && pendingFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Upload Document</h3>
              <button onClick={() => { setShowUploadModal(false); setPendingFile(null); }} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors">
                <LuX className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 p-3 bg-brand-50 dark:bg-brand-500/10 rounded-lg border border-brand-200 dark:border-brand-500/30">
                <LuFileText className="w-5 h-5 text-brand-600 dark:text-brand-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{pendingFile.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{(pendingFile.size / 1024).toFixed(0)} KB</p>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Document Name</label>
                <input type="text" value={newDocName} onChange={(e) => setNewDocName(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Category</label>
                <select value={newDocCategory} onChange={(e) => setNewDocCategory(e.target.value)} className={inputCls}>
                  {DOC_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              <button onClick={() => { setShowUploadModal(false); setPendingFile(null); }} className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancel</button>
              <button onClick={handleUploadConfirm} disabled={uploading || !newDocName.trim()} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 disabled:opacity-50 rounded-lg transition-colors">
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

function RenewalsTab({ renewals, onRenewalsChange }: { renewals: Renewal[]; onRenewalsChange: (r: Renewal[]) => void }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<Renewal>>({});

  function openAdd() { setDraft({ name: "", dueDate: "", amount: "", status: "upcoming" }); setShowAddModal(true); }

  function saveNew() {
    if (!draft.name?.trim()) return;
    const r: Renewal = { id: `ren-${Date.now()}`, name: draft.name!, dueDate: draft.dueDate || "", amount: draft.amount || "", status: draft.status as Renewal["status"] || "upcoming" };
    onRenewalsChange([...renewals, r]);
    setShowAddModal(false);
    setDraft({});
  }

  function startEdit(r: Renewal) { setEditingId(r.id); setDraft({ ...r }); }
  function cancelEdit() { setEditingId(null); setDraft({}); }
  function saveEdit(id: string) {
    onRenewalsChange(renewals.map((r) => r.id === id ? { ...r, ...draft } as Renewal : r));
    setEditingId(null); setDraft({});
  }

  function removeRenewal(id: string) { onRenewalsChange(renewals.filter((r) => r.id !== id)); }

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
        {renewals.length === 0 ? (
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
                        <button onClick={cancelEdit} className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"><LuX className="w-4 h-4" /></button>
                        <button onClick={() => saveEdit(r.id)} className="p-1.5 text-success-600 hover:bg-success-50 dark:hover:bg-success-500/10 rounded-lg transition-colors"><LuCheck className="w-4 h-4" /></button>
                      </>
                    ) : (
                      <>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.cls}`}>{cfg.label}</span>
                        <button onClick={() => startEdit(r)} className="p-1.5 text-gray-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                          <LuPencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => removeRenewal(r.id)} className="p-1.5 text-gray-400 hover:text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                          <LuTrash2 className="w-4 h-4" />
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
              <button onClick={saveNew} disabled={!draft.name?.trim()} className="px-4 py-2 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 disabled:opacity-50 rounded-lg transition-colors">Add Renewal</button>
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

function ServiceRequestsTab({ requests, onRequestsChange }: { requests: ServiceRequest[]; onRequestsChange: (r: ServiceRequest[]) => void }) {
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [adminNotesDraft, setAdminNotesDraft] = useState("");
  const [statusDraft, setStatusDraft] = useState<ServiceRequest["status"]>("pending");

  const viewing = requests.find((r) => r.id === viewingId) ?? null;

  function openView(r: ServiceRequest) {
    setViewingId(r.id);
    setAdminNotesDraft(r.adminNotes ?? "");
    setStatusDraft(r.status);
  }

  function saveView() {
    onRequestsChange(requests.map((r) => r.id === viewingId ? { ...r, status: statusDraft, adminNotes: adminNotesDraft, updatedDate: new Date().toLocaleDateString("en-GB") } : r));
    setViewingId(null);
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
        {requests.length === 0 ? (
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
                    onClick={() => openView(r)}
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
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              <button onClick={() => setViewingId(null)} className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancel</button>
              <button onClick={saveView} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors">
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

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = Number(params.id);

  const customer = DUMMY_CUSTOMERS.find((c) => c.id === customerId);

  const [activeTab, setActiveTab] = useState<TabKey>("profile");

  const [docs, setDocs] = useState<CompanyDocument[]>([
    { id: "doc-1", name: "Certificate of Incorporation",     category: "Incorporation", size: "245 KB", date: "15/1/2020" },
    { id: "doc-2", name: "Business Registration Certificate",category: "Registration",  size: "189 KB", date: "30/4/2025" },
    { id: "doc-3", name: "Memorandum & Articles of Association", category: "Constitution", size: "1.2 MB", date: "15/1/2020" },
    { id: "doc-4", name: "Share Certificates",               category: "Shares",        size: "456 KB", date: "20/3/2021" },
    { id: "doc-5", name: "Annual Return 2024",               category: "Statutory",     size: "678 KB", date: "15/3/2025" },
  ]);

  const [renewals, setRenewals] = useState<Renewal[]>([
    { id: "ren-1", name: "Business Registration",    dueDate: "30/4/2026", amount: "HKD 2,200", status: "upcoming" },
    { id: "ren-2", name: "Annual Return Filing",     dueDate: "1/3/2026",  amount: "HKD 105",   status: "pending" },
    { id: "ren-3", name: "Registered Office Renewal",dueDate: "31/12/2026",amount: "HKD 3,600", status: "current" },
  ]);

  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([
    { id: "SR-2026-001", type: "Change of Directors",      description: "Request to appoint new director – Michael Lee",                  status: "pending",     requestedDate: "5/1/2026",  updatedDate: "6/1/2026" },
    { id: "SR-2025-045", type: "Registered Address Update", description: "Update registered office address to new premises",             status: "in-progress", requestedDate: "20/12/2025",updatedDate: "4/1/2026" },
    { id: "SR-2025-038", type: "Share Transfer",            description: "Transfer 1000 shares from David Wong to Sarah Chen",           status: "completed",   requestedDate: "10/12/2025",updatedDate: "28/12/2025" },
    { id: "SR-2025-029", type: "Company Name Change",       description: "Changed company name from Tech Ltd to Tech Innovations Ltd",   status: "completed",   requestedDate: "15/11/2025",updatedDate: "30/11/2025" },
  ]);

  if (!customer) {
    return (
      <div className="space-y-4">
        <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
          <LuArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="p-6 bg-error-50 dark:bg-error-500/10 border border-error-200 dark:border-error-500/20 rounded-xl">
          <p className="text-sm font-medium text-error-700 dark:text-error-400">Customer not found.</p>
        </div>
      </div>
    );
  }

  const initials = `${customer.firstName.charAt(0)}${customer.lastName.charAt(0)}`.toUpperCase();
  const avatarCls = AVATAR_COLORS[customer.id % AVATAR_COLORS.length];

  // ── Per-customer initial data (managed internally by CompanyProfileTab) ───────
  const initialProfile: CompanyProfile = {
    companyName:        customer.companyName,
    registrationNumber: `BR-${customerId}-2024-HK`,
    incorporationDate:  "15 January 2020",
    businessNature:     "Professional Services",
    email:              customer.email,
    phone:              "+852 2345 6789",
    address:            "Unit 12F, Central Tower, 123 Queen's Road Central, Hong Kong",
    companyType:        customer.companyType,
    country:            customer.countryOfIncorporation,
  };

  const initialDirectors: Director[] = [
    { id: "dir-1", name: "David Wong", title: "Managing Director",  idNumber: "A1234567", since: "15/1/2020" },
    { id: "dir-2", name: "Sarah Chen", title: "Executive Director", idNumber: "B9876543", since: "20/3/2021" },
  ];

  const initialShareholders: Shareholder[] = [
    { id: "sh-1", name: "David Wong",              shares: "5,000 Ordinary Shares", percentage: 50 },
    { id: "sh-2", name: "Sarah Chen",              shares: "3,000 Ordinary Shares", percentage: 30 },
    { id: "sh-3", name: "Innovation Holdings Ltd", shares: "2,000 Ordinary Shares", percentage: 20 },
  ];

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
        />
      )}
      {activeTab === "documents" && (
        <DocumentsTab docs={docs} onDocsChange={setDocs} />
      )}
      {activeTab === "renewals" && (
        <RenewalsTab renewals={renewals} onRenewalsChange={setRenewals} />
      )}
      {activeTab === "service-requests" && (
        <ServiceRequestsTab requests={serviceRequests} onRequestsChange={setServiceRequests} />
      )}
    </div>
  );
}
