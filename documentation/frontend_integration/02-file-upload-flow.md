# 02 — File Upload Flow

Documents must be uploaded to object storage **before** you submit the registration
payload. The registration payload only contains **references** to already-uploaded files
(key, url, fileName, mimeType, size).

---

## Step-by-step

```
Frontend                        API Server                  Object Storage (S3/MinIO)
   |                               |                               |
   |--- POST /api/v1/uploads/presign ---->                         |
   |    { documentType, fileName,  |                               |
   |      mimeType, sizeBytes }    |                               |
   |                               |-- generates presigned PUT URL->|
   |<-- 200 { uploadUrl, key,      |                               |
   |          publicUrl, expiresIn}|                               |
   |                               |                               |
   |--- PUT <uploadUrl> (raw bytes, Content-Type header) --------> |
   |<-- 200 OK (empty body) ------------------------------------ --|
   |                               |                               |
   | (store key + publicUrl locally, build payload)
   |                               |
   |--- POST /api/v1/registrations (JSON payload with file refs) ->|
   |<-- 201 { id, status, submittedAt } ----------------------- --|
```

---

## Step 1: Presign the upload

```typescript
const presignRes = await fetch('/api/v1/uploads/presign', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    documentType: 'passport',       // see allowed types below
    fileName:     file.name,        // original file name from <input type="file">
    mimeType:     file.type,        // e.g. "application/pdf"
    sizeBytes:    file.size,        // in bytes
  }),
});

if (!presignRes.ok) {
  const err = await presignRes.json();
  // handle validation error — see 05-error-handling.md
}

const { uploadUrl, key, publicUrl, expiresIn } = await presignRes.json();
```

---

## Step 2: PUT the file bytes

Upload the **raw file** directly to the presigned URL using an HTTP `PUT`. Do **not** use
`multipart/form-data` — the presigned URL expects the raw binary content.

```typescript
const uploadRes = await fetch(uploadUrl, {
  method: 'PUT',
  headers: { 'Content-Type': file.type },  // must match the mimeType sent in step 1
  body: file,                               // the File/Blob object directly
});

if (!uploadRes.ok) {
  throw new Error(`Storage upload failed: ${uploadRes.status}`);
}
```

The `uploadUrl` expires in `expiresIn` seconds (900 s = 15 minutes). If the user takes
too long filling out the form, you may need to request a new presigned URL.

---

## Step 3: Build the FileReference object

After a successful PUT, you have everything needed to construct the file reference object
that goes into the registration payload:

```typescript
const fileRef = {
  key:      key,         // from presign response
  url:      publicUrl,   // from presign response
  fileName: file.name,   // original filename
  mimeType: file.type,   // MIME type
  size:     file.size,   // bytes (integer)
};
```

This exact shape is used inside `persons[n].documents.*` in the registration payload.

---

## Allowed document types

| `documentType` value | Used for |
|----------------------|----------|
| `passport` | Individual person's passport scan |
| `selfie` | Individual person's selfie / liveness photo |
| `addressProof` | Individual person's proof of address |
| `certificate_of_incorporation` | Corporate person's certificate of incorporation |
| `business_license` | Corporate person's business licence |
| `others` | Any supplementary documents |

---

## Allowed file types and size

| Property | Allowed values |
|----------|---------------|
| `mimeType` | `application/pdf`, `image/jpeg`, `image/jpg`, `image/png`, `image/webp` |
| `sizeBytes` | 1 byte – 10,485,760 bytes (10 MB) |

The presign endpoint will return `400` if you send an unsupported MIME type or a file
that exceeds 10 MB. **Validate these on the frontend** before calling presign to give
the user a fast, clear error.

```typescript
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

function validateFile(file: File): string | null {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return `Unsupported file type: ${file.type}. Allowed: PDF, JPEG, PNG, WEBP`;
  }
  if (file.size > MAX_SIZE_BYTES) {
    return `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 10 MB`;
  }
  if (file.size === 0) {
    return 'File is empty';
  }
  return null;
}
```

---

## Required vs optional documents per person type

### `individual` person — ALL THREE are required

| Field | Required |
|-------|---------|
| `documents.passport` | **YES** |
| `documents.selfie` | **YES** |
| `documents.addressProof` | **YES** |
| `documents.certificate_of_incorporation` | No (send `null`) |
| `documents.business_license` | No (send `null`) |
| `documents.others` | No (send `null`) |

### `corporate` person — no strict server requirement, but send what you have

| Field | Notes |
|-------|-------|
| `documents.passport` | Optional — send `null` if not applicable |
| `documents.selfie` | Optional — send `null` if not applicable |
| `documents.addressProof` | Optional — send `null` if not applicable |
| `documents.certificate_of_incorporation` | Recommended — upload the company's certificate |
| `documents.business_license` | Optional |
| `documents.others` | Optional |

Always include all 6 document fields in the payload, even if they are `null`.

---

## Handling presign expiry

The presigned URL is valid for **15 minutes**. If the user is still on the form when the
URL expires and tries to upload, the `PUT` will fail with a 4xx from the storage provider.
Recommended approach:

1. Track when each presigned URL was generated.
2. If more than 14 minutes have passed, call presign again to get a fresh URL.
3. Re-upload the file with the new URL.
