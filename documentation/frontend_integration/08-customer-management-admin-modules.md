# 08 — Customer Management (Admin) Integration

This document is for frontend engineers integrating the **Admin Customer Management** screens/tabs.

It covers the backend APIs for:

- Customer list (customer management table)
- Customer detail page shell
- Customer Profile tab (Company Profile + Stakeholders)
- Documents tab
- Renewals tab
- Service Requests tab

This is written from the backend perspective and reflects the APIs implemented in this codebase today.

---

## 1. Scope and Route Groups

### Admin customer management route group

Base path:

```text
/api/v1/admin/customers
```

All endpoints in this document are:

- `ADMIN` user type only
- permission-gated (currently reusing `USER_MANAGEMENT_READ/UPDATE`)

### Authentication

Send:

```text
Authorization: Bearer <accessToken>
```

Use `GET /auth/me` for session rehydration and portal routing after refresh.

---

## 2. Customer Management List Page (Admin)

The customer management list screen (search/filter/table view) should currently use:

```text
GET /users?type=CUSTOMER
```

### Supported filters on `GET /users`

- `type=CUSTOMER|ADMIN`
- `active=true|false` or `active|inactive`
- `search=` (name + email)
- `name=`
- `email=`
- `badgeId=`
- `badgeName=`
- `country=` (derived from linked registrations)
- `registrationStatus=` (from linked registrations)
- `hasLinkedRegistration=true|false`

### Example

```text
GET /users?type=CUSTOMER&search=james&country=Hong%20Kong&registrationStatus=completed
```

### Current response shape (important)

`GET /users` currently returns:

- `id`
- `name`
- `email`
- `type`
- `active`
- `role`
- `lastActive`
- `countries` (derived array)
- `linkedRegistrationsCount`

### UI mapping note (important)

The screenshot shows columns like `Company` and `Reg. Status`.

Backend note:

- `GET /users` currently does **not** return company name / latest registration status directly.
- Frontend may need one of:
  - temporary fallback display from existing state/mock data
  - a follow-up backend enhancement for list payload enrichment
  - lazy loading on row view (not recommended for large lists)

The filters for registration status/country are already supported on the backend.

---

## 3. Customer Detail Page Shell (Top Header + Tab Bootstrapping)

When opening `admin/customer-management/:customerId`, call:

```text
GET /api/v1/admin/customers/:customerId
```

This endpoint is the page bootstrap.

### Returns

- `customer` summary (id, name, email, type, active, role, timestamps)
- `linkedRegistration` (latest linked registration summary if any)
- `counts`
  - `stakeholders`
  - `registrationDocuments`
  - `companyDocuments`
  - `renewals`
  - `serviceRequests`
- `flags`
  - `hasCompanyProfile`
  - `customerManagementDocsImplemented`
  - `renewalsImplemented`
  - `serviceRequestsImplemented`

### Recommended frontend load sequence

1. Load page shell via `GET /api/v1/admin/customers/:customerId`
2. Render tabs immediately
3. Fetch tab data on tab open (or prefetch active tab only)

---

## 4. Customer Profile Tab

This tab is backed by two backend areas:

- Company Profile (company information)
- Stakeholders (directors/shareholders data sourced from linked registrations)

### 4.1 Company Profile (Company Information card)

#### Get profile

```text
GET /api/v1/admin/customers/:customerId/company-profile
```

Behavior:

- `404` if company profile does not exist yet (show create state / edit form)

#### Create profile

```text
POST /api/v1/admin/customers/:customerId/company-profile
```

Required fields:

- `companyName`
- `businessNature`
- `businessEmail`
- `phoneNumber`
- `registeredOfficeAddress`

Optional fields:

- `registrationId`
- `companyType`
- `countryOfIncorporation`
- `businessRegistrationNumber`
- `incorporationDate` (`YYYY-MM-DD`)
- `status`
- `source`

#### Update profile

```text
PATCH /api/v1/admin/customers/:customerId/company-profile
```

Partial update supported.

Backend validation:

- if `registrationId` is provided, it must belong to the same customer

### 4.2 Stakeholders (Directors + Shareholders cards)

#### List stakeholders

```text
GET /api/v1/admin/customers/:customerId/stakeholders
```

Supported filters:

- `role=director|shareholder`
- `type=individual|corporate`
- `search=` (full name / company name / email)
- `hasDocuments=true|false`
- `registrationId=<uuid>`
- `sortBy=id|fullName|companyName|sharePercentage`
- `sortOrder=asc|desc`
- `page`
- `limit`

#### Get stakeholder detail

```text
GET /api/v1/admin/customers/:customerId/stakeholders/:stakeholderId
```

Returns stakeholder + linked registration documents (if any).

#### Create stakeholder

```text
POST /api/v1/admin/customers/:customerId/stakeholders
```

#### Update stakeholder

```text
PATCH /api/v1/admin/customers/:customerId/stakeholders/:stakeholderId
```

### Stakeholder business-flow note (important)

Frontend should treat Customer Management as:

- read
- create
- update

Do **not** use stakeholder delete in Customer Management UI for the current workflow.

Deletion is handled in the **Registration Edit** module/section.

---

## 5. Documents Tab (Admin Customer Management Documents)

This tab is backed by the **customer company documents** module (separate from registration submission documents).

### 5.1 List documents

```text
GET /api/v1/admin/customers/:customerId/documents
```

Supported filters:

- `category`
- `stakeholderId`
- `status` (`pending_upload|uploaded|failed|deleted`)
- `search` (name/fileName)
- `registrationId`
- `createdFrom`, `createdTo`
- `sortBy=createdAt|name|category`
- `sortOrder=asc|desc`
- `page`, `limit`

### 5.2 Upload flow (presigned S3 PUT)

Backend uses a **two-step metadata + S3 upload** flow.

#### Step 1: init upload (creates metadata row)

```text
POST /api/v1/admin/customers/:customerId/documents/upload-init
```

Example request:

```json
{
  "name": "Certificate of Incorporation",
  "category": "Incorporation",
  "documentType": "certificate_of_incorporation",
  "fileName": "certificate.pdf",
  "mimeType": "application/pdf",
  "fileSize": 245120,
  "stakeholderId": null,
  "registrationId": "reg_uuid_optional"
}
```

Response returns:

- `documentId`
- `fileKey`
- `uploadUrl`
- `uploadMethod` (`PUT`)
- `requiredHeaders`
- `expiresAt`

#### Step 2: upload file directly to S3

Use returned `uploadUrl` and required headers.

#### Step 3: mark upload complete

```text
POST /api/v1/admin/customers/:customerId/documents/:documentId/upload-complete
```

Optional payload:

```json
{ "etag": "\"abc123...\"" }
```

#### Step 4: generate download URL

```text
GET /api/v1/admin/customers/:customerId/documents/:documentId/download-url
```

### 5.3 Metadata APIs

- `GET /api/v1/admin/customers/:customerId/documents/:documentId`
- `PATCH /api/v1/admin/customers/:customerId/documents/:documentId`
- `DELETE /api/v1/admin/customers/:customerId/documents/:documentId` (soft delete metadata)

### Validation notes

- `stakeholderId` must belong to the same customer
- if both `stakeholderId` and `registrationId` are provided, they must match
- allowed MIME types (currently): PDF/JPEG/JPG/PNG/WEBP
- max size (currently): `20 MB`

### UI notes for the screenshot

- The admin "Upload Document" button should use the upload-init flow above.
- The "Download" buttons should call `download-url` first, then open/download the signed URL.

---

## 6. Renewals Tab (Admin)

### Endpoints

- `GET /api/v1/admin/customers/:customerId/renewals`
- `POST /api/v1/admin/customers/:customerId/renewals`
- `GET /api/v1/admin/customers/:customerId/renewals/:renewalId`
- `PATCH /api/v1/admin/customers/:customerId/renewals/:renewalId`
- `DELETE /api/v1/admin/customers/:customerId/renewals/:renewalId`

### List filters

- `status` (`upcoming|pending|current|overdue`)
- `dueFrom`, `dueTo`
- `overdue=true`
- `upcomingDays=<n>`
- `search`
- `sortBy=dueDate|status|createdAt|name`
- `sortOrder=asc|desc`
- `page`, `limit`

### Create/update payload shape

```json
{
  "name": "Business Registration",
  "renewalType": "statutory",
  "dueDate": "2026-04-30",
  "amount": {
    "currency": "HKD",
    "minor": 220000
  },
  "status": "upcoming",
  "notes": "Annual statutory renewal"
}
```

### Response formatting

Backend returns both:

- normalized `amount` (`{ currency, minor }`)
- display helper `amountDisplay`

This supports your UI chips/list rows without frontend currency formatting if you prefer.

---

## 7. Service Requests Tab (Admin)

This tab shows customer service requests and allows admins to review/update status.

### 7.1 Admin endpoints (customer-scoped)

- `GET /api/v1/admin/customers/:customerId/service-requests`
- `GET /api/v1/admin/customers/:customerId/service-requests/:requestId`
- `PATCH /api/v1/admin/customers/:customerId/service-requests/:requestId`
- `GET /api/v1/admin/customers/:customerId/service-requests/:requestId/activity`

### 7.2 Admin list filters

- `status`
- `type`
- `typeCode`
- `priority`
- `requestedFrom`, `requestedTo`
- `updatedFrom`, `updatedTo`
- `assignedTo`
- `search`
- `sortBy=requestedAt|updatedAt|status|type|priority`
- `sortOrder=asc|desc`
- `page`, `limit`

### 7.3 Admin update payload (matches modal workflow)

```json
{
  "status": "in-progress",
  "adminNotes": "Received documents. Filing in progress."
}
```

Also supported:

- `assignedToAdminId` (must be active `ADMIN`)
- `internalNotes`
- `priority`

### 7.4 Activity/history endpoint

```text
GET /api/v1/admin/customers/:customerId/service-requests/:requestId/activity
```

Activity items include:

- `created`
- `customer_updated`
- `status_changed`
- `admin_notes_updated`
- `internal_notes_updated`
- `assignment_changed`
- `priority_changed`

This is intended for timeline/history UI in the service request detail/modal.

---

## 8. Customer Portal Service Requests (for company-management screens)

The provided screenshots also show customer-side "Submit Service Request" and "Submit Document Request" modals.

These use the **customer portal** endpoints:

- `POST /api/v1/customer/service-requests`
- `GET /api/v1/customer/service-requests`
- `GET /api/v1/customer/service-requests/:requestId`
- `PATCH /api/v1/customer/service-requests/:requestId`
- `GET /api/v1/customer/service-requests/:requestId/activity`

### Supported create payload (current backend)

```json
{
  "type": "Change of Directors",
  "typeCode": "change_directors",
  "description": "Please update the director list with the attached resolution.",
  "priority": "medium"
}
```

### Important current backend limitations (frontend must account for)

The customer modals in screenshots show extra UX options that are **not yet implemented in backend**:

- `Save as Draft` -> not supported (no draft status)
- attachment uploads for customer service requests -> not supported yet
- document-request-specific attachment flow -> not supported yet

Recommended frontend handling for now:

- submit as normal request only
- hide/disable draft mode
- hide/disable attachment upload in service request modal until backend support lands

If you want to represent "Document Request" in current backend, use the same service request API with:

- `type = "Document Request"`
- `typeCode = "document_request"`
- `description = additional notes`

---

## 9. Error Handling Guidance (Frontend)

Common backend responses across these modules:

- `400` validation error -> show field/form errors
- `401` unauthorized -> refresh session or logout
- `403` forbidden -> admin/customer role mismatch or permission issue
- `404` resource not found -> stale UI state / wrong customer scope
- `500` server error -> generic error state + retry option

### Scoping-related 404 behavior

Many endpoints intentionally return `404` when a nested resource does not belong to the selected customer.

Example:

- wrong `stakeholderId` under a customer
- wrong `service requestId` under a customer

Treat this as a data scope mismatch, not just "missing record".

---

## 10. Implementation Notes for Frontend Team

### Recommended per-tab loading (admin customer detail)

1. `GET /api/v1/admin/customers/:customerId` (page shell)
2. Active tab load:
   - Company Profile tab -> company profile + stakeholders
   - Documents tab -> documents list
   - Renewals tab -> renewals list
   - Service Requests tab -> service requests list
3. Modal/detail actions call resource-specific endpoints

### Avoid coupling to unsupported assumptions

- Do not assume customer list endpoint already returns `company` and `regStatus` columns
- Do not assume customer service request drafts/attachments exist
- Do not use stakeholder delete in Customer Management UI (registration edit owns that flow)

