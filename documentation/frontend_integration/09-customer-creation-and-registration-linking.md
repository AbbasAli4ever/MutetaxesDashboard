# 09 — Customer Creation and Registration Linking (Admin Flow)

This document is for frontend engineers integrating the **Create Customer** flow and **Registration -> Customer linking** flow shown in the admin registration/customer-management screens.

It covers:

- Creating a customer login (admin-created)
- Linking a registration to a customer account
- Company setup creation during customer onboarding
- Optional company document uploads during onboarding
- Backend constraints and recovery behavior

This reflects the backend behavior implemented in this codebase today.

---

## 1. Business Flow (Current)

### Official flow (admin-driven)

1. Public registration is submitted
2. Admin reviews registration in admin panel
3. Admin creates customer login (name/email/password + badge + `type=CUSTOMER`)
4. Admin links the registration to that customer
5. Admin optionally creates company profile and uploads company docs
6. Customer logs in and sees portal data

### Important note

Customer self-claim (`POST /api/v1/registrations/:id/claim`) exists as a fallback, but it is **not** the primary business flow.

---

## 2. Core APIs Used in Customer Creation Flow

### 2.1 Create customer login (admin user management API)

```text
POST /users
```

Required fields (practical admin flow):

- `name`
- `email`
- `password`
- `badgeId` (customer badge)
- `type: "CUSTOMER"`

Optional:

- `active` (defaults to active if omitted by backend/UI flow)

### Example request

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

### Example response (current shape)

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

### Backend validation notes

- only `ADMIN` user type can create users
- admin cannot create/assign admin users unless allowed by their own type/permissions logic
- `type` must be `CUSTOMER` or `ADMIN`
- email must be unique

---

## 3. Link Registration to Customer (No Full Payload Resend)

This is the backend-supported way to attach an already-submitted registration to the newly created customer account.

### Endpoint

```text
PATCH /api/v1/registrations/:id/customer
```

### Request body

```json
{
  "customerId": 12
}
```

To unlink:

```json
{
  "customerId": null
}
```

### Backend validation

- endpoint is admin-only
- `customerId` must be number or `null`
- selected user must exist
- selected user must be `type=CUSTOMER`
- selected customer must be active

### Why this exists (important)

You do **not** need to resend the full registration payload to connect a customer account.

This is intentionally a lightweight linking endpoint.

---

## 4. Registration Completion + Customer Creation Wizard (UI Flow Mapping)

The screenshots show a 2-step admin modal:

1. `Customer Login`
2. `Company Setup`

Backend does **not** currently expose a single transactional endpoint for this entire wizard.

Frontend should orchestrate multiple APIs in sequence.

---

## 5. Recommended Frontend Sequence (Step-by-Step)

## Step 1 — Create Customer Login (Customer Login tab)

Call:

```text
POST /users
```

Store:

- `createdCustomerId` (required for subsequent calls)

### Field mapping for screenshot (Customer Login step)

- `First Name` + `Last Name` -> frontend may combine into `name` (backend `POST /users` expects single `name`)
- `Email Address` -> `email`
- `Password` -> `password`
- `Confirm Password` -> frontend-only validation
- `type` -> always send `"CUSTOMER"`

### Suggested frontend implementation

Combine names before request:

```text
name = `${firstName} ${lastName}`.trim()
```

---

## Step 2 — Link Registration to Customer

Call:

```text
PATCH /api/v1/registrations/:registrationId/customer
```

Payload:

```json
{ "customerId": 12 }
```

This should happen after successful customer creation.

---

## Step 3 — Company Setup (Company Profile tab/modal section)

Use the company profile API:

- `GET /api/v1/admin/customers/:customerId/company-profile` (optional pre-check)
- `POST /api/v1/admin/customers/:customerId/company-profile` (create)
- `PATCH /api/v1/admin/customers/:customerId/company-profile` (update if already exists)

### Suggested create payload (mapped from screenshot)

```json
{
  "registrationId": "2f2597be-8b5c-4594-b03b-af421715b8d0",
  "companyName": "hello",
  "businessNature": "ecommerce",
  "businessEmail": "zaeem@swiftnine.com",
  "phoneNumber": "+852-123456789",
  "registeredOfficeAddress": "hello, ahore, punjab, 1857189, HK"
}
```

### Important note about directors/shareholders fields in screenshot

The UI shows:

- `Directors`
- `Shareholders with Shareholding %`

Backend source of truth for these in Customer Management is currently **Stakeholders** (linked registration stakeholder data).

Frontend should:

- display these from `GET /api/v1/admin/customers/:customerId/stakeholders`
- use stakeholder create/update endpoints for edits (not company-profile payload)

---

## Step 4 — Company Document Uploads (Optional in onboarding)

If the wizard uploads company docs during customer creation, use the customer-company-documents flow:

1. `POST /api/v1/admin/customers/:customerId/documents/upload-init`
2. Upload to returned S3 `uploadUrl`
3. `POST /api/v1/admin/customers/:customerId/documents/:documentId/upload-complete`

### Suggested category/documentType mapping for onboarding docs

Frontend labels from the screenshot can map like this:

- Certificate of Incorporation
  - `category = "Incorporation"`
  - `documentType = "certificate_of_incorporation"`
- Business Registration
  - `category = "Registration"`
  - `documentType = "business_registration_certificate"` (or team-standard code)
- Articles of Association
  - `category = "Constitution"`
  - `documentType = "articles_of_association"`
- Annual Return
  - `category = "Statutory"`
  - `documentType = "annual_return"`
- Board Resolution
  - `category = "Statutory"`
  - `documentType = "board_resolution"`
- Other Documents
  - `category = "Other"`
  - `documentType = "other"`

Backend note:

- `category` is required and free-form string
- `documentType` is optional string
- you can define stable frontend enums and send them consistently

---

## 6. Registration Status Update (Admin workflow)

After customer creation + linking (and optionally company setup/docs), frontend can update registration status using the existing admin registration update endpoint:

```text
PATCH /api/v1/registrations/:registrationId
```

Typical use:

- set registration to `completed`

This endpoint is separate from customer linking on purpose.

---

## 7. Failure Handling / Recovery Strategy (Frontend)

Because the backend currently uses multiple endpoints (not one transaction), frontend should handle partial success.

### Case A: customer created, registration link failed

State:

- user exists
- registration not linked

Recovery:

- allow retry of `PATCH /api/v1/registrations/:id/customer`
- do not re-create the user if email already exists

### Case B: customer + link succeeded, company profile failed

State:

- customer can still exist and log in
- registration is linked

Recovery:

- retry company profile create/update
- profile can be completed later from Customer Management detail screen

### Case C: upload-init succeeded, S3 upload failed

State:

- metadata row exists with `pending_upload`

Recovery:

- retry upload by starting a new upload-init (recommended)
- optionally mark old metadata row as `failed` via PATCH if your UI wants cleanup behavior

---

## 8. Create Customer From Customer Management List (Without Registration)

The screenshots also show a `Create Customer` button in the Customer Management list screen.

This flow can be supported with:

### Option A — Customer-only creation (no registration selected)

1. `POST /users` with `type=CUSTOMER`
2. Optionally `POST /api/v1/admin/customers/:customerId/company-profile`
3. Optional docs upload

### Option B — Customer creation + registration selected from dropdown

1. `POST /users`
2. `PATCH /api/v1/registrations/:registrationId/customer`
3. Company profile/doc setup

Backend fully supports this multi-step flow today.

---

## 9. Data Ownership and Portal Behavior (Important)

Once registration is linked to a customer:

- customer portal can access only own registrations (`/api/v1/my-registrations`)
- admin customer-management page can access customer-scoped modules under `/api/v1/admin/customers/:customerId/...`

Backend enforces ownership and admin/customer route separation server-side.

Frontend should still apply route guards, but backend is the source of truth.

---

## 10. What Is Not Yet a Single Backend Endpoint (By Design / Current State)

The following are **not** combined into one backend endpoint yet:

- create customer + link registration + create company profile + upload docs + complete registration

Frontend must orchestrate these calls in sequence.

If needed later, backend can add a convenience endpoint like:

```text
POST /api/v1/admin/customers/from-registration
```

But current implementation is intentionally modular and already production-usable.

