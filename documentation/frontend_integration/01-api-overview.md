# 01 — API Overview

## Base URL

| Environment | Base URL |
|-------------|----------|
| Local dev   | `http://localhost:3000` |
| Production  | *(to be updated)* |

Interactive Swagger docs: `http://localhost:3000/api/docs`
Health check: `http://localhost:3000/health`

---

## Endpoints

### 1. Presign a file upload

```
POST /api/v1/uploads/presign
```

Use this **before** submitting the registration to get a temporary URL for uploading
a document directly to object storage.

**Request body**

```json
{
  "documentType": "passport",
  "fileName": "passport_john.pdf",
  "mimeType": "application/pdf",
  "sizeBytes": 204800
}
```

**Success response — 200 OK**

```json
{
  "uploadUrl":  "https://storage.example.com/...",
  "key":        "uploads/passport/uuid/passport_john.pdf",
  "publicUrl":  "https://storage.example.com/company-formation/uploads/passport/uuid/passport_john.pdf",
  "expiresIn":  900
}
```

- `uploadUrl` — pre-signed PUT URL. Use it to upload the raw file bytes (expires in 15 min).
- `key` — storage path inside the bucket. Store this; you will send it in the registration payload.
- `publicUrl` — permanent URL to access the file after upload. Store this too.
- `expiresIn` — seconds until `uploadUrl` expires (900 = 15 minutes).

---

### 2. Submit a company registration

```
POST /api/v1/registrations
```

Sends the complete company formation payload. Validated server-side before any DB write.

**Request body** — `Content-Type: application/json`
See [03-payload-reference.md](./03-payload-reference.md) for the full schema.

**Success response — 201 Created**

```json
{
  "id":          "550e8400-e29b-41d4-a716-446655440000",
  "status":      "pending_review",
  "submittedAt": "2026-02-13T10:30:00.000Z"
}
```

---

## Request Headers

```
Content-Type: application/json
```

No authentication headers are required for the public registration endpoint.

---

## CORS

The API allows requests from the following origins:

- `http://localhost:5173` (Vite dev)
- `http://localhost:4173` (Vite preview)
- `http://localhost:3030`
- `http://192.168.100.15:5173`
- `http://192.168.0.0:5173`

Allowed methods: `GET`, `POST`, `PUT`, `OPTIONS`
Allowed headers: `Content-Type`, `Authorization`

If you add a new origin (staging, production domain) you must ask the backend team to
update the CORS allow-list.

---

## Request Size Limit

The JSON body must be **under 2 MB**. Individual files uploaded via the presign endpoint
must be **under 10 MB** each.

---

## Status Codes Summary

| Code | Meaning |
|------|---------|
| 200  | Presign URL generated successfully |
| 201  | Registration created successfully |
| 400  | Validation error — see `details` in response body |
| 409  | Duplicate record / DB constraint violation |
| 500  | Unexpected server error |
