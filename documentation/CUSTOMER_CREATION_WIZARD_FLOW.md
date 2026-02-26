# Customer Creation Wizard Flow (Admin) — API Integration Guide

This document describes the exact backend API flow for the admin-side **Create Customer** wizard/modal you explained.

This version includes the updated behavior to avoid orphan users:

- `Next` only moves the UI to the next step
- **No backend write happens on `Next`**
- All API calls run on the **final submit** button

Flow summary:

1. Admin clicks **Create Customer**
2. Registration dropdown loads
3. Admin selects a registration
4. Admin fills customer login details (name/email/password)
5. Admin clicks **Next** (frontend validation + local wizard state only)
6. Admin fills company profile details
7. Admin optionally selects/uploads company documents
8. Admin clicks **Final Submit / Complete Registration**
9. Frontend runs API chain in sequence:
   - create customer user
   - link registration to customer
   - save company profile
   - optional document uploads
   - optional mark registration completed

This file is intentionally standalone so frontend engineers can implement this flow from one document.

---

## 1. Prerequisites (Auth + Permissions)

All APIs in this flow require:

- `Authorization: Bearer <admin_access_token>`
- logged-in user `type = ADMIN`

Permissions required:

- Registration dropdown/list:
  - `READ_REGISTRATIONS`
- Create customer login (`POST /users`):
  - `CREATE_USERS`
- Link registration to customer:
  - `UPDATE_REGISTRATIONS`
- Mark registration completed (optional final step):
  - `UPDATE_REGISTRATIONS`

Notes:

- Admin customer module endpoints (`/api/v1/admin/customers/...`) are admin-only.
- Backend enforces type/ownership. Frontend should still hide/guard UI appropriately.

---

## 2. Full UI Flow -> API Flow (Exact Sequence)

## Updated Plan (Important Edge Case Fix)

Problem:

- If frontend calls `POST /users` on the first step (`Next`) and admin closes the modal before Company Setup, a customer user is created but onboarding is incomplete.

Updated solution:

- Collect user login details in step 1
- Collect company profile details in step 2
- Optional docs are selected in step 2
- Run all backend APIs only on the final submit button

Yes, this is fully possible with the current backend APIs because they are modular and can be orchestrated by frontend in sequence.

## Step 0 — Admin clicks `Create Customer`

UI action:

- Open modal/wizard
- Show registration dropdown
- Show customer login fields

If the action starts from **Registration Detail page**, `registrationId` may already be known and dropdown can be pre-filled.

---

## Step 1 — Load registration list for dropdown

### API

```http
GET /api/v1/registrations?page=1&limit=50
Authorization: Bearer <admin_token>
```

### Purpose

- Populate the registration dropdown inside the create-customer modal.

### Recommended frontend dropdown data to keep

- `registrationId` (required)
- display label (company/applicant)
- status badge
- email/applicant name (if shown)

### Optional filtering

Use whatever registration filters your UI supports (search/status) to reduce list size.

---

## Step 2 — Admin selects registration + enters login details

Frontend collects:

- `selectedRegistrationId`
- `firstName`
- `lastName`
- `email`
- `password`
- `confirmPassword` (frontend-only)
- `badgeId` (customer badge)

### Frontend validation before API calls

- required fields present
- email format valid
- password min length / complexity (per UI rules)
- `confirmPassword === password`
- registration selected

---

## Step 3 — On `Next` button click: Move to Company Setup (No API Call)

### Updated behavior (recommended)

When admin clicks `Next` after entering user details:

- run frontend validation
- store values in wizard state
- move to Company Setup step
- **do not call `POST /users` yet**

This avoids creating orphan users when the modal is closed early.

### Data to store in wizard state now

- `selectedRegistrationId`
- `firstName`
- `lastName`
- `email`
- `password`
- `badgeId`

---

## Step 4 — On final submit: Create customer login (first backend call in chain)

### API

```http
POST /users
Authorization: Bearer <admin_token>
Content-Type: application/json
```

### Request payload

```json
{
  "name": "Zaeem Hassan",
  "email": "zaeem@swiftnine.com",
  "password": "SecurePass123!",
  "badgeId": 3,
  "type": "CUSTOMER",
  "active": true
}
```

### Field mapping from UI to backend payload

- `firstName + lastName` -> `name`
- `email` -> `email`
- `password` -> `password`
- `confirmPassword` -> do not send
- `badgeId` -> `badgeId`
- `type` -> always `"CUSTOMER"`

### Expected success response (shape example)

```json
{
  "success": true,
  "message": "User created successfully",
  "user": {
    "id": 12,
    "name": "Zaeem Hassan",
    "email": "zaeem@swiftnine.com",
    "type": "CUSTOMER",
    "active": "active",
    "role": "Customer"
  }
}
```

### Frontend must store immediately

- `createdCustomerId = response.user.id`
- `createdCustomerEmail = response.user.email`

Do not continue without storing `createdCustomerId`.

---

## Step 5 — Link selected registration to created customer

This is the lightweight link API (no full registration payload resend required).

### API

```http
PATCH /api/v1/registrations/:registrationId/customer
Authorization: Bearer <admin_token>
Content-Type: application/json
```

### Request payload

```json
{
  "customerId": 12
}
```

### What backend validates

- admin-only endpoint
- registration exists
- `customerId` is valid number or `null`
- selected user exists
- selected user is `type = CUSTOMER`
- selected customer is active

### Frontend action after success

- mark `registrationLinked = true`
- move wizard to `Company Setup` step

This is the exact link step you described and it is the correct backend-supported flow.

---

## Step 6 — Save Company Setup (Customer Company Profile)

Now the wizard shows company profile fields (company info) and optional document uploads.

### API(s)

- Create profile:
  - `POST /api/v1/admin/customers/:customerId/company-profile`
- If profile already exists, update:
  - `PATCH /api/v1/admin/customers/:customerId/company-profile`
- Optional pre-check:
  - `GET /api/v1/admin/customers/:customerId/company-profile`

### Recommended create payload (example)

```json
{
  "registrationId": "2f2597be-8b5c-4594-b03b-af421715b8d0",
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

### Minimum fields required by backend

- `companyName`
- `businessNature`
- `businessEmail`
- `phoneNumber`
- `registeredOfficeAddress`

### Important note (Directors / Shareholders sections in UI)

These are **not** part of company-profile payload.

They come from linked registration stakeholders and should use:

- `GET /api/v1/admin/customers/:customerId/stakeholders`
- `POST /api/v1/admin/customers/:customerId/stakeholders`
- `PATCH /api/v1/admin/customers/:customerId/stakeholders/:stakeholderId`

Do not send directors/shareholders in `company-profile` create/update payload.

---

## Step 7 — Optional company document uploads (admin uploads on behalf of customer)

This is optional in the wizard.

For each file, use a 3-step flow.

### 6.1 Upload init (create metadata + get signed S3 upload URL)

```http
POST /api/v1/admin/customers/:customerId/documents/upload-init
Authorization: Bearer <admin_token>
Content-Type: application/json
```

### Example request payload

```json
{
  "name": "Certificate of Incorporation",
  "category": "Incorporation",
  "documentType": "certificate_of_incorporation",
  "fileName": "certificate.pdf",
  "mimeType": "application/pdf",
  "fileSize": 245120,
  "registrationId": "2f2597be-8b5c-4594-b03b-af421715b8d0"
}
```

### Example response fields used by frontend

- `documentId`
- `uploadUrl`
- `uploadMethod` (usually `PUT`)
- `requiredHeaders`
- `expiresAt`

### 6.2 Upload file directly to S3

```http
PUT <uploadUrl>
Content-Type: application/pdf
```

Body = raw file bytes.

This call goes directly to S3, not the backend.

### 6.3 Confirm upload complete

```http
POST /api/v1/admin/customers/:customerId/documents/:documentId/upload-complete
Authorization: Bearer <admin_token>
Content-Type: application/json
```

Optional body:

```json
{
  "etag": "\"abc123etag\""
}
```

### Optional document metadata update (if UI edits title/category later)

```http
PATCH /api/v1/admin/customers/:customerId/documents/:documentId
```

---

## Step 8 — Optional final action: Mark registration completed

If your workflow considers the process complete after customer creation/link/profile/docs, frontend can update the registration status.

### API

```http
PATCH /api/v1/registrations/:registrationId
Authorization: Bearer <admin_token>
Content-Type: application/json
```

### Example intent

- Set registration status to `completed`

Use the same registration update payload shape your admin registration screen already uses.

This is intentionally separate from the link API.

---

## 3. Recommended Orchestration Pseudocode (Frontend)

```ts
// Step 1: load dropdown (on modal open)
const registrations = await api.get("/api/v1/registrations", { params: { page: 1, limit: 50 } });

// Step 2: user fills login details and clicks Next
// No backend call here. Store wizard state only.

// Step 3: final submit button -> run backend API chain
const createUserRes = await api.post("/users", {
  name: `${firstName} ${lastName}`.trim(),
  email,
  password,
  badgeId,
  type: "CUSTOMER",
  active: true,
});
const customerId = createUserRes.user.id;

await api.patch(`/api/v1/registrations/${selectedRegistrationId}/customer`, { customerId });

await api.post(`/api/v1/admin/customers/${customerId}/company-profile`, {
  registrationId: selectedRegistrationId,
  companyName,
  businessNature,
  businessEmail,
  phoneNumber,
  registeredOfficeAddress,
  companyType,
  countryOfIncorporation,
  businessRegistrationNumber,
  incorporationDate,
});

// Optional docs (repeat for each file)
const init = await api.post(`/api/v1/admin/customers/${customerId}/documents/upload-init`, docMeta);
await uploadToS3(init.uploadUrl, file, init.requiredHeaders);
await api.post(`/api/v1/admin/customers/${customerId}/documents/${init.documentId}/upload-complete`, {});

// Optional final completion
await api.patch(`/api/v1/registrations/${selectedRegistrationId}`, { status: "completed" });
```

---

## 4. Error Handling / Partial Success Recovery (Very Important)

This flow is multi-step and not a single backend transaction, so frontend must handle partial success.

### Case A — Modal closed before final submit

State:

- no backend data is created

Frontend behavior:

- safe to discard wizard state
- no orphan customer user exists

### Case B — `POST /users` succeeds, link API fails

State:

- customer user exists
- registration not linked

Frontend behavior:

- show message: customer created, linking failed
- allow retry of only:
  - `PATCH /api/v1/registrations/:id/customer`
- do **not** retry `POST /users` blindly (email may already exist)

### Case C — create + link succeed, company profile save fails

State:

- user exists
- registration linked
- no profile yet (or partial profile)

Frontend behavior:

- let admin retry profile save
- allow close/resume later from Customer Management detail page

### Case D — upload-init succeeds, S3 upload fails

State:

- backend metadata row may remain `pending_upload`

Frontend behavior:

- retry upload using a fresh `upload-init`
- optionally ignore stale pending rows (backend list can be filtered)

### Case E — everything succeeds except registration completion

State:

- customer created + linked
- profile/docs may be saved
- registration status not updated

Frontend behavior:

- show success with warning
- offer retry for `PATCH /api/v1/registrations/:id`

---

## 5. Data Frontend Should Persist Across Wizard Steps

Keep this in modal/wizard state (or temp store) until final submit succeeds:

- `selectedRegistrationId`
- `createdCustomerId`
- `createdCustomerEmail`
- `customerCreated` (boolean)
- `registrationLinked` (boolean)
- `companyProfileSaved` (boolean)
- uploaded docs array:
  - `documentId`
  - `name`
  - `category`
  - `status`

This avoids orphan users, prevents duplicate creation, and supports retry on partial failures.

---

## 6. Customer Visibility After Admin Uploads (What Happens Next)

Once admin uploads company documents under:

- `POST /api/v1/admin/customers/:customerId/documents/upload-init`
- `POST /api/v1/admin/customers/:customerId/documents/:documentId/upload-complete`

those documents are stored against that `customerId`.

Customer portal can read/download them via customer-only endpoints:

- `GET /api/v1/customer/documents`
- `GET /api/v1/customer/documents/:documentId`
- `GET /api/v1/customer/documents/:documentId/download-url`

So admin-uploaded docs become visible to the linked customer (read-only).

---

## 7. What Frontend Should NOT Do in This Flow

- Do not resend the full registration payload to link a customer
- Do not use admin endpoints from customer portal
- Do not use customer endpoints during admin onboarding flow
- Do not include directors/shareholders in company-profile payload
- Do not retry `POST /users` automatically after partial failure without checking if user was already created

---

## 8. APIs Used in This Flow (Checklist)

- `GET /api/v1/registrations` (dropdown list)
- `POST /users` (create customer user, `type=CUSTOMER`)
- `PATCH /api/v1/registrations/:registrationId/customer` (link registration to customer)
- `POST /api/v1/admin/customers/:customerId/company-profile` (save company profile)
- `PATCH /api/v1/admin/customers/:customerId/company-profile` (if editing/updating)
- `GET /api/v1/admin/customers/:customerId/stakeholders` (show directors/shareholders)
- `POST /api/v1/admin/customers/:customerId/documents/upload-init` (optional docs)
- `POST /api/v1/admin/customers/:customerId/documents/:documentId/upload-complete` (optional docs)
- `PATCH /api/v1/registrations/:registrationId` (optional status completion)

---

## 9. Exact UI Sequence (Revised) — What Happens on Each Button

### `Create Customer` button

- Open wizard/modal
- Load registrations dropdown (`GET /api/v1/registrations`) unless already on registration detail page with a preselected registration

### `Next` button (step 1 -> step 2)

- Frontend validation only
- Save login fields in local wizard state
- No backend API call

### `Back` button (step 2 -> step 1)

- Keep wizard state in memory (login data + company profile draft + selected files)
- No backend API call

### `Close` button before final submit

- Discard local wizard state
- No backend cleanup required (because no backend write has happened yet)

### `Final Submit / Complete Registration` button

- Run the backend API chain in this exact order:
  1. `POST /users`
  2. `PATCH /api/v1/registrations/:registrationId/customer`
  3. `POST/PATCH /api/v1/admin/customers/:customerId/company-profile`
  4. optional docs upload flow (`upload-init` -> S3 `PUT` -> `upload-complete`)
  5. optional `PATCH /api/v1/registrations/:registrationId` (`status=completed`)
