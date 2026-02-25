"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authFetch, API_BASE_URL } from "@/lib/auth";
import {
  LuSearch,
  LuBuilding2,
  LuExternalLink,
  LuChevronLeft,
  LuChevronRight,
  LuInbox,
  LuFilter,
  LuX,
  LuPlus,
  LuUser,
  LuMail,
  LuPhone,
  LuMapPin,
  LuLock,
  LuEye,
  LuEyeOff,
  LuFileText,
  LuImage,
  LuUpload,
  LuTrash2,
  LuReplace,
  LuCheck,
  LuRefreshCw,
  LuArrowLeft,
  LuChevronDown,
} from "react-icons/lu";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CustomerListItem {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  companyName: string;
  companyType: string | null;
  countryOfIncorporation: string | null;
  registrationStatus: "pending" | "in-progress" | "completed";
  registrationId: string | null;
  createdAt: string;
  active: boolean;
}

// ─── API Registration Types ───────────────────────────────────────────────────

interface ApiRegistration {
  id: string;
  clientName: string;
  clientEmail: string;
  phone: string;
  type: string;
  status: string;
}

interface ApiRegistrationDetail {
  id: string;
  clientName: string;
  clientEmail: string;
  phone: string;
  proposedCompanyName: string;
  natureOfBusiness: string[];
  applicantEmail: string;
  applicantPhone: string;
  billingStreet: string;
  billingCity: string;
  billingState: string;
  billingPostalCode: string;
  billingCountry: string;
  stakeholders: Array<{
    fullName: string;
    companyName: string | null;
    roles: string[];
    sharePercentage: number | null;
    numberOfShares: number | null;
  }>;
}

// ─── Dummy Customers ──────────────────────────────────────────────────────────

const DUMMY_CUSTOMERS: CustomerListItem[] = [
  { id: 1,  firstName: "James",    lastName: "Whitfield",  email: "james.whitfield@gmail.com",    companyName: "Whitfield Holdings Ltd",    companyType: "Private Limited", countryOfIncorporation: "Hong Kong",    registrationStatus: "completed",   registrationId: "reg-001", createdAt: "2024-08-12T10:30:00Z", active: true },
  { id: 2,  firstName: "Priya",    lastName: "Sharma",     email: "priya.sharma@techvision.io",   companyName: "TechVision Innovations",    companyType: "Private Limited", countryOfIncorporation: "Singapore",   registrationStatus: "in-progress", registrationId: "reg-002", createdAt: "2024-09-03T08:00:00Z", active: true },
  { id: 3,  firstName: "Marcus",   lastName: "Chen",       email: "marcus.chen@alphagroup.hk",    companyName: "Alpha Group International", companyType: "Public Limited",  countryOfIncorporation: "Hong Kong",   registrationStatus: "completed",   registrationId: "reg-003", createdAt: "2024-07-21T14:15:00Z", active: true },
  { id: 4,  firstName: "Fatima",   lastName: "Al-Hassan",  email: "fatima@alhassan-ventures.ae",  companyName: "Al-Hassan Ventures",        companyType: "LLC",             countryOfIncorporation: "UAE",         registrationStatus: "pending",     registrationId: "reg-004", createdAt: "2024-11-05T09:45:00Z", active: true },
  { id: 5,  firstName: "Oliver",   lastName: "Sutton",     email: "oliver.sutton@suttonlaw.co.uk",companyName: "Sutton Legal Consultancy",  companyType: "Partnership",     countryOfIncorporation: "UK",          registrationStatus: "completed",   registrationId: "reg-005", createdAt: "2024-06-18T11:00:00Z", active: false },
  { id: 6,  firstName: "Mei",      lastName: "Zhang",      email: "mei.zhang@zhanginvest.com",    companyName: "Zhang Investment Group",    companyType: "Private Limited", countryOfIncorporation: "Hong Kong",   registrationStatus: "in-progress", registrationId: "reg-006", createdAt: "2024-10-29T07:30:00Z", active: true },
  { id: 7,  firstName: "Sebastien",lastName: "Dubois",     email: "s.dubois@europartners.fr",     companyName: "Euro Partners SAS",         companyType: "SAS",             countryOfIncorporation: "France",      registrationStatus: "pending",     registrationId: "reg-007", createdAt: "2024-12-01T13:00:00Z", active: true },
  { id: 8,  firstName: "Amara",    lastName: "Okonkwo",    email: "amara.okonkwo@nexafin.ng",     companyName: "NexaFin Solutions",         companyType: "Private Limited", countryOfIncorporation: "Nigeria",     registrationStatus: "completed",   registrationId: "reg-008", createdAt: "2024-08-30T16:20:00Z", active: true },
  { id: 9,  firstName: "Daniel",   lastName: "Park",       email: "dpark@koreasmart.co.kr",       companyName: "Korea Smart Technology",    companyType: "Corporation",     countryOfIncorporation: "South Korea", registrationStatus: "in-progress", registrationId: "reg-009", createdAt: "2024-09-15T10:10:00Z", active: true },
  { id: 10, firstName: "Sofia",    lastName: "Monteiro",   email: "sofia.m@monteiro-group.br",    companyName: "Monteiro Group Ltda",       companyType: "Ltda",            countryOfIncorporation: "Brazil",      registrationStatus: "pending",     registrationId: "reg-010", createdAt: "2024-11-22T12:00:00Z", active: false },
  { id: 11, firstName: "Raj",      lastName: "Patel",      email: "raj.patel@pateltrade.in",      companyName: "Patel Trade & Commerce",    companyType: "Private Limited", countryOfIncorporation: "India",       registrationStatus: "completed",   registrationId: "reg-011", createdAt: "2024-07-08T09:00:00Z", active: true },
  { id: 12, firstName: "Elena",    lastName: "Kovach",     email: "e.kovach@kovachcap.ua",        companyName: "Kovach Capital Partners",   companyType: "LLC",             countryOfIncorporation: "Ukraine",     registrationStatus: "in-progress", registrationId: "reg-012", createdAt: "2024-10-11T15:30:00Z", active: true },
  { id: 13, firstName: "Thomas",   lastName: "Bergmann",   email: "t.bergmann@bergmann-gmbh.de",  companyName: "Bergmann GmbH",             companyType: "GmbH",            countryOfIncorporation: "Germany",     registrationStatus: "completed",   registrationId: "reg-013", createdAt: "2024-05-25T11:45:00Z", active: true },
  { id: 14, firstName: "Laila",    lastName: "Rahimi",     email: "laila.rahimi@rahimire.ae",     companyName: "Rahimi Real Estate",        companyType: "LLC",             countryOfIncorporation: "UAE",         registrationStatus: "pending",     registrationId: "reg-014", createdAt: "2024-12-08T08:00:00Z", active: true },
  { id: 15, firstName: "Kevin",    lastName: "Osei",       email: "kevin.osei@oseilogistics.gh",  companyName: "Osei Logistics Ltd",        companyType: "Private Limited", countryOfIncorporation: "Ghana",       registrationStatus: "completed",   registrationId: "reg-015", createdAt: "2024-09-27T14:00:00Z", active: true },
  { id: 16, firstName: "Yuki",     lastName: "Tanaka",     email: "yuki.tanaka@tanaka-hd.jp",     companyName: "Tanaka Holdings Co.",       companyType: "KK",              countryOfIncorporation: "Japan",       registrationStatus: "in-progress", registrationId: "reg-016", createdAt: "2024-10-05T09:20:00Z", active: true },
  { id: 17, firstName: "Camille",  lastName: "Fontaine",   email: "camille.f@fontainelux.fr",     companyName: "Fontaine Luxe SAS",         companyType: "SAS",             countryOfIncorporation: "France",      registrationStatus: "completed",   registrationId: "reg-017", createdAt: "2024-06-02T10:00:00Z", active: false },
  { id: 18, firstName: "Arjun",    lastName: "Mehta",      email: "arjun.mehta@mehtacorp.in",     companyName: "Mehta Corporation",         companyType: "Private Limited", countryOfIncorporation: "India",       registrationStatus: "pending",     registrationId: "reg-018", createdAt: "2024-11-14T13:30:00Z", active: true },
  { id: 19, firstName: "Isabella", lastName: "Rossi",      email: "i.rossi@rossi-ventures.it",    companyName: "Rossi Ventures SpA",        companyType: "SpA",             countryOfIncorporation: "Italy",       registrationStatus: "completed",   registrationId: "reg-019", createdAt: "2024-08-19T11:15:00Z", active: true },
  { id: 20, firstName: "Ahmed",    lastName: "Al-Farsi",   email: "ahmed.alfarsi@alfarsico.om",   companyName: "Al-Farsi Investments Co.",  companyType: "LLC",             countryOfIncorporation: "Oman",        registrationStatus: "in-progress", registrationId: "reg-020", createdAt: "2024-07-30T08:45:00Z", active: true },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

function isValidEmail(e: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

function getStatusStyle(status: CustomerListItem["registrationStatus"]) {
  switch (status) {
    case "completed":   return "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400";
    case "in-progress": return "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400";
    case "pending":     return "bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400";
  }
}

function formatStatus(s: string) {
  return s.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function getInitials(first: string, last: string) {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

const AVATAR_COLORS = [
  "bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300",
  "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
];

function avatarColor(id: number) {
  return AVATAR_COLORS[id % AVATAR_COLORS.length];
}

const STATUS_OPTIONS = [
  { label: "All Statuses", value: "" },
  { label: "Pending",      value: "pending" },
  { label: "In Progress",  value: "in-progress" },
  { label: "Completed",    value: "completed" },
];

// ─── Shared input styles ──────────────────────────────────────────────────────

const inputCls    = "w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all placeholder-gray-400";
const inputErrCls = "w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-error-400 dark:border-error-500 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-error-400 focus:border-transparent transition-all placeholder-gray-400";

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: 1 | 2 }) {
  return (
    <div className="flex items-center gap-2 px-6 pt-4 shrink-0">
      <div className="flex items-center gap-1.5">
        <div className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${step === 1 ? "bg-brand-500 text-white" : "bg-success-500 text-white"}`}>
          {step === 1 ? "1" : <LuCheck className="w-3.5 h-3.5" />}
        </div>
        <span className={`text-xs font-medium ${step === 1 ? "text-brand-600 dark:text-brand-400" : "text-success-600 dark:text-success-400"}`}>Customer Login</span>
      </div>
      <div className={`flex-1 h-px ${step === 2 ? "bg-brand-400" : "bg-gray-200 dark:bg-gray-700"}`} />
      <div className="flex items-center gap-1.5">
        <div className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${step === 2 ? "bg-brand-500 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"}`}>2</div>
        <span className={`text-xs ${step === 2 ? "font-medium text-brand-600 dark:text-brand-400" : "text-gray-500 dark:text-gray-400"}`}>Company Setup</span>
      </div>
    </div>
  );
}

// ─── Document Upload Field ────────────────────────────────────────────────────

interface CompanyDocFile { file: File; preview: string; }

const COMP_DOC_MIME = ["application/pdf", "image/jpeg", "image/jpg", "image/png", "image/webp"];
const COMP_DOC_MAX  = 10 * 1024 * 1024;

function CompanyDocUploadField({ label, description, value, onChange }: {
  label: string; description?: string;
  value: CompanyDocFile | null; onChange: (v: CompanyDocFile | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!COMP_DOC_MIME.includes(file.type)) { alert("Allowed: PDF, JPEG, PNG, WEBP"); return; }
    if (file.size > COMP_DOC_MAX) { alert("Max file size: 10 MB"); return; }
    e.target.value = "";
    onChange({ file, preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : "" });
  }

  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">{label}</label>
      {description && <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">{description}</p>}
      <input ref={inputRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={handleFile} />
      {value ? (
        <div className="flex items-center justify-between p-3 bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/30 rounded-lg">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 flex items-center justify-center rounded-md bg-brand-100 dark:bg-brand-500/20 shrink-0">
              {value.file.type.startsWith("image/") ? <LuImage className="w-4 h-4 text-brand-600 dark:text-brand-400" /> : <LuFileText className="w-4 h-4 text-brand-600 dark:text-brand-400" />}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{value.file.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{formatBytes(value.file.size)}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-2">
            <button type="button" onClick={() => inputRef.current?.click()} className="p-1.5 text-brand-500 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors" title="Replace">
              <LuReplace className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={() => onChange(null)} className="p-1.5 text-error-500 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors" title="Remove">
              <LuTrash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()} className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-brand-400 dark:hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/5 text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-all text-xs font-medium">
          <LuUpload className="w-4 h-4" /> Upload document
        </button>
      )}
    </div>
  );
}

// ─── Modal Forms ──────────────────────────────────────────────────────────────

interface CreateLoginForm {
  registrationId: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface ShareholderEntry {
  name: string;
  percentage: string;
}

interface CompanySetupForm {
  companyName: string;
  businessNature: string;
  businessEmail: string;
  phoneNumber: string;
  registeredOfficeAddress: string;
  directors: string;
  shareholders: ShareholderEntry[];
  certificateOfIncorporation: CompanyDocFile | null;
  businessRegistration: CompanyDocFile | null;
  articlesOfAssociation: CompanyDocFile | null;
  annualReturn: CompanyDocFile | null;
  boardResolution: CompanyDocFile | null;
  otherDocuments: CompanyDocFile | null;
}

// ─── Modal Step 1: Create Customer Login ──────────────────────────────────────

function CreateLoginModal({ onNext, onClose }: {
  onNext: (form: CreateLoginForm, detail: ApiRegistrationDetail | null) => void;
  onClose: () => void;
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [form, setForm] = useState<CreateLoginForm>({
    registrationId: "", firstName: "", lastName: "", email: "",
    password: "", confirmPassword: "",
  });
  const [touched, setTouched]           = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);

  // Real registrations from API
  const [registrations, setRegistrations] = useState<ApiRegistration[]>([]);
  const [regsLoading, setRegsLoading]     = useState(true);
  const [regsError, setRegsError]         = useState("");

  // Full detail fetched when a registration is selected
  const [selectedDetail, setSelectedDetail]   = useState<ApiRegistrationDetail | null>(null);
  const [detailLoading, setDetailLoading]     = useState(false);

  // Fetch registrations list on mount
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setRegsLoading(true);
      setRegsError("");
      try {
        const res = await authFetch(`${API_BASE_URL}/api/v1/registrations?limit=100&page=1`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load registrations");
        if (!cancelled) setRegistrations(data.registrations ?? []);
      } catch (err) {
        if (!cancelled) setRegsError(err instanceof Error ? err.message : "Failed to load registrations");
      } finally {
        if (!cancelled) setRegsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const selectedReg = registrations.find((r) => r.id === form.registrationId) ?? null;

  async function selectRegistration(reg: ApiRegistration) {
    setDropdownOpen(false);
    // Parse clientName into first/last
    const parts = (reg.clientName ?? "").trim().split(/\s+/);
    const firstName = parts[0] ?? "";
    const lastName  = parts.slice(1).join(" ");
    setForm((f) => ({
      ...f,
      registrationId: reg.id,
      firstName,
      lastName,
      email: reg.clientEmail,
    }));

    // Fetch full detail for Step 2
    setDetailLoading(true);
    setSelectedDetail(null);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/v1/registrations/${reg.id}`);
      const data = await res.json();
      if (res.ok) setSelectedDetail(data.registration ?? null);
    } catch {
      // detail fetch failed — Step 2 will just have empty defaults
    } finally {
      setDetailLoading(false);
    }
  }

  const set = (k: keyof CreateLoginForm) => (v: string) => setForm((p) => ({ ...p, [k]: v }));

  const errors = {
    registrationId:  !form.registrationId           ? "Please select a registration" : "",
    firstName:       !form.firstName.trim()          ? "Required" : "",
    lastName:        !form.lastName.trim()           ? "Required" : "",
    email:           !form.email.trim()              ? "Required" : !isValidEmail(form.email) ? "Invalid email" : "",
    password:        !form.password                  ? "Required" : form.password.length < 8 ? "Minimum 8 characters" : "",
    confirmPassword: !form.confirmPassword           ? "Required" : form.confirmPassword !== form.password ? "Passwords do not match" : "",
  };
  const valid = Object.values(errors).every((e) => !e);

  function handleNext() {
    setTouched(true);
    if (!valid) return;
    onNext(form, selectedDetail);
  }

  return (
    <div className="fixed inset-0 z-80 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center">
              <LuUser className="w-[18px] h-[18px] text-brand-600 dark:text-brand-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Create Customer Login</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Step 1 of 2 — Set up portal access for the customer</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <LuX className="w-4 h-4" />
          </button>
        </div>

        <StepIndicator step={1} />

        {/* Body */}
        <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">

          {/* Registration dropdown */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
              Select Registration <span className="text-error-500">*</span>
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setDropdownOpen((o) => !o)}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm border rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white ${
                  touched && errors.registrationId ? "border-error-400 dark:border-error-500" : "border-gray-200 dark:border-gray-700"
                }`}
              >
                <span className={selectedReg ? "text-gray-900 dark:text-white" : "text-gray-400"}>
                  {selectedReg ? `${selectedReg.id} — ${selectedReg.clientName}` : "Choose a registration…"}
                </span>
                <LuChevronDown className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ${dropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {dropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden max-h-52 overflow-y-auto">
                  {regsLoading ? (
                    <div className="flex items-center justify-center gap-2 px-4 py-6 text-xs text-gray-400">
                      <LuRefreshCw className="w-3.5 h-3.5 animate-spin" /> Loading registrations…
                    </div>
                  ) : regsError ? (
                    <div className="px-4 py-4 text-xs text-error-500">{regsError}</div>
                  ) : registrations.length === 0 ? (
                    <div className="px-4 py-4 text-xs text-gray-400">No registrations found.</div>
                  ) : (
                    registrations.map((reg) => (
                      <button
                        key={reg.id}
                        type="button"
                        onClick={() => selectRegistration(reg)}
                        className="w-full flex flex-col items-start px-4 py-3 text-left hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors border-b border-gray-100 dark:border-gray-800 last:border-0"
                      >
                        <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">{reg.id}</span>
                        <span className="text-sm text-gray-800 dark:text-gray-200 mt-0.5">{reg.type}</span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">{reg.clientName} · {reg.clientEmail}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            {touched && errors.registrationId && <p className="mt-1 text-xs text-error-500">{errors.registrationId}</p>}
          </div>

          {/* Auto-fill hint / detail loading */}
          {detailLoading && (
            <div className="flex items-center gap-2 px-3 py-2 bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/30 rounded-lg">
              <LuRefreshCw className="w-3.5 h-3.5 text-brand-500 animate-spin shrink-0" />
              <p className="text-xs text-brand-700 dark:text-brand-400">Loading registration details…</p>
            </div>
          )}
          {selectedReg && !detailLoading && (
            <div className="flex items-center gap-2 px-3 py-2 bg-success-50 dark:bg-success-500/10 border border-success-200 dark:border-success-500/30 rounded-lg">
              <LuCheck className="w-3.5 h-3.5 text-success-600 dark:text-success-400 shrink-0" />
              <p className="text-xs text-success-700 dark:text-success-400">
                Fields auto-filled from <span className="font-semibold">{selectedReg.id}</span>. You may edit them below.
              </p>
            </div>
          )}

          {/* Name */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">First Name <span className="text-error-500">*</span></label>
              <input type="text" value={form.firstName} onChange={(e) => set("firstName")(e.target.value)} className={touched && errors.firstName ? inputErrCls : inputCls} placeholder="First name" />
              {touched && errors.firstName && <p className="mt-1 text-xs text-error-500">{errors.firstName}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Last Name <span className="text-error-500">*</span></label>
              <input type="text" value={form.lastName} onChange={(e) => set("lastName")(e.target.value)} className={touched && errors.lastName ? inputErrCls : inputCls} placeholder="Last name" />
              {touched && errors.lastName && <p className="mt-1 text-xs text-error-500">{errors.lastName}</p>}
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Email Address <span className="text-error-500">*</span></label>
            <div className="relative">
              <LuMail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="email" value={form.email} onChange={(e) => set("email")(e.target.value)} className={(touched && errors.email ? inputErrCls : inputCls) + " pl-9"} placeholder="email@example.com" />
            </div>
            {touched && errors.email && <p className="mt-1 text-xs text-error-500">{errors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Password <span className="text-error-500">*</span></label>
            <div className="relative">
              <LuLock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => set("password")(e.target.value)} className={(touched && errors.password ? inputErrCls : inputCls) + " pl-9 pr-9"} placeholder="Minimum 8 characters" />
              <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                {showPassword ? <LuEyeOff className="w-4 h-4" /> : <LuEye className="w-4 h-4" />}
              </button>
            </div>
            {touched && errors.password && <p className="mt-1 text-xs text-error-500">{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Confirm Password <span className="text-error-500">*</span></label>
            <div className="relative">
              <LuLock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type={showConfirm ? "text" : "password"} value={form.confirmPassword} onChange={(e) => set("confirmPassword")(e.target.value)} className={(touched && errors.confirmPassword ? inputErrCls : inputCls) + " pl-9 pr-9"} placeholder="Re-enter password" />
              <button type="button" onClick={() => setShowConfirm((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                {showConfirm ? <LuEyeOff className="w-4 h-4" /> : <LuEye className="w-4 h-4" />}
              </button>
            </div>
            {touched && errors.confirmPassword && <p className="mt-1 text-xs text-error-500">{errors.confirmPassword}</p>}
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-700">
            The customer will use these credentials to log in to the portal. Name and email are auto-filled from the selected registration.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            Cancel
          </button>
          <button onClick={handleNext} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors">
            Next: Company Setup <LuChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal Step 2: Company Setup ──────────────────────────────────────────────

function CompanySetupModal({ loginForm, detail, onConfirm, onBack, onClose, submitting }: {
  loginForm: CreateLoginForm;
  detail: ApiRegistrationDetail | null;
  onConfirm: (form: CompanySetupForm) => void;
  onBack: () => void;
  onClose: () => void;
  submitting: boolean;
}) {
  // Build address from billing fields
  const address = detail
    ? [detail.billingStreet, detail.billingCity, detail.billingState, detail.billingPostalCode, detail.billingCountry]
        .filter(Boolean).join(", ")
    : "";

  // Build directors string from stakeholders
  const directorsStr = detail
    ? detail.stakeholders
        .filter((s) => s.roles.some((r) => r.toLowerCase().includes("director")))
        .map((s) => s.fullName || s.companyName || "")
        .filter(Boolean)
        .join(", ")
    : "";

  // Build shareholders array from stakeholders
  const shareholdersInit: ShareholderEntry[] = detail
    ? detail.stakeholders
        .filter((s) => s.roles.some((r) => r.toLowerCase().includes("shareholder")))
        .map((s) => ({
          name: s.fullName || s.companyName || "",
          percentage: s.sharePercentage != null ? String(s.sharePercentage) : "",
        }))
        .filter((s) => s.name)
    : [];

  const [form, setForm] = useState<CompanySetupForm>({
    companyName:             detail?.proposedCompanyName                    ?? "",
    businessNature:          (detail?.natureOfBusiness ?? []).join(", "),
    businessEmail:           detail?.applicantEmail || loginForm.email,
    phoneNumber:             detail?.applicantPhone || "",
    registeredOfficeAddress: address,
    directors:               directorsStr,
    shareholders:            shareholdersInit.length ? shareholdersInit : [{ name: "", percentage: "" }],
    certificateOfIncorporation: null,
    businessRegistration:       null,
    articlesOfAssociation:      null,
    annualReturn:               null,
    boardResolution:            null,
    otherDocuments:             null,
  });

  const [touched, setTouched] = useState(false);

  const errors = {
    companyName:             !form.companyName.trim()             ? "Required" : "",
    businessNature:          !form.businessNature.trim()          ? "Required" : "",
    businessEmail:           !form.businessEmail.trim()           ? "Required" : !isValidEmail(form.businessEmail) ? "Invalid email" : "",
    phoneNumber:             !form.phoneNumber.trim()             ? "Required" : "",
    registeredOfficeAddress: !form.registeredOfficeAddress.trim() ? "Required" : "",
    directors:               !form.directors.trim()               ? "Required" : "",
    shareholders:            !form.shareholders.some((s) => s.name.trim()) ? "At least one shareholder required" : "",
  };
  const valid = Object.values(errors).every((e) => !e);

  const set = (k: keyof CompanySetupForm) => (v: string | CompanyDocFile | null) =>
    setForm((p) => ({ ...p, [k]: v }));

  function updateShareholder(index: number, field: keyof ShareholderEntry, value: string) {
    setForm((p) => {
      const updated = p.shareholders.map((s, i) => i === index ? { ...s, [field]: value } : s);
      return { ...p, shareholders: updated };
    });
  }

  function addShareholder() {
    setForm((p) => ({ ...p, shareholders: [...p.shareholders, { name: "", percentage: "" }] }));
  }

  function removeShareholder(index: number) {
    setForm((p) => ({
      ...p,
      shareholders: p.shareholders.length > 1 ? p.shareholders.filter((_, i) => i !== index) : p.shareholders,
    }));
  }

  function handleConfirm() {
    setTouched(true);
    if (!valid) return;
    onConfirm(form);
  }

  const docsUploaded = [
    form.certificateOfIncorporation, form.businessRegistration,
    form.articlesOfAssociation,      form.annualReturn,
    form.boardResolution,            form.otherDocuments,
  ].filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-80 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center">
              <LuBuilding2 className="w-[18px] h-[18px] text-brand-600 dark:text-brand-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Company Setup</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Step 2 of 2 — Review company info and upload documents</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <LuX className="w-4 h-4" />
          </button>
        </div>

        <StepIndicator step={2} />

        {/* Scrollable Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">

          {/* Source hint */}
          {detail && (
            <div className="flex items-center gap-2 px-3 py-2 bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/30 rounded-lg">
              <LuBuilding2 className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 shrink-0" />
              <p className="text-xs text-brand-700 dark:text-brand-400">
                Auto-filled from <span className="font-semibold">{detail.id}</span> — edit any field if needed.
              </p>
            </div>
          )}

          {/* Company Information */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-md bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center">
                <LuBuilding2 className="w-3.5 h-3.5 text-brand-500 dark:text-brand-400" />
              </div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Company Information</h4>
              <span className="text-xs text-gray-400 ml-1">— edit if needed</span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Company Name <span className="text-error-500">*</span></label>
                <input type="text" value={form.companyName} onChange={(e) => set("companyName")(e.target.value)} className={touched && errors.companyName ? inputErrCls : inputCls} />
                {touched && errors.companyName && <p className="mt-1 text-xs text-error-500">{errors.companyName}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Nature of Business <span className="text-error-500">*</span></label>
                <textarea value={form.businessNature} onChange={(e) => set("businessNature")(e.target.value)} rows={2} className={(touched && errors.businessNature ? inputErrCls : inputCls) + " resize-none"} />
                {touched && errors.businessNature && <p className="mt-1 text-xs text-error-500">{errors.businessNature}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Business Email <span className="text-error-500">*</span></label>
                  <div className="relative">
                    <LuMail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="email" value={form.businessEmail} onChange={(e) => set("businessEmail")(e.target.value)} className={(touched && errors.businessEmail ? inputErrCls : inputCls) + " pl-9"} />
                  </div>
                  {touched && errors.businessEmail && <p className="mt-1 text-xs text-error-500">{errors.businessEmail}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Phone Number <span className="text-error-500">*</span></label>
                  <div className="relative">
                    <LuPhone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="tel" value={form.phoneNumber} onChange={(e) => set("phoneNumber")(e.target.value)} className={(touched && errors.phoneNumber ? inputErrCls : inputCls) + " pl-9"} />
                  </div>
                  {touched && errors.phoneNumber && <p className="mt-1 text-xs text-error-500">{errors.phoneNumber}</p>}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Registered Office Address <span className="text-error-500">*</span></label>
                <div className="relative">
                  <LuMapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <textarea value={form.registeredOfficeAddress} onChange={(e) => set("registeredOfficeAddress")(e.target.value)} rows={2} className={(touched && errors.registeredOfficeAddress ? inputErrCls : inputCls) + " resize-none pl-9"} />
                </div>
                {touched && errors.registeredOfficeAddress && <p className="mt-1 text-xs text-error-500">{errors.registeredOfficeAddress}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Directors <span className="text-error-500">*</span></label>
                <textarea value={form.directors} onChange={(e) => set("directors")(e.target.value)} rows={2} placeholder="e.g. John Smith, Jane Doe" className={(touched && errors.directors ? inputErrCls : inputCls) + " resize-none"} />
                {touched && errors.directors && <p className="mt-1 text-xs text-error-500">{errors.directors}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Shareholders with Shareholding % <span className="text-error-500">*</span></label>
                <div className="space-y-2">
                  {form.shareholders.map((s, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={s.name}
                        onChange={(e) => updateShareholder(i, "name", e.target.value)}
                        placeholder="Shareholder name"
                        className={`${touched && !s.name.trim() ? inputErrCls : inputCls} flex-1`}
                      />
                      <div className="relative w-28 shrink-0">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={s.percentage}
                          onChange={(e) => updateShareholder(i, "percentage", e.target.value)}
                          placeholder="0"
                          className={`${inputCls} w-full pr-7`}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">%</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeShareholder(i)}
                        disabled={form.shareholders.length === 1}
                        className="p-1.5 text-gray-400 hover:text-error-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
                      >
                        <LuX className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addShareholder}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors"
                  >
                    <LuPlus className="w-3.5 h-3.5" /> Add Shareholder
                  </button>
                </div>
                {touched && errors.shareholders && <p className="mt-1 text-xs text-error-500">{errors.shareholders}</p>}
              </div>
            </div>
          </div>

          {/* Documents */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-md bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center">
                <LuFileText className="w-3.5 h-3.5 text-brand-500 dark:text-brand-400" />
              </div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Company Documents</h4>
              <span className="text-xs text-gray-400 ml-1">— optional</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CompanyDocUploadField label="Certificate of Incorporation" description="Official certificate issued by the government" value={form.certificateOfIncorporation} onChange={(v) => set("certificateOfIncorporation")(v as CompanyDocFile | null)} />
              <CompanyDocUploadField label="Business Registration" description="Business registration certificate or license" value={form.businessRegistration} onChange={(v) => set("businessRegistration")(v as CompanyDocFile | null)} />
              <CompanyDocUploadField label="Articles of Association" description="Memorandum and articles of association" value={form.articlesOfAssociation} onChange={(v) => set("articlesOfAssociation")(v as CompanyDocFile | null)} />
              <CompanyDocUploadField label="Annual Return" description="Latest annual return filing" value={form.annualReturn} onChange={(v) => set("annualReturn")(v as CompanyDocFile | null)} />
              <CompanyDocUploadField label="Board Resolution" description="Relevant board resolutions" value={form.boardResolution} onChange={(v) => set("boardResolution")(v as CompanyDocFile | null)} />
              <CompanyDocUploadField label="Other Documents" description="Any additional supporting documents" value={form.otherDocuments} onChange={(v) => set("otherDocuments")(v as CompanyDocFile | null)} />
            </div>
          </div>

          {/* Summary */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl space-y-2">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Summary</p>
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              <LuUser className="w-3.5 h-3.5 text-brand-500 shrink-0" />
              <span>Login: <span className="font-medium text-gray-900 dark:text-white">{loginForm.firstName} {loginForm.lastName}</span> ({loginForm.email})</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              <LuBuilding2 className="w-3.5 h-3.5 text-brand-500 shrink-0" />
              <span>Company: <span className="font-medium text-gray-900 dark:text-white">{form.companyName || "—"}</span></span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              <LuFileText className="w-3.5 h-3.5 text-brand-500 shrink-0" />
              <span>Documents: <span className="font-medium text-gray-900 dark:text-white">{docsUploaded}</span> / 6 uploaded</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 shrink-0">
          <button onClick={onBack} disabled={submitting} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50">
            <LuArrowLeft className="w-4 h-4" /> Back
          </button>
          <button onClick={handleConfirm} disabled={submitting} className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-success-500 hover:bg-success-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors">
            {submitting
              ? <><LuRefreshCw className="w-4 h-4 animate-spin" /> Creating…</>
              : <><LuCheck className="w-4 h-4" /> Create Customer</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CustomerManagementPage() {
  const router = useRouter();

  const [searchInput,   setSearchInput]   = useState("");
  const [statusFilter,  setStatusFilter]  = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [page, setPage] = useState(1);

  // Add Customer modal
  const [addStep,       setAddStep]       = useState<null | 1 | 2>(null);
  const [addLoginForm,  setAddLoginForm]  = useState<CreateLoginForm | null>(null);
  const [addDetail,     setAddDetail]     = useState<ApiRegistrationDetail | null>(null);
  const [addSubmitting, setAddSubmitting] = useState(false);

  const filtered = useMemo(() => {
    const q = searchInput.toLowerCase().trim();
    return DUMMY_CUSTOMERS.filter((c) => {
      const matchSearch =
        !q ||
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.companyName.toLowerCase().includes(q);
      const matchStatus  = !statusFilter  || c.registrationStatus === statusFilter;
      const matchCountry = !countryFilter || (c.countryOfIncorporation ?? "").toLowerCase().includes(countryFilter.toLowerCase().trim());
      return matchSearch && matchStatus && matchCountry;
    });
  }, [searchInput, statusFilter, countryFilter]);

  const total      = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const hasActiveFilters = searchInput || statusFilter || countryFilter;

  function clearFilters() {
    setSearchInput(""); setStatusFilter(""); setCountryFilter(""); setPage(1);
  }

  function handleFilter(setter: (v: string) => void, v: string) {
    setter(v); setPage(1);
  }

  function handleAddCustomerConfirm(companySetup: CompanySetupForm) {
    setAddSubmitting(true);
    setTimeout(() => {
      setAddSubmitting(false);
      setAddStep(null);
      setAddLoginForm(null);
      console.log("Customer created", { login: addLoginForm, company: companySetup });
    }, 1200);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Customer Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage customers and their company formation details
          </p>
        </div>
        <button
          onClick={() => setAddStep(1)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors"
        >
          <LuPlus className="w-4 h-4" /> Add Customer
        </button>
      </div>

      {/* Table Card */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-theme-sm overflow-hidden">

        {/* Toolbar */}
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, company…"
              value={searchInput}
              onChange={(e) => handleFilter(setSearchInput, e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <LuFilter className="w-4 h-4 text-gray-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => handleFilter(setStatusFilter, e.target.value)}
              className="text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
            >
              {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <input
            type="text"
            placeholder="Country…"
            value={countryFilter}
            onChange={(e) => handleFilter(setCountryFilter, e.target.value)}
            className="text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all w-32"
          />
          {hasActiveFilters && (
            <button onClick={clearFilters} className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-error-600 dark:hover:text-error-400 transition-colors">
              <LuX className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                {["#", "Customer", "Email", "Company", "Type", "Country", "Reg. Status", "Actions"].map((h) => (
                  <th key={h} className="px-3 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/80">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-20 text-center">
                    <LuInbox className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No customers found</p>
                    {hasActiveFilters && (
                      <button onClick={clearFilters} className="mt-2 text-xs text-brand-500 hover:underline">Clear filters</button>
                    )}
                  </td>
                </tr>
              ) : (
                paginated.map((c, idx) => (
                  <tr
                    key={c.id}
                    onClick={() => router.push(`/admin/customer-management/${c.id}`)}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                  >
                    <td className="px-3 py-4 whitespace-nowrap">
                      <span className="text-xs text-gray-400 dark:text-gray-600 font-mono">{(page - 1) * PAGE_SIZE + idx + 1}</span>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${avatarColor(c.id)}`}>
                          {getInitials(c.firstName, c.lastName)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{c.firstName} {c.lastName}</p>
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium mt-0.5 ${c.active ? "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400" : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"}`}>
                            {c.active ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{c.email}</span>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap max-w-[200px]">
                      <div className="flex items-center gap-2">
                        <LuBuilding2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{c.companyName || "—"}</span>
                      </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      {c.companyType
                        ? <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">{c.companyType}</span>
                        : <span className="text-xs text-gray-400 italic">—</span>
                      }
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{c.countryOfIncorporation ?? "—"}</span>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${getStatusStyle(c.registrationStatus)}`}>
                        {formatStatus(c.registrationStatus)}
                      </span>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <button
                        onClick={(e) => { e.stopPropagation(); router.push(`/admin/customer-management/${c.id}`); }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/10 hover:bg-brand-100 dark:hover:bg-brand-500/20 rounded-lg transition-colors"
                      >
                        <LuExternalLink className="w-3.5 h-3.5" /> View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {paginated.length > 0 && (
          <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between gap-4 flex-wrap">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Showing {Math.min((page - 1) * PAGE_SIZE + 1, total)}–{Math.min(page * PAGE_SIZE, total)} of {total.toLocaleString()}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <LuChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce<(number | "…")[]>((acc, p, i, arr) => {
                  if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push("…");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === "…" ? (
                    <span key={`e-${i}`} className="px-2 text-gray-400 text-sm">…</span>
                  ) : (
                    <button key={p} onClick={() => setPage(p as number)} className={`w-8 h-8 text-sm font-medium rounded-lg transition-colors ${page === p ? "bg-brand-500 text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}>
                      {p}
                    </button>
                  )
                )}
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <LuChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Add Customer Modals ─────────────────────────────────────────────── */}
      {addStep === 1 && (
        <CreateLoginModal
          onNext={(form, detail) => { setAddLoginForm(form); setAddDetail(detail); setAddStep(2); }}
          onClose={() => { setAddStep(null); setAddLoginForm(null); setAddDetail(null); }}
        />
      )}
      {addStep === 2 && addLoginForm && (
        <CompanySetupModal
          loginForm={addLoginForm}
          detail={addDetail}
          onConfirm={handleAddCustomerConfirm}
          onBack={() => setAddStep(1)}
          onClose={() => { setAddStep(null); setAddLoginForm(null); setAddDetail(null); }}
          submitting={addSubmitting}
        />
      )}
    </div>
  );
}
