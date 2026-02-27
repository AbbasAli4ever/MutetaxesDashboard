"use client";

import { API_BASE_URL, authFetch } from "@/lib/auth";

export interface CustomerCompanyProfileApi {
  id?: string;
  companyName?: string | null;
  businessNature?: string | null;
  businessEmail?: string | null;
  phoneNumber?: string | null;
  registeredOfficeAddress?: string | null;
  companyType?: string | null;
  countryOfIncorporation?: string | null;
  businessRegistrationNumber?: string | null;
  incorporationDate?: string | null;
}

export interface CustomerStakeholderApi {
  id: number;
  registrationId?: string;
  type: "individual" | "corporate";
  roles: ("shareholder" | "director")[];
  fullName?: string | null;
  companyName?: string | null;
  registrationNumber?: string | null;
  numberOfShares?: number | null;
  sharePercentage?: number | null;
}

export interface CustomerDocumentApi {
  id: string;
  category: string;
  documentType?: string | null;
  name: string;
  fileName?: string | null;
  fileUrl?: string | null;
  publicUrl?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  status?: "pending_upload" | "uploaded" | "failed" | "deleted";
  createdAt?: string;
}

export interface CustomerRenewalApi {
  id: string;
  name: string;
  renewalType?: string | null;
  dueDate: string;
  amount?: { currency?: string | null; minor?: number | null } | null;
  amountDisplay?: string | null;
  status: "upcoming" | "pending" | "current" | "overdue";
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomerServiceRequestApi {
  id: string;
  type: string;
  typeCode?: string | null;
  description: string;
  status: "pending" | "in-progress" | "completed" | "rejected";
  priority?: "low" | "medium" | "high" | null;
  adminNotes?: string | null;
  requestedAt?: string | null;
  updatedAt?: string | null;
  createdAt?: string | null;
}

export interface CustomerServiceRequestActivityApi {
  id?: string;
  actionType?: string;
  payload?: unknown;
  createdAt?: string;
  actor?: {
    id?: number;
    name?: string;
    email?: string;
    type?: string;
  } | null;
}

export interface MyRegistrationApi {
  id: string;
  status: "pending" | "in-progress" | "completed";
  applicantFirstName?: string | null;
  applicantLastName?: string | null;
  applicantEmail?: string | null;
  applicantPhone?: string | null;
  proposedCompanyName?: string | null;
  countryOfIncorporation?: string | null;
  companyType?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export async function authJson<T = unknown>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await authFetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      (data as { error?: { message?: string } | string; message?: string })?.error &&
      typeof (data as { error?: unknown }).error === "object"
        ? ((data as { error?: { message?: string } }).error?.message || `Request failed (${res.status})`)
        : ((data as { error?: string; message?: string }).error || (data as { message?: string }).message || `Request failed (${res.status})`);
    throw new Error(message);
  }
  return data as T;
}

async function tryCustomerGet<T>(paths: string[], notFoundOk = false): Promise<T | null> {
  let lastErr: unknown;
  for (const path of paths) {
    try {
      return await authJson<T>(`${API_BASE_URL}${path}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message.toLowerCase() : "";
      if (notFoundOk && (msg.includes("404") || msg.includes("not found"))) {
        lastErr = err;
        continue;
      }
      lastErr = err;
    }
  }
  if (notFoundOk) return null;
  throw lastErr instanceof Error ? lastErr : new Error("Failed to fetch customer data");
}

export function formatDateDisplay(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-GB");
}

export function formatBytes(bytes?: number | null) {
  if (!bytes || bytes <= 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatAmountDisplay(
  amount?: { currency?: string | null; minor?: number | null } | null,
  amountDisplay?: string | null
) {
  if (amountDisplay) return amountDisplay;
  if (!amount || amount.minor == null) return "";
  const currency = (amount.currency || "HKD").toUpperCase();
  return `${currency} ${(amount.minor / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function pickArray<T>(payload: unknown, keys: string[]): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (!payload || typeof payload !== "object") return [];
  const obj = payload as Record<string, unknown>;
  for (const key of keys) {
    if (Array.isArray(obj[key])) return obj[key] as T[];
  }
  return [];
}

export async function getCustomerProfileBundle() {
  const [profileRes, stakeholdersRes, regsRes] = await Promise.all([
    tryCustomerGet<{ data?: CustomerCompanyProfileApi; profile?: CustomerCompanyProfileApi; companyProfile?: CustomerCompanyProfileApi }>(
      [
        "/api/v1/customer/company-profile",
        "/api/v1/customer/company/profile",
      ],
      true
    ),
    tryCustomerGet<{ data?: CustomerStakeholderApi[]; stakeholders?: CustomerStakeholderApi[] }>(
      [
        "/api/v1/customer/stakeholders?limit=100&page=1",
        "/api/v1/customer/company/stakeholders?limit=100&page=1",
      ],
      true
    ),
    tryCustomerGet<{ registrations?: MyRegistrationApi[]; data?: MyRegistrationApi[] }>(
      ["/api/v1/my-registrations?limit=100&page=1"],
      true
    ),
  ]);

  const profile =
    profileRes &&
    ((profileRes as { data?: CustomerCompanyProfileApi }).data ||
      (profileRes as { profile?: CustomerCompanyProfileApi }).profile ||
      (profileRes as { companyProfile?: CustomerCompanyProfileApi }).companyProfile ||
      null);

  const stakeholders = pickArray<CustomerStakeholderApi>(stakeholdersRes, ["data", "stakeholders"]);
  const registrations = pickArray<MyRegistrationApi>(regsRes, ["registrations", "data"]);
  const latestRegistration = registrations
    .slice()
    .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime())[0] || null;

  return { profile, stakeholders, registrations, latestRegistration };
}

export async function listCustomerDocuments() {
  const res = await authJson<{ data?: CustomerDocumentApi[]; documents?: CustomerDocumentApi[] }>(
    `${API_BASE_URL}/api/v1/customer/documents?limit=100&page=1&sortBy=createdAt&sortOrder=desc`
  );
  return pickArray<CustomerDocumentApi>(res, ["data", "documents"]).filter((d) => d.status !== "deleted");
}

export async function getCustomerDocumentDownloadUrl(documentId: string) {
  const res = await authJson<{ data?: { signedUrl?: string; downloadUrl?: string; url?: string }; signedUrl?: string; downloadUrl?: string; url?: string }>(
    `${API_BASE_URL}/api/v1/customer/documents/${documentId}/download-url`
  );
  return res.data?.signedUrl || res.data?.downloadUrl || res.data?.url || res.signedUrl || res.downloadUrl || res.url || null;
}

export async function listCustomerRenewals() {
  const res = await tryCustomerGet<{ data?: CustomerRenewalApi[]; renewals?: CustomerRenewalApi[] }>(
    [
      "/api/v1/customer/renewals?limit=100&page=1&sortBy=dueDate&sortOrder=asc",
      "/api/v1/customer/company/renewals?limit=100&page=1&sortBy=dueDate&sortOrder=asc",
    ],
    true
  );
  return pickArray<CustomerRenewalApi>(res, ["data", "renewals"]);
}

export async function listCustomerServiceRequests() {
  const res = await authJson<{ data?: CustomerServiceRequestApi[] }>(
    `${API_BASE_URL}/api/v1/customer/service-requests?limit=100&page=1&sortBy=requestedAt&sortOrder=desc`
  );
  return pickArray<CustomerServiceRequestApi>(res, ["data"]);
}

export async function getCustomerServiceRequest(requestId: string) {
  const res = await authJson<{ data?: CustomerServiceRequestApi }>(
    `${API_BASE_URL}/api/v1/customer/service-requests/${requestId}`
  );
  return res.data || null;
}

export async function getCustomerServiceRequestActivity(requestId: string) {
  const res = await authJson<{ data?: CustomerServiceRequestActivityApi[] }>(
    `${API_BASE_URL}/api/v1/customer/service-requests/${requestId}/activity`
  );
  return pickArray<CustomerServiceRequestActivityApi>(res, ["data"]);
}

export async function createCustomerServiceRequest(payload: {
  type: string;
  typeCode?: string;
  description: string;
  priority?: "low" | "medium" | "high";
}) {
  const res = await authJson<{ data?: CustomerServiceRequestApi }>(
    `${API_BASE_URL}/api/v1/customer/service-requests`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
  return res.data || null;
}

export async function updateCustomerServiceRequest(
  requestId: string,
  payload: { description?: string; priority?: "low" | "medium" | "high"; status?: "rejected" }
) {
  const res = await authJson<{ data?: CustomerServiceRequestApi }>(
    `${API_BASE_URL}/api/v1/customer/service-requests/${requestId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );
  return res.data || null;
}

export async function withdrawCustomerServiceRequest(requestId: string) {
  const res = await authJson<{ data?: CustomerServiceRequestApi }>(
    `${API_BASE_URL}/api/v1/customer/service-requests/${requestId}`,
    {
      method: "PATCH",
      body: JSON.stringify({ status: "rejected" }),
    }
  );
  return res.data || null;
}
