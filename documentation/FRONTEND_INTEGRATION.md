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
4. [User Types](#4-user-types)
5. [Permission System](#5-permission-system)
6. [API Reference](#6-api-reference)
   - [Public Routes](#61-public-routes)
   - [Auth Routes](#62-auth-routes)
   - [User Routes](#63-user-routes)
   - [Badge Routes](#64-badge-routes)
   - [Ticket Routes](#65-ticket-routes)
   - [Registration Routes (Admin)](#66-registration-routes-admin)
   - [Customer Portal — My Registrations](#67-customer-portal--my-registrations)
   - [Customer Portal — Service Requests](#68-customer-portal--service-requests)
   - [Admin Customer Management](#69-admin-customer-management)
   - [File Upload Routes](#610-file-upload-routes)
7. [Error Handling](#7-error-handling)
8. [HTTP Status Codes](#8-http-status-codes)
9. [All 32 Permissions Reference](#9-all-32-permissions-reference)
10. [Data Models](#10-data-models)
11. [Implementation Examples](#11-implementation-examples)
12. [Environment Setup](#12-environment-setup)
13. [Route Summary Table](#appendix--route-summary-table)

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
    "type": "ADMIN",
    "permissions": ["REGISTRATIONS_READ", "BADGE_CREATION_READ", "..."],
    "role": "admin",
    "dashboardPath": "/admin/dashboard"
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

> **Side effect:** Every successful login also updates the user's `lastActive` timestamp in the database.

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

> The backend validates the token and fetches the full user (with permissions) from the database on every protected request. Use the `permissions` array returned at login or from `GET /auth/me/permissions`.

---

## 4. User Types

The system now has **two distinct user types**. Every user has a `type` field that determines which parts of the API they can access.

| Type       | Description                                              | Dashboard Path       |
|------------|----------------------------------------------------------|----------------------|
| `ADMIN`    | Internal staff. Manage registrations, users, badges, etc.| `/admin/dashboard`   |
| `CUSTOMER` | External clients. View own registrations, service requests| `/customer/dashboard`|

> The `type` field is returned in the login response as `user.type`. Use `user.dashboardPath` to redirect after login.

### Type-Restricted Routes

Some routes are **type-gated** in addition to being permission-gated:

- Routes under `/api/v1/admin/*` → `ADMIN` only
- Routes under `/api/v1/my-registrations` → `CUSTOMER` only
- Routes under `/api/v1/customer/service-requests` → `CUSTOMER` only
- Ticket GET endpoints → both types (customers see only their own tickets)

---

## 5. Permission System

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

After login, the `user.permissions` array contains all permission codes:

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

> **Important:** Frontend permission checks are for UI/UX only. The backend enforces permissions on every request independently.

---

## 6. API Reference

### 6.1 Public Routes

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

#### `GET /health`
Simple health status. No authentication required.

**Response `200`:**
```json
{ "status": "ok" }
```

---

#### `GET /permissions`
Returns all 32 available permissions. No authentication required. Use to populate permission selection UIs.

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

### 6.2 Auth Routes

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
    "type": "ADMIN",
    "permissions": ["REGISTRATIONS_READ", "BADGE_CREATION_READ"],
    "role": "admin",
    "dashboardPath": "/admin/dashboard"
  }
}
```

| Field                  | Type           | Description                                                |
|------------------------|----------------|-------------------------------------------------------------|
| accessToken            | string         | JWT valid for 15 minutes                                   |
| refreshToken           | string         | JWT valid for 7 days                                       |
| expiresIn              | number         | Access token lifetime in seconds (`900`)                   |
| refreshTokenExpiresIn  | number         | Refresh token lifetime in seconds (`604800`)               |
| user.type              | `ADMIN` \| `CUSTOMER` | User type — determines dashboard route              |
| user.permissions       | string[]       | Array of permission code strings                           |
| user.role              | string \| null | Badge `name` of the user's first badge, or `null`          |
| user.dashboardPath     | string         | `/admin/dashboard` or `/customer/dashboard`                |

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

#### `GET /auth/me`
Get the full profile of the currently authenticated user including type, permissions, and badges.

**Auth required:** Yes — Bearer token

**Response `200`:**
```json
{
  "id": 1,
  "email": "admin@mutetaxes.com",
  "name": "Super Admin",
  "type": "ADMIN",
  "permissions": ["REGISTRATIONS_READ", "BADGE_CREATION_READ"],
  "badges": [
    { "id": 1, "name": "admin", "displayName": "Administrator", "color": "#EF4444" }
  ],
  "dashboardPath": "/admin/dashboard"
}
```

> Use this endpoint on session restore (page refresh) to re-sync user data.

---

#### `GET /auth/me/permissions`
Returns the full permission list for the currently authenticated user.

**Auth required:** Yes — Bearer token

**Response `200`:**
```json
{
  "permissions": [
    {
      "id": 1,
      "code": "REGISTRATIONS_READ",
      "displayName": "View Registrations"
    }
  ]
}
```

> Deduplicates permissions automatically. If a user has multiple badges with overlapping permissions, each code appears only once.

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
| newPassword     | string | Yes      | Minimum 8 characters. Must differ from current |

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

### 6.3 User Routes

All user routes require authentication. Individual routes require specific `USER_MANAGEMENT_*` permissions.

> **Note:** `POST /users/create` (old public route) has been removed. User creation is now `POST /users` and requires `USER_MANAGEMENT_CREATE`.

---

#### `POST /users`
Create a new user.

**Auth required:** Yes
**Permission required:** `USER_MANAGEMENT_CREATE`

**Request body:**
```json
{
  "name": "Jane Doe",
  "email": "jane.doe@example.com",
  "password": "SecurePass123!",
  "badgeId": 2,
  "type": "CUSTOMER",
  "active": true
}
```

| Field    | Type              | Required | Rules                                          |
|----------|-------------------|----------|------------------------------------------------|
| name     | string            | Yes      | Non-empty string                               |
| email    | string            | Yes      | Valid email format, unique                     |
| password | string            | Yes      | Non-empty. Will be bcrypt-hashed (10 rounds)   |
| badgeId  | number            | Yes      | Must be an existing badge ID                   |
| type     | `ADMIN` \| `CUSTOMER` | No  | Default: `CUSTOMER`                            |
| active   | boolean           | No       | `true` (default) or `false`                    |

**Response `201`:**
```json
{
  "success": true,
  "message": "User created successfully",
  "user": {
    "id": 5,
    "name": "Jane Doe",
    "email": "jane.doe@example.com",
    "type": "CUSTOMER",
    "active": "active",
    "role": "Content Editor"
  }
}
```

**Error responses:**
```json
// 400 — Validation errors
{ "success": false, "error": "Name is required and must be a non-empty string" }
{ "success": false, "error": "Email must be a valid email address" }
{ "success": false, "error": "Email is already in use" }
{ "success": false, "error": "Badge ID (role) is required and must be a number" }
{ "success": false, "error": "Active must be a boolean value" }
{ "success": false, "error": "Invalid badge ID - badge does not exist" }

// 403 — Only admins can create admin users
{ "success": false, "error": "Only administrators can create admin users" }
```

---

#### `GET /users`
List all users. Supports rich filtering.

**Auth required:** Yes
**Permission required:** `USER_MANAGEMENT_READ`

**Query parameters:**

| Parameter             | Type    | Description                                              |
|-----------------------|---------|----------------------------------------------------------|
| type                  | string  | Filter: `ADMIN` or `CUSTOMER`                           |
| active                | string  | Filter: `true` / `false` or `active` / `inactive`       |
| search                | string  | Search across name and email                             |
| badgeId               | integer | Filter by badge ID                                       |
| badgeName             | string  | Filter by badge name                                     |
| country               | string  | Filter by country (derived from linked registrations)    |
| registrationStatus    | string  | Filter by linked registration status                     |
| hasLinkedRegistration | boolean | `true` = only users with a linked registration           |

**Response `200`:**
```json
{
  "success": true,
  "users": [
    {
      "id": 1,
      "name": "Super Admin",
      "email": "admin@mutetaxes.com",
      "type": "ADMIN",
      "active": "active",
      "role": "Administrator",
      "lastActive": "2026-02-16T12:30:00.000Z"
    },
    {
      "id": 2,
      "name": "Jane Doe",
      "email": "jane.doe@example.com",
      "type": "CUSTOMER",
      "active": "inactive",
      "role": "Content Editor",
      "lastActive": null
    }
  ]
}
```

| Field      | Type           | Description                                                              |
|------------|----------------|--------------------------------------------------------------------------|
| type       | string         | `"ADMIN"` or `"CUSTOMER"`                                                |
| active     | string         | `"active"` or `"inactive"` — stringified boolean                        |
| role       | string         | Badge `displayName`(s), comma-joined if user has multiple badges         |
| lastActive | string \| null | ISO 8601 timestamp of last login. `null` if user has never logged in     |

---

#### `PATCH /users/:id`
Update a user's details. All fields optional.

**Auth required:** Yes
**Permission required:** `USER_MANAGEMENT_UPDATE`

**Request body** (all fields optional, at least one required):
```json
{
  "name": "Jane Smith",
  "email": "jane.smith@example.com",
  "password": "NewSecurePass123!",
  "badgeId": 3,
  "type": "CUSTOMER",
  "active": false
}
```

> **Note on `badgeId`:** Providing a `badgeId` completely replaces the user's current badge assignment.

**Response `200`:**
```json
{
  "success": true,
  "message": "User updated successfully",
  "user": {
    "id": 2,
    "name": "Jane Smith",
    "email": "jane.smith@example.com",
    "type": "CUSTOMER",
    "active": "inactive",
    "role": "Senior Editor"
  }
}
```

---

#### `DELETE /users/:id`
Permanently delete a user. Cascades gracefully:
- Badge assignments removed
- User's documents deleted
- Registrations linked to this user have `clientId` set to `null`

**Auth required:** Yes
**Permission required:** `USER_MANAGEMENT_DELETE`

**Response `200`:**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

---

### 6.4 Badge Routes

---

#### `GET /badges`
List all badges with their permissions.

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

---

#### `GET /badges/:id`
Get a single badge by ID.

**Auth required:** Yes
**Permission required:** `BADGE_CREATION_READ`

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

---

#### `POST /badges`
Create a new badge.

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
| displayName   | string           | Yes      | Human-readable label.                     |
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

---

#### `PATCH /badges/:id`
Update a badge.

**Auth required:** Yes
**Permission required:** `BADGE_CREATION_UPDATE`

**Request body** (all optional, at least one required):
```json
{
  "displayName": "Senior Content Editor",
  "color": "#8B5CF6",
  "permissionIds": [1, 2, 3, 4]
}
```

> **Note:** `permissionIds` is a full replacement — all previous permissions are removed.

---

#### `DELETE /badges/:id`
Delete a badge.

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
// 400 — Badge has users assigned
{ "success": false, "error": "Cannot delete badge that is assigned to users" }
```

---

#### `GET /badges/:id/permissions`
Returns a full permissions map for a badge — every permission as a key with `true` or `false`. Use for rendering a permission toggle UI.

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
    "BADGE_CREATION_CREATE": true,
    "BADGE_CREATION_READ": true,
    "BADGE_CREATION_UPDATE": true,
    "BADGE_CREATION_DELETE": true,
    "SUPPORT_TICKETS_CREATE": false,
    "SUPPORT_TICKETS_READ": false,
    "SUPPORT_TICKETS_UPDATE": false,
    "SUPPORT_TICKETS_DELETE": false,
    "COMPLIANCE_CREATE": false,
    "COMPLIANCE_READ": false
  }
}
```

---

### 6.5 Ticket Routes

All ticket routes require authentication and a `SUPPORT_TICKETS_*` permission.

> **Customer vs Admin behavior:** Customers see only their own tickets. Admins see all tickets.

---

#### `GET /tickets`
List tickets. Supports optional query filters.

**Auth required:** Yes
**Permission required:** `SUPPORT_TICKETS_READ`

**Query parameters:**

| Parameter    | Type    | Description                              |
|--------------|---------|------------------------------------------|
| status       | string  | Filter: `OPEN`, `IN_PROGRESS`, `RESOLVED` |
| priority     | string  | Filter: `HIGH`, `MEDIUM`, `LOW`           |
| clientId     | integer | Filter by client user ID (admin only)    |
| assignedToId | integer | Filter by assigned user ID               |

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
| clientId     | number  | Yes (Admin) | Must be an existing user ID           |
| priority     | string  | No       | `HIGH`, `MEDIUM`, `LOW`. Default: `MEDIUM` |
| assignedToId | number  | No       | Must be an existing user ID if provided  |

> **Customer behavior:** When a `CUSTOMER` creates a ticket, their own user ID is used as `clientId` automatically.

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

---

#### `GET /tickets/:id`
Get a single ticket by ID. Customers can only access their own tickets.

**Auth required:** Yes
**Permission required:** `SUPPORT_TICKETS_READ`

---

#### `PATCH /tickets/:id`
Update a ticket. **Admin only.**

**Auth required:** Yes (Admin)
**Permission required:** `SUPPORT_TICKETS_UPDATE`

**Request body** (all optional, at least one required):
```json
{
  "title": "Updated title",
  "priority": "LOW",
  "status": "IN_PROGRESS",
  "assignedToId": 2
}
```

| Field        | Type            | Rules                                    |
|--------------|-----------------|------------------------------------------|
| title        | string          | Non-empty string                         |
| priority     | string          | `HIGH`, `MEDIUM`, `LOW`                  |
| status       | string          | `OPEN`, `IN_PROGRESS`, `RESOLVED`        |
| assignedToId | number \| null  | Existing user ID or `null` to unassign   |

---

#### `DELETE /tickets/:id`
Delete a ticket. **Admin only.**

**Auth required:** Yes (Admin)
**Permission required:** `SUPPORT_TICKETS_DELETE`

**Response `200`:**
```json
{
  "success": true,
  "message": "Ticket deleted successfully"
}
```

---

### 6.6 Registration Routes (Admin)

Base path: `/api/v1/registrations`

---

#### `POST /api/v1/registrations`
Submit a new company registration. **Public endpoint — no authentication required.**

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

**Response `201`:**
```json
{
  "success": true,
  "message": "Registration submitted successfully",
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

> Store the returned `id` (UUID) — use it to fetch or update this registration.

---

#### `GET /api/v1/registrations`
List all registrations. Admin only.

**Auth required:** Yes (Admin)
**Permission required:** `REGISTRATIONS_READ`

**Query parameters:**

| Parameter    | Type    | Default | Description                              |
|--------------|---------|---------|------------------------------------------|
| status       | string  | —       | Filter: `pending`, `in-progress`, `completed` |
| assignedToId | integer | —       | Filter by assigned admin user ID         |
| page         | integer | `1`     | Page number (1-based)                    |
| limit        | integer | `20`    | Results per page (max 100)               |

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
      "documentList": []
    }
  ]
}
```

---

#### `GET /api/v1/registrations/:id`
Get full registration detail. Admin only.

**Auth required:** Yes (Admin)
**Permission required:** `REGISTRATIONS_READ`

**Response `200`:** Full `RegistrationDetail` object — see [Data Models](#10-data-models).

---

#### `PATCH /api/v1/registrations/:id`
Update a registration.

**Auth required:** Yes (Admin)
**Permission required:** `REGISTRATIONS_UPDATE`

Admin status/assignment update:
```json
{
  "status": "in-progress",
  "assignedToId": 1
}
```

Full form update (replaces all stakeholders):
```json
{
  "applicant": { "firstName": "Jane", "lastName": "Smith", "email": "jane@example.com", "phone": "+85298765432" },
  "company": { "proposedCompanyName": "Updated Co Ltd" },
  "persons": [...]
}
```

> **Note on `persons`:** If included, all existing stakeholders and their documents are **fully replaced**. If omitted, stakeholders are untouched.

| Field        | Type            | Rules                                                    |
|--------------|-----------------|----------------------------------------------------------|
| status       | string          | `pending`, `in-progress`, `completed`                    |
| assignedToId | number \| null  | Existing user ID or `null` to unassign                   |

---

#### `DELETE /api/v1/registrations/:id`
Permanently delete a registration (cascades to stakeholders and documents).

**Auth required:** Yes (Admin)
**Permission required:** `REGISTRATIONS_DELETE`

---

#### `POST /api/v1/registrations/:id/claim`
Link a registration to the authenticated customer account.

**Auth required:** Yes (Customer)

> The customer's email must match `applicantEmail` on the registration.

**Response `200`:**
```json
{
  "success": true,
  "message": "Registration claimed successfully"
}
```

**Error responses:**
```json
// 400 — Email mismatch
{ "success": false, "error": "Email does not match registration applicant email" }

// 409 — Already claimed
{ "success": false, "error": "Registration is already linked to a customer" }
```

---

#### `PATCH /api/v1/registrations/:id/customer`
Admin endpoint to link or unlink a registration to a customer user.

**Auth required:** Yes (Admin)
**Permission required:** `REGISTRATIONS_UPDATE`

**Request body:**
```json
{
  "customerId": 5
}
```

Send `"customerId": null` to unlink.

---

### 6.7 Customer Portal — My Registrations

These endpoints are for **CUSTOMER users only** to view their own registrations.

Base path: `/api/v1/my-registrations`

---

#### `GET /api/v1/my-registrations`
List the authenticated customer's own registrations.

**Auth required:** Yes (Customer only)

**Query parameters:**

| Parameter | Type    | Default | Description                              |
|-----------|---------|---------|------------------------------------------|
| status    | string  | —       | Filter: `pending`, `in-progress`, `completed` |
| page      | integer | `1`     | Page number                              |
| limit     | integer | `20`    | Results per page (max 100)               |

**Response `200`:**
```json
{
  "success": true,
  "total": 2,
  "page": 1,
  "limit": 20,
  "registrations": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "status": "completed",
      "applicantFirstName": "John",
      "applicantLastName": "Doe",
      "applicantEmail": "john@example.com",
      "proposedCompanyName": "ABC Holdings Ltd",
      "countryOfIncorporation": "HK",
      "companyType": "private_limited_company",
      "createdAt": "2026-02-20T09:00:00.000Z",
      "updatedAt": "2026-02-26T10:00:00.000Z"
    }
  ]
}
```

---

#### `GET /api/v1/my-registrations/:id`
Get one of the customer's own registrations. Returns `404` if the registration is not owned by the authenticated user.

**Auth required:** Yes (Customer only)

**Response `200`:**
```json
{
  "success": true,
  "registration": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "status": "completed",
    "applicantFirstName": "John",
    "applicantLastName": "Doe",
    "applicantEmail": "john@example.com",
    "applicantPhone": "+85212345678",
    "proposedCompanyName": "ABC Holdings Ltd",
    "alternativeNames": ["ABC Ventures Ltd"],
    "countryOfIncorporation": "HK",
    "companyType": "private_limited_company",
    "createdAt": "2026-02-20T09:00:00.000Z",
    "updatedAt": "2026-02-26T10:00:00.000Z"
  }
}
```

---

### 6.8 Customer Portal — Service Requests

These endpoints let **CUSTOMER users** submit and manage their own service requests.

Base path: `/api/v1/customer/service-requests`

> All endpoints require the customer to be authenticated (CUSTOMER user type).

---

#### `GET /api/v1/customer/service-requests`
List the authenticated customer's own service requests.

**Auth required:** Yes (Customer)
**Permission required:** `SUPPORT_TICKETS_READ`

**Query parameters:**

| Parameter | Type   | Description                                              |
|-----------|--------|----------------------------------------------------------|
| status    | string | Filter: `pending`, `in-progress`, `completed`, `rejected`|
| search    | string | Search across id, type, description                      |
| sortBy    | string | `requestedAt` (default), `updatedAt`, `status`, `type`  |
| sortOrder | string | `asc` or `desc` (default: `desc`)                        |
| page      | integer| Page number (default: 1)                                 |
| limit     | integer| Results per page (default: 20, max: 100)                 |

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "customerId": 12,
      "type": "Change of Directors",
      "typeCode": "change_directors",
      "description": "Please update the director list with the attached resolution.",
      "status": "pending",
      "priority": "medium",
      "requestedByUserId": 12,
      "assignedToAdminId": null,
      "adminNotes": null,
      "requestedAt": "2026-02-26T11:00:00.000Z",
      "resolvedAt": null,
      "createdAt": "2026-02-26T11:00:00.000Z",
      "updatedAt": "2026-02-26T11:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "sortBy": "requestedAt",
    "sortOrder": "desc"
  }
}
```

---

#### `POST /api/v1/customer/service-requests`
Create a new service request.

**Auth required:** Yes (Customer)
**Permission required:** `SUPPORT_TICKETS_CREATE`

**Request body:**
```json
{
  "type": "Change of Directors",
  "typeCode": "change_directors",
  "description": "Please update the director list with the attached resolution.",
  "priority": "medium"
}
```

| Field       | Type   | Required | Rules                                    |
|-------------|--------|----------|------------------------------------------|
| type        | string | Yes      | Non-empty, max 255 chars. Human-readable label |
| typeCode    | string | No       | Machine-readable slug. Nullable.         |
| description | string | Yes      | Non-empty, max 5000 chars                |
| priority    | string | No       | `low`, `medium` (default), `high`        |

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "customerId": 12,
    "type": "Change of Directors",
    "typeCode": "change_directors",
    "description": "Please update the director list with the attached resolution.",
    "status": "pending",
    "priority": "medium",
    "requestedByUserId": 12,
    "assignedToAdminId": null,
    "adminNotes": null,
    "requestedAt": "2026-02-26T11:00:00.000Z",
    "resolvedAt": null,
    "createdAt": "2026-02-26T11:00:00.000Z",
    "updatedAt": "2026-02-26T11:00:00.000Z"
  },
  "meta": {}
}
```

---

#### `GET /api/v1/customer/service-requests/:requestId`
Get a single service request (customer's own only).

**Auth required:** Yes (Customer)
**Permission required:** `SUPPORT_TICKETS_READ`

**Response `200`:** Same `data` object shape as the list item above.

---

#### `PATCH /api/v1/customer/service-requests/:requestId`
Update a service request. **Only allowed while status is `pending`.**

**Auth required:** Yes (Customer)
**Permission required:** `SUPPORT_TICKETS_UPDATE`

**Request body** (at least one field required):
```json
{
  "description": "Updated description with more details.",
  "priority": "high"
}
```

| Field       | Type   | Required | Rules                           |
|-------------|--------|----------|---------------------------------|
| description | string | No       | Non-empty, max 5000 chars       |
| priority    | string | No       | `low`, `medium`, `high`         |

**Error responses:**
```json
// 400 — Request already in processing
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Customer can only update service requests while status is pending",
    "details": [{ "field": "status", "message": "Request already in processing" }]
  }
}
```

---

#### `GET /api/v1/customer/service-requests/:requestId/activity`
Get the activity/history log for a service request.

**Auth required:** Yes (Customer)
**Permission required:** `SUPPORT_TICKETS_READ`

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "act_uuid",
      "serviceRequestId": "sr_uuid",
      "actorUserId": 5,
      "actionType": "status_changed",
      "payload": {
        "before": "pending",
        "after": "in-progress"
      },
      "createdAt": "2026-02-26T12:00:00.000Z",
      "actor": {
        "id": 5,
        "name": "Admin User",
        "email": "admin@mutetaxes.com",
        "type": "ADMIN"
      }
    }
  ],
  "meta": {}
}
```

**Activity action types:**

| actionType                | Triggered by    | Description                             |
|---------------------------|-----------------|-----------------------------------------|
| `created`                 | Customer        | Service request created                 |
| `customer_updated`        | Customer        | Customer edited description/priority    |
| `status_changed`          | Admin           | Status was changed                      |
| `admin_notes_updated`     | Admin           | Admin notes were updated                |
| `internal_notes_updated`  | Admin           | Internal notes were updated             |
| `assignment_changed`      | Admin           | Assigned admin changed                  |
| `priority_changed`        | Admin           | Priority level changed                  |

---

### 6.9 Admin Customer Management

These endpoints let **ADMIN users** manage customer data — company profiles, stakeholders, documents, renewals, and service requests.

Base path (list): `/api/v1/admin/customers`
Base path (customer scoped): `/api/v1/admin/customers/:customerId`

> All endpoints:
> - Require `ADMIN` user type
> - The `:customerId` must be a user with `type === "CUSTOMER"`

---

#### `GET /api/v1/admin/customers`
List customers for the **Customer Management table** with company and registration summary fields already flattened.

**Permission required:** `USER_MANAGEMENT_READ`

**Query parameters:**

| Parameter          | Type    | Default | Description |
|-------------------|---------|---------|-------------|
| `search`          | string  | —       | Search across customer name, email, and company names |
| `status`          | string  | —       | Customer user status filter: `active`, `inactive`, `true`, `false` |
| `country`         | string  | —       | Country filter (company profile country / registration fallback) |
| `registrationStatus` | string | —     | Registration status filter: `pending`, `in-progress`, `completed` |
| `page`            | integer | `1`     | Page number |
| `limit`           | integer | `20`    | Results per page |
| `sortBy`          | string  | `createdAt` | `createdAt`, `name`, `email`, `lastActive` |
| `sortOrder`       | string  | `desc`  | `asc` or `desc` |

**Example:**

```http
GET /api/v1/admin/customers?search=james&status=active&country=Hong%20Kong&registrationStatus=completed&page=1&limit=10
Authorization: Bearer <admin_token>
```

**Response `200`:**
```json
{
  "success": true,
  "total": 1,
  "page": 1,
  "limit": 10,
  "customers": [
    {
      "id": 12,
      "name": "James Whitfield",
      "status": "active",
      "email": "james.whitfield@gmail.com",
      "companyName": "Whitfield Holdings Ltd",
      "companyType": "Private Limited",
      "country": "Hong Kong",
      "registrationStatus": "completed"
    }
  ]
}
```

This endpoint is intended for the admin customer list table and avoids calling `GET /users`.

---

#### `GET /api/v1/admin/customers/:customerId`
Get customer summary — identity, latest registration, counts, and feature flags.

**Permission required:** `USER_MANAGEMENT_READ`

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "id": 12,
    "name": "John Doe",
    "email": "john@example.com",
    "type": "CUSTOMER",
    "active": true,
    "lastActive": "2026-02-26T10:00:00.000Z",
    "badges": [{ "id": 2, "name": "customer", "displayName": "Customer" }],
    "latestRegistration": {
      "id": "a1b2c3d4-...",
      "status": "completed",
      "proposedCompanyName": "Acme HK Limited",
      "assignedToId": 1,
      "createdAt": "2026-02-20T09:00:00.000Z",
      "updatedAt": "2026-02-26T10:00:00.000Z"
    },
    "counts": {
      "registrations": 1,
      "stakeholders": 2,
      "registrationDocuments": 3,
      "companyDocuments": 5,
      "renewals": 2,
      "serviceRequests": 1
    },
    "hasCompanyProfile": true
  }
}
```

---

#### Company Profile

---

##### `GET /api/v1/admin/customers/:customerId/company-profile`
Get the customer's company profile.

**Permission required:** `USER_MANAGEMENT_READ`

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "customerId": 12,
    "registrationId": "reg_uuid",
    "companyName": "Acme HK Limited",
    "businessNature": "Technology consulting",
    "businessEmail": "info@acme.com",
    "phoneNumber": "+85212345678",
    "registeredOfficeAddress": "123 Nathan Road, Kowloon, HK",
    "companyType": "private_limited_company",
    "countryOfIncorporation": "HK",
    "businessRegistrationNumber": "12345678",
    "incorporationDate": "2024-01-15",
    "status": "active",
    "source": "registration",
    "createdAt": "2026-02-19T10:00:00.000Z",
    "updatedAt": "2026-02-26T10:00:00.000Z"
  }
}
```

**Error responses:**
```json
// 404 — No profile exists yet
{ "success": false, "error": { "code": "NOT_FOUND", "message": "Company profile not found" } }
```

---

##### `POST /api/v1/admin/customers/:customerId/company-profile`
Create a company profile. One profile per customer.

**Permission required:** `USER_MANAGEMENT_UPDATE`

**Request body:**
```json
{
  "companyName": "Acme HK Limited",
  "businessNature": "Technology consulting",
  "businessEmail": "info@acme.com",
  "phoneNumber": "+85212345678",
  "registeredOfficeAddress": "123 Nathan Road, Kowloon, HK",
  "companyType": "private_limited_company",
  "countryOfIncorporation": "HK",
  "businessRegistrationNumber": "12345678",
  "incorporationDate": "2024-01-15",
  "status": "active",
  "source": "registration",
  "registrationId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

| Field                      | Type   | Required | Rules                        |
|----------------------------|--------|----------|------------------------------|
| companyName                | string | Yes      | Non-empty                    |
| businessNature             | string | Yes      | Non-empty                    |
| businessEmail              | string | Yes      | Valid email                  |
| phoneNumber                | string | Yes      | Non-empty                    |
| registeredOfficeAddress    | string | Yes      | Non-empty                    |
| companyType                | string | No       |                              |
| countryOfIncorporation     | string | No       |                              |
| businessRegistrationNumber | string | No       |                              |
| incorporationDate          | string | No       | Format: `YYYY-MM-DD`         |
| status                     | string | No       |                              |
| source                     | string | No       |                              |
| registrationId             | string | No       | UUID of linked registration  |

**Response `201`:** Created company profile object.

**Error responses:**
```json
// 409 — Profile already exists
{ "success": false, "error": { "code": "CONFLICT", "message": "Company profile already exists for this customer" } }
```

---

##### `PATCH /api/v1/admin/customers/:customerId/company-profile`
Update the company profile. All fields optional, at least one required.

**Permission required:** `USER_MANAGEMENT_UPDATE`

**Response `200`:** Updated company profile object.

---

#### Stakeholders

---

##### `GET /api/v1/admin/customers/:customerId/stakeholders`
List stakeholders from the customer's linked registration(s).

**Permission required:** `USER_MANAGEMENT_READ`

**Query parameters:**

| Parameter      | Type    | Description                                              |
|----------------|---------|----------------------------------------------------------|
| role           | string  | Filter: `director`, `shareholder`                        |
| type           | string  | Filter: `individual`, `corporate`                        |
| search         | string  | Search across fullName, companyName, email               |
| hasDocuments   | boolean | Filter to stakeholders that have/don't have documents    |
| registrationId | string  | UUID — required if customer has multiple registrations   |
| sortBy         | string  | `id` (default), `fullName`, `companyName`, `sharePercentage` |
| sortOrder      | string  | `asc` or `desc` (default: `desc`)                        |
| page           | integer | Default: 1                                               |
| limit          | integer | Default: 20, max: 100                                    |

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "registrationId": "a1b2c3d4-...",
      "type": "individual",
      "roles": ["shareholder", "director"],
      "fullName": "John Doe",
      "companyName": null,
      "nationality": "GB",
      "email": "john@example.com",
      "phone": "+85212345678",
      "addressStreet": "123 Nathan Road",
      "addressCity": "Kowloon",
      "addressState": "",
      "addressPostalCode": "00000",
      "addressCountry": "HK",
      "countryOfIncorporation": null,
      "registrationNumber": null,
      "numberOfShares": 10000,
      "sharePercentage": 100,
      "hasDocuments": true,
      "documentsCount": 2
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 1 }
}
```

---

##### `POST /api/v1/admin/customers/:customerId/stakeholders`
Create a stakeholder under the customer's linked registration.

**Permission required:** `USER_MANAGEMENT_UPDATE`

**Request body:**
```json
{
  "registrationId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "type": "individual",
  "roles": ["director", "shareholder"],
  "fullName": "Jane Smith",
  "nationality": "HK",
  "email": "jane@example.com",
  "phone": "+85298765432",
  "addressStreet": "456 Queens Road",
  "addressCity": "Central",
  "addressState": "",
  "addressPostalCode": "00000",
  "addressCountry": "HK",
  "numberOfShares": 5000,
  "sharePercentage": 50
}
```

| Field          | Type    | Required | Rules                                                    |
|----------------|---------|----------|----------------------------------------------------------|
| type           | string  | Yes      | `individual` or `corporate`                              |
| roles          | array   | Yes      | Array of `director`, `shareholder`                       |
| registrationId | string  | Conditional | Required if customer has multiple linked registrations |

**Response `201`:** Created stakeholder object.

---

##### `GET /api/v1/admin/customers/:customerId/stakeholders/:stakeholderId`
Get a single stakeholder.

**Permission required:** `USER_MANAGEMENT_READ`

---

##### `PATCH /api/v1/admin/customers/:customerId/stakeholders/:stakeholderId`
Update a stakeholder. All fields optional.

**Permission required:** `USER_MANAGEMENT_UPDATE`

---

##### `DELETE /api/v1/admin/customers/:customerId/stakeholders/:stakeholderId`
Delete a stakeholder.

**Permission required:** `USER_MANAGEMENT_UPDATE`

**Response `200`:**
```json
{
  "success": true,
  "message": "Stakeholder deleted successfully"
}
```

---

#### Company Documents

The company documents system supports a **two-step upload flow** using S3 presigned URLs.

---

##### `GET /api/v1/admin/customers/:customerId/documents`
List customer company documents.

**Permission required:** `USER_MANAGEMENT_READ`

**Query parameters:**

| Parameter      | Type    | Description                                              |
|----------------|---------|----------------------------------------------------------|
| category       | string  | Filter by document category                              |
| stakeholderId  | integer | Filter by stakeholder                                    |
| status         | string  | Filter: `pending_upload`, `uploaded`, `failed`, `deleted`|
| search         | string  | Search across name, fileName, documentType               |
| registrationId | string  | Filter by linked registration UUID                       |
| createdFrom    | string  | ISO datetime lower bound                                 |
| createdTo      | string  | ISO datetime upper bound                                 |
| sortBy         | string  | `createdAt` (default), `name`, `category`               |
| sortOrder      | string  | `asc` or `desc` (default: `desc`)                        |
| page           | integer | Default: 1                                               |
| limit          | integer | Default: 20, max: 100                                    |

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "doc_uuid",
      "customerId": 12,
      "registrationId": "reg_uuid",
      "stakeholderId": null,
      "category": "Incorporation",
      "documentType": "certificate_of_incorporation",
      "name": "Certificate of Incorporation",
      "fileKey": "customers/12/company-documents/doc_uuid/certificate.pdf",
      "fileName": "certificate.pdf",
      "fileUrl": "https://cdn.example.com/...",
      "mimeType": "application/pdf",
      "fileSize": 245120,
      "etag": "\"abc123\"",
      "status": "uploaded",
      "uploadedBy": 5,
      "createdAt": "2026-02-26T10:00:00.000Z",
      "updatedAt": "2026-02-26T10:05:00.000Z",
      "deletedAt": null
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 1 }
}
```

---

##### `POST /api/v1/admin/customers/:customerId/documents/upload-init`
**Step 1 of 2:** Initialize a document upload. Creates a metadata record and returns a presigned S3 PUT URL.

**Permission required:** `USER_MANAGEMENT_UPDATE`

**Request body:**
```json
{
  "name": "Certificate of Incorporation",
  "category": "Incorporation",
  "documentType": "certificate_of_incorporation",
  "fileName": "certificate.pdf",
  "mimeType": "application/pdf",
  "fileSize": 245120,
  "stakeholderId": null,
  "registrationId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

| Field         | Type    | Required | Rules                                                         |
|---------------|---------|----------|---------------------------------------------------------------|
| name          | string  | Yes      | Human-readable document name, max 255 chars                   |
| category      | string  | Yes      | Category label, max 100 chars                                 |
| documentType  | string  | No       | Nullable — e.g. `certificate_of_incorporation`                |
| fileName      | string  | Yes      | Original file name with extension                             |
| mimeType      | string  | Yes      | `application/pdf`, `image/jpeg`, `image/jpg`, `image/png`, `image/webp` |
| fileSize      | integer | Yes      | File size in bytes. Max: **20 MB** (20971520)                 |
| stakeholderId | integer | No       | Link document to a specific stakeholder                       |
| registrationId| string  | No       | UUID of linked registration                                   |

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "documentId": "doc_uuid",
    "fileKey": "customers/12/company-documents/doc_uuid/certificate.pdf",
    "publicUrl": "https://cdn.example.com/customers/12/company-documents/doc_uuid/certificate.pdf",
    "uploadUrl": "https://s3-presigned-url...",
    "uploadMethod": "PUT",
    "requiredHeaders": {
      "Content-Type": "application/pdf"
    },
    "expiresAt": "2026-02-26T10:15:00.000Z"
  },
  "meta": {}
}
```

**Frontend upload flow:**

```typescript
// Step 1: Init upload
const { data } = await api.post(`/api/v1/admin/customers/${customerId}/documents/upload-init`, {
  name: "Certificate of Incorporation",
  category: "Incorporation",
  fileName: file.name,
  mimeType: file.type,
  fileSize: file.size,
});

// Step 2: Upload directly to S3 using presigned URL
await fetch(data.uploadUrl, {
  method: 'PUT',
  headers: { 'Content-Type': file.type },
  body: file,
});

// Step 3: Confirm upload complete
await api.post(
  `/api/v1/admin/customers/${customerId}/documents/${data.documentId}/upload-complete`,
  { etag: null } // Optional: pass ETag from S3 response headers
);
```

---

##### `POST /api/v1/admin/customers/:customerId/documents/:documentId/upload-complete`
**Step 2 of 2:** Confirm the upload completed. Marks the document status as `uploaded`.

**Permission required:** `USER_MANAGEMENT_UPDATE`

**Request body** (optional):
```json
{
  "etag": "\"abc123\""
}
```

**Response `200`:** Updated document metadata object.

---

##### `GET /api/v1/admin/customers/:customerId/documents/:documentId`
Get a single document's metadata.

**Permission required:** `USER_MANAGEMENT_READ`

---

##### `GET /api/v1/admin/customers/:customerId/documents/:documentId/download-url`
Get a signed S3 URL to download a document. Only works for `status === "uploaded"` documents.

**Permission required:** `USER_MANAGEMENT_READ`

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "downloadUrl": "https://s3-signed-url...",
    "expiresAt": "2026-02-26T11:00:00.000Z"
  }
}
```

**Error responses:**
```json
// 400 — Document not uploaded yet
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "Document is not yet uploaded" } }
```

---

##### `PATCH /api/v1/admin/customers/:customerId/documents/:documentId`
Update document metadata (name, category, stakeholder link, status).

**Permission required:** `USER_MANAGEMENT_UPDATE`

**Request body** (at least one field required):
```json
{
  "name": "Certificate of Incorporation (Stamped)",
  "category": "Statutory",
  "documentType": null,
  "stakeholderId": 45,
  "registrationId": "a1b2c3d4-...",
  "status": "uploaded"
}
```

| Field         | Type    | Rules                                                         |
|---------------|---------|---------------------------------------------------------------|
| name          | string  | Max 255 chars                                                 |
| category      | string  | Max 100 chars                                                 |
| documentType  | string  | Nullable                                                      |
| stakeholderId | integer | Nullable — link/unlink document from stakeholder              |
| registrationId| string  | Nullable UUID                                                 |
| status        | string  | `pending_upload`, `uploaded`, `failed`, `deleted`             |

---

##### `DELETE /api/v1/admin/customers/:customerId/documents/:documentId`
Soft-delete a document (sets `deletedAt` timestamp, `status` becomes `deleted`).

**Permission required:** `USER_MANAGEMENT_UPDATE`

**Response `200`:**
```json
{
  "success": true,
  "data": { "id": "doc_uuid", "deleted": true },
  "meta": {}
}
```

---

#### Renewals

Renewals track company obligations with due dates and amounts. Amounts are stored as **minor units (cents)** — e.g. `220000` = HKD 2,200.00.

---

##### `GET /api/v1/admin/customers/:customerId/renewals`
List customer renewals.

**Permission required:** `USER_MANAGEMENT_READ`

**Query parameters:**

| Parameter    | Type    | Description                                             |
|--------------|---------|---------------------------------------------------------|
| status       | string  | Filter: `upcoming`, `pending`, `current`, `overdue`     |
| dueFrom      | string  | ISO date lower bound (YYYY-MM-DD)                       |
| dueTo        | string  | ISO date upper bound (YYYY-MM-DD)                       |
| overdue      | boolean | `true` = only overdue renewals                          |
| upcomingDays | integer | Return renewals due within N days                       |
| search       | string  | Search in name and renewalType                          |
| sortBy       | string  | `dueDate`, `status`, `createdAt`, `name`               |
| sortOrder    | string  | `asc` or `desc`                                         |
| page         | integer | Default: 1                                              |
| limit        | integer | Default: 20, max: 100                                   |

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "ren_uuid",
      "customerId": 12,
      "name": "Business Registration",
      "renewalType": "statutory",
      "dueDate": "2026-04-30",
      "amount": {
        "currency": "HKD",
        "minor": 220000
      },
      "amountDisplay": "HK$2,200.00",
      "status": "upcoming",
      "notes": "Annual statutory renewal",
      "lastNotifiedAt": null,
      "createdAt": "2026-02-26T10:00:00.000Z",
      "updatedAt": "2026-02-26T10:00:00.000Z"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 1 }
}
```

---

##### `POST /api/v1/admin/customers/:customerId/renewals`
Create a renewal.

**Permission required:** `USER_MANAGEMENT_UPDATE`

**Request body:**
```json
{
  "name": "Business Registration",
  "renewalType": "statutory",
  "dueDate": "2026-04-30",
  "amount": {
    "currency": "HKD",
    "minor": 220000
  },
  "status": "upcoming",
  "notes": "Annual statutory renewal"
}
```

| Field       | Type   | Required | Rules                                               |
|-------------|--------|----------|-----------------------------------------------------|
| name        | string | Yes      | Non-empty, max 255 chars                            |
| dueDate     | string | Yes      | Date string (YYYY-MM-DD)                            |
| amount      | object | Yes      | `{ currency: string (3 chars), minor: integer >= 0 }` |
| renewalType | string | No       | Nullable — e.g. `statutory`, `annual`, `license`    |
| status      | string | No       | `upcoming` (default), `pending`, `current`, `overdue` |
| notes       | string | No       | Nullable                                            |

> **Amount minor units:** Store amounts in the smallest currency unit (cents). For HKD 2,200.00, send `220000`. The response includes a pre-formatted `amountDisplay` string.

**Response `201`:** Created renewal object.

---

##### `GET /api/v1/admin/customers/:customerId/renewals/:renewalId`
Get a single renewal.

**Permission required:** `USER_MANAGEMENT_READ`

---

##### `PATCH /api/v1/admin/customers/:customerId/renewals/:renewalId`
Update a renewal. All fields optional, at least one required.

**Permission required:** `USER_MANAGEMENT_UPDATE`

Additional updatable fields not in create:
- `lastNotifiedAt` — ISO datetime or `null` to clear

**Response `200`:** Updated renewal object.

---

##### `DELETE /api/v1/admin/customers/:customerId/renewals/:renewalId`
Delete a renewal permanently.

**Permission required:** `USER_MANAGEMENT_UPDATE`

**Response `200`:**
```json
{
  "success": true,
  "data": { "id": "ren_uuid", "deleted": true },
  "meta": {}
}
```

---

#### Service Requests (Admin View)

Admins manage service requests through a separate set of endpoints scoped to a specific customer.

---

##### `GET /api/v1/admin/customers/:customerId/service-requests`
List service requests for a customer.

**Permission required:** `USER_MANAGEMENT_READ`

**Query parameters:**

| Parameter  | Type    | Description                                              |
|------------|---------|----------------------------------------------------------|
| status     | string  | Filter: `pending`, `in-progress`, `completed`, `rejected`|
| type       | string  | Filter by request type text                              |
| typeCode   | string  | Filter by typeCode slug                                  |
| priority   | string  | Filter: `low`, `medium`, `high`                          |
| assignedTo | integer | Filter by assigned admin user ID                         |
| search     | string  | Search across id, type, description                      |
| sortBy     | string  | `requestedAt` (default), `updatedAt`, `status`, `type`, `priority` |
| sortOrder  | string  | `asc` or `desc`                                          |
| page       | integer | Default: 1                                               |
| limit      | integer | Default: 20, max: 100                                    |

**Response `200`:** Same `ServiceRequest` object shape as the customer portal.

> **Difference from customer portal:** Admin sees `internalNotes` in addition to `adminNotes`.

---

##### `GET /api/v1/admin/customers/:customerId/service-requests/:requestId`
Get a single service request (admin view, includes `internalNotes`).

**Permission required:** `USER_MANAGEMENT_READ`

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "id": "sr_uuid",
    "customerId": 12,
    "type": "Change of Directors",
    "typeCode": "change_directors",
    "description": "Please update the director list.",
    "status": "in-progress",
    "priority": "medium",
    "requestedByUserId": 12,
    "assignedToAdminId": 5,
    "adminNotes": "Received documents. Filing in progress.",
    "internalNotes": "Checked with compliance team.",
    "requestedAt": "2026-02-26T11:00:00.000Z",
    "resolvedAt": null,
    "createdAt": "2026-02-26T11:00:00.000Z",
    "updatedAt": "2026-02-26T12:00:00.000Z"
  },
  "meta": {}
}
```

---

##### `PATCH /api/v1/admin/customers/:customerId/service-requests/:requestId`
Update a service request (admin workflow).

**Permission required:** `USER_MANAGEMENT_UPDATE`

**Request body** (at least one field required):
```json
{
  "status": "in-progress",
  "adminNotes": "Received documents. Filing in progress.",
  "internalNotes": "Checked with compliance team.",
  "assignedToAdminId": 5,
  "priority": "high"
}
```

| Field             | Type            | Rules                                               |
|-------------------|-----------------|-----------------------------------------------------|
| status            | string          | `pending`, `in-progress`, `completed`, `rejected`   |
| adminNotes        | string \| null  | Notes visible to customer                           |
| internalNotes     | string \| null  | Internal staff notes (not shown to customer)        |
| assignedToAdminId | integer \| null | Admin user ID or `null` to unassign                 |
| priority          | string          | `low`, `medium`, `high`                             |

**Response `200`:** Updated service request object.

---

##### `GET /api/v1/admin/customers/:customerId/service-requests/:requestId/activity`
Get the activity log for a service request (admin view — same as customer view but with access to internal notes changes).

**Permission required:** `USER_MANAGEMENT_READ`

---

### 6.10 File Upload Routes

---

#### `POST /api/v1/uploads/presign`
Get a presigned S3 URL for uploading a registration document. **Public endpoint — no auth required.**

> Use this to upload stakeholder documents during the public registration form flow. For admin company document uploads, use the `/api/v1/admin/customers/:customerId/documents/upload-init` endpoint instead.

**Request body:**
```json
{
  "documentType": "passport",
  "fileName": "passport.jpg",
  "mimeType": "image/jpeg",
  "sizeBytes": 102400
}
```

| Field        | Type   | Required | Rules                                                         |
|--------------|--------|----------|---------------------------------------------------------------|
| documentType | string | Yes      | `passport`, `selfie`, `addressProof`, `certificate_of_incorporation`, `business_license`, `others` |
| fileName     | string | Yes      | Original file name                                            |
| mimeType     | string | Yes      | `application/pdf`, `image/jpeg`, `image/jpg`, `image/png`, `image/webp` |
| sizeBytes    | integer| Yes      | File size in bytes. Max: **10 MB** (10485760)                 |

**Response `200`:**
```json
{
  "uploadUrl": "https://s3.example.com/...",
  "key": "uploads/passport-abc123.jpg",
  "publicUrl": "https://cdn.example.com/uploads/passport-abc123.jpg",
  "expiresIn": 3600
}
```

---

#### `GET /api/v1/uploads/signed-url`
Get a temporary signed URL to access a private S3 file.

**Auth required:** Yes

**Query parameters:**

| Parameter | Type   | Description                              |
|-----------|--------|------------------------------------------|
| key       | string | S3 object key (from upload response)     |

**Response `200`:**
```json
{
  "signedUrl": "https://s3.example.com/...",
  "expiresIn": 3600
}
```

---

## 7. Error Handling

### Standard error response shapes

```typescript
// Format A — auth/middleware errors
{
  error: string;    // Short error category
  message: string;  // Detailed description
}

// Format B — badge/user/ticket/registration controllers
{
  success: false;
  error: string;    // Detailed error
  message?: string; // Additional context (optional)
}

// Format C — admin customer management controllers (new)
{
  success: false;
  error: {
    code: "VALIDATION_ERROR" | "NOT_FOUND" | "CONFLICT" | "INTERNAL_SERVER_ERROR";
    message: string;
    details: Array<{ field: string; message: string }>;
  };
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
        // Validation error — extract message from any format
        throw new Error(data.error?.message || data.error || data.message || 'Bad request');
      case 401:
        // Token expired or missing — redirect to login
        clearTokens();
        redirectToLogin();
        throw new Error('Session expired');
      case 403:
        // No permission — show "Access denied" UI
        throw new Error('You do not have permission to perform this action');
      case 404:
        throw new Error(data.error?.message || data.error || 'Resource not found');
      case 409:
        throw new Error(data.error?.message || data.error || 'Conflict — resource already exists');
      case 500:
        throw new Error('A server error occurred. Please try again later.');
      default:
        throw new Error('An unexpected error occurred');
    }
  }

  return data;
}
```

---

## 8. HTTP Status Codes

| Code | Meaning            | When it occurs                                               |
|------|--------------------|--------------------------------------------------------------|
| 200  | OK                 | Successful GET, PATCH, DELETE                                |
| 201  | Created            | Successful POST (user, badge, ticket, registration, etc.)    |
| 400  | Bad Request        | Missing fields, validation error, duplicate name             |
| 401  | Unauthorized       | Missing `Authorization` header, invalid/expired JWT          |
| 403  | Forbidden          | Valid token but wrong user type or missing permission        |
| 404  | Not Found          | Resource with given ID does not exist                        |
| 409  | Conflict           | Duplicate resource (e.g. company profile already exists)     |
| 500  | Internal Server Error | Database error, unexpected exception                      |

---

## 9. All 32 Permissions Reference

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

## 10. Data Models

### User

```typescript
interface UserListItem {
  id: number;
  name: string;
  email: string;
  type: 'ADMIN' | 'CUSTOMER';
  active: 'active' | 'inactive';
  role: string;                   // badge displayName(s), comma-joined
  lastActive?: string | null;     // ISO 8601 or null
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
    type: 'ADMIN' | 'CUSTOMER';
    permissions: string[];
    role: string | null;
    dashboardPath: '/admin/dashboard' | '/customer/dashboard';
  };
}
```

### Badge

```typescript
interface Badge {
  id: number;
  name: string;
  displayName: string;
  color: string;         // Hex color, e.g. "#EF4444"
  createdAt: string;     // ISO 8601
  permissions: Permission[];
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
  createdAt: string;
  assignedToId: number | null;
  assignedTo: { id: number; name: string; email: string } | null;
}
```

### RegistrationListItem

```typescript
interface RegistrationListItem {
  id: string;            // UUID
  clientName: string;
  clientEmail: string;
  phone: string;
  type: string;          // companyType
  status: 'pending' | 'in-progress' | 'completed';
  assignedTo: string;    // Admin name or "Unassigned"
  submittedDate: string;
  lastUpdated: string;
  documents: number;     // count
  documentList: RegistrationDocument[];
}
```

### RegistrationDetail

```typescript
interface RegistrationDetail {
  id: string;
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
  registrationId: string;
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
  // Admin customer management endpoints also include:
  hasDocuments?: boolean;
  documentsCount?: number;
}
```

### RegistrationDocument

```typescript
interface RegistrationDocument {
  id: number;
  registrationId: string;
  stakeholderId: number | null;
  documentType: 'passport' | 'selfie' | 'addressProof' | 'certificate_of_incorporation' | 'business_license' | 'others';
  fileKey: string | null;
  fileUrl: string;
  fileName: string | null;
  mimeType: string | null;
  fileSize: number | null;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  rejectionReason: string | null;
  uploadedBy: number | null;
  verifiedBy: number | null;
  createdAt: string;
}
```

### CustomerCompanyProfile

```typescript
interface CustomerCompanyProfile {
  id: string;                       // UUID
  customerId: number;
  registrationId: string | null;    // UUID of linked registration
  companyName: string;
  businessNature: string;
  businessEmail: string;
  phoneNumber: string;
  registeredOfficeAddress: string;
  companyType: string | null;
  countryOfIncorporation: string | null;
  businessRegistrationNumber: string | null;
  incorporationDate: string | null; // YYYY-MM-DD
  status: string | null;
  source: string | null;
  createdAt: string;
  updatedAt: string;
}
```

### CustomerCompanyDocument

```typescript
interface CustomerCompanyDocument {
  id: string;                       // UUID
  customerId: number;
  registrationId: string | null;
  stakeholderId: number | null;
  category: string;
  documentType: string | null;
  name: string;
  fileKey: string | null;
  fileName: string | null;
  fileUrl: string | null;
  mimeType: string | null;
  fileSize: number | null;          // bytes
  etag: string | null;
  status: 'pending_upload' | 'uploaded' | 'failed' | 'deleted';
  uploadedBy: number | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;         // null unless soft-deleted
}
```

### CustomerRenewal

```typescript
interface CustomerRenewal {
  id: string;           // UUID
  customerId: number;
  name: string;
  renewalType: string | null;
  dueDate: string;      // YYYY-MM-DD
  amount: {
    currency: string;   // 3-letter ISO code, e.g. "HKD"
    minor: number;      // Amount in smallest currency unit (cents)
  };
  amountDisplay: string; // Pre-formatted, e.g. "HK$2,200.00"
  status: 'upcoming' | 'pending' | 'current' | 'overdue';
  notes: string | null;
  lastNotifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
```

### CustomerServiceRequest

```typescript
interface CustomerServiceRequest {
  id: string;                    // UUID
  customerId: number;
  type: string;                  // Human-readable request type
  typeCode: string | null;       // Machine-readable slug
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'rejected';
  priority: 'low' | 'medium' | 'high';
  requestedByUserId: number;
  assignedToAdminId: number | null;
  adminNotes: string | null;     // Visible to customer
  internalNotes?: string | null; // Admin-only — not returned to customer portal
  requestedAt: string;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
```

### CustomerServiceRequestActivity

```typescript
interface CustomerServiceRequestActivity {
  id: string;
  serviceRequestId: string;
  actorUserId: number;
  actionType:
    | 'created'
    | 'customer_updated'
    | 'status_changed'
    | 'admin_notes_updated'
    | 'internal_notes_updated'
    | 'assignment_changed'
    | 'priority_changed';
  payload: Record<string, any>; // Varies by actionType
  createdAt: string;
  actor: {
    id: number;
    name: string;
    email: string;
    type: 'ADMIN' | 'CUSTOMER';
  } | null;
}
```

---

## 11. Implementation Examples

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

  // Redirect based on user type
  if (data.user.type === 'ADMIN') {
    window.location.href = '/admin/dashboard';
  } else {
    window.location.href = '/customer/dashboard';
  }

  return data.user; // { id, email, name, type, permissions, role, dashboardPath }
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

### Customer Document Upload (Two-Step S3 Flow)

```typescript
// customerDocuments.ts

import { authorizedFetch } from './auth';

export async function uploadCustomerDocument(
  customerId: number,
  file: File,
  meta: {
    name: string;
    category: string;
    documentType?: string;
    stakeholderId?: number | null;
    registrationId?: string | null;
  }
) {
  // Step 1: Initialize upload — get presigned URL
  const initRes = await authorizedFetch(
    `/api/v1/admin/customers/${customerId}/documents/upload-init`,
    {
      method: 'POST',
      body: JSON.stringify({
        name: meta.name,
        category: meta.category,
        documentType: meta.documentType ?? null,
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        stakeholderId: meta.stakeholderId ?? null,
        registrationId: meta.registrationId ?? null,
      }),
    }
  );

  if (!initRes.ok) {
    const err = await initRes.json();
    throw new Error(err.error?.message || 'Failed to initialize upload');
  }

  const { data } = await initRes.json();
  const { documentId, uploadUrl } = data;

  // Step 2: Upload directly to S3
  const s3Res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });

  if (!s3Res.ok) {
    throw new Error('Failed to upload file to S3');
  }

  // Extract ETag from S3 response (optional but recommended)
  const etag = s3Res.headers.get('ETag');

  // Step 3: Confirm upload complete
  const completeRes = await authorizedFetch(
    `/api/v1/admin/customers/${customerId}/documents/${documentId}/upload-complete`,
    {
      method: 'POST',
      body: JSON.stringify({ etag }),
    }
  );

  const result = await completeRes.json();
  if (!completeRes.ok) throw new Error(result.error?.message || 'Failed to complete upload');

  return result.data; // Finalized document metadata
}
```

### Service Request Management (Customer)

```typescript
// serviceRequests.ts

import { authorizedFetch } from './auth';

export async function createServiceRequest(payload: {
  type: string;
  typeCode?: string;
  description: string;
  priority?: 'low' | 'medium' | 'high';
}) {
  const res = await authorizedFetch('/api/v1/customer/service-requests', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Failed to create service request');
  return data.data;
}

export async function getMyServiceRequests(filters?: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.search) params.set('search', filters.search);
  if (filters?.page) params.set('page', String(filters.page));
  if (filters?.limit) params.set('limit', String(filters.limit));

  const res = await authorizedFetch(`/api/v1/customer/service-requests?${params}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Failed to fetch service requests');
  return data; // { success, data: [], meta: { page, limit, total } }
}

export async function updateMyServiceRequest(
  requestId: string,
  payload: { description?: string; priority?: string }
) {
  const res = await authorizedFetch(`/api/v1/customer/service-requests/${requestId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Failed to update service request');
  return data.data;
}
```

### Admin Renewal Management

```typescript
// renewals.ts

import { authorizedFetch } from './auth';

export async function createRenewal(
  customerId: number,
  payload: {
    name: string;
    dueDate: string;        // YYYY-MM-DD
    amount: { currency: string; minor: number }; // minor = cents
    renewalType?: string;
    status?: 'upcoming' | 'pending' | 'current' | 'overdue';
    notes?: string;
  }
) {
  const res = await authorizedFetch(`/api/v1/admin/customers/${customerId}/renewals`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Failed to create renewal');
  return data.data;
}

// Helper: convert HKD amount to minor units
export function toMinorUnits(amount: number): number {
  return Math.round(amount * 100);
}

// Usage example:
// await createRenewal(12, {
//   name: "Business Registration",
//   dueDate: "2026-04-30",
//   amount: { currency: "HKD", minor: toMinorUnits(2200) }, // 220000
//   renewalType: "statutory",
//   status: "upcoming",
// });
```

### Permission-Aware Navigation (React Router)

```tsx
// ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export function ProtectedRoute({
  permission,
  userType,
  children,
}: {
  permission?: string;
  userType?: 'ADMIN' | 'CUSTOMER';
  children: JSX.Element;
}) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (userType && user.type !== userType) {
    return <Navigate to="/403" replace />;
  }

  if (permission && !user.permissions.includes(permission)) {
    return <Navigate to="/403" replace />;
  }

  return children;
}

// App.tsx
<Routes>
  <Route path="/login" element={<LoginPage />} />

  {/* Admin routes */}
  <Route path="/admin/badges" element={<ProtectedRoute userType="ADMIN" permission="BADGE_CREATION_READ"><BadgesPage /></ProtectedRoute>} />
  <Route path="/admin/users" element={<ProtectedRoute userType="ADMIN" permission="USER_MANAGEMENT_READ"><UsersPage /></ProtectedRoute>} />
  <Route path="/admin/registrations" element={<ProtectedRoute userType="ADMIN" permission="REGISTRATIONS_READ"><RegistrationsPage /></ProtectedRoute>} />
  <Route path="/admin/customers/:customerId" element={<ProtectedRoute userType="ADMIN" permission="USER_MANAGEMENT_READ"><CustomerDetailPage /></ProtectedRoute>} />
  <Route path="/admin/tickets" element={<ProtectedRoute userType="ADMIN" permission="SUPPORT_TICKETS_READ"><TicketsPage /></ProtectedRoute>} />

  {/* Customer portal routes */}
  <Route path="/customer/registrations" element={<ProtectedRoute userType="CUSTOMER"><MyRegistrationsPage /></ProtectedRoute>} />
  <Route path="/customer/registrations/:id" element={<ProtectedRoute userType="CUSTOMER"><MyRegistrationDetailPage /></ProtectedRoute>} />
  <Route path="/customer/service-requests" element={<ProtectedRoute userType="CUSTOMER" permission="SUPPORT_TICKETS_READ"><MyServiceRequestsPage /></ProtectedRoute>} />
  <Route path="/customer/tickets" element={<ProtectedRoute userType="CUSTOMER" permission="SUPPORT_TICKETS_READ"><MyTicketsPage /></ProtectedRoute>} />
</Routes>
```

---

## 12. Environment Setup

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
| Type     | `ADMIN`                  |
| Badge    | Administrator (all 32 permissions) |

---

## Appendix — Route Summary Table

| Method | Path                                                            | Auth Type | Permission Required      | Description                                    |
|--------|-----------------------------------------------------------------|-----------|--------------------------|------------------------------------------------|
| GET    | `/`                                                             | None      | —                        | Health check                                   |
| GET    | `/health`                                                       | None      | —                        | Simple status                                  |
| GET    | `/permissions`                                                  | None      | —                        | List all 32 permissions                        |
| POST   | `/auth/login`                                                   | None      | —                        | Login — returns tokens + user                  |
| POST   | `/auth/refresh`                                                 | None      | —                        | Refresh access token                           |
| GET    | `/auth/me`                                                      | Any       | —                        | Get current user profile                       |
| GET    | `/auth/me/permissions`                                          | Any       | —                        | Get current user's permissions                 |
| PATCH  | `/auth/change-password`                                         | Any       | —                        | Change own password                            |
| POST   | `/users`                                                        | Admin     | `USER_MANAGEMENT_CREATE` | Create a new user (admin or customer)          |
| GET    | `/users`                                                        | Admin     | `USER_MANAGEMENT_READ`   | List users with filters                        |
| PATCH  | `/users/:id`                                                    | Admin     | `USER_MANAGEMENT_UPDATE` | Update user                                    |
| DELETE | `/users/:id`                                                    | Admin     | `USER_MANAGEMENT_DELETE` | Delete user                                    |
| GET    | `/badges`                                                       | Admin     | `BADGE_CREATION_READ`    | List all badges                                |
| GET    | `/badges/:id`                                                   | Admin     | `BADGE_CREATION_READ`    | Get single badge                               |
| POST   | `/badges`                                                       | Admin     | `BADGE_CREATION_CREATE`  | Create badge                                   |
| PATCH  | `/badges/:id`                                                   | Admin     | `BADGE_CREATION_UPDATE`  | Update badge                                   |
| DELETE | `/badges/:id`                                                   | Admin     | `BADGE_CREATION_DELETE`  | Delete badge                                   |
| GET    | `/badges/:id/permissions`                                       | Admin     | `BADGE_CREATION_UPDATE`  | Get badge permission map                       |
| GET    | `/tickets`                                                      | Any       | `SUPPORT_TICKETS_READ`   | List tickets (scoped by user type)             |
| POST   | `/tickets`                                                      | Any       | `SUPPORT_TICKETS_CREATE` | Create ticket                                  |
| GET    | `/tickets/:id`                                                  | Any       | `SUPPORT_TICKETS_READ`   | Get single ticket                              |
| PATCH  | `/tickets/:id`                                                  | Admin     | `SUPPORT_TICKETS_UPDATE` | Update ticket                                  |
| DELETE | `/tickets/:id`                                                  | Admin     | `SUPPORT_TICKETS_DELETE` | Delete ticket                                  |
| POST   | `/api/v1/registrations`                                         | None      | —                        | Submit registration (public)                   |
| GET    | `/api/v1/registrations`                                         | Admin     | `REGISTRATIONS_READ`     | List registrations (paginated)                 |
| GET    | `/api/v1/registrations/:id`                                     | Admin     | `REGISTRATIONS_READ`     | Get registration detail                        |
| PATCH  | `/api/v1/registrations/:id`                                     | Admin     | `REGISTRATIONS_UPDATE`   | Update registration                            |
| DELETE | `/api/v1/registrations/:id`                                     | Admin     | `REGISTRATIONS_DELETE`   | Delete registration                            |
| POST   | `/api/v1/registrations/:id/claim`                               | Customer  | —                        | Customer claims registration                   |
| PATCH  | `/api/v1/registrations/:id/customer`                            | Admin     | `REGISTRATIONS_UPDATE`   | Admin links registration to customer           |
| GET    | `/api/v1/my-registrations`                                      | Customer  | —                        | List customer's own registrations              |
| GET    | `/api/v1/my-registrations/:id`                                  | Customer  | —                        | Get customer's own registration detail         |
| GET    | `/api/v1/customer/service-requests`                             | Customer  | `SUPPORT_TICKETS_READ`   | List customer's own service requests           |
| POST   | `/api/v1/customer/service-requests`                             | Customer  | `SUPPORT_TICKETS_CREATE` | Create service request                         |
| GET    | `/api/v1/customer/service-requests/:requestId`                  | Customer  | `SUPPORT_TICKETS_READ`   | Get customer's own service request             |
| PATCH  | `/api/v1/customer/service-requests/:requestId`                  | Customer  | `SUPPORT_TICKETS_UPDATE` | Update service request (pending only)          |
| GET    | `/api/v1/customer/service-requests/:requestId/activity`         | Customer  | `SUPPORT_TICKETS_READ`   | Get service request activity log               |
| GET    | `/api/v1/admin/customers`                                      | Admin     | `USER_MANAGEMENT_READ`   | List customers for customer management table   |
| GET    | `/api/v1/admin/customers/:customerId`                           | Admin     | `USER_MANAGEMENT_READ`   | Get customer summary                           |
| GET    | `/api/v1/admin/customers/:customerId/company-profile`           | Admin     | `USER_MANAGEMENT_READ`   | Get company profile                            |
| POST   | `/api/v1/admin/customers/:customerId/company-profile`           | Admin     | `USER_MANAGEMENT_UPDATE` | Create company profile                         |
| PATCH  | `/api/v1/admin/customers/:customerId/company-profile`           | Admin     | `USER_MANAGEMENT_UPDATE` | Update company profile                         |
| GET    | `/api/v1/admin/customers/:customerId/stakeholders`              | Admin     | `USER_MANAGEMENT_READ`   | List stakeholders                              |
| POST   | `/api/v1/admin/customers/:customerId/stakeholders`              | Admin     | `USER_MANAGEMENT_UPDATE` | Create stakeholder                             |
| GET    | `/api/v1/admin/customers/:customerId/stakeholders/:id`          | Admin     | `USER_MANAGEMENT_READ`   | Get stakeholder                                |
| PATCH  | `/api/v1/admin/customers/:customerId/stakeholders/:id`          | Admin     | `USER_MANAGEMENT_UPDATE` | Update stakeholder                             |
| DELETE | `/api/v1/admin/customers/:customerId/stakeholders/:id`          | Admin     | `USER_MANAGEMENT_UPDATE` | Delete stakeholder                             |
| GET    | `/api/v1/admin/customers/:customerId/documents`                 | Admin     | `USER_MANAGEMENT_READ`   | List company documents                         |
| POST   | `/api/v1/admin/customers/:customerId/documents/upload-init`     | Admin     | `USER_MANAGEMENT_UPDATE` | Init document upload (get presigned S3 URL)    |
| POST   | `/api/v1/admin/customers/:customerId/documents/:id/upload-complete` | Admin | `USER_MANAGEMENT_UPDATE` | Complete document upload                       |
| GET    | `/api/v1/admin/customers/:customerId/documents/:id`             | Admin     | `USER_MANAGEMENT_READ`   | Get document metadata                          |
| GET    | `/api/v1/admin/customers/:customerId/documents/:id/download-url`| Admin     | `USER_MANAGEMENT_READ`   | Get signed download URL                        |
| PATCH  | `/api/v1/admin/customers/:customerId/documents/:id`             | Admin     | `USER_MANAGEMENT_UPDATE` | Update document metadata                       |
| DELETE | `/api/v1/admin/customers/:customerId/documents/:id`             | Admin     | `USER_MANAGEMENT_UPDATE` | Soft-delete document                           |
| GET    | `/api/v1/admin/customers/:customerId/renewals`                  | Admin     | `USER_MANAGEMENT_READ`   | List renewals                                  |
| POST   | `/api/v1/admin/customers/:customerId/renewals`                  | Admin     | `USER_MANAGEMENT_UPDATE` | Create renewal                                 |
| GET    | `/api/v1/admin/customers/:customerId/renewals/:renewalId`       | Admin     | `USER_MANAGEMENT_READ`   | Get renewal                                    |
| PATCH  | `/api/v1/admin/customers/:customerId/renewals/:renewalId`       | Admin     | `USER_MANAGEMENT_UPDATE` | Update renewal                                 |
| DELETE | `/api/v1/admin/customers/:customerId/renewals/:renewalId`       | Admin     | `USER_MANAGEMENT_UPDATE` | Delete renewal                                 |
| GET    | `/api/v1/admin/customers/:customerId/service-requests`          | Admin     | `USER_MANAGEMENT_READ`   | List customer service requests (admin view)    |
| GET    | `/api/v1/admin/customers/:customerId/service-requests/:id`      | Admin     | `USER_MANAGEMENT_READ`   | Get service request (admin view)               |
| PATCH  | `/api/v1/admin/customers/:customerId/service-requests/:id`      | Admin     | `USER_MANAGEMENT_UPDATE` | Update service request (admin)                 |
| GET    | `/api/v1/admin/customers/:customerId/service-requests/:id/activity` | Admin | `USER_MANAGEMENT_READ`   | Get service request activity log               |
| POST   | `/api/v1/uploads/presign`                                       | None      | —                        | Get S3 presigned PUT URL (registration docs)   |
| GET    | `/api/v1/uploads/signed-url`                                    | Any       | —                        | Get S3 signed GET URL for private file         |
