# 05 — Error Handling

This document covers every error response the API can return and how you should handle
each one in the UI.

---

## Error response shapes

There are two different error response shapes depending on where the error originates.

### Shape A — Validation error (400)

Returned when the request body fails Zod schema validation.

```json
{
  "error": "Validation failed",
  "details": {
    "formErrors": [],
    "fieldErrors": {
      "applicant": ["Required"],
      "persons": ["Sum of shareholder shares (9000) must equal shareCapital.totalShares (10000)"]
    }
  }
}
```

`details` is a Zod `flatten()` object with two keys:
- `fieldErrors` — a map of `fieldPath → string[]` (array of error messages per field)
- `formErrors` — array of top-level (non-field) errors

The field path uses **dot notation for nested fields**:
`"applicant.email"`, `"persons.0.documents.passport"`, `"billing.phone"`

---

### Shape B — Simple error (400 / 409 / 500)

Returned for non-validation errors.

```json
{
  "error": "A record with this data already exists"
}
```

---

## Status codes and what to do

### 201 Created

Registration was accepted. Parse the response and show a confirmation screen.

```json
{
  "id":          "550e8400-e29b-41d4-a716-446655440000",
  "status":      "pending_review",
  "submittedAt": "2026-02-13T10:30:00.000Z"
}
```

Show the user:
- Reference ID (`id`) so they can follow up.
- Status message — `"pending_review"` means the team will review the application.
- Submission timestamp.

---

### 400 Bad Request — field-level validation

Check `details.fieldErrors`. Map each field path back to the correct form field and
display the error message inline.

```typescript
interface ValidationErrorResponse {
  error: 'Validation failed';
  details: {
    formErrors: string[];
    fieldErrors: Record<string, string[] | undefined>;
  };
}

async function submitRegistration(payload: unknown) {
  const res = await fetch('/api/v1/registrations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (res.status === 400) {
    const body: ValidationErrorResponse = await res.json();
    // Map each field error to the form
    Object.entries(body.details.fieldErrors).forEach(([path, messages]) => {
      setFieldError(path, messages?.[0] ?? 'Invalid value');
    });
    // Also show any form-level errors
    body.details.formErrors.forEach((msg) => showGlobalError(msg));
    return;
  }

  if (res.status === 201) {
    const data = await res.json();
    navigateToConfirmation(data);
    return;
  }

  // handle other status codes...
}
```

---

### 400 Bad Request — presign endpoint

```json
{
  "error": "Validation failed",
  "details": {
    "fieldErrors": {
      "mimeType": ["Invalid enum value. Expected 'passport' | 'selfie' | ..."],
      "sizeBytes": ["Number must be less than or equal to 10485760"]
    },
    "formErrors": []
  }
}
```

Or a plain string error:
```json
{
  "error": "Unsupported file type: image/bmp. Allowed: PDF, JPEG, PNG, WEBP"
}
```

Show the error near the file input that triggered the presign call.

---

### 409 Conflict

A database-level duplicate or constraint violation.

```json
{
  "error": "A record with this data already exists"
}
```

Show a top-level notification. The user may have already submitted this registration
(e.g. double-click on Submit button). Suggest they check their email for a confirmation.

**Prevention:** Disable the Submit button immediately after the first click.

---

### 500 Internal Server Error

An unexpected server-side error. This should be rare.

```json
{
  "error": "An unexpected error occurred"
}
```

Also note: if you send **malformed JSON** (syntax error in body) or a body **larger than 2 MB**,
the server currently returns 500 instead of 400. Prevent this by:
1. Always serialising with `JSON.stringify` (not string concatenation).
2. Keeping the payload well under 2 MB (files are uploaded separately, only references
   are in the JSON body — a typical payload is ~5 KB).

Show a generic error message and a retry option. Log the error to your error tracking
service (Sentry, etc.).

---

## Complete error-handling template

```typescript
type ApiError =
  | { type: 'validation'; fieldErrors: Record<string, string[] | undefined>; formErrors: string[] }
  | { type: 'conflict'; message: string }
  | { type: 'server'; message: string }
  | { type: 'network'; message: string };

async function callRegistrationApi(payload: unknown): Promise<ApiError | null> {
  let res: Response;

  try {
    res = await fetch('/api/v1/registrations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    // Network failure (offline, DNS, etc.)
    return { type: 'network', message: 'Unable to reach the server. Check your connection.' };
  }

  if (res.status === 201) {
    // success — caller handles this
    return null;
  }

  const body = await res.json().catch(() => ({ error: 'Unknown error' }));

  if (res.status === 400) {
    if (body.details) {
      return {
        type: 'validation',
        fieldErrors: body.details.fieldErrors ?? {},
        formErrors:  body.details.formErrors  ?? [],
      };
    }
    return { type: 'validation', fieldErrors: {}, formErrors: [body.error] };
  }

  if (res.status === 409) {
    return { type: 'conflict', message: body.error };
  }

  return { type: 'server', message: body.error ?? 'An unexpected error occurred' };
}
```

---

## Field path reference — how Zod reports nested errors

The server flattens nested validation errors. The keys in `fieldErrors` use
**dot + array-index notation**. Common examples:

| `fieldErrors` key | Meaning |
|-------------------|---------|
| `applicant` | Error on the entire applicant object |
| `applicant.email` | applicant's email field |
| `company.proposedCompanyName` | Company name |
| `company.natureOfBusiness` | natureOfBusiness array |
| `shareCapital.totalShares` | Shares mismatch (cross-field rule) |
| `persons` | Cross-field error on the persons array |
| `persons.0.fullName` | First person's fullName |
| `persons.1.documents.passport` | Second person's passport document |
| `persons.0.shareholding.percentage` | First person's shareholding percentage |
| `services.banking.preferredProvider` | Missing/invalid preferred provider |
| `services.banking.providers` | no_bank_account exclusivity violation |
| `billing.phone` | Billing phone (E.164 format) |
| `complianceAccepted.isAccepted` | Compliance not accepted |

---

## User-facing error messages (suggested copy)

| Error | Suggested UI message |
|-------|---------------------|
| `complianceAccepted.isAccepted` | "You must accept the terms and compliance statement to proceed." |
| `shareCapital.totalShares` share mismatch | "The total shares allocated to shareholders must equal the total shares in the share capital." |
| `persons` percentage mismatch | "Shareholder percentages must add up to exactly 100%." |
| `persons` no director | "At least one person must be assigned the Director role, or select Nominee Director Service." |
| `services.banking.preferredProvider` missing | "Please select a preferred banking provider from your chosen options." |
| `services.banking.providers` no_bank_account conflict | "Cannot combine 'No Bank Account' with other banking providers." |
| `persons` duplicate email | "Each individual person must have a unique email address." |
| `documents.passport` missing | "A passport document is required for individual persons." |
| `documents.selfie` missing | "A selfie / ID photo is required for individual persons." |
| `documents.addressProof` missing | "A proof of address document is required for individual persons." |
| 409 Conflict | "This registration may already have been submitted. Please check your email for a confirmation." |
| 500 Server Error | "Something went wrong on our end. Please try again in a moment." |
| Network error | "Unable to reach the server. Please check your internet connection and try again." |
