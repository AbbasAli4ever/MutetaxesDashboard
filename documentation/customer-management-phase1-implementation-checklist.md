# Customer Management Backend — Phase 1 Implementation Checklist

This checklist turns the full customer-management backend plan into a concrete Phase 1 implementation sequence for this codebase.

Phase 1 goal:
- enable customer detail page shell
- enable company profile tab (CRUD)
- enable customer-scoped stakeholder read APIs
- document APIs in Swagger

---

## Phase 1 Scope (Deliverables)

### Database / Prisma
- [x] Add `CustomerCompanyProfile` model
- [x] Add relations from `User` and `Registration` to `CustomerCompanyProfile`
- [x] Add Prisma migration SQL for new table + indexes + FKs
- [x] Regenerate Prisma Client

### Validation
- [x] Add `src/validation/customer-company-profile.schema.ts`
  - [x] create schema
  - [x] update schema (partial)

### Backend APIs (Admin)
- [x] `GET /api/v1/admin/customers/:customerId` (customer summary)
- [x] `GET /api/v1/admin/customers/:customerId/company-profile`
- [x] `POST /api/v1/admin/customers/:customerId/company-profile`
- [x] `PATCH /api/v1/admin/customers/:customerId/company-profile`
- [x] `GET /api/v1/admin/customers/:customerId/stakeholders`
- [x] `GET /api/v1/admin/customers/:customerId/stakeholders/:stakeholderId`

### Filters (Phase 1 stakeholder list)
- [x] `role`
- [x] `type`
- [x] `search`
- [x] `hasDocuments`
- [x] `registrationId`
- [x] `sortBy`
- [x] `sortOrder`
- [x] `page`
- [x] `limit`

### Routing / Auth
- [x] Create admin customer management routes file
- [x] Mount route in `src/server.ts` under `/api/v1/admin/customers`
- [x] Restrict routes to `ADMIN` user type
- [x] Apply admin read/update permissions (initially reuse `USER_MANAGEMENT_READ/UPDATE`)

### Swagger
- [x] Add Swagger docs for all Phase 1 endpoints
- [x] Document stakeholder filter query params
- [x] Document access restrictions (admin-only)

### Docs
- [x] Update frontend integration docs after Phase 1 API contracts are implemented (follow-up)

### Validation / Build
- [x] `npm run prisma:generate`
- [x] `npm run build`

---

## File-by-File Implementation Plan

### 1) Prisma schema and migration

Files:
- `prisma/schema.prisma`
- `prisma/migrations/<new_migration>/migration.sql`

Add model:
- `CustomerCompanyProfile`

Relations:
- `User.companyProfiles`
- `Registration.companyProfiles`

Notes:
- v1 uses one active profile per customer -> unique `customerId`
- `registrationId` optional (prefill/source linkage)

---

### 2) Validation schema

File:
- `src/validation/customer-company-profile.schema.ts`

Schemas:
- `createCustomerCompanyProfileSchema`
- `updateCustomerCompanyProfileSchema`

Core validations:
- required on create:
  - `companyName`
  - `businessNature`
  - `businessEmail`
  - `phoneNumber`
  - `registeredOfficeAddress`
- valid email
- trim strings

---

### 3) Controller implementation (admin customer management)

File (new):
- `src/controllers/admin-customer.controller.ts`

Helpers:
- parse `customerId`
- ensure user exists and `type=CUSTOMER`
- resolve linked registrations

Endpoints:
- customer summary
- company profile create/get/patch
- stakeholder list/detail

Response format (new customer-management APIs):
- `success`
- `data`
- optional `meta` (pagination + filters)

---

### 4) Routes + Swagger

File (new):
- `src/routes/admin-customers.routes.ts`

Mount path:
- `/api/v1/admin/customers`

Middleware:
- `requireUserType('ADMIN')`
- `requirePermission(PERMISSION_KEYS.READ_USERS)` for read endpoints
- `requirePermission(PERMISSION_KEYS.UPDATE_USERS)` for create/update company-profile

Swagger docs:
- request/response examples
- stakeholder filter params

---

### 5) Server route mount

File:
- `src/server.ts`

Add:
- import `adminCustomersRoutes`
- `app.use('/api/v1/admin/customers', adminCustomersRoutes)`

---

## Known Constraints (Current Schema)

These affect Phase 1 behavior and are intentionally handled in API design:

1. `Stakeholder` currently has no `createdAt`/`updatedAt`
- stakeholder sorting by `createdAt` cannot be truly supported yet
- API will support practical alternatives (`id`, `fullName`, `sharePercentage`)

2. `User` has no direct `country` field
- country-based user filtering is already derived from linked registrations
- same pattern may be used in customer summaries where needed

3. Customers may have multiple linked registrations
- summary endpoint should return:
  - latest linked registration summary
  - `linkedRegistrationsCount`
- stakeholder list can support optional `registrationId` filter

---

## Phase 1 Acceptance Criteria

- Admin can load customer detail page shell via `GET /api/v1/admin/customers/:customerId`
- Admin can create, fetch, and update company profile
- Admin can list/read customer-scoped stakeholders
- Stakeholder list supports documented filters/pagination
- Swagger docs render for new endpoints
- Build passes

---

## Phase 1 Follow-Up (Immediately after completion)

- [x] Update `Documentation/frontend_integration/07-auth-role-and-customer-portal.md` with Phase 1 admin-customer endpoints
- [x] Start Phase 2 (documents + stakeholder CRUD)
