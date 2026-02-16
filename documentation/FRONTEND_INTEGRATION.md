# MuteTaxes Backend — Frontend Integration Guide

> **Base URL (Development):** `http://localhost:3000`
> **Content-Type:** All requests must use `application/json`
> **Authentication:** Bearer JWT token in `Authorization` header

---

## Table of Contents

1. [Quick Start](#1-quick-start)
2. [Authentication Flow](#2-authentication-flow)
3. [Token Management](#3-token-management)
4. [Permission System](#4-permission-system)
5. [API Reference](#5-api-reference)
   - [Public Routes](#51-public-routes)
   - [Auth Routes](#52-auth-routes)
   - [Badge Routes](#53-badge-routes)
   - [User Routes](#54-user-routes)
     - [POST /users — Create user](#post-users)
     - [GET /users — List all users](#get-users)
     - [PATCH /users/:id — Update user](#patch-usersid)
     - [DELETE /users/:id — Delete user](#delete-usersid)
6. [Error Handling](#6-error-handling)
7. [HTTP Status Codes](#7-http-status-codes)
8. [All 32 Permissions Reference](#8-all-32-permissions-reference)
9. [Data Models](#9-data-models)
10. [Implementation Examples](#10-implementation-examples)
11. [Environment Setup](#11-environment-setup)

---

## 1. Quick Start

### Step 1 — Login and get tokens

```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin@mutetaxes.com",
  "password": "secure_password_123"
}
```

Response:

```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "admin@mutetaxes.com",
    "name": "Super Admin",
    "permissions": ["REGISTRATIONS_READ", "BADGE_CREATION_READ", "..."]
  }
}
```

### Step 2 — Attach token to every protected request

```http
GET /badges
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 3 — Refresh the access token when it expires

```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 2. Authentication Flow

The backend uses a two-token JWT strategy.

```
┌──────────┐                             ┌──────────┐
│ Frontend │                             │ Backend  │
└────┬─────┘                             └────┬─────┘
     │  POST /auth/login                      │
     │  { email, password }                   │
     │ ─────────────────────────────────────► │
     │                                        │  Validate credentials
     │                                        │  Generate accessToken (1 day)
     │                                        │  Generate refreshToken (7 days)
     │  { accessToken, refreshToken, user }   │
     │ ◄───────────────────────────────────── │
     │                                        │
     │  GET /badges                           │
     │  Authorization: Bearer <accessToken>   │
     │ ─────────────────────────────────────► │
     │                                        │  Validate JWT
     │                                        │  Check BADGE_CREATION_READ permission
     │  { success: true, badges: [...] }      │
     │ ◄───────────────────────────────────── │
     │                                        │
     │  [Access token expires after 1 day]    │
     │                                        │
     │  POST /auth/refresh                    │
     │  { refreshToken }                      │
     │ ─────────────────────────────────────► │
     │                                        │  Validate refresh token
     │                                        │  Generate new accessToken
     │  { success: true, accessToken }        │
     │ ◄───────────────────────────────────── │
└──────────┘                             └──────────┘
```

### Token Lifetimes

| Token        | Expiry  | Purpose                                  |
|--------------|---------|------------------------------------------|
| accessToken  | 1 day   | Authenticate every API request           |
| refreshToken | 7 days  | Obtain a new access token after expiry   |

> **Side effect:** Every successful login also updates the user's `lastActive` timestamp in the database, which is visible in `GET /users`.

---

## 3. Token Management

### Storage Recommendations

```
┌─────────────────────────────────────────────────────┐
│ Token Storage Strategy                              │
├────────────────┬────────────────────────────────────┤
│ accessToken    │ In-memory (JS variable / Zustand /  │
│                │ Redux state) — cleared on page      │
│                │ refresh, which is fine.             │
├────────────────┬────────────────────────────────────┤
│ refreshToken   │ localStorage or secure HttpOnly     │
│                │ cookie (if backend adds cookie      │
│                │ support). Never store access token  │
│                │ in localStorage if possible.        │
└────────────────┴────────────────────────────────────┘
```

### How to attach the token (Axios example)

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000',
});

// Request interceptor — attach access token
api.interceptors.request.use((config) => {
  const accessToken = getAccessToken(); // from your state/store
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Response interceptor — auto-refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        const { data } = await axios.post('/auth/refresh', { refreshToken });
        setAccessToken(data.accessToken);
        // Retry the original request
        error.config.headers.Authorization = `Bearer ${data.accessToken}`;
        return api.request(error.config);
      }
    }
    return Promise.reject(error);
  }
);
```

### JWT Payload Structure

The decoded access token contains:

```json
{
  "userId": 1,
  "iat": 1700000000,
  "exp": 1700086400
}
```

> The backend validates the token and fetches the full user (with permissions) from the database on every protected request. You do not need to decode the JWT on the frontend — use the `permissions` array returned at login or from `GET /auth/me/permissions`.

---

## 4. Permission System

### How Permissions Work

Permissions are assigned to **Badges**. Users receive one or more Badges. The union of all permissions across all badges determines what a user can do.

```
User
 └── Badge: "Admin"
      ├── Permission: REGISTRATIONS_READ
      ├── Permission: REGISTRATIONS_CREATE
      ├── Permission: BADGE_CREATION_READ
      └── ... (all 32 for super admin)
```

### Checking Permissions on the Frontend

After login, the `user.permissions` array contains all the user's permission codes as strings:

```json
{
  "permissions": [
    "REGISTRATIONS_READ",
    "BADGE_CREATION_READ",
    "BADGE_CREATION_UPDATE"
  ]
}
```

**Helper function:**

```typescript
function hasPermission(userPermissions: string[], required: string): boolean {
  return userPermissions.includes(required);
}

// Usage
if (hasPermission(user.permissions, 'BADGE_CREATION_CREATE')) {
  // Show "Create Badge" button
}
```

**React component guard example:**

```tsx
function PermissionGate({
  permission,
  children,
}: {
  permission: string;
  children: React.ReactNode;
}) {
  const { permissions } = useAuth(); // your auth context
  if (!permissions.includes(permission)) return null;
  return <>{children}</>;
}

// Usage
<PermissionGate permission="BADGE_CREATION_CREATE">
  <CreateBadgeButton />
</PermissionGate>
```

> **Important:** Frontend permission checks are for UI/UX only. The backend enforces permissions on every request independently. Always guard sensitive UI behind both a permission check AND expect proper backend 403 responses.

---

## 5. API Reference

### 5.1 Public Routes

---

#### `GET /`
Health check. No authentication required.

**Response `200`:**
```json
{
  "success": true,
  "message": "Yes, MuteTaxes Backend API is working!"
}
```

---

#### `GET /permissions`
Returns all 32 available permissions. No authentication required. Use this to populate permission selection UIs (e.g., badge creation form).

**Response `200`:**
```json
{
  "success": true,
  "message": "Yes, permissions route is working!",
  "permissions": [
    {
      "id": 1,
      "code": "REGISTRATIONS_CREATE",
      "displayName": "Create Registrations",
      "description": "Allows creating new registrations"
    }
  ]
}
```

---

### 5.2 Auth Routes

---

#### `POST /auth/login`
Authenticate a user and receive tokens.

**Auth required:** No

**Request body:**
```json
{
  "email": "admin@mutetaxes.com",
  "password": "secure_password_123"
}
```

| Field    | Type   | Required | Description     |
|----------|--------|----------|-----------------|
| email    | string | Yes      | User's email    |
| password | string | Yes      | User's password |

**Response `200`:**
```json
{
  "success": true,
  "accessToken": "eyJhbGci...",
  "refreshToken": "eyJhbGci...",
  "user": {
    "id": 1,
    "email": "admin@mutetaxes.com",
    "name": "Super Admin",
    "permissions": ["REGISTRATIONS_READ", "BADGE_CREATION_READ"]
  }
}
```

**Error responses:**
```json
// 400 — Missing fields
{ "error": "Bad Request", "message": "Email and password are required" }

// 401 — Wrong credentials
{ "error": "Unauthorized", "message": "Invalid email or password" }

// 500 — Server error
{ "error": "Internal Server Error", "message": "..." }
```

---

#### `POST /auth/refresh`
Exchange a valid refresh token for a new access token.

**Auth required:** No

**Request body:**
```json
{
  "refreshToken": "eyJhbGci..."
}
```

| Field        | Type   | Required | Description            |
|--------------|--------|----------|------------------------|
| refreshToken | string | Yes      | The current refresh token |

**Response `200`:**
```json
{
  "success": true,
  "accessToken": "eyJhbGci..."
}
```

**Error responses:**
```json
// 400 — Missing token
{ "error": "Bad Request", "message": "Refresh token is required" }

// 403 — Invalid or expired refresh token
{ "error": "Forbidden", "message": "Invalid or expired refresh token" }

// 404 — User deleted after token issued
{ "error": "Not Found", "message": "User not found" }
```

---

#### `GET /auth/me/permissions`
Returns the full permission list for the currently authenticated user. Use this to re-sync permissions after session restore.

**Auth required:** Yes — Bearer token

**Request:**
```http
GET /auth/me/permissions
Authorization: Bearer <accessToken>
```

**Response `200`:**
```json
{
  "permissions": [
    {
      "id": 1,
      "code": "REGISTRATIONS_READ",
      "displayName": "Read Registrations"
    },
    {
      "id": 9,
      "code": "BADGE_CREATION_READ",
      "displayName": "Read Badge Creation"
    }
  ]
}
```

> This endpoint deduplicates permissions automatically, so if a user has multiple badges with overlapping permissions, each permission code appears only once.

**Error responses:**
```json
// 401 — No / invalid token
{ "error": "Unauthorized", "message": "Authorization header with Bearer token is required" }

// 404 — User no longer exists
{ "error": "Not Found", "message": "User not found" }
```

---

### 5.3 Badge Routes

All badge routes require authentication. Individual routes additionally require specific permissions as noted.

---

#### `GET /badges`
List all badges with their associated permissions.

**Auth required:** Yes
**Permission required:** `BADGE_CREATION_READ`

**Request:**
```http
GET /badges
Authorization: Bearer <accessToken>
```

**Response `200`:**
```json
{
  "success": true,
  "count": 2,
  "badges": [
    {
      "id": 1,
      "name": "admin",
      "displayName": "Administrator",
      "color": "#EF4444",
      "createdAt": "2024-01-15T10:00:00.000Z",
      "permissions": [
        { "id": 1, "code": "REGISTRATIONS_CREATE" },
        { "id": 2, "code": "REGISTRATIONS_READ" }
      ]
    }
  ]
}
```

**Error responses:**
```json
// 401 — Not authenticated
{ "error": "Unauthorized", "message": "Authorization header with Bearer token is required" }

// 403 — Missing BADGE_CREATION_READ permission
{ "error": "Forbidden", "message": "Missing required permission" }
```

---

#### `GET /badges/:id`
Get a single badge by ID.

**Auth required:** Yes
**Permission required:** `BADGE_CREATION_READ`

**Path parameters:**

| Parameter | Type    | Description |
|-----------|---------|-------------|
| id        | integer | Badge ID    |

**Request:**
```http
GET /badges/1
Authorization: Bearer <accessToken>
```

**Response `200`:**
```json
{
  "success": true,
  "badge": {
    "id": 1,
    "name": "admin",
    "displayName": "Administrator",
    "color": "#EF4444",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "permissions": [
      { "id": 1, "code": "REGISTRATIONS_CREATE" }
    ]
  }
}
```

**Error responses:**
```json
// 400 — Invalid ID
{ "success": false, "error": "Invalid badge ID" }

// 404 — Badge not found
{ "success": false, "error": "Badge not found" }
```

---

#### `POST /badges`
Create a new badge with optional permission assignments.

**Auth required:** Yes
**Permission required:** `BADGE_CREATION_CREATE`

**Request:**
```http
POST /badges
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request body:**
```json
{
  "name": "content-editor",
  "displayName": "Content Editor",
  "color": "#10B981",
  "permissionIds": [1, 2, 5]
}
```

| Field         | Type             | Required | Rules                                      |
|---------------|------------------|----------|--------------------------------------------|
| name          | string           | Yes      | Unique, non-empty. Used as identifier.     |
| displayName   | string           | Yes      | Human-readable label shown in the UI.     |
| color         | string           | No       | Hex color code. Default: `#3B82F6`         |
| permissionIds | array of numbers | No       | IDs from `GET /permissions`. Default: none |

**Response `201`:**
```json
{
  "success": true,
  "message": "Badge created successfully",
  "badge": {
    "id": 3,
    "name": "content-editor",
    "displayName": "Content Editor",
    "color": "#10B981",
    "createdAt": "2024-01-15T12:00:00.000Z",
    "permissions": [
      { "id": 1, "code": "REGISTRATIONS_CREATE" }
    ]
  }
}
```

**Error responses:**
```json
// 400 — Validation failure
{ "success": false, "error": "Name is required and must be a non-empty string" }

// 400 — Name already taken
{ "success": false, "error": "A badge with this name already exists" }

// 400 — Invalid permission IDs
{ "success": false, "error": "Some permission IDs are invalid" }

// 500 — Server error
{ "success": false, "error": "Failed to create badge" }
```

---

#### `PATCH /badges/:id`
Update an existing badge. You can update display name, color, and/or permissions.

**Auth required:** Yes
**Permission required:** `BADGE_CREATION_UPDATE`

**Path parameters:**

| Parameter | Type    | Description |
|-----------|---------|-------------|
| id        | integer | Badge ID    |

**Request:**
```http
PATCH /badges/3
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request body** (all fields optional, but at least one required):
```json
{
  "displayName": "Senior Content Editor",
  "color": "#8B5CF6",
  "permissionIds": [1, 2, 3, 4]
}
```

| Field         | Type             | Required | Rules                                            |
|---------------|------------------|----------|--------------------------------------------------|
| displayName   | string           | No       | New human-readable label                         |
| color         | string           | No       | New hex color code                               |
| permissionIds | array of numbers | No       | Replaces all existing permissions for this badge |

> **Note:** `permissionIds` is a full replacement — not an append. If you send `permissionIds: [1, 2]`, all other previously assigned permissions are removed.

**Response `200`:**
```json
{
  "success": true,
  "message": "Badge updated successfully",
  "badge": {
    "id": 3,
    "name": "content-editor",
    "displayName": "Senior Content Editor",
    "color": "#8B5CF6",
    "createdAt": "2024-01-15T12:00:00.000Z",
    "permissions": [
      { "id": 1, "code": "REGISTRATIONS_CREATE" },
      { "id": 2, "code": "REGISTRATIONS_READ" }
    ]
  }
}
```

**Error responses:**
```json
// 400 — No fields to update
{ "success": false, "error": "At least one field must be provided to update" }

// 400 — Invalid color format
{ "success": false, "error": "Color must be a valid hex color code" }

// 404 — Badge not found
{ "success": false, "error": "Badge not found" }
```

---

#### `DELETE /badges/:id`
Delete a badge permanently.

**Auth required:** Yes
**Permission required:** `BADGE_CREATION_DELETE`

**Path parameters:**

| Parameter | Type    | Description |
|-----------|---------|-------------|
| id        | integer | Badge ID    |

**Request:**
```http
DELETE /badges/3
Authorization: Bearer <accessToken>
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Badge deleted successfully"
}
```

**Error responses:**
```json
// 400 — Badge has users assigned, cannot delete
{ "success": false, "error": "Cannot delete badge that is assigned to users" }

// 404 — Badge not found
{ "success": false, "error": "Badge not found" }
```

> Before deleting a badge, you must reassign all users who hold it to a different badge, or delete those users.

---

#### `GET /badges/:id/permissions`
Returns a full permissions map for a specific badge — every permission as a key with `true` or `false` indicating whether the badge has it. Useful for rendering a permission toggle UI.

**Auth required:** Yes
**Permission required:** `BADGE_CREATION_UPDATE`

**Path parameters:**

| Parameter | Type    | Description |
|-----------|---------|-------------|
| id        | integer | Badge ID    |

**Request:**
```http
GET /badges/1/permissions
Authorization: Bearer <accessToken>
```

**Response `200`:**
```json
{
  "success": true,
  "badgeId": 1,
  "badgeName": "admin",
  "badgeDisplayName": "Administrator",
  "permissions": {
    "REGISTRATIONS_CREATE": true,
    "REGISTRATIONS_READ": true,
    "REGISTRATIONS_UPDATE": true,
    "REGISTRATIONS_DELETE": true,
    "USER_MANAGEMENT_CREATE": true,
    "USER_MANAGEMENT_READ": true,
    "USER_MANAGEMENT_UPDATE": true,
    "USER_MANAGEMENT_DELETE": true,
    "PAYMENTS_CREATE": true,
    "PAYMENTS_READ": true,
    "PAYMENTS_UPDATE": true,
    "PAYMENTS_DELETE": true,
    "COMPLIANCE_CREATE": false,
    "COMPLIANCE_READ": false,
    "COMPLIANCE_UPDATE": false,
    "COMPLIANCE_DELETE": false,
    "REPORTS_CREATE": false,
    "REPORTS_READ": false,
    "REPORTS_UPDATE": false,
    "REPORTS_DELETE": false,
    "MESSAGES_CREATE": false,
    "MESSAGES_READ": false,
    "MESSAGES_UPDATE": false,
    "MESSAGES_DELETE": false,
    "SUPPORT_TICKETS_CREATE": false,
    "SUPPORT_TICKETS_READ": false,
    "SUPPORT_TICKETS_UPDATE": false,
    "SUPPORT_TICKETS_DELETE": false,
    "BADGE_CREATION_CREATE": true,
    "BADGE_CREATION_READ": true,
    "BADGE_CREATION_UPDATE": true,
    "BADGE_CREATION_DELETE": true
  }
}
```

---

### 5.4 User Routes

All four user routes are **protected** and require authentication + a specific `USER_MANAGEMENT_*` permission.

> **Breaking change from earlier version:** `POST /users/create` (public) has been removed. User creation is now `POST /users` and requires the `USER_MANAGEMENT_CREATE` permission.

---

#### `POST /users`
Create a new user with a name, email, password, badge (role), and optional active status.

**Auth required:** Yes
**Permission required:** `USER_MANAGEMENT_CREATE`

**Request:**
```http
POST /users
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request body:**
```json
{
  "name": "Jane Doe",
  "email": "jane.doe@example.com",
  "password": "SecurePass123!",
  "badgeId": 2,
  "active": true
}
```

| Field    | Type    | Required | Rules                                          |
|----------|---------|----------|------------------------------------------------|
| name     | string  | Yes      | Non-empty string                               |
| email    | string  | Yes      | Valid email format, unique                     |
| password | string  | Yes      | Non-empty. Will be bcrypt-hashed (10 rounds)   |
| badgeId  | number  | Yes      | Must be an existing badge ID                   |
| active   | boolean | No       | `true` (default) or `false`                    |

**Response `201`:**
```json
{
  "success": true,
  "message": "User created successfully",
  "user": {
    "id": 5,
    "name": "Jane Doe",
    "email": "jane.doe@example.com",
    "active": "active",
    "role": "Content Editor"
  }
}
```

> Note: The response does **not** include the password. `active` is returned as the string `"active"` or `"inactive"`. `role` is the badge's `displayName`.

**Error responses:**
```json
// 400 — Validation errors
{ "success": false, "error": "Name is required and must be a non-empty string" }
{ "success": false, "error": "Email is required and must be a non-empty string" }
{ "success": false, "error": "Email must be a valid email address" }
{ "success": false, "error": "Password is required and must be a non-empty string" }
{ "success": false, "error": "Badge ID (role) is required and must be a number" }
{ "success": false, "error": "Active must be a boolean value" }
{ "success": false, "error": "Email is already in use" }
{ "success": false, "error": "Invalid badge ID - badge does not exist" }

// 500 — Server error
{ "success": false, "error": "Internal server error", "message": "Failed to create user" }
```

---

#### `GET /users`
List all users with their ID, name, email, active status, role (badge display name), and `lastActive` timestamp.

**Auth required:** Yes
**Permission required:** `USER_MANAGEMENT_READ`

**Request:**
```http
GET /users
Authorization: Bearer <accessToken>
```

**Response `200`:**
```json
{
  "success": true,
  "users": [
    {
      "id": 1,
      "name": "Super Admin",
      "email": "admin@mutetaxes.com",
      "active": "active",
      "role": "Administrator",
      "lastActive": "2026-02-16T12:30:00.000Z"
    },
    {
      "id": 2,
      "name": "Jane Doe",
      "email": "jane.doe@example.com",
      "active": "inactive",
      "role": "Content Editor",
      "lastActive": null
    }
  ]
}
```

**Field descriptions:**

| Field      | Type           | Description                                                              |
|------------|----------------|--------------------------------------------------------------------------|
| id         | number         | Unique user ID                                                           |
| name       | string         | User's full name                                                         |
| email      | string         | User's email address                                                     |
| active     | string         | `"active"` or `"inactive"` — stringified boolean                        |
| role       | string         | Badge `displayName`(s), comma-joined if user has multiple badges         |
| lastActive | string \| null | ISO 8601 timestamp of last login. `null` if user has never logged in     |

> `lastActive` is updated automatically every time the user successfully logs in via `POST /auth/login`.

**Error responses:**
```json
// 401 — Not authenticated
{ "error": "Unauthorized", "message": "Authorization header with Bearer token is required" }

// 403 — Missing USER_MANAGEMENT_READ permission
{ "error": "Forbidden", "message": "Missing required permission" }

// 500 — Server error
{ "success": false, "error": "Internal server error", "message": "Failed to fetch users" }
```

---

#### `PATCH /users/:id`
Update a user's name, email, password, active status, and/or badge (role). All fields are optional — send only what needs to change.

**Auth required:** Yes
**Permission required:** `USER_MANAGEMENT_UPDATE`

**Path parameters:**

| Parameter | Type    | Description |
|-----------|---------|-------------|
| id        | integer | User ID     |

**Request:**
```http
PATCH /users/2
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request body** (all fields optional, but at least one must be provided):
```json
{
  "name": "Jane Smith",
  "email": "jane.smith@example.com",
  "password": "NewSecurePass123!",
  "badgeId": 3,
  "active": false
}
```

| Field    | Type    | Required | Rules                                                                  |
|----------|---------|----------|------------------------------------------------------------------------|
| name     | string  | No       | Non-empty string                                                       |
| email    | string  | No       | Valid email format, unique across all users                            |
| password | string  | No       | Non-empty. Will be bcrypt-hashed (10 rounds) before storing            |
| badgeId  | number  | No       | Must be an existing badge ID. **Replaces** all current badges on user  |
| active   | boolean | No       | `true` = active, `false` = inactive                                    |

> **Note on `badgeId`:** Providing a `badgeId` completely replaces the user's current badge assignment — it is not additive. The user will only hold the newly specified badge after the update.

**Response `200`:**
```json
{
  "success": true,
  "message": "User updated successfully",
  "user": {
    "id": 2,
    "name": "Jane Smith",
    "email": "jane.smith@example.com",
    "active": "inactive",
    "role": "Senior Editor"
  }
}
```

**Error responses:**
```json
// 400 — Invalid user ID
{ "success": false, "error": "Invalid user ID" }

// 400 — Validation errors
{ "success": false, "error": "Name must be a non-empty string" }
{ "success": false, "error": "Email must be a valid email address" }
{ "success": false, "error": "Email is already in use by another user" }
{ "success": false, "error": "Password must be a non-empty string" }
{ "success": false, "error": "Active must be a boolean value" }
{ "success": false, "error": "Badge ID must be a number" }
{ "success": false, "error": "Invalid badge ID - badge does not exist" }

// 404 — User not found
{ "success": false, "error": "User not found" }

// 500 — Server error
{ "success": false, "error": "Internal server error", "message": "Failed to update user" }
```

---

#### `DELETE /users/:id`
Permanently delete a user. Before deleting, the backend gracefully handles all related records:
- User's badge assignments are removed
- User's documents are deleted
- Registrations linked to this user have `clientId` set to `null`
- Registration documents uploaded or verified by this user have those foreign key fields set to `null`

**Auth required:** Yes
**Permission required:** `USER_MANAGEMENT_DELETE`

**Path parameters:**

| Parameter | Type    | Description |
|-----------|---------|-------------|
| id        | integer | User ID     |

**Request:**
```http
DELETE /users/2
Authorization: Bearer <accessToken>
```

**Response `200`:**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

**Error responses:**
```json
// 400 — Invalid user ID
{ "success": false, "error": "Invalid user ID" }

// 404 — User not found
{ "success": false, "error": "User not found" }

// 500 — Server error
{ "success": false, "error": "Internal server error", "message": "Failed to delete user" }
```

---

## 6. Error Handling

### Standard error response shape

Every error from the backend follows one of these two structures:

```typescript
// Format A (most endpoints)
{
  error: string;    // Short error category
  message: string;  // Detailed description
}

// Format B (badge/user controllers)
{
  success: false;
  error: string;    // Detailed error
  message?: string; // Additional context (optional)
}
```

### Recommended frontend error handler

```typescript
async function apiCall(url: string, options: RequestInit) {
  const response = await fetch(url, options);
  const data = await response.json();

  if (!response.ok) {
    switch (response.status) {
      case 400:
        // Validation error — show the error message to the user
        throw new Error(data.error || data.message || 'Bad request');
      case 401:
        // Token expired or missing — redirect to login
        clearTokens();
        redirectToLogin();
        throw new Error('Session expired');
      case 403:
        // No permission — show "Access denied" UI
        throw new Error('You do not have permission to perform this action');
      case 404:
        // Resource not found
        throw new Error(data.error || 'Resource not found');
      case 500:
        // Server error — show generic error
        throw new Error('A server error occurred. Please try again later.');
      default:
        throw new Error('An unexpected error occurred');
    }
  }

  return data;
}
```

---

## 7. HTTP Status Codes

| Code | Meaning            | When it occurs                                               |
|------|--------------------|--------------------------------------------------------------|
| 200  | OK                 | Successful GET, PATCH, DELETE                                |
| 201  | Created            | Successful POST (user or badge created)                      |
| 400  | Bad Request        | Missing fields, validation error, duplicate name             |
| 401  | Unauthorized       | Missing `Authorization` header, invalid or expired JWT       |
| 403  | Forbidden          | Valid token but user lacks required permission               |
| 404  | Not Found          | Badge/user with given ID does not exist                      |
| 500  | Internal Server Error | Database error, unexpected exception                      |

---

## 8. All 32 Permissions Reference

Permissions follow the pattern: `{MODULE}_{ACTION}`

| Code                       | Module             | Action |
|----------------------------|--------------------|--------|
| `REGISTRATIONS_CREATE`     | Registrations      | Create |
| `REGISTRATIONS_READ`       | Registrations      | Read   |
| `REGISTRATIONS_UPDATE`     | Registrations      | Update |
| `REGISTRATIONS_DELETE`     | Registrations      | Delete |
| `USER_MANAGEMENT_CREATE`   | User Management    | Create |
| `USER_MANAGEMENT_READ`     | User Management    | Read   |
| `USER_MANAGEMENT_UPDATE`   | User Management    | Update |
| `USER_MANAGEMENT_DELETE`   | User Management    | Delete |
| `PAYMENTS_CREATE`          | Payments           | Create |
| `PAYMENTS_READ`            | Payments           | Read   |
| `PAYMENTS_UPDATE`          | Payments           | Update |
| `PAYMENTS_DELETE`          | Payments           | Delete |
| `COMPLIANCE_CREATE`        | Compliance         | Create |
| `COMPLIANCE_READ`          | Compliance         | Read   |
| `COMPLIANCE_UPDATE`        | Compliance         | Update |
| `COMPLIANCE_DELETE`        | Compliance         | Delete |
| `REPORTS_CREATE`           | Reports            | Create |
| `REPORTS_READ`             | Reports            | Read   |
| `REPORTS_UPDATE`           | Reports            | Update |
| `REPORTS_DELETE`           | Reports            | Delete |
| `MESSAGES_CREATE`          | Messages           | Create |
| `MESSAGES_READ`            | Messages           | Read   |
| `MESSAGES_UPDATE`          | Messages           | Update |
| `MESSAGES_DELETE`          | Messages           | Delete |
| `SUPPORT_TICKETS_CREATE`   | Support Tickets    | Create |
| `SUPPORT_TICKETS_READ`     | Support Tickets    | Read   |
| `SUPPORT_TICKETS_UPDATE`   | Support Tickets    | Update |
| `SUPPORT_TICKETS_DELETE`   | Support Tickets    | Delete |
| `BADGE_CREATION_CREATE`    | Badge Creation     | Create |
| `BADGE_CREATION_READ`      | Badge Creation     | Read   |
| `BADGE_CREATION_UPDATE`    | Badge Creation     | Update |
| `BADGE_CREATION_DELETE`    | Badge Creation     | Delete |

---

## 9. Data Models

These represent the shapes returned from the API. They are derived from the Prisma schema.

### User (from `POST /users`, `GET /users`, `PATCH /users/:id`)

All protected user management endpoints return the same flat shape:

```typescript
interface UserListItem {
  id: number;
  name: string;
  email: string;
  active: 'active' | 'inactive'; // stringified boolean from DB boolean field
  role: string;                   // badge displayName(s), comma-joined
  lastActive: string | null;      // ISO 8601 datetime or null — only present on GET /users
}
```

> `lastActive` is included in `GET /users` list items. `POST /users` and `PATCH /users/:id` responses do not include `lastActive`.

### User schema fields (Prisma)

```typescript
// Underlying database fields on the User model
interface UserSchema {
  id: number;
  email: string;         // unique
  password: string;      // bcrypt hash — never exposed in API responses
  name: string;
  active: boolean;       // default: true
  lastActive: Date | null; // updated on every login
  createdAt: Date;       // set on creation
}
```

### Badge

```typescript
interface Badge {
  id: number;
  name: string;          // Internal unique identifier (e.g., "admin")
  displayName: string;   // Human-readable name (e.g., "Administrator")
  color: string;         // Hex color code (e.g., "#EF4444")
  createdAt: string;     // ISO 8601 datetime string
  permissions: Permission[];
}
```

### Permission

```typescript
interface Permission {
  id: number;
  code: string;          // e.g., "REGISTRATIONS_READ"
  displayName: string;   // e.g., "Read Registrations"
  description?: string;  // Longer description (returned from GET /permissions only)
}
```

### BadgePermissionsMap (from `GET /badges/:id/permissions`)

```typescript
interface BadgePermissionsMap {
  success: boolean;
  badgeId: number;
  badgeName: string;
  badgeDisplayName: string;
  permissions: Record<string, boolean>;
  // All 32 permission codes as keys, boolean values
}
```

### LoginResponse

```typescript
interface LoginResponse {
  success: boolean;
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    email: string;
    name: string;
    permissions: string[]; // Array of permission code strings
  };
}
```

---

## 10. Implementation Examples

### Full Auth Flow (TypeScript + Fetch)

```typescript
// auth.ts

const BASE_URL = 'http://localhost:3000';

let accessToken: string | null = null;
let refreshToken: string | null = localStorage.getItem('refreshToken');

export async function login(email: string, password: string) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Login failed');
  }

  const data = await res.json();
  accessToken = data.accessToken;
  refreshToken = data.refreshToken;
  localStorage.setItem('refreshToken', data.refreshToken);
  return data.user;
}

export async function refresh() {
  if (!refreshToken) throw new Error('No refresh token');

  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) throw new Error('Session expired');

  const data = await res.json();
  accessToken = data.accessToken;
}

export async function authorizedFetch(path: string, options: RequestInit = {}) {
  if (!accessToken) await refresh();

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    },
  });

  if (res.status === 401) {
    // Try refreshing once
    await refresh();
    return fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        ...options.headers,
      },
    });
  }

  return res;
}
```

### Badge Management Example

```typescript
// badges.ts

import { authorizedFetch } from './auth';

// List all badges
export async function getBadges() {
  const res = await authorizedFetch('/badges');
  if (!res.ok) throw new Error('Failed to fetch badges');
  return res.json();
}

// Create a badge
export async function createBadge(payload: {
  name: string;
  displayName: string;
  color?: string;
  permissionIds?: number[];
}) {
  const res = await authorizedFetch('/badges', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create badge');
  return data.badge;
}

// Update badge permissions
export async function updateBadgePermissions(badgeId: number, permissionIds: number[]) {
  const res = await authorizedFetch(`/badges/${badgeId}`, {
    method: 'PATCH',
    body: JSON.stringify({ permissionIds }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update badge');
  return data.badge;
}

// Get badge permission map (for a toggle UI)
export async function getBadgePermissionMap(badgeId: number) {
  const res = await authorizedFetch(`/badges/${badgeId}/permissions`);
  if (!res.ok) throw new Error('Failed to fetch badge permissions');
  return res.json(); // Returns { permissions: { REGISTRATIONS_READ: true, ... } }
}

// Delete badge
export async function deleteBadge(badgeId: number) {
  const res = await authorizedFetch(`/badges/${badgeId}`, { method: 'DELETE' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to delete badge');
  return data;
}
```

### User Management Example

```typescript
// users.ts

import { authorizedFetch } from './auth';

// Create a new user (requires USER_MANAGEMENT_CREATE)
export async function createUser(payload: {
  name: string;
  email: string;
  password: string;
  badgeId: number;
  active?: boolean;
}) {
  const res = await authorizedFetch('/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create user');
  return data.user; // UserListItem (without lastActive)
}

// List all users (requires USER_MANAGEMENT_READ)
export async function getUsers() {
  const res = await authorizedFetch('/users');
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch users');
  return data.users; // UserListItem[] (includes lastActive)
}

// Update user name, email, password, role (badge), or active status (requires USER_MANAGEMENT_UPDATE)
export async function updateUser(
  userId: number,
  payload: {
    name?: string;
    email?: string;
    password?: string;
    badgeId?: number;
    active?: boolean;
  }
) {
  const res = await authorizedFetch(`/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update user');
  return data.user; // UserListItem
}

// Deactivate a user without deleting (requires USER_MANAGEMENT_UPDATE)
export async function deactivateUser(userId: number) {
  return updateUser(userId, { active: false });
}

// Reassign a user's badge/role (requires USER_MANAGEMENT_UPDATE)
export async function reassignRole(userId: number, badgeId: number) {
  return updateUser(userId, { badgeId });
}

// Delete a user permanently (requires USER_MANAGEMENT_DELETE)
export async function deleteUser(userId: number) {
  const res = await authorizedFetch(`/users/${userId}`, { method: 'DELETE' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to delete user');
  return data;
}
```

### Permission-Aware Navigation (React Router example)

```tsx
// ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export function ProtectedRoute({
  permission,
  children,
}: {
  permission?: string;
  children: JSX.Element;
}) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (permission && !user.permissions.includes(permission)) {
    return <Navigate to="/403" replace />;
  }

  return children;
}

// App.tsx
<Routes>
  <Route path="/login" element={<LoginPage />} />

  {/* Badge management */}
  <Route
    path="/badges"
    element={
      <ProtectedRoute permission="BADGE_CREATION_READ">
        <BadgesPage />
      </ProtectedRoute>
    }
  />
  <Route
    path="/badges/create"
    element={
      <ProtectedRoute permission="BADGE_CREATION_CREATE">
        <CreateBadgePage />
      </ProtectedRoute>
    }
  />

  {/* User management */}
  <Route
    path="/users"
    element={
      <ProtectedRoute permission="USER_MANAGEMENT_READ">
        <UsersPage />
      </ProtectedRoute>
    }
  />
  <Route
    path="/users/create"
    element={
      <ProtectedRoute permission="USER_MANAGEMENT_CREATE">
        <CreateUserPage />
      </ProtectedRoute>
    }
  />
  <Route
    path="/users/:id/edit"
    element={
      <ProtectedRoute permission="USER_MANAGEMENT_UPDATE">
        <EditUserPage />
      </ProtectedRoute>
    }
  />
</Routes>
```

---

## 11. Environment Setup

### Development `.env` (never commit real secrets)

```env
DATABASE_URL="postgresql://admin:password123@localhost:6543/mutetaxes_dummy"
JWT_ACCESS_SECRET="88f03be01f43606a193dd9b8fbb36ddcae64b36342a53e8cfaa249d6eb5d76e0d7b2d2a8d83339a55872e9b1581d5b79eaa62ad3964d5d3cc162e24c9c014b40"
JWT_REFRESH_SECRET="3e31005e52eebe753699a7376e5c411e426f53fd1c9d1361a0425a2bdc1e86b66e75b1504b84812bc91d98260cf922b11707ebd5021fd086cdfeebe1268b8b5a"
PORT=3000
```

### Starting the backend

```bash
# Start PostgreSQL (Docker)
docker-compose up -d

# Install dependencies
npm install

# Push schema to database
npx prisma db push

# Seed initial data (admin user + 32 permissions + admin badge)
npx prisma db seed

# Start development server
npm run dev
```

### Default seeded credentials

| Field    | Value                    |
|----------|--------------------------|
| Email    | `admin@mutetaxes.com`    |
| Password | `secure_password_123`    |
| Badge    | Administrator (all 32 permissions) |

---

## Appendix — Route Summary Table

| Method | Path                      | Auth | Permission Required        | Description                          |
|--------|---------------------------|------|----------------------------|--------------------------------------|
| GET    | `/`                       | No   | —                          | Health check                         |
| GET    | `/permissions`            | No   | —                          | List all 32 permissions              |
| POST   | `/auth/login`             | No   | —                          | Login and receive tokens             |
| POST   | `/auth/refresh`           | No   | —                          | Refresh access token                 |
| GET    | `/auth/me/permissions`    | Yes  | Any authenticated user     | Get current user's permissions       |
| POST   | `/users`                  | Yes  | `USER_MANAGEMENT_CREATE`   | Create a new user                    |
| GET    | `/users`                  | Yes  | `USER_MANAGEMENT_READ`     | List all users                       |
| PATCH  | `/users/:id`              | Yes  | `USER_MANAGEMENT_UPDATE`   | Update user name/email/password/role/active |
| DELETE | `/users/:id`              | Yes  | `USER_MANAGEMENT_DELETE`   | Permanently delete a user            |
| GET    | `/badges`                 | Yes  | `BADGE_CREATION_READ`      | List all badges                      |
| GET    | `/badges/:id`             | Yes  | `BADGE_CREATION_READ`      | Get single badge                     |
| POST   | `/badges`                 | Yes  | `BADGE_CREATION_CREATE`    | Create a badge                       |
| PATCH  | `/badges/:id`             | Yes  | `BADGE_CREATION_UPDATE`    | Update a badge                       |
| DELETE | `/badges/:id`             | Yes  | `BADGE_CREATION_DELETE`    | Delete a badge                       |
| GET    | `/badges/:id/permissions` | Yes  | `BADGE_CREATION_UPDATE`    | Get permission map for a badge       |
