# 07 — Auth, User Type, and Customer Portal Integration

This document covers the newly implemented auth/user-type and customer registration ownership APIs.

It is intended for the frontend team to:

- route users to the correct dashboard after login/refresh
- prevent customer/admin portal mix-ups
- link an existing registration to a customer account from the admin panel **without resending the full registration payload**
- fetch customer-owned registrations safely
- integrate the new Admin Customer Management Phase 1/Phase 2-start endpoints (summary, company profile, stakeholders)

---

## What Changed (Implemented)

### User type support

Users now have a `type`:

- `CUSTOMER`
- `ADMIN`

Backend uses this to enforce portal/API separation in addition to permission checks.

### Login response now includes routing info

`POST /auth/login` now returns:

- `user.type`
- `user.dashboardPath`

### New rehydration endpoint

`GET /auth/me` returns the current authenticated user with:

- `type`
- `role`
- `permissions`
- `dashboardPath`

Use this after app reload / token refresh to route the user correctly.

### Customer registration ownership

Registrations can now be linked to a specific customer via `customerId` (backend ownership field).

New customer-facing endpoints:

- `GET /api/v1/my-registrations`
- `GET /api/v1/my-registrations/:id`

Admin linking endpoint (primary flow, no full payload resend):

- `PATCH /api/v1/registrations/:id/customer`

Customer self-claim endpoint (optional fallback):

- `POST /api/v1/registrations/:id/claim`

### Admin/customer route isolation (enforced server-side)

Implemented restrictions include:

- `users/*` -> admin only
- `badges/*` -> admin only
- admin registration dashboard routes (`/api/v1/registrations` list/detail/update/delete) -> admin only
- ticket update/delete -> admin only
- customers can only list/view their own tickets

---

## Authentication Flow (Frontend)

### 1. Login

```
POST /auth/login
```

**Request**

```json
{
  "email": "user@example.com",
  "password": "your_password"
}
```

**Success response (shape)**

```json
{
  "success": true,
  "accessToken": "jwt_access_token",
  "refreshToken": "jwt_refresh_token",
  "expiresIn": 900,
  "refreshTokenExpiresIn": 604800,
  "user": {
    "id": 12,
    "email": "user@example.com",
    "name": "Jane Doe",
    "type": "CUSTOMER",
    "permissions": ["SUPPORT_TICKETS_READ", "SUPPORT_TICKETS_CREATE"],
    "role": "client",
    "dashboardPath": "/customer/dashboard"
  }
}
```

### 2. Redirect after login

Use `user.dashboardPath` from the response.

- `ADMIN` -> `/admin/dashboard`
- `CUSTOMER` -> `/customer/dashboard`

### 3. Rehydrate on page refresh / app init

Call:

```
GET /auth/me
Authorization: Bearer <accessToken>
```

Use the response to restore:

- user profile
- `type`
- permissions
- dashboard route guard state

### 4. Token refresh flow (existing)

After `POST /auth/refresh`, call `GET /auth/me` (recommended) to ensure the frontend has fresh user context.

---

## New Endpoint: Get Current User (`/auth/me`)

```
GET /auth/me
```

### Headers

```
Authorization: Bearer <accessToken>
```

### Success response — 200 OK

```json
{
  "success": true,
  "user": {
    "id": 12,
    "email": "user@example.com",
    "name": "Jane Doe",
    "type": "CUSTOMER",
    "role": "client",
    "permissions": ["SUPPORT_TICKETS_READ", "SUPPORT_TICKETS_CREATE"],
    "dashboardPath": "/customer/dashboard"
  }
}
```

### Errors

- `401` if token missing/invalid
- `404` if user no longer exists
- `500` server error

---

## Customer Registration Ownership (Important)

### Primary workflow (admin-driven)

The current business flow is **admin-driven**:

1. Public registration is submitted
2. Admin processes the registration
3. When completing the registration, admin creates/selects a customer account
4. Admin links the registration to that customer (`customerId`)
5. Customer logs in and sees portal data immediately

This means the frontend **does not need to use the claim endpoint in normal flow**.

### Why separate linking exists

The public registration submit endpoint (`POST /api/v1/registrations`) is still payload-first and can be used before a customer account is linked.

To avoid resending the whole registration payload later, the backend provides **separate lightweight linking endpoints**.

### Admin link endpoint (primary)

```
PATCH /api/v1/registrations/:id/customer
```

Admin can link/unlink a registration to a `CUSTOMER` user by `customerId`.

#### Request body

```json
{
  "customerId": 12
}
```

Unlink:

```json
{
  "customerId": null
}
```

#### Backend validations

- endpoint is admin-only
- `customerId` must be a number or `null`
- selected user must exist
- selected user must have `type = CUSTOMER`
- selected user must be active

### Typical admin panel flows

#### Flow A: Complete registration -> create customer -> link

1. Admin marks/starts completion flow for a registration
2. Admin enters customer `name`, `email`, `password` (and customer badge)
3. Frontend calls `POST /users` with `type: "CUSTOMER"`
4. Receive created user id
5. Frontend calls `PATCH /api/v1/registrations/:id/customer` with `{ customerId: newUserId }`
6. Frontend updates registration status via existing admin registration update endpoint (if not already done)

#### Flow B: Add Customer panel (with registration dropdown)

1. Admin selects registration from dropdown
2. Admin enters `name`, `email`, `password`
3. Create customer via `POST /users` (`type: "CUSTOMER"`)
4. Link selected registration using `PATCH /api/v1/registrations/:id/customer`

### Customer claim endpoint (optional fallback)

```
POST /api/v1/registrations/:id/claim
```

This links the registration to the currently authenticated `CUSTOMER`.

No full registration payload is required.

### How claim authorization works

The backend will allow claim only when:

- authenticated user type is `CUSTOMER`

---

## Admin Customer Management (Phase 1 + Stakeholder CRUD Start)

These endpoints power the new admin dashboard Customer Management module and are all scoped by `customerId`.

Base path:

```text
/api/v1/admin/customers/:customerId
```

All endpoints below are:

- `ADMIN` user type only
- permission-gated (`READ_USERS` for reads, `UPDATE_USERS` for writes)

### 1. Customer detail page shell (summary endpoint)

```text
GET /api/v1/admin/customers/:customerId
```

Use this first when opening the Customer Management detail page.

Returns:

- customer identity (`id`, `name`, `email`, `type`, `active`, `lastActive`, `createdAt`)
- latest linked registration summary (if any)
- counts (stakeholders, registration docs, placeholders for future modules)
- feature flags (`hasCompanyProfile`, future module flags)

This endpoint is intended to let frontend render the page shell and tabs before loading tab-specific data.

### 2. Company Profile (Company Information tab)

#### Get profile

```text
GET /api/v1/admin/customers/:customerId/company-profile
```

- Returns `404` if profile does not exist yet (frontend should show empty/create state)

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

Optional:

- `registrationId` (if omitted, backend uses latest linked registration when available)
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

- Partial updates supported
- Backend validates `registrationId` belongs to the same customer (if provided)

### 3. Stakeholders (Customer-scoped APIs over registration stakeholders)

These APIs reuse the existing registration stakeholder table but expose it through customer scope.

#### List stakeholders

```text
GET /api/v1/admin/customers/:customerId/stakeholders
```

Supported query params:

- `role=director|shareholder`
- `type=individual|corporate`
- `search=` (searches `fullName`, `companyName`, `email`)
- `hasDocuments=true|false`
- `registrationId=<uuid>` (only if this registration belongs to the customer)
- `sortBy=id|fullName|companyName|sharePercentage`
- `sortOrder=asc|desc`
- `page` (default `1`)
- `limit` (default `20`, max `100`)

Response includes:

- stakeholder rows
- `meta.page`, `meta.limit`, `meta.total`
- `meta.filtersApplied`

#### Get stakeholder detail

```text
GET /api/v1/admin/customers/:customerId/stakeholders/:stakeholderId
```

Returns stakeholder data plus linked registration documents for that stakeholder.

#### Create stakeholder (Phase 2 start)

```text
POST /api/v1/admin/customers/:customerId/stakeholders
```

Backend behavior:

- if customer has exactly one linked registration, `registrationId` can be omitted
- if customer has multiple linked registrations, `registrationId` is required
- validates stakeholder type + roles + shareholder fields

Important payload rules:

- `type = "individual"` requires `fullName`
- `type = "corporate"` requires `companyName`
- if `roles` includes `"shareholder"`, backend requires:
  - `numberOfShares`
  - `sharePercentage` (`0..100`)

#### Update stakeholder (Phase 2 start)

```text
PATCH /api/v1/admin/customers/:customerId/stakeholders/:stakeholderId
```

- Partial updates supported
- Backend validates merged final state (not just changed fields), so invalid partial combinations are rejected

#### Delete stakeholder (Phase 2 start)

```text
DELETE /api/v1/admin/customers/:customerId/stakeholders/:stakeholderId
```

- Deletes only if stakeholder belongs to a registration linked to that customer

Frontend business-flow note:

- Do **not** use stakeholder delete from the Customer Management UI for the current workflow.
- Stakeholder deletion is managed in the **Registration Edit** section/module.
- Customer Management should treat stakeholders as create/update/read in normal operation.

### Recommended frontend loading sequence for Customer Management page

1. `GET /api/v1/admin/customers/:customerId` (page shell)
2. On Company Info tab open:
   - `GET /company-profile`
3. On Stakeholders tab open:
   - `GET /stakeholders?page=1&limit=20`
4. On stakeholder modal open:
   - `GET /stakeholders/:stakeholderId` (if detail needed)

### Current phase status (for frontend planning)

- `Company Profile` CRUD: implemented
- `Stakeholders` list/detail/create/update/delete: implemented (Phase 2 start)
  - frontend business flow currently uses list/detail/create/update (deletion handled in Registration Edit module)
- `Company Documents`: not implemented yet
- `Renewals`: not implemented yet
- `Service Requests`: not implemented yet

### 4. Company Documents (Phase 2 continuation - implemented)

These APIs are for the Customer Management Documents tab (separate from registration submission documents).

#### List documents

```text
GET /api/v1/admin/customers/:customerId/documents
```

Supported query params:

- `category`
- `stakeholderId`
- `status` (`pending_upload|uploaded|failed|deleted`)
- `search` (searches `name`, `fileName`)
- `registrationId`
- `createdFrom`, `createdTo` (ISO date/date-time)
- `sortBy=createdAt|name|category`
- `sortOrder=asc|desc`
- `page`, `limit`

Example request:

```text
GET /api/v1/admin/customers/12/documents?category=Incorporation&status=uploaded&search=certificate&page=1&limit=20
```

Example response (shape):

```json
{
  "success": true,
  "data": [
    {
      "id": "doc_123",
      "customerId": 12,
      "registrationId": "reg_uuid",
      "stakeholderId": null,
      "category": "Incorporation",
      "documentType": "certificate_of_incorporation",
      "name": "Certificate of Incorporation",
      "fileKey": "customers/12/company-documents/doc_123/certificate.pdf",
      "fileName": "certificate.pdf",
      "fileUrl": "https://cdn.example.com/customers/12/company-documents/doc_123/certificate.pdf",
      "mimeType": "application/pdf",
      "fileSize": 245120,
      "etag": "\"abc123\"",
      "status": "uploaded",
      "createdAt": "2026-02-26T10:00:00.000Z",
      "updatedAt": "2026-02-26T10:01:00.000Z",
      "deletedAt": null
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1
  }
}
```

#### Upload flow (presigned S3 PUT)

Step 1: initialize upload (creates metadata row + returns S3 PUT URL)

```text
POST /api/v1/admin/customers/:customerId/documents/upload-init
```

Request body:

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
- `requiredHeaders` (`Content-Type`)
- `expiresAt`

Step 2: upload file directly to S3 using the returned `uploadUrl`

Step 3: mark upload complete

```text
POST /api/v1/admin/customers/:customerId/documents/:documentId/upload-complete
```

Optional body:

```json
{
  "etag": "\"abc123...\""
}
```

Step 4 (when viewing/downloading): get signed download URL

```text
GET /api/v1/admin/customers/:customerId/documents/:documentId/download-url
```

#### Metadata endpoints

- `GET /api/v1/admin/customers/:customerId/documents/:documentId`
- `PATCH /api/v1/admin/customers/:customerId/documents/:documentId`
- `DELETE /api/v1/admin/customers/:customerId/documents/:documentId` (soft delete metadata)

Example `PATCH` payloads:

Rename / recategorize:

```json
{
  "name": "Certificate of Incorporation (Stamped)",
  "category": "Statutory"
}
```

Link to stakeholder:

```json
{
  "stakeholderId": 45,
  "registrationId": "reg_uuid"
}
```

Mark as failed/deleted in metadata workflow:

```json
{
  "status": "failed"
}
```

Notes:

- `stakeholderId` and `registrationId` are validated to ensure they belong to the same customer
- `DELETE` is a soft delete in backend metadata (S3 object deletion is not implemented yet)
- Supported MIME types currently: PDF + common images (`jpeg/jpg/png/webp`)
- Max file size currently: `20 MB`

### 5. Renewals (Phase 2 continuation - implemented)

Admin customer-scoped renewals APIs:

- `GET /api/v1/admin/customers/:customerId/renewals`
- `POST /api/v1/admin/customers/:customerId/renewals`
- `GET /api/v1/admin/customers/:customerId/renewals/:renewalId`
- `PATCH /api/v1/admin/customers/:customerId/renewals/:renewalId`
- `DELETE /api/v1/admin/customers/:customerId/renewals/:renewalId`

List filters supported:

- `status` (`upcoming|pending|current|overdue`)
- `dueFrom`, `dueTo`
- `overdue=true`
- `upcomingDays=<number>`
- `search` (searches `name`)
- `sortBy=dueDate|status|createdAt|name`
- `sortOrder=asc|desc`
- `page`, `limit`

Create/update payload shape:

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

Response includes normalized + display amount:

- `amount: { currency, minor }`
- `amountDisplay`

### 6. Service Requests (Phase 2 continuation - implemented)

#### Customer portal APIs

- `POST /api/v1/customer/service-requests`
- `GET /api/v1/customer/service-requests`
- `GET /api/v1/customer/service-requests/:requestId`
- `PATCH /api/v1/customer/service-requests/:requestId` (pending-only edits: `description`, `priority`)

Customer create payload example:

```json
{
  "type": "Change of Directors",
  "typeCode": "change_directors",
  "description": "Please update the director list with the attached resolution.",
  "priority": "medium"
}
```

#### Admin customer-scoped APIs

- `GET /api/v1/admin/customers/:customerId/service-requests`
- `GET /api/v1/admin/customers/:customerId/service-requests/:requestId`
- `PATCH /api/v1/admin/customers/:customerId/service-requests/:requestId`

Admin update payload (matches current modal behavior):

```json
{
  "status": "in-progress",
  "adminNotes": "Received documents. Filing in progress."
}
```

Additional supported admin update fields:

- `assignedToAdminId` (must be active `ADMIN`)
- `internalNotes`
- `priority`

Admin list filters supported:

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

#### Service request activity/history (Phase 4 continuation)

New activity endpoints for timeline/history UI:

- Admin: `GET /api/v1/admin/customers/:customerId/service-requests/:requestId/activity`
- Customer: `GET /api/v1/customer/service-requests/:requestId/activity`

Backend logs activity entries for:

- customer request creation
- customer edits (`customer_updated`)
- admin status changes (`status_changed`)
- admin notes updates (`admin_notes_updated`)
- internal notes updates (`internal_notes_updated`)
- assignment changes (`assignment_changed`)
- priority changes (`priority_changed`)

Activity response item shape:

```json
{
  "id": "act_1",
  "serviceRequestId": "sr_123",
  "actorUserId": 5,
  "actionType": "status_changed",
  "payload": {
    "before": "pending",
    "after": "in-progress"
  },
  "createdAt": "2026-02-26T11:00:00.000Z",
  "actor": {
    "id": 5,
    "name": "Admin User",
    "email": "admin@example.com",
    "type": "ADMIN"
  }
}
```

Frontend note:

- customer timeline endpoint is ownership-scoped (only own request)
- admin timeline endpoint is customer-scoped and validates `requestId` belongs to the selected `customerId`
- registration exists
- registration is not already claimed by another customer
- `registration.applicantEmail === loggedInUser.email`

This prevents a customer from claiming another person’s registration.

### Headers

```
Authorization: Bearer <accessToken>
```

### Request body

No body required.

### Success response — 200 OK

```json
{
  "success": true,
  "message": "Registration linked to your account successfully",
  "registration": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "customerId": 12,
    "applicantEmail": "user@example.com",
    "status": "pending",
    "updatedAt": "2026-02-25T10:00:00.000Z"
  }
}
```

### Claim error cases

| Status | Meaning |
|--------|---------|
| `401` | Missing/invalid token |
| `403` | Not a customer OR email mismatch |
| `404` | Registration not found |
| `409` | Already linked to another customer |
| `500` | Server error |

---

## Customer Portal Registration APIs

These endpoints return **only registrations owned by the authenticated customer**.

### 1. List my registrations

```
GET /api/v1/my-registrations
```

### Query params

- `status` (optional): `pending | in-progress | completed`
- `page` (optional, default `1`)
- `limit` (optional, default `20`, max `100`)

### Success response — 200 OK

```json
{
  "success": true,
  "total": 2,
  "page": 1,
  "limit": 20,
  "registrations": [
    {
      "id": "uuid-1",
      "clientName": "Jane Doe",
      "clientEmail": "user@example.com",
      "phone": "+85212345678",
      "type": "private_limited_company",
      "status": "pending",
      "assignedTo": "Unassigned",
      "submittedDate": "2026-02-25T10:00:00.000Z",
      "lastUpdated": "2026-02-25T10:00:00.000Z",
      "documents": 3,
      "documentList": []
    }
  ]
}
```

### 2. Get one of my registrations

```
GET /api/v1/my-registrations/:id
```

Returns full registration detail only if `customerId === req.user.id`.

### Common errors (both endpoints)

- `401` if token missing/invalid
- `403` if user is not `CUSTOMER`
- `404` if record not found (or not owned by this customer for `/:id`)
- `500` server error

---

## Frontend Integration Guidance

### Recommended flow for registration + account linking (current)

1. Submit registration via public `POST /api/v1/registrations`.
2. Save returned registration `id` client-side (local storage/session/state).
3. Admin creates/selects customer account in admin panel.
4. Admin links registration to customer via `PATCH /api/v1/registrations/:id/customer`.
5. Customer logs in and frontend routes via `user.dashboardPath`.
6. Customer dashboard uses `GET /api/v1/my-registrations` and `GET /api/v1/my-registrations/:id`.

### Optional fallback flow (if needed)

If a registration exists but admin has not linked it yet, and you intentionally expose a recovery path, the customer can claim it using:

- `POST /api/v1/registrations/:id/claim`

### Do NOT do this

- Do not resend the full registration payload just to attach a customer account.
- Do not make customer claim the primary UX if admin assignment is the official workflow.
- Do not trust frontend route guards alone; backend will still enforce access.

---

## Backend Rollout Notes (for tracking)

These are implementation/ops notes so frontend and backend stay aligned:

- Backend schema now includes `Registration.customerId` (nullable).
- A backfill script exists to link legacy registrations by email:
  - `npm run prisma:backfill:registration-customer`
- Matching rule: `registration.applicantEmail` -> `user.email` where `user.type = CUSTOMER`
- Unmatched registrations remain unlinked (`customerId = null`) until claimed or manually linked by admin.

---

## Current Limitations / Next API Docs To Add

Pending docs / enhancements (backend work may continue):

- Swagger docs for the new admin link endpoint `/api/v1/registrations/:id/customer` (if not yet deployed in your running backend instance)
- explicit frontend examples for token refresh + `GET /auth/me` rehydration
- optional combined backend endpoint for "complete + create customer + link" in one transaction
