# MuteTaxes Backend — Frontend Integration Guide

> **Base URL (Development):** `http://localhost:3000`
> **Content-Type:** All requests must use `application/json`
> **Authentication:** Bearer JWT token in `Authorization` header
> **Swagger UI:** `http://localhost:3000/api-docs`

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
   - [Ticket Routes](#55-ticket-routes)
   - [Registration Routes](#56-registration-routes)
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
  "expiresIn": 900,
  "refreshTokenExpiresIn": 604800,
  "user": {
    "id": 1,
    "email": "admin@mutetaxes.com",
    "name": "Super Admin",
    "permissions": ["REGISTRATIONS_READ", "BADGE_CREATION_READ", "..."],
    "role": "admin"
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
     │                                        │  Check user is active
     │                                        │  Generate accessToken (15 min)
     │                                        │  Generate refreshToken (7 days)
     │                                        │  Update lastActive timestamp
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
     │  [Access token expires after 15 min]   │
     │                                        │
     │  POST /auth/refresh                    │
     │  { refreshToken }                      │
     │ ─────────────────────────────────────► │
     │                                        │  Validate refresh token
     │                                        │  Generate new accessToken
     │  { success: true, accessToken,         │
     │    expiresIn: 900 }                    │
     │ ◄───────────────────────────────────── │
└──────────┘                             └──────────┘
```

### Token Lifetimes

| Token        | Expiry   | `expiresIn` field | Purpose                                  |
|--------------|----------|-------------------|------------------------------------------|
| accessToken  | 15 min   | `900` (seconds)   | Authenticate every API request           |
| refreshToken | 7 days   | `604800` (seconds)| Obtain a new access token after expiry   |

> **Side effect:** Every successful login also updates the user's `lastActive` timestamp in the database, which is visible in `GET /users`.

> **Inactive users:** If a user's `active` field is `false`, login returns `401` with message `"User account is inactive"`.

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
  "exp": 1700000900
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
  "expiresIn": 900,
  "refreshTokenExpiresIn": 604800,
  "user": {
    "id": 1,
    "email": "admin@mutetaxes.com",
    "name": "Super Admin",
    "permissions": ["REGISTRATIONS_READ", "BADGE_CREATION_READ"],
    "role": "admin"
  }
}
```

| Field                  | Type           | Description                                                |
|------------------------|----------------|------------------------------------------------------------|
| accessToken            | string         | JWT valid for 15 minutes                                   |
| refreshToken           | string         | JWT valid for 7 days                                       |
| expiresIn              | number         | Access token lifetime in seconds (`900`)                   |
| refreshTokenExpiresIn  | number         | Refresh token lifetime in seconds (`604800`)               |
| user.permissions       | string[]       | Array of permission code strings (union of all badges)     |
| user.role              | string \| null | Badge `name` of the user's first badge, or `null`          |

**Error responses:**
```json
// 400 — Missing fields
{ "error": "Bad Request", "message": "Email and password are required" }

// 401 — Wrong credentials
{ "error": "Unauthorized", "message": "Invalid email or password" }

// 401 — Inactive user
{ "error": "Unauthorized", "message": "User account is inactive" }

// 500 — Server error
{ "error": "Internal Server Error", "message": "Failed to authenticate user" }
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
  "accessToken": "eyJhbGci...",
  "expiresIn": 900
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
      "displayName": "View Registrations"
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

#### `PATCH /auth/change-password`
Change the authenticated user's own password.

**Auth required:** Yes — Bearer token

**Request:**
```http
PATCH /auth/change-password
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request body:**
```json
{
  "currentPassword": "current_secure_password_123",
  "newPassword": "new_secure_password_456"
}
```

| Field           | Type   | Required | Rules                              |
|-----------------|--------|----------|------------------------------------|
| currentPassword | string | Yes      | Must match the user's current password |
| newPassword     | string | Yes      | Minimum 8 characters. Must differ from current password |

**Response `200`:**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Error responses:**
```json
// 400 — Missing fields
{ "error": "Bad Request", "message": "Current password and new password are required" }

// 400 — Password too short
{ "error": "Bad Request", "message": "New password must be at least 8 characters long" }

// 400 — Same password
{ "error": "Bad Request", "message": "New password must be different from current password" }

// 401 — Wrong current password
{ "error": "Unauthorized", "message": "Current password is incorrect" }

// 404 — User not found
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

### 5.5 Ticket Routes

All ticket routes require authentication and a specific `SUPPORT_TICKETS_*` permission.

---

#### `GET /tickets`
List all tickets, ordered by creation date descending. Supports optional query filters.

**Auth required:** Yes
**Permission required:** `SUPPORT_TICKETS_READ`

**Query parameters:**

| Parameter    | Type    | Description                        |
|--------------|---------|------------------------------------|
| status       | string  | Filter: `OPEN`, `IN_PROGRESS`, `RESOLVED` |
| priority     | string  | Filter: `HIGH`, `MEDIUM`, `LOW`    |
| clientId     | integer | Filter by client user ID           |
| assignedToId | integer | Filter by assigned user ID         |

**Request:**
```http
GET /tickets?status=OPEN&priority=HIGH
Authorization: Bearer <accessToken>
```

**Response `200`:**
```json
{
  "success": true,
  "count": 2,
  "tickets": [
    {
      "id": 1,
      "title": "Fix login page bug",
      "clientId": 3,
      "client": { "id": 3, "name": "John Doe", "email": "john@example.com" },
      "priority": "HIGH",
      "status": "OPEN",
      "createdAt": "2026-02-19T10:00:00.000Z",
      "assignedToId": 1,
      "assignedTo": { "id": 1, "name": "Super Admin", "email": "admin@mutetaxes.com" }
    }
  ]
}
```

**Error responses:**
```json
// 401 — Not authenticated
{ "error": "Unauthorized", "message": "Authorization header with Bearer token is required" }

// 403 — Missing permission
{ "error": "Forbidden", "message": "Missing required permission" }
```

---

#### `POST /tickets`
Create a new ticket.

**Auth required:** Yes
**Permission required:** `SUPPORT_TICKETS_CREATE`

**Request body:**
```json
{
  "title": "Fix login page bug",
  "clientId": 3,
  "priority": "HIGH",
  "assignedToId": 1
}
```

| Field        | Type    | Required | Rules                                    |
|--------------|---------|----------|------------------------------------------|
| title        | string  | Yes      | Non-empty string                         |
| clientId     | number  | Yes      | Must be an existing user ID              |
| priority     | string  | No       | `HIGH`, `MEDIUM`, `LOW`. Default: `MEDIUM` |
| assignedToId | number  | No       | Must be an existing user ID if provided  |

**Response `201`:**
```json
{
  "success": true,
  "message": "Ticket created successfully",
  "ticket": {
    "id": 1,
    "title": "Fix login page bug",
    "clientId": 3,
    "client": { "id": 3, "name": "John Doe", "email": "john@example.com" },
    "priority": "HIGH",
    "status": "OPEN",
    "createdAt": "2026-02-19T10:00:00.000Z",
    "assignedToId": 1,
    "assignedTo": { "id": 1, "name": "Super Admin", "email": "admin@mutetaxes.com" }
  }
}
```

**Error responses:**
```json
// 400 — Validation errors
{ "success": false, "error": "Title is required and must be a non-empty string" }
{ "success": false, "error": "Client ID is required and must be a number" }
{ "success": false, "error": "Priority must be one of: HIGH, MEDIUM, LOW" }
{ "success": false, "error": "Client user does not exist" }
{ "success": false, "error": "Assigned user does not exist" }
```

---

#### `GET /tickets/:id`
Get a single ticket by ID.

**Auth required:** Yes
**Permission required:** `SUPPORT_TICKETS_READ`

**Response `200`:**
```json
{
  "success": true,
  "ticket": {
    "id": 1,
    "title": "Fix login page bug",
    "clientId": 3,
    "client": { "id": 3, "name": "John Doe", "email": "john@example.com" },
    "priority": "HIGH",
    "status": "OPEN",
    "createdAt": "2026-02-19T10:00:00.000Z",
    "assignedToId": 1,
    "assignedTo": { "id": 1, "name": "Super Admin", "email": "admin@mutetaxes.com" }
  }
}
```

**Error responses:**
```json
// 400 — Invalid ID
{ "success": false, "error": "Invalid ticket ID" }

// 404 — Not found
{ "success": false, "error": "Ticket not found" }
```

---

#### `PATCH /tickets/:id`
Update a ticket's title, priority, status, or assigned user. All fields optional.

**Auth required:** Yes
**Permission required:** `SUPPORT_TICKETS_UPDATE`

**Request body** (all fields optional, but at least one required):
```json
{
  "title": "Updated title",
  "priority": "LOW",
  "status": "IN_PROGRESS",
  "assignedToId": 2
}
```

| Field        | Type    | Required | Rules                                    |
|--------------|---------|----------|------------------------------------------|
| title        | string  | No       | Non-empty string                         |
| priority     | string  | No       | `HIGH`, `MEDIUM`, `LOW`                  |
| status       | string  | No       | `OPEN`, `IN_PROGRESS`, `RESOLVED`        |
| assignedToId | number \| null | No | Must be an existing user ID, or `null` to unassign |

**Response `200`:**
```json
{
  "success": true,
  "message": "Ticket updated successfully",
  "ticket": { ... }
}
```

**Error responses:**
```json
// 400 — Validation errors
{ "success": false, "error": "Title must be a non-empty string" }
{ "success": false, "error": "Priority must be one of: HIGH, MEDIUM, LOW" }
{ "success": false, "error": "Status must be one of: OPEN, IN_PROGRESS, RESOLVED" }
{ "success": false, "error": "Assigned user does not exist" }

// 404 — Not found
{ "success": false, "error": "Ticket not found" }
```

---

#### `DELETE /tickets/:id`
Delete a ticket permanently.

**Auth required:** Yes
**Permission required:** `SUPPORT_TICKETS_DELETE`

**Response `200`:**
```json
{
  "success": true,
  "message": "Ticket deleted successfully"
}
```

**Error responses:**
```json
// 400 — Invalid ID
{ "success": false, "error": "Invalid ticket ID" }

// 404 — Not found
{ "success": false, "error": "Ticket not found" }
```

---

### 5.6 Registration Routes

Base path: `/api/v1/registrations`

---

#### `POST /api/v1/registrations`
Submit a new company registration. **This is a public endpoint — no authentication required.**

Accepts the full multi-step form payload. Creates the registration, all stakeholders (shareholders/directors), and their uploaded documents in a single transaction.

**Auth required:** No

**Request body:**
```json
{
  "applicant": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+85212345678"
  },
  "company": {
    "countryOfIncorporation": "HK",
    "type": "private_limited_company",
    "proposedCompanyName": "Acme HK Limited",
    "alternativeNames": ["Acme Hong Kong Ltd", "Acme Co"],
    "natureOfBusiness": ["technology", "consulting"],
    "businessScope": "local",
    "businessScopeDescription": "We provide software development and IT consulting services."
  },
  "shareCapital": {
    "currency": "HKD",
    "totalAmount": 10000,
    "totalShares": 10000
  },
  "persons": [
    {
      "type": "individual",
      "roles": ["shareholder", "director"],
      "fullName": "John Doe",
      "nationality": "GB",
      "email": "john@example.com",
      "phone": "+85212345678",
      "residentialAddress": {
        "street": "123 Nathan Road",
        "city": "Kowloon",
        "state": "",
        "postalCode": "00000",
        "country": "HK"
      },
      "companyName": null,
      "countryOfIncorporation": null,
      "registrationNumber": null,
      "shareholding": {
        "shares": 10000,
        "percentage": 100
      },
      "documents": {
        "passport": {
          "key": "uploads/passport-abc123.jpg",
          "url": "https://cdn.example.com/uploads/passport-abc123.jpg",
          "fileName": "passport.jpg",
          "mimeType": "image/jpeg",
          "size": 102400
        },
        "selfie": null,
        "addressProof": null,
        "certificate_of_incorporation": null,
        "business_license": null,
        "others": null
      }
    }
  ],
  "services": {
    "banking": {
      "providers": ["HSBC", "Hang Seng"],
      "preferredProvider": "HSBC"
    },
    "additionalServices": ["accounting", "secretarial"]
  },
  "billing": {
    "name": "John Doe",
    "email": "billing@example.com",
    "phone": "+85212345678",
    "address": {
      "street": "123 Nathan Road",
      "city": "Kowloon",
      "state": "",
      "postalCode": "00000",
      "country": "HK"
    },
    "paymentMethod": "credit_card"
  },
  "complianceAccepted": {
    "isAccepted": true,
    "timestamp": "2026-02-19T10:00:00.000Z"
  }
}
```

**Required fields:**

| Section   | Field                      | Required |
|-----------|----------------------------|----------|
| applicant | firstName, lastName, email, phone | Yes |
| company   | proposedCompanyName        | Yes      |
| persons[n]| type, roles                | Yes (per person) |

**Person type rules:**
- `type: "individual"` → `fullName`, `nationality`, `residentialAddress` recommended
- `type: "corporate"` → `companyName`, `countryOfIncorporation`, `registrationNumber` recommended

**Response `201`:**
```json
{
  "success": true,
  "message": "Registration submitted successfully",
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

> Store the returned `id` (UUID) — use it to fetch or update this registration later.

**Error responses:**
```json
// 400 — Missing required fields
{ "success": false, "error": "Applicant firstName, lastName, email and phone are required" }
{ "success": false, "error": "Company proposedCompanyName is required" }

// 500 — Server error
{ "success": false, "error": "Internal server error" }
```

---

#### `GET /api/v1/registrations`
List all registrations with pagination and optional filters. Returns a dashboard-friendly shape.

**Auth required:** Yes
**Permission required:** `REGISTRATIONS_READ`

**Query parameters:**

| Parameter    | Type    | Default | Description                              |
|--------------|---------|---------|------------------------------------------|
| status       | string  | —       | Filter: `pending`, `in-progress`, `completed` |
| assignedToId | integer | —       | Filter by assigned admin user ID         |
| page         | integer | `1`     | Page number (1-based)                    |
| limit        | integer | `20`    | Results per page (max 100)               |

**Request:**
```http
GET /api/v1/registrations?status=pending&page=1&limit=20
Authorization: Bearer <accessToken>
```

**Response `200`:**
```json
{
  "success": true,
  "total": 42,
  "page": 1,
  "limit": 20,
  "registrations": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "clientName": "John Doe",
      "clientEmail": "john@example.com",
      "phone": "+85212345678",
      "type": "private_limited_company",
      "status": "pending",
      "assignedTo": "Super Admin",
      "submittedDate": "2026-02-19T10:00:00.000Z",
      "lastUpdated": "2026-02-19T10:00:00.000Z",
      "documents": 3,
      "documentList": [ ... ]
    }
  ]
}
```

| Field         | Type    | Description                                              |
|---------------|---------|----------------------------------------------------------|
| total         | number  | Total matching records before pagination                 |
| assignedTo    | string  | Name of the assigned admin user, or `"Unassigned"`       |
| documents     | number  | Count of uploaded documents for this registration        |
| documentList  | array   | Full `RegistrationDocument[]` for this registration      |

**Error responses:**
```json
// 401 — Not authenticated
{ "error": "Unauthorized", "message": "..." }

// 403 — Missing REGISTRATIONS_READ permission
{ "error": "Forbidden", "message": "Missing required permission" }
```

---

#### `GET /api/v1/registrations/:id`
Get the full detail of a single registration including all stakeholders and their documents.

**Auth required:** Yes
**Permission required:** `REGISTRATIONS_READ`

**Path parameters:**

| Parameter | Type | Description        |
|-----------|------|--------------------|
| id        | UUID | Registration UUID  |

**Response `200`:**
```json
{
  "success": true,
  "registration": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "status": "pending",
    "assignedToId": 1,
    "assignedTo": { "id": 1, "name": "Super Admin", "email": "admin@mutetaxes.com" },
    "applicantFirstName": "John",
    "applicantLastName": "Doe",
    "applicantEmail": "john@example.com",
    "applicantPhone": "+85212345678",
    "countryOfIncorporation": "HK",
    "companyType": "private_limited_company",
    "proposedCompanyName": "Acme HK Limited",
    "alternativeNames": ["Acme Hong Kong Ltd"],
    "natureOfBusiness": ["technology"],
    "businessScope": "local",
    "businessScopeDescription": "...",
    "shareCapitalCurrency": "HKD",
    "shareCapitalAmount": 10000,
    "totalShares": 10000,
    "bankingProviders": ["HSBC"],
    "preferredBankingProvider": "HSBC",
    "additionalServices": ["accounting"],
    "billingName": "John Doe",
    "billingEmail": "billing@example.com",
    "billingPhone": "+85212345678",
    "billingStreet": "123 Nathan Road",
    "billingCity": "Kowloon",
    "billingState": "",
    "billingPostalCode": "00000",
    "billingCountry": "HK",
    "billingPaymentMethod": "credit_card",
    "complianceAccepted": true,
    "complianceTimestamp": "2026-02-19T10:00:00.000Z",
    "createdAt": "2026-02-19T10:00:00.000Z",
    "updatedAt": "2026-02-19T10:00:00.000Z",
    "stakeholders": [
      {
        "id": 1,
        "registrationId": "a1b2c3d4-...",
        "type": "individual",
        "roles": ["shareholder", "director"],
        "fullName": "John Doe",
        "nationality": "GB",
        "email": "john@example.com",
        "phone": "+85212345678",
        "addressStreet": "123 Nathan Road",
        "addressCity": "Kowloon",
        "addressState": "",
        "addressPostalCode": "00000",
        "addressCountry": "HK",
        "companyName": null,
        "countryOfIncorporation": null,
        "registrationNumber": null,
        "numberOfShares": 10000,
        "sharePercentage": 100,
        "documents": [ ... ]
      }
    ],
    "documents": [ ... ]
  }
}
```

**Error responses:**
```json
// 404 — Not found
{ "success": false, "error": "Registration not found" }
```

---

#### `PATCH /api/v1/registrations/:id`
Update a registration. All fields are optional.

- **Admin workflow:** Update `status` and/or `assignedToId` without touching form data.
- **Full update:** Send `applicant`, `company`, `persons`, etc. to update form fields.
- **Persons:** If `persons` array is included, all existing stakeholders and their documents are **fully replaced**. If omitted, stakeholders are untouched.

**Auth required:** Yes
**Permission required:** `REGISTRATIONS_UPDATE`

**Request body examples:**

Admin status update only:
```json
{
  "status": "in-progress",
  "assignedToId": 1
}
```

Full form update with stakeholder replacement:
```json
{
  "applicant": { "firstName": "Jane", "lastName": "Smith", "email": "jane@example.com", "phone": "+85298765432" },
  "company": { "proposedCompanyName": "Updated Co Ltd" },
  "persons": [
    {
      "type": "individual",
      "roles": ["shareholder", "director"],
      "fullName": "Jane Smith",
      "nationality": "HK",
      "email": "jane@example.com",
      "phone": "+85298765432",
      "residentialAddress": { "street": "456 Queens Road", "city": "Central", "state": "", "postalCode": "00000", "country": "HK" },
      "shareholding": { "shares": 10000, "percentage": 100 },
      "documents": { "passport": { "key": "...", "url": "...", "fileName": "passport.jpg", "mimeType": "image/jpeg", "size": 98304 }, "selfie": null, "addressProof": null, "certificate_of_incorporation": null, "business_license": null, "others": null }
    }
  ]
}
```

Additional body fields:

| Field        | Type    | Rules                                                    |
|--------------|---------|----------------------------------------------------------|
| status       | string  | `pending`, `in-progress`, `completed`                    |
| assignedToId | number \| null | Must be an existing user ID, or `null` to unassign |

**Response `200`:**
```json
{
  "success": true,
  "message": "Registration updated successfully",
  "registration": { ... }
}
```

**Error responses:**
```json
// 400 — Invalid status
{ "success": false, "error": "status must be one of: pending, in-progress, completed" }

// 404 — Not found
{ "success": false, "error": "Registration not found" }
```

---

#### `DELETE /api/v1/registrations/:id`
Permanently delete a registration and cascade to all related stakeholders and documents. This action is irreversible.

**Auth required:** Yes
**Permission required:** `REGISTRATIONS_DELETE`

**Response `200`:**
```json
{
  "success": true,
  "message": "Registration deleted successfully"
}
```

**Error responses:**
```json
// 404 — Not found
{ "success": false, "error": "Registration not found" }
```

---

## 6. Error Handling

### Standard error response shape

Every error from the backend follows one of these two structures:

```typescript
// Format A (auth/middleware errors)
{
  error: string;    // Short error category
  message: string;  // Detailed description
}

// Format B (badge/user/ticket/registration controllers)
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
| 201  | Created            | Successful POST (user, badge, ticket, or registration created) |
| 400  | Bad Request        | Missing fields, validation error, duplicate name             |
| 401  | Unauthorized       | Missing `Authorization` header, invalid/expired JWT, wrong password |
| 403  | Forbidden          | Valid token but user lacks required permission               |
| 404  | Not Found          | Badge/user/ticket/registration with given ID does not exist  |
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

### User (from `POST /users`, `GET /users`, `PATCH /users/:id`)

```typescript
interface UserListItem {
  id: number;
  name: string;
  email: string;
  active: 'active' | 'inactive'; // stringified boolean from DB boolean field
  role: string;                   // badge displayName(s), comma-joined
  lastActive?: string | null;     // ISO 8601 datetime or null — only present on GET /users
}
```

### LoginResponse

```typescript
interface LoginResponse {
  success: boolean;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;              // 900 (seconds)
  refreshTokenExpiresIn: number;  // 604800 (seconds)
  user: {
    id: number;
    email: string;
    name: string;
    permissions: string[]; // Array of permission code strings
    role: string | null;   // First badge's name, or null
  };
}
```

### RefreshResponse

```typescript
interface RefreshResponse {
  success: boolean;
  accessToken: string;
  expiresIn: number; // 900 (seconds)
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

### Ticket

```typescript
interface Ticket {
  id: number;
  title: string;
  clientId: number;
  client: { id: number; name: string; email: string };
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  createdAt: string;                   // ISO 8601
  assignedToId: number | null;
  assignedTo: { id: number; name: string; email: string } | null;
}
```

### RegistrationListItem (from `GET /api/v1/registrations`)

```typescript
interface RegistrationListItem {
  id: string;            // UUID
  clientName: string;    // applicantFirstName + ' ' + applicantLastName
  clientEmail: string;
  phone: string;
  type: string;          // companyType
  status: 'pending' | 'in-progress' | 'completed';
  assignedTo: string;    // Admin user name, or "Unassigned"
  submittedDate: string; // ISO 8601
  lastUpdated: string;   // ISO 8601
  documents: number;     // Count of RegistrationDocuments
  documentList: RegistrationDocument[];
}
```

### RegistrationDetail (from `GET /api/v1/registrations/:id` and `PATCH`)

```typescript
interface RegistrationDetail {
  id: string;            // UUID
  status: 'pending' | 'in-progress' | 'completed';
  assignedToId: number | null;
  assignedTo: { id: number; name: string; email: string } | null;
  applicantFirstName: string;
  applicantLastName: string;
  applicantEmail: string;
  applicantPhone: string;
  countryOfIncorporation: string | null;
  companyType: string | null;
  proposedCompanyName: string;
  alternativeNames: string[];
  natureOfBusiness: string[];
  businessScope: string | null;
  businessScopeDescription: string | null;
  shareCapitalCurrency: string | null;
  shareCapitalAmount: number | null;
  totalShares: number | null;
  bankingProviders: string[];
  preferredBankingProvider: string | null;
  additionalServices: string[];
  billingName: string | null;
  billingEmail: string | null;
  billingPhone: string | null;
  billingStreet: string | null;
  billingCity: string | null;
  billingState: string | null;
  billingPostalCode: string | null;
  billingCountry: string | null;
  billingPaymentMethod: string | null;
  complianceAccepted: boolean;
  complianceTimestamp: string | null;
  createdAt: string;
  updatedAt: string;
  stakeholders: Stakeholder[];
  documents: RegistrationDocument[];
}
```

### Stakeholder

```typescript
interface Stakeholder {
  id: number;
  registrationId: string; // UUID
  type: 'individual' | 'corporate';
  roles: ('shareholder' | 'director')[];
  fullName: string | null;
  nationality: string | null;
  email: string | null;
  phone: string | null;
  addressStreet: string | null;
  addressCity: string | null;
  addressState: string | null;
  addressPostalCode: string | null;
  addressCountry: string | null;
  companyName: string | null;
  countryOfIncorporation: string | null;
  registrationNumber: string | null;
  numberOfShares: number | null;
  sharePercentage: number | null;
  documents: RegistrationDocument[];
}
```

### RegistrationDocument

```typescript
interface RegistrationDocument {
  id: number;
  registrationId: string; // UUID
  stakeholderId: number | null;
  documentType: 'passport' | 'selfie' | 'addressProof' | 'certificate_of_incorporation' | 'business_license' | 'others';
  fileKey: string | null;
  fileUrl: string;
  fileName: string | null;
  mimeType: string | null;
  fileSize: number | null;   // bytes
  verificationStatus: 'pending' | 'approved' | 'rejected';
  rejectionReason: string | null;
  uploadedBy: number | null; // User ID
  verifiedBy: number | null; // User ID
  createdAt: string;         // ISO 8601
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
  return data.user; // { id, email, name, permissions, role }
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
  // data.expiresIn = 900 — use this to schedule next refresh
}

export async function changePassword(currentPassword: string, newPassword: string) {
  const res = await authorizedFetch('/auth/change-password', {
    method: 'PATCH',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to change password');
  }
  return res.json();
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

### Ticket Management Example

```typescript
// tickets.ts

import { authorizedFetch } from './auth';

export async function getTickets(filters?: {
  status?: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
  clientId?: number;
  assignedToId?: number;
}) {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.priority) params.set('priority', filters.priority);
  if (filters?.clientId) params.set('clientId', String(filters.clientId));
  if (filters?.assignedToId) params.set('assignedToId', String(filters.assignedToId));

  const res = await authorizedFetch(`/tickets?${params}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch tickets');
  return data; // { success, count, tickets }
}

export async function createTicket(payload: {
  title: string;
  clientId: number;
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
  assignedToId?: number;
}) {
  const res = await authorizedFetch('/tickets', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create ticket');
  return data.ticket;
}

export async function updateTicket(ticketId: number, payload: {
  title?: string;
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
  status?: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  assignedToId?: number | null;
}) {
  const res = await authorizedFetch(`/tickets/${ticketId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update ticket');
  return data.ticket;
}

export async function deleteTicket(ticketId: number) {
  const res = await authorizedFetch(`/tickets/${ticketId}`, { method: 'DELETE' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to delete ticket');
  return data;
}
```

### Registration Management Example

```typescript
// registrations.ts

import { authorizedFetch } from './auth';

// Submit a new registration (public — no auth needed)
export async function submitRegistration(payload: object) {
  const res = await fetch('http://localhost:3000/api/v1/registrations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to submit registration');
  return data.id; // UUID string
}

// List registrations (admin)
export async function getRegistrations(filters?: {
  status?: 'pending' | 'in-progress' | 'completed';
  assignedToId?: number;
  page?: number;
  limit?: number;
}) {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.assignedToId) params.set('assignedToId', String(filters.assignedToId));
  if (filters?.page) params.set('page', String(filters.page));
  if (filters?.limit) params.set('limit', String(filters.limit));

  const res = await authorizedFetch(`/api/v1/registrations?${params}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch registrations');
  return data; // { success, total, page, limit, registrations }
}

// Get full registration detail
export async function getRegistration(id: string) {
  const res = await authorizedFetch(`/api/v1/registrations/${id}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Registration not found');
  return data.registration;
}

// Update status / assign admin
export async function updateRegistrationStatus(id: string, status: string, assignedToId?: number | null) {
  const res = await authorizedFetch(`/api/v1/registrations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status, assignedToId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update registration');
  return data.registration;
}

// Delete registration
export async function deleteRegistration(id: string) {
  const res = await authorizedFetch(`/api/v1/registrations/${id}`, { method: 'DELETE' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to delete registration');
  return data;
}
```

### Badge Management Example

```typescript
// badges.ts

import { authorizedFetch } from './auth';

export async function getBadges() {
  const res = await authorizedFetch('/badges');
  if (!res.ok) throw new Error('Failed to fetch badges');
  return res.json();
}

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

export async function updateBadgePermissions(badgeId: number, permissionIds: number[]) {
  const res = await authorizedFetch(`/badges/${badgeId}`, {
    method: 'PATCH',
    body: JSON.stringify({ permissionIds }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update badge');
  return data.badge;
}

export async function getBadgePermissionMap(badgeId: number) {
  const res = await authorizedFetch(`/badges/${badgeId}/permissions`);
  if (!res.ok) throw new Error('Failed to fetch badge permissions');
  return res.json(); // Returns { permissions: { REGISTRATIONS_READ: true, ... } }
}

export async function deleteBadge(badgeId: number) {
  const res = await authorizedFetch(`/badges/${badgeId}`, { method: 'DELETE' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to delete badge');
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
  <Route path="/badges" element={<ProtectedRoute permission="BADGE_CREATION_READ"><BadgesPage /></ProtectedRoute>} />
  <Route path="/badges/create" element={<ProtectedRoute permission="BADGE_CREATION_CREATE"><CreateBadgePage /></ProtectedRoute>} />

  {/* User management */}
  <Route path="/users" element={<ProtectedRoute permission="USER_MANAGEMENT_READ"><UsersPage /></ProtectedRoute>} />
  <Route path="/users/create" element={<ProtectedRoute permission="USER_MANAGEMENT_CREATE"><CreateUserPage /></ProtectedRoute>} />
  <Route path="/users/:id/edit" element={<ProtectedRoute permission="USER_MANAGEMENT_UPDATE"><EditUserPage /></ProtectedRoute>} />

  {/* Ticket management */}
  <Route path="/tickets" element={<ProtectedRoute permission="SUPPORT_TICKETS_READ"><TicketsPage /></ProtectedRoute>} />
  <Route path="/tickets/create" element={<ProtectedRoute permission="SUPPORT_TICKETS_CREATE"><CreateTicketPage /></ProtectedRoute>} />

  {/* Registrations */}
  <Route path="/registrations" element={<ProtectedRoute permission="REGISTRATIONS_READ"><RegistrationsPage /></ProtectedRoute>} />
  <Route path="/registrations/:id" element={<ProtectedRoute permission="REGISTRATIONS_READ"><RegistrationDetailPage /></ProtectedRoute>} />
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

| Method | Path                           | Auth | Permission Required         | Description                          |
|--------|--------------------------------|------|-----------------------------|--------------------------------------|
| GET    | `/`                            | No   | —                           | Health check                         |
| GET    | `/permissions`                 | No   | —                           | List all 32 permissions              |
| POST   | `/auth/login`                  | No   | —                           | Login and receive tokens             |
| POST   | `/auth/refresh`                | No   | —                           | Refresh access token                 |
| GET    | `/auth/me/permissions`         | Yes  | Any authenticated user      | Get current user's permissions       |
| PATCH  | `/auth/change-password`        | Yes  | Any authenticated user      | Change own password                  |
| POST   | `/users`                       | Yes  | `USER_MANAGEMENT_CREATE`    | Create a new user                    |
| GET    | `/users`                       | Yes  | `USER_MANAGEMENT_READ`      | List all users                       |
| PATCH  | `/users/:id`                   | Yes  | `USER_MANAGEMENT_UPDATE`    | Update user name/email/password/role/active |
| DELETE | `/users/:id`                   | Yes  | `USER_MANAGEMENT_DELETE`    | Permanently delete a user            |
| GET    | `/badges`                      | Yes  | `BADGE_CREATION_READ`       | List all badges                      |
| GET    | `/badges/:id`                  | Yes  | `BADGE_CREATION_READ`       | Get single badge                     |
| POST   | `/badges`                      | Yes  | `BADGE_CREATION_CREATE`     | Create a badge                       |
| PATCH  | `/badges/:id`                  | Yes  | `BADGE_CREATION_UPDATE`     | Update a badge                       |
| DELETE | `/badges/:id`                  | Yes  | `BADGE_CREATION_DELETE`     | Delete a badge                       |
| GET    | `/badges/:id/permissions`      | Yes  | `BADGE_CREATION_UPDATE`     | Get permission map for a badge       |
| GET    | `/tickets`                     | Yes  | `SUPPORT_TICKETS_READ`      | List all tickets (filterable)        |
| POST   | `/tickets`                     | Yes  | `SUPPORT_TICKETS_CREATE`    | Create a ticket                      |
| GET    | `/tickets/:id`                 | Yes  | `SUPPORT_TICKETS_READ`      | Get single ticket                    |
| PATCH  | `/tickets/:id`                 | Yes  | `SUPPORT_TICKETS_UPDATE`    | Update a ticket                      |
| DELETE | `/tickets/:id`                 | Yes  | `SUPPORT_TICKETS_DELETE`    | Delete a ticket                      |
| POST   | `/api/v1/registrations`        | No   | —                           | Submit new registration (public)     |
| GET    | `/api/v1/registrations`        | Yes  | `REGISTRATIONS_READ`        | List registrations (paginated)       |
| GET    | `/api/v1/registrations/:id`    | Yes  | `REGISTRATIONS_READ`        | Get full registration detail         |
| PATCH  | `/api/v1/registrations/:id`    | Yes  | `REGISTRATIONS_UPDATE`      | Update registration                  |
| DELETE | `/api/v1/registrations/:id`    | Yes  | `REGISTRATIONS_DELETE`      | Delete registration                  |
