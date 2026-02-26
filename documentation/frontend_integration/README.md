# MuteTaxes — HK Company Formation API: Frontend Integration Guide

This documentation is written for the **frontend team**. It covers everything you need to
integrate with the Company Formation REST API — from uploading documents to submitting the
final registration payload.

---

## Table of Contents

| File | What it covers |
|------|----------------|
| [01-api-overview.md](./01-api-overview.md) | Base URL, endpoints, headers, CORS, limits |
| [02-file-upload-flow.md](./02-file-upload-flow.md) | How to upload files before registration (presign → PUT → reference) |
| [03-payload-reference.md](./03-payload-reference.md) | Every field in the registration payload with types and constraints |
| [04-validation-rules.md](./04-validation-rules.md) | All checks you must enforce on the frontend (mirrors server rules) |
| [05-error-handling.md](./05-error-handling.md) | All possible error responses and how to handle/display them |
| [06-examples.md](./06-examples.md) | Full valid payload examples (single person, two persons) |
| [07-auth-role-and-customer-portal.md](./07-auth-role-and-customer-portal.md) | Auth/user type, `/auth/me`, portal routing, registration ownership/linking basics |
| [08-customer-management-admin-modules.md](./08-customer-management-admin-modules.md) | Admin Customer Management list/detail tabs: profile, documents, renewals, service requests |
| [09-customer-creation-and-registration-linking.md](./09-customer-creation-and-registration-linking.md) | Admin create-customer wizard, registration linking, company setup, onboarding docs upload |

---

## Quick-start Checklist

1. Upload all documents first via `POST /api/v1/uploads/presign` + `PUT <uploadUrl>`.
2. Collect the `{ key, publicUrl }` returned for each file.
3. Build the registration JSON payload (see [03-payload-reference.md](./03-payload-reference.md)).
4. Run every frontend validation check (see [04-validation-rules.md](./04-validation-rules.md)).
5. Submit `POST /api/v1/registrations`.
6. On `201` — show the confirmation page with `{ id, status, submittedAt }`.
7. On `400` / `409` / `500` — see [05-error-handling.md](./05-error-handling.md).
8. Customer registrations are usually linked by admin during completion. After customer login, call `GET /auth/me` and then fetch `GET /api/v1/my-registrations` (claim endpoint is optional fallback) — see [07-auth-role-and-customer-portal.md](./07-auth-role-and-customer-portal.md).
9. For Admin Customer Management tabs and Create Customer wizard integration, use [08-customer-management-admin-modules.md](./08-customer-management-admin-modules.md) and [09-customer-creation-and-registration-linking.md](./09-customer-creation-and-registration-linking.md).
