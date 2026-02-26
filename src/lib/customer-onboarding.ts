import { API_BASE_URL, authFetch } from "@/lib/auth";

const STATIC_CUSTOMER_BADGE_ID = 3;

export interface CustomerBadge {
  id: number;
  name: string;
  displayName: string;
  color?: string;
}

export interface CustomerOnboardingLoginInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  badgeId?: number;
}

export interface CustomerOnboardingCompanyProfileInput {
  companyName: string;
  businessNature: string;
  businessEmail: string;
  phoneNumber: string;
  registeredOfficeAddress: string;
  companyType?: string;
  countryOfIncorporation?: string;
  businessRegistrationNumber?: string;
  incorporationDate?: string;
  registrationId?: string;
}

export interface CustomerOnboardingDocumentInput {
  name: string;
  category: string;
  documentType?: string;
  file: File;
  registrationId?: string;
  stakeholderId?: number | null;
}

export interface CustomerOnboardingFlowInput {
  registrationId?: string;
  login: CustomerOnboardingLoginInput;
  companyProfile: CustomerOnboardingCompanyProfileInput;
  documents?: CustomerOnboardingDocumentInput[];
  registrationStatusToSet?: "pending" | "in-progress" | "completed";
  onProgress?: (message: string) => void;
}

export interface CustomerOnboardingFlowResult {
  customerId: number;
  customerEmail: string;
  registrationLinked: boolean;
  companyProfileSaved: boolean;
  uploadedDocuments: Array<{ documentId: string; name: string }>;
  registrationStatusUpdated: boolean;
}

export class CustomerOnboardingFlowError extends Error {
  step: string;
  partialResult: Partial<CustomerOnboardingFlowResult>;
  status?: number;

  constructor(args: {
    step: string;
    message: string;
    partialResult: Partial<CustomerOnboardingFlowResult>;
    status?: number;
  }) {
    super(args.message);
    this.name = "CustomerOnboardingFlowError";
    this.step = args.step;
    this.partialResult = args.partialResult;
    this.status = args.status;
  }
}

type ApiErrorLike = Error & { status?: number; body?: unknown };

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function extractErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") return fallback;

  const record = payload as Record<string, unknown>;
  if (isNonEmptyString(record.error)) return record.error;
  if (isNonEmptyString(record.message)) return record.message;

  if (record.error && typeof record.error === "object") {
    const nested = record.error as Record<string, unknown>;
    if (isNonEmptyString(nested.message)) return nested.message;
  }

  return fallback;
}

async function parseJsonSafe(response: Response) {
  return response.json().catch(() => ({}));
}

async function authJson(url: string, options: RequestInit = {}) {
  const response = await authFetch(url, options);
  const data = await parseJsonSafe(response);

  if (!response.ok) {
    const err = new Error(
      extractErrorMessage(data, `Request failed (${response.status})`)
    ) as ApiErrorLike;
    err.status = response.status;
    err.body = data;
    throw err;
  }

  return data;
}

function cleanOptionalString(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

async function uploadCompanyDocument(
  customerId: number,
  doc: CustomerOnboardingDocumentInput
): Promise<{ documentId: string; name: string }> {
  const initPayload: Record<string, unknown> = {
    name: doc.name,
    category: doc.category,
    fileName: doc.file.name,
    mimeType: doc.file.type,
    fileSize: doc.file.size,
  };

  if (cleanOptionalString(doc.documentType)) {
    initPayload.documentType = cleanOptionalString(doc.documentType);
  }
  if (typeof doc.stakeholderId === "number") {
    initPayload.stakeholderId = doc.stakeholderId;
  }
  if (cleanOptionalString(doc.registrationId)) {
    initPayload.registrationId = cleanOptionalString(doc.registrationId);
  }

  const initRes = await authJson(
    `${API_BASE_URL}/api/v1/admin/customers/${customerId}/documents/upload-init`,
    {
      method: "POST",
      body: JSON.stringify(initPayload),
    }
  );

  const initData = (initRes as { data?: Record<string, unknown> }).data ?? (initRes as Record<string, unknown>);
  const documentId = String(initData.documentId ?? "");
  const uploadUrl = String(initData.uploadUrl ?? "");
  const uploadMethod = String(initData.uploadMethod ?? "PUT");
  const requiredHeaders =
    (initData.requiredHeaders as Record<string, string> | undefined) ?? {};

  if (!documentId || !uploadUrl) {
    throw new Error(`Upload init failed for ${doc.name}: missing upload metadata`);
  }

  const s3Headers = new Headers(requiredHeaders);
  if (!s3Headers.has("Content-Type") && doc.file.type) {
    s3Headers.set("Content-Type", doc.file.type);
  }

  const uploadRes = await fetch(uploadUrl, {
    method: uploadMethod,
    headers: s3Headers,
    body: doc.file,
  });

  if (!uploadRes.ok) {
    throw new Error(`S3 upload failed for ${doc.name} (${uploadRes.status})`);
  }

  const etag = uploadRes.headers.get("etag");
  const completeBody = etag ? { etag } : {};

  await authJson(
    `${API_BASE_URL}/api/v1/admin/customers/${customerId}/documents/${documentId}/upload-complete`,
    {
      method: "POST",
      body: JSON.stringify(completeBody),
    }
  );

  return { documentId, name: doc.name };
}

async function upsertCompanyProfile(
  customerId: number,
  companyProfile: CustomerOnboardingCompanyProfileInput
) {
  const payload: Record<string, unknown> = {
    companyName: companyProfile.companyName.trim(),
    businessNature: companyProfile.businessNature.trim(),
    businessEmail: companyProfile.businessEmail.trim(),
    phoneNumber: companyProfile.phoneNumber.trim(),
    registeredOfficeAddress: companyProfile.registeredOfficeAddress.trim(),
    source: "registration",
  };

  const optionalMappings: Array<[keyof CustomerOnboardingCompanyProfileInput, string]> = [
    ["companyType", "companyType"],
    ["countryOfIncorporation", "countryOfIncorporation"],
    ["businessRegistrationNumber", "businessRegistrationNumber"],
    ["incorporationDate", "incorporationDate"],
    ["registrationId", "registrationId"],
  ];

  for (const [sourceKey, targetKey] of optionalMappings) {
    const value = cleanOptionalString(companyProfile[sourceKey] as string | undefined);
    if (value) payload[targetKey] = value;
  }

  try {
    await authJson(
      `${API_BASE_URL}/api/v1/admin/customers/${customerId}/company-profile`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
  } catch (error) {
    const apiError = error as ApiErrorLike;
    const msg = apiError.message.toLowerCase();
    const isConflict = apiError.status === 409 || msg.includes("already exists") || msg.includes("conflict");
    if (!isConflict) throw error;

    await authJson(
      `${API_BASE_URL}/api/v1/admin/customers/${customerId}/company-profile`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      }
    );
  }
}

function wrapStepError(
  step: string,
  error: unknown,
  partialResult: Partial<CustomerOnboardingFlowResult>
): CustomerOnboardingFlowError {
  if (error instanceof CustomerOnboardingFlowError) return error;
  const apiError = error as ApiErrorLike;
  return new CustomerOnboardingFlowError({
    step,
    message: apiError?.message || `Failed during ${step}`,
    partialResult,
    status: apiError?.status,
  });
}

export async function fetchBadges(): Promise<CustomerBadge[]> {
  const res = await authJson(`${API_BASE_URL}/badges`);
  return (res.badges ?? []) as CustomerBadge[];
}

export function findCustomerBadgeId(badges: CustomerBadge[]): number | null {
  const normalized = badges.map((badge) => ({
    ...badge,
    _label: `${badge.name} ${badge.displayName}`.toLowerCase(),
  }));

  const preferred =
    normalized.find((b) => b._label.includes("customer")) ??
    normalized.find((b) => b._label.includes("client"));

  return preferred?.id ?? null;
}

export async function runCustomerOnboardingFlow(
  input: CustomerOnboardingFlowInput
): Promise<CustomerOnboardingFlowResult> {
  const result: Partial<CustomerOnboardingFlowResult> = {
    registrationLinked: false,
    companyProfileSaved: false,
    uploadedDocuments: [],
    registrationStatusUpdated: false,
  };

  let currentStep = "create-customer-user";

  try {
    input.onProgress?.("Creating customer login...");
    const resolvedBadgeId =
      typeof input.login.badgeId === "number" && input.login.badgeId > 0
        ? input.login.badgeId
        : STATIC_CUSTOMER_BADGE_ID;

    const createUserPayload: Record<string, unknown> = {
      name: `${input.login.firstName} ${input.login.lastName}`.trim(),
      email: input.login.email.trim(),
      password: input.login.password,
      type: "CUSTOMER",
      active: true,
      badgeId: resolvedBadgeId,
    };

    const createUserRes = await authJson(`${API_BASE_URL}/users`, {
      method: "POST",
      body: JSON.stringify(createUserPayload),
    });

    const createdUser =
      (createUserRes as { user?: Record<string, unknown> }).user ??
      ((createUserRes as { data?: { user?: Record<string, unknown> } }).data?.user) ??
      ((createUserRes as { data?: Record<string, unknown> }).data);

    const customerId = Number(createdUser?.id);
    const customerEmail = String(createdUser?.email ?? input.login.email);
    if (!Number.isFinite(customerId) || customerId <= 0) {
      throw new Error("Customer creation succeeded but no customer ID was returned");
    }

    result.customerId = customerId;
    result.customerEmail = customerEmail;

    if (input.registrationId) {
      currentStep = "link-registration";
      input.onProgress?.("Linking registration to customer...");
      await authJson(
        `${API_BASE_URL}/api/v1/registrations/${input.registrationId}/customer`,
        {
          method: "PATCH",
          body: JSON.stringify({ customerId }),
        }
      );
      result.registrationLinked = true;
    }

    currentStep = "save-company-profile";
    input.onProgress?.("Saving company profile...");
    await upsertCompanyProfile(customerId, {
      ...input.companyProfile,
      registrationId: input.registrationId ?? input.companyProfile.registrationId,
    });
    result.companyProfileSaved = true;

    const docs = input.documents ?? [];
    for (const doc of docs) {
      currentStep = `upload-document:${doc.name}`;
      input.onProgress?.(`Uploading ${doc.name}...`);
      const uploaded = await uploadCompanyDocument(customerId, {
        ...doc,
        registrationId: input.registrationId ?? doc.registrationId,
      });
      (result.uploadedDocuments as Array<{ documentId: string; name: string }>).push(uploaded);
    }

    if (input.registrationId && input.registrationStatusToSet) {
      currentStep = "update-registration-status";
      input.onProgress?.(`Updating registration status to ${input.registrationStatusToSet}...`);
      await authJson(`${API_BASE_URL}/api/v1/registrations/${input.registrationId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: input.registrationStatusToSet }),
      });
      result.registrationStatusUpdated = true;
    }

    input.onProgress?.("Completed");

    return result as CustomerOnboardingFlowResult;
  } catch (error) {
    throw wrapStepError(currentStep, error, result);
  }
}
