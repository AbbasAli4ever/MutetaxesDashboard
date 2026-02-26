# Customer Management Backend Implementation Plan (Phased)

This document is the backend implementation plan for the new **Customer Management** modules added in the admin dashboard.

It is written to avoid rework and keep backend/frontend integration aligned while we implement the modules in phases.

---

## 1. Purpose

Build the backend for the frontend Customer Management module so the following tabs/flows can be fully integrated:

- Customer list and filtering
- Customer detail shell
- Company Information
- Stakeholders
- Company Documents
- Renewals
- Service Requests
- Registration-to-customer linkage (already started)
- Create customer + attach to registration workflows

This plan also captures the existing backend baseline (what is already implemented) so future work builds on it accurately.

---

## 2. Current Backend Baseline (Verified in Codebase)

### 2.1 Existing backend stack

- Node + Express
- Prisma (PostgreSQL)
- JWT auth
- Swagger (JSDoc comments)

### 2.2 Existing auth/portal separation foundation (already implemented)

Verified in code:

- `User.type` enum exists in Prisma schema (`CUSTOMER`, `ADMIN`)
- `requireUserType(...)` middleware exists
- `/auth/me` exists for frontend rehydration
- admin/customer API route separation has started

### 2.3 Existing customer-registration linkage foundation (already implemented)

Verified in code:

- `Registration.customerId` exists in Prisma schema
- admin can link registration to customer:
  - `PATCH /api/v1/registrations/:id/customer`
- customer-owned registrations endpoints exist:
  - `GET /api/v1/my-registrations`
  - `GET /api/v1/my-registrations/:id`
- optional fallback customer claim endpoint exists:
  - `POST /api/v1/registrations/:id/claim`

### 2.4 Existing data models we should reuse

Prisma models already available:

- `User`
- `Registration`
- `Stakeholder`
- `RegistrationDocument`
- `Ticket`
- `Badge`, `Permission`, `UserBadge`

### 2.5 Existing uploads infrastructure we can reuse

Current generic uploads endpoints:

- `POST /api/v1/uploads/presign`
- `GET /api/v1/uploads/signed-url`

We should reuse the same S3 signing utilities for customer-company documents.

---

## 3. Scope of This Backend Plan

### In scope (to build)

1. Admin customer-management backend APIs (customer-scoped)
2. New DB tables for company profile/documents/renewals/service requests
3. Reuse stakeholder data with customer-scoped APIs
4. Filters, pagination, sorting
5. Validation schemas
6. Swagger docs
7. Integration docs updates (parallel)

### Out of scope (for first pass)

- Full notification system
- Virus scanning pipeline (document placeholder statuses can be added now)
- Background jobs for renewals reminders
- Staff role (`STAFF`) unless explicitly added to current auth model

## 3.1 Current Implementation Status (Updated)

- Phase 1: Implemented
- Phase 2: Implemented (core scope)
- Phase 3: Implemented
- Phase 4: Implemented (core scope + service request activity/history)
- Phase 5: Pending (hardening/optimization)

Notes:

- Tests are deferred for now.
- Optional items remain optional (aggregate endpoint, document replace-init, explicit file-delete endpoint, etc.).
- Customer Management UI does not need stakeholder deletion for the current business flow; stakeholder deletion is handled in the Registration Edit section.

---

## 4. Backend API Standards (Apply to New Customer-Management Endpoints)

### 4.1 Response envelope (new modules)

Use a consistent envelope for all **new** customer-management endpoints:

```json
{
  "success": true,
  "data": {},
  "meta": {
    "requestId": "req_123",
    "page": 1,
    "limit": 20,
    "total": 125
  }
}
```

### 4.2 Error response (new modules)

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid shareholder percentage",
    "details": [
      { "field": "sharePercentage", "message": "Must be between 0 and 100" }
    ]
  },
  "meta": {
    "requestId": "req_123"
  }
}
```

### 4.3 Common standards

- ISO 8601 UTC timestamps
- `PATCH` for partial updates
- Pagination for list endpoints
- `sortBy` and `sortOrder`
- Validation via Zod
- Swagger docs updated per phase (not deferred)
- Role + permission checks on admin endpoints

### 4.4 Compatibility note

Existing older endpoints in this codebase return mixed response shapes. We should **not** refactor all old endpoints immediately.

Plan:
- Standardize all **new customer-management endpoints**
- Keep old routes stable to avoid regressions

---

## 5. Core Integration Rule (Important)

Frontend customer detail screens are **customerId-scoped**, but some source data currently originates from `registrationId`.

Backend must support:

- customer-scoped endpoints (primary)
- optional registration-scoped aliases (only where necessary)

### Rule to enforce

For customer-scoped admin endpoints:

1. Resolve the linked registration using `Registration.customerId = :customerId`
2. Query/update records scoped to that registration (for stakeholder-derived data)
3. Reject if data does not belong to that customer context

---

## 6. Data Model Plan (Prisma / PostgreSQL)

## 6.1 Existing models to reuse (no new table initially)

### A. `Stakeholder` (reuse)

Current table already supports:

- `type` (`individual` / `corporate`)
- `roles` array (director/shareholder/both)
- individual and corporate fields
- share fields

This is suitable for customer-management stakeholder UI.

### B. `RegistrationDocument` (registration-only docs)

Keep this table as source-of-truth for registration submission docs.

Do **not** overload this table for ongoing customer/company document management.

---

## 6.2 New tables to create

## A. `CustomerCompanyProfile` (new)

Purpose:
- Admin-managed Company Information tab
- Can be prefilled from registration and then edited independently

### Proposed fields

- `id` (UUID/string)
- `customerId` (FK -> `User.id`)
- `registrationId` (FK -> `Registration.id`, nullable)
- `companyName`
- `businessNature`
- `businessEmail`
- `phoneNumber`
- `registeredOfficeAddress`
- `companyType` (nullable)
- `countryOfIncorporation` (nullable)
- `businessRegistrationNumber` (nullable)
- `incorporationDate` (nullable, date)
- `status` (optional)
- `source` (`registration_prefill`, `admin_manual`, etc. optional)
- `createdAt`, `updatedAt`
- `createdBy`, `updatedBy` (optional FKs -> `User.id`)
- `deletedAt` (optional if soft delete is desired)

### Cardinality decision (recommended now)

Start with **1 active profile per customer** (enforce unique `customerId`).

If one customer can manage multiple companies later, migrate to company-profile-per-registration/company entity later.

---

## B. `CustomerCompanyDocument` (new)

Purpose:
- Company/customer management documents tab (separate from registration submission docs)

### Proposed fields

- `id` (UUID/string)
- `customerId` (FK -> `User.id`)
- `registrationId` (FK -> `Registration.id`, nullable)
- `stakeholderId` (FK -> `Stakeholder.id`, nullable)
- `category` (string enum-like)
- `documentType` (optional enum/code)
- `name` (display name)
- `fileKey` (S3 key)
- `bucket` (optional)
- `mimeType`
- `fileSize`
- `checksum` (optional)
- `status` (`pending_upload`, `uploaded`, `failed`, `deleted`)
- `uploadedBy` (FK -> `User.id`, nullable)
- `createdAt`, `updatedAt`
- `deletedAt` (soft delete recommended)

### Indexes (recommended)

- `(customerId, createdAt desc)`
- `(customerId, category)`
- `(customerId, stakeholderId)`
- `(status)`

---

## C. `CustomerRenewal` (new)

Purpose:
- Renewals tab in admin customer management

### Proposed fields

- `id` (UUID/string)
- `customerId` (FK -> `User.id`)
- `name`
- `renewalType` (optional)
- `dueDate` (date)
- `amountMinor` (integer)
- `currency` (e.g. `HKD`)
- `status` (`upcoming`, `pending`, `current`, `overdue`)
- `notes` (optional)
- `lastNotifiedAt` (nullable)
- `createdAt`, `updatedAt`
- optional audit fields (`createdBy`, `updatedBy`)
- optional `deletedAt`

---

## D. `CustomerServiceRequest` (new)

Purpose:
- Service Requests tab (admin side + customer-side requests)

### Proposed fields

- `id` (UUID internal primary key)
- `publicId` (optional human-friendly code like `SR-2026-001`)
- `customerId` (FK -> `User.id`)
- `type` (string)
- `typeCode` (optional enum-like string)
- `description`
- `status` (`pending`, `in-progress`, `completed`, `rejected`)
- `priority` (optional: `low`, `medium`, `high`)
- `requestedByUserId` (FK -> `User.id`)
- `assignedToAdminId` (FK -> `User.id`, nullable)
- `adminNotes` (frontend currently edits this)
- `internalNotes` (optional; not visible to customers)
- `requestedAt`
- `resolvedAt` (nullable)
- `createdAt`, `updatedAt`
- optional `deletedAt`

### Enum compatibility requirement

Status values must match frontend exactly:

- `pending`
- `in-progress`
- `completed`
- `rejected`

---

## E. `CustomerServiceRequestActivity` (recommended, optional in first pass)

Purpose:
- audit trail for status changes/comments

### Proposed fields

- `id`
- `serviceRequestId`
- `actorUserId`
- `actionType`
- `payload` (JSON)
- `createdAt`

---

## 7. API Namespace and Route Structure

### 7.1 Admin routes (new)

Mount under:

- `/api/v1/admin/customers`

Reason:
- clear portal separation
- consistent with admin UI
- avoids overloading `/users` and `/registrations`

### 7.2 Customer routes (new)

Mount under:

- `/api/v1/customer/...`

Reason:
- aligns with `requireUserType('CUSTOMER')`
- makes frontend integration clearer

---

## 8. Phased Implementation Plan

## Phase 0 (Pre-implementation prep / alignment)

Goal:
- avoid schema/route drift before coding starts

### Tasks

1. Confirm DB migration status in actual environment
   - `User.type` and `Registration.customerId` are now in schema and code, but ensure actual DBs are migrated
2. Lock response-envelope conventions for new customer-management endpoints
3. Confirm cardinality assumptions:
   - customer -> multiple registrations? (current schema allows yes)
   - one company profile per customer for v1? (recommended yes)
4. Confirm if `STAFF` role is postponed
   - current backend only supports `ADMIN` / `CUSTOMER`
5. Confirm document categories and service request types as enum lists (or keep string-first for v1)

### Deliverables

- This plan approved
- Phase 1 scope approved

---

## Phase 1 (Database foundation + customer page shell + company profile + stakeholder read)

Goal:
- frontend can load customer management page shell and core tabs with real data

### 1A. Prisma schema + migration(s)

Add:
- `CustomerCompanyProfile`

Optional in same migration if ready:
- `createdBy/updatedBy` audit FKs

### 1B. Admin customer summary endpoint (new)

#### Endpoint

- `GET /api/v1/admin/customers/:customerId`

#### Purpose

Load customer detail page shell:
- customer basic info
- linked registration summary
- counts for tabs
- profile existence

#### Suggested response (`data`)

- customer: `id`, `name`, `email`, `type`, `active`, `lastActive`
- linkedRegistration: `id`, `status`, `assignedToId`, `createdAt`
- counts:
  - stakeholders
  - registrationDocuments
  - companyDocuments
  - renewals
  - serviceRequests
- flags:
  - `hasCompanyProfile`

### 1C. Company profile CRUD (new)

#### Endpoints

- `POST /api/v1/admin/customers/:customerId/company-profile`
- `GET /api/v1/admin/customers/:customerId/company-profile`
- `PATCH /api/v1/admin/customers/:customerId/company-profile`
- `DELETE /api/v1/admin/customers/:customerId/company-profile` (optional; can defer)

#### Validation (v1)

Required on create:
- `companyName`
- `businessNature`
- `businessEmail`
- `phoneNumber`
- `registeredOfficeAddress`

Optional:
- `companyType`
- `countryOfIncorporation`
- `businessRegistrationNumber`
- `incorporationDate`

#### Filters

No list endpoint needed in v1 (single profile per customer).

### 1D. Customer-scoped stakeholders (reuse existing `Stakeholder`)

#### Endpoints (priority: list + get)

- `GET /api/v1/admin/customers/:customerId/stakeholders`
- `GET /api/v1/admin/customers/:customerId/stakeholders/:stakeholderId`

Optional in same phase if time allows:
- `POST`
- `PATCH`
- `DELETE`

#### Query filters for list (v1)

- `role=director|shareholder`
- `type=individual|corporate`
- `search=` (name/company/email)
- `sortBy=fullName|createdAt|sharePercentage`
- `sortOrder=asc|desc`

#### Backend behavior

- Resolve `registrationId` by linked registration
- Return 404 if customer has no linked registration (or 200 empty list; decide explicitly)
- Enforce stakeholder belongs to that resolved registration

### 1E. Swagger + docs (parallel)

Add Swagger for all new Phase 1 endpoints.

Update Documentation:
- frontend integration docs
- backend plan progress checklist (optional appendix in this file)

### Phase 1 success criteria

- Admin customer detail shell can load real data
- Company profile tab create/get/update works
- Stakeholders tab list/detail reads from backend

---

## Phase 2 (Stakeholder CRUD + company documents + S3 upload flow)

Goal:
- enable documents tab and stakeholder editing in customer management

### 2A. Prisma schema + migrations

Add:
- `CustomerCompanyDocument`

### 2B. Stakeholder CRUD (complete)

#### Endpoints

- `POST /api/v1/admin/customers/:customerId/stakeholders`
- `PATCH /api/v1/admin/customers/:customerId/stakeholders/:stakeholderId`
- `DELETE /api/v1/admin/customers/:customerId/stakeholders/:stakeholderId`

#### Validation rules

- `roles` supports both `director` and `shareholder`
- if shareholder role included:
  - validate `numberOfShares`, `sharePercentage` as needed
- type-specific required fields:
  - `individual`: `fullName` (and optionally nationality/address if business requires)
  - `corporate`: `companyName`, optional incorporation fields

#### Business-rule decisions to confirm

- Stakeholder deletion in Customer Management UI is not required for current business flow (deletion handled in Registration Edit section)
- Strict share-total validation vs warning-only

### 2C. Company documents metadata + S3 presigned flow

#### Metadata endpoints

- `GET /api/v1/admin/customers/:customerId/documents`
- `GET /api/v1/admin/customers/:customerId/documents/:documentId`
- `PATCH /api/v1/admin/customers/:customerId/documents/:documentId`
- `DELETE /api/v1/admin/customers/:customerId/documents/:documentId`

#### Upload/download flow endpoints

- `POST /api/v1/admin/customers/:customerId/documents/upload-init`
- `POST /api/v1/admin/customers/:customerId/documents/:documentId/upload-complete`
- `GET /api/v1/admin/customers/:customerId/documents/:documentId/download-url`

Optional later:
- `replace-init`
- explicit file-delete endpoint (if not handled in delete)

#### Filters (documents list)

- `category`
- `stakeholderId`
- `status`
- `search`
- `createdFrom`, `createdTo`
- `sortBy=createdAt|name|category`
- `sortOrder`
- pagination

#### Reuse existing upload code

Reuse S3 signing utilities used by `/api/v1/uploads/presign`, but separate controller/routes for customer document metadata lifecycle.

### 2D. Swagger + docs

- Add schemas and examples for `upload-init`, `upload-complete`, `download-url`
- Document allowed MIME types and size limits

### Phase 2 success criteria

- Stakeholders tab fully CRUD-capable
- Documents tab upload/list/delete/download integrated

Status:
- Implemented (core scope)
- Stakeholder delete API exists, but frontend Customer Management UI may intentionally avoid using it

---

## Phase 3 (Renewals module)

Goal:
- backend for renewals tab (currently local state in frontend)

### 3A. Prisma schema + migration

Add:
- `CustomerRenewal`

### 3B. Endpoints

- `GET /api/v1/admin/customers/:customerId/renewals`
- `POST /api/v1/admin/customers/:customerId/renewals`
- `GET /api/v1/admin/customers/:customerId/renewals/:renewalId`
- `PATCH /api/v1/admin/customers/:customerId/renewals/:renewalId`
- `DELETE /api/v1/admin/customers/:customerId/renewals/:renewalId`

### 3C. Filters (renewals list)

Required in v1:

- `status`
- `dueFrom`
- `dueTo`
- `search`
- `sortBy=dueDate|status|createdAt`
- `sortOrder`

Optional in v2:

- `overdue=true`
- `upcomingDays=30`

### 3D. Response modeling note

Frontend uses display amount strings today. Backend should return:

- normalized amount:
  - `amount: { currency, minor }`
- optional convenience:
  - `amountDisplay`

### Phase 3 success criteria

- Renewals tab can read/create/update/delete via backend

Status:
- Implemented

---

## Phase 4 (Service Requests module: admin + customer)

Goal:
- replace local-state service request tab with full backend integration

### 4A. Prisma schema + migration

Add:
- `CustomerServiceRequest`
- `CustomerServiceRequestActivity` (optional now, recommended soon)

### 4B. Customer-side endpoints

- `POST /api/v1/customer/service-requests`
- `GET /api/v1/customer/service-requests`
- `GET /api/v1/customer/service-requests/:requestId`
- optional `PATCH /api/v1/customer/service-requests/:requestId` (limited fields only)

### 4C. Admin customer-scoped endpoints

- `GET /api/v1/admin/customers/:customerId/service-requests`
- `GET /api/v1/admin/customers/:customerId/service-requests/:requestId`
- `PATCH /api/v1/admin/customers/:customerId/service-requests/:requestId`

#### Admin patch payload (must match current frontend modal)

- `status`
- `adminNotes`

### 4D. Filters (admin list)

- `status`
- `type` / `typeCode`
- `priority`
- `requestedFrom`, `requestedTo`
- `updatedFrom`, `updatedTo`
- `assignedTo`
- `search` (id/type/description)
- pagination + sorting

### 4E. Audit/activity (recommended)

If `CustomerServiceRequestActivity` is included:
- log status changes
- log admin notes changes
- optional comments/events

### Phase 4 success criteria

- Admin service requests tab fully backend-driven
- Customer portal can create/list/view service requests

Status:
- Implemented
- Service request activity/history endpoints also implemented

---

## Phase 5 (Quality, optimization, and aggregate loading)

Goal:
- improve performance/usability after core modules work

### 5A. Optional aggregate endpoint

If frontend wants reduced round-trips:

- `GET /api/v1/admin/customers/:customerId/company-management?include=profile,stakeholders,documents,renewals,serviceRequests`

Recommendation:
- keep per-tab endpoints as source of truth
- add aggregate endpoint only after profiling

### 5B. Soft delete / audit hardening

- add `deletedAt` where missing
- enforce hidden-by-default queries for soft-deleted records
- add audit fields if not already added in earlier phases

### 5C. Performance hardening

- indexes based on real query patterns
- pagination defaults and max limits
- avoid over-fetching (`include=` support where useful)

---

## 9. Detailed API Plan (By Module)

## 9.1 Admin Customer Summary

### Endpoint

- `GET /api/v1/admin/customers/:customerId`

### Filters

None (single resource)

### Response (`data`)

- `customer`
- `linkedRegistration`
- `counts`
- `flags`

### Backend requirements

- validate `customerId` exists and is `type=CUSTOMER`
- admin-only route
- permission check (suggest reusing `USER_MANAGEMENT_READ` initially or define new customer-management permission group later)

---

## 9.2 Company Profile APIs

### Endpoints

- `POST /api/v1/admin/customers/:customerId/company-profile`
- `GET /api/v1/admin/customers/:customerId/company-profile`
- `PATCH /api/v1/admin/customers/:customerId/company-profile`
- `DELETE /api/v1/admin/customers/:customerId/company-profile` (optional)

### Request payload (create/update)

```json
{
  "companyName": "ABC Holdings Ltd",
  "businessNature": "Consulting, Trading",
  "businessEmail": "ops@abc.com",
  "phoneNumber": "+852 1234 5678",
  "registeredOfficeAddress": "Unit 10, Central, Hong Kong",
  "companyType": "Private Limited",
  "countryOfIncorporation": "Hong Kong",
  "businessRegistrationNumber": "BR-123456",
  "incorporationDate": "2026-01-15"
}
```

### Validation

- required fields on create
- email format
- trim strings
- optional phone normalization
- one active profile per customer

---

## 9.3 Stakeholder APIs (Customer-scoped)

### Endpoints

- `GET /api/v1/admin/customers/:customerId/stakeholders`
- `POST /api/v1/admin/customers/:customerId/stakeholders`
- `GET /api/v1/admin/customers/:customerId/stakeholders/:stakeholderId`
- `PATCH /api/v1/admin/customers/:customerId/stakeholders/:stakeholderId`
- `DELETE /api/v1/admin/customers/:customerId/stakeholders/:stakeholderId`

### Filters

- `role`
- `type`
- `search`
- `hasDocuments` (phase 2 or later depending document model)
- `sortBy`
- `sortOrder`
- pagination (optional initially; recommended if lists can grow)

### Important rules

- `roles` can contain both values
- shareholder role implies share-field validation
- ownership scoping via customer -> registration resolution

---

## 9.4 Company Document APIs

### Metadata endpoints

- `GET /api/v1/admin/customers/:customerId/documents`
- `POST /api/v1/admin/customers/:customerId/documents` (optional if upload-init creates metadata)
- `GET /api/v1/admin/customers/:customerId/documents/:documentId`
- `PATCH /api/v1/admin/customers/:customerId/documents/:documentId`
- `DELETE /api/v1/admin/customers/:customerId/documents/:documentId`

### Upload/download endpoints

- `POST /api/v1/admin/customers/:customerId/documents/upload-init`
- `POST /api/v1/admin/customers/:customerId/documents/:documentId/upload-complete`
- `GET /api/v1/admin/customers/:customerId/documents/:documentId/download-url`

### Filters

- `category`
- `stakeholderId`
- `status`
- `search`
- `createdFrom`, `createdTo`
- `sortBy`
- `sortOrder`
- pagination

### File handling requirements

- MIME allow-list
- max size
- short-lived presigned URLs
- download URL generated on demand
- soft delete metadata (recommended)

---

## 9.5 Renewals APIs

### Endpoints

- `GET /api/v1/admin/customers/:customerId/renewals`
- `POST /api/v1/admin/customers/:customerId/renewals`
- `GET /api/v1/admin/customers/:customerId/renewals/:renewalId`
- `PATCH /api/v1/admin/customers/:customerId/renewals/:renewalId`
- `DELETE /api/v1/admin/customers/:customerId/renewals/:renewalId`

### Filters

- `status`
- `dueFrom`, `dueTo`
- `overdue` (phase 2 of renewals)
- `upcomingDays` (phase 2 of renewals)
- `search`
- `sortBy`
- `sortOrder`

---

## 9.6 Service Request APIs

### Customer endpoints

- `POST /api/v1/customer/service-requests`
- `GET /api/v1/customer/service-requests`
- `GET /api/v1/customer/service-requests/:requestId`
- optional `PATCH` (limited)

### Admin customer-scoped endpoints

- `GET /api/v1/admin/customers/:customerId/service-requests`
- `GET /api/v1/admin/customers/:customerId/service-requests/:requestId`
- `PATCH /api/v1/admin/customers/:customerId/service-requests/:requestId`

### Admin update payload (frontend-aligned)

```json
{
  "status": "in-progress",
  "adminNotes": "Received documents. Filing in progress."
}
```

### Filters

- `status`
- `type` / `typeCode`
- `priority`
- `requestedFrom`, `requestedTo`
- `updatedFrom`, `updatedTo`
- `assignedTo`
- `search`
- pagination
- sorting

---

## 10. Create Customer from Registration Workflow (Bridge Plan)

This connects the registration completion workflow to customer portal onboarding.

### Current supported path (already available)

1. Create customer via `POST /users` with `type: CUSTOMER`
2. Link registration via `PATCH /api/v1/registrations/:id/customer`
3. Update registration status via existing admin registration update endpoint

### Recommended future convenience endpoint (optional)

- `POST /api/v1/admin/customers/from-registration`

Potential behavior:
- create customer user
- assign customer badge
- link registration
- optionally create company profile from registration prefill
- return customer summary for redirect

This should be implemented only after Phase 1/2 base endpoints are stable.

---

## 11. Authorization Plan (Practical for Current Codebase)

### Current reality

Current middleware supports:
- `ADMIN`
- `CUSTOMER`

There is no `STAFF` user type in the backend today.

### Phase 1 authorization plan

- Admin endpoints:
  - `requireUserType('ADMIN')`
  - permission checks (reuse existing permission groups initially)
- Customer endpoints:
  - `requireUserType('CUSTOMER')`
  - ownership checks in controllers

### Permission strategy recommendation

For faster delivery, start with existing admin permissions (e.g. `USER_MANAGEMENT_READ`, `USER_MANAGEMENT_UPDATE`) for customer-management admin routes.

Then add a dedicated permission family later if needed:
- `CUSTOMER_MANAGEMENT_READ`
- `CUSTOMER_MANAGEMENT_UPDATE`
- etc.

---

## 12. Validation Schema Plan (Zod)

Create module-specific validation schemas to keep controllers thin.

### Proposed files

- `src/validation/customer-company-profile.schema.ts`
- `src/validation/customer-stakeholder.schema.ts`
- `src/validation/customer-company-document.schema.ts`
- `src/validation/customer-renewal.schema.ts`
- `src/validation/customer-service-request.schema.ts`

### Shared helpers (recommended)

- pagination query parser
- sort query parser
- date-range query parser
- standardized validation error mapper -> error envelope

---

## 13. Controller / Route Organization Plan (Avoid Bloat)

Do **not** put customer-management features into `user.controller.ts` or `registration.controller.ts` beyond small bridge endpoints.

### Recommended structure

#### Controllers

- `src/controllers/admin/customer.controller.ts` (summary + orchestrated reads)
- `src/controllers/admin/customer-company-profile.controller.ts`
- `src/controllers/admin/customer-stakeholder.controller.ts`
- `src/controllers/admin/customer-document.controller.ts`
- `src/controllers/admin/customer-renewal.controller.ts`
- `src/controllers/admin/customer-service-request.controller.ts`
- `src/controllers/customer/service-request.controller.ts`

#### Routes

- `src/routes/admin-customer.routes.ts` (or split by module if large)
- `src/routes/customer-service-request.routes.ts`

#### Services (recommended)

- `src/services/customer-management/...`

This keeps business logic testable and route handlers concise.

---

## 14. Migration Plan (Step-by-step)

Use **small Prisma migrations**, not one huge migration.

### Migration sequence (recommended)

1. `customer_company_profile`
2. `customer_company_document`
3. `customer_renewal`
4. `customer_service_request`
5. `customer_service_request_activity` (optional if deferred)

### Migration safety checklist

- create migration
- apply to local DB
- `prisma generate`
- run build/tests
- verify Swagger boots

### Backfills

- Registration -> customer backfill by email (already planned/implemented as script)
- Optional company-profile prefill from registration (can be command/script or endpoint)

---

## 15. Swagger / OpenAPI Plan (Parallel Work)

Swagger updates must happen with each phase.

### For every new endpoint, document:

- auth requirements
- admin/customer access restriction
- request schema
- response envelope
- filters (`query` params)
- enum values
- error cases

### Shared Swagger schema components to add (recommended)

- `ApiSuccessEnvelope`
- `ApiErrorEnvelope`
- pagination meta
- sort params
- customer-management enums (document status/category, renewal status, service request status)

---

## 16. Testing Plan (Backend)

## Phase 1 tests

- admin can fetch customer summary
- admin can create/get/update company profile
- admin cannot access customer-scoped stakeholder data for unrelated customer
- non-admin blocked on admin routes

## Phase 2 tests

- document upload-init returns signed URL + metadata record
- upload-complete updates status
- download-url works only for authorized users
- document list filters work

## Phase 3 tests

- renewals CRUD + status validation
- due-date filters

## Phase 4 tests

- customer can create/list own service requests
- admin can update status/adminNotes
- status enum validation enforced
- customer cannot access another customer’s requests

---

## 17. Frontend Integration Milestones (What Backend Must Deliver)

### Milestone A (Customer page shell + core data)

Backend delivers:
- `GET /api/v1/admin/customers/:customerId`
- company profile CRUD
- stakeholder list/detail (customer-scoped)

### Milestone B (Documents tab)

Backend delivers:
- docs list + upload-init/upload-complete + download-url + delete

### Milestone C (Renewals + Admin Service Requests tab)

Backend delivers:
- renewals CRUD
- admin service request list/detail/update

### Milestone D (Customer portal service requests)

Backend delivers:
- customer create/list/detail service requests

---

## 18. Risks / Decisions to Finalize Early

1. Customer to company/profile cardinality
   - v1 plan assumes one active company profile per customer

2. Registration linkage requirement
   - Can a customer exist without a linked registration? (likely yes, via Add Customer panel)

3. Document ownership semantics
   - customer-level vs company-level vs stakeholder-level docs
   - schema supports mixed ownership in one table (recommended for v1)

4. Service request notes visibility
   - `adminNotes` visible to customer? frontend suggests yes
   - use `internalNotes` for private admin-only notes

5. Soft delete policy
   - recommended for docs and service requests

---

## 19. Immediate Next Step (Recommended)

Start with **Phase 1** in this exact order:

1. Add `CustomerCompanyProfile` Prisma model + migration
2. Implement `GET /api/v1/admin/customers/:customerId` summary endpoint
3. Implement company profile `GET/POST/PATCH`
4. Implement customer-scoped stakeholder `GET` list/detail
5. Add Swagger docs for these endpoints
6. Update frontend integration docs for Phase 1 endpoint consumption

This gives the frontend team a stable foundation while we build the remaining tabs incrementally.

---

## 20. Appendix: Existing Implemented Endpoints Relevant to This Plan

These already exist and should be reused in customer-management workflows:

- `POST /users` (admin creates customer/admin; supports `type`)
- `GET /users` (admin list with filters incl. `type`, `search`, `country`, etc.)
- `PATCH /users/:id`
- `POST /auth/login`
- `POST /auth/refresh`
- `GET /auth/me`
- `GET /api/v1/registrations/:id` (admin)
- `PATCH /api/v1/registrations/:id` (admin)
- `PATCH /api/v1/registrations/:id/customer` (admin link/unlink registration to customer)
- `GET /api/v1/my-registrations` (customer-owned registrations)
- `GET /api/v1/my-registrations/:id`
- `POST /api/v1/uploads/presign`
- `GET /api/v1/uploads/signed-url`

This plan builds on these endpoints, not around them.
