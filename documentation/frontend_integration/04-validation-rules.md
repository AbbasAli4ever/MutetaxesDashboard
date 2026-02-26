# 04 — Validation Rules

These are **all** the rules enforced by the server. Implement every one of them on the
frontend to give users immediate, inline feedback before they even hit Submit.

---

## Per-field rules (per section)

### `applicant`

| Field | Rule |
|-------|------|
| `firstName` | Required, 1–100 characters |
| `lastName` | Required, 1–100 characters |
| `email` | Required, valid email format |
| `phone` | Required, 7–20 characters |

---

### `company`

| Field | Rule |
|-------|------|
| `countryOfIncorporation` | Required, exactly 2 characters (ISO alpha-2) |
| `type` | Required, must be `"private_limited_company"` |
| `proposedCompanyName` | Required, 1–200 characters |
| `alternativeNames` | Optional array, max 3 items, each item 1–100 characters |
| `natureOfBusiness` | Required array, at least 1 item, each from the allowed enum |
| `businessScope` | Optional free text |
| `businessScopeDescription` | Required, **minimum 50 characters**, max 2000 characters |

---

### `shareCapital`

| Field | Rule |
|-------|------|
| `currency` | 1–3 character string, default `"HKD"` |
| `totalAmount` | Positive integer |
| `totalShares` | Positive integer |

---

### `persons` — per-person field rules

#### All persons

| Field | Rule |
|-------|------|
| `type` | Required — `"individual"` or `"corporate"` |
| `roles` | Required array with at least 1 item: `"shareholder"` and/or `"director"` |

#### Individual person

| Field | Rule |
|-------|------|
| `fullName` | Required, 2–200 characters |
| `nationality` | Required, exactly 2 characters (ISO alpha-2) |
| `email` | Required, valid email |
| `phone` | Required, 7–20 characters |
| `residentialAddress` | Required — full Address object |
| `residentialAddress.street` | Min 1 char |
| `residentialAddress.city` | 1–100 chars |
| `residentialAddress.postalCode` | 1–20 chars |
| `residentialAddress.country` | Exactly 2 chars |
| `documents.passport` | **Required** — must be a FileReference, not null |
| `documents.selfie` | **Required** — must be a FileReference, not null |
| `documents.addressProof` | **Required** — must be a FileReference, not null |

#### Corporate person

| Field | Rule |
|-------|------|
| `companyName` | Required, 1–300 characters |
| `countryOfIncorporation` | Required, exactly 2 characters (ISO alpha-2) |
| `registrationNumber` | Required, 1–100 characters |

#### Shareholders (any type)

| Field | Rule |
|-------|------|
| `shareholding.shares` | Required when role includes `"shareholder"`. Positive integer. |
| `shareholding.percentage` | Required when role includes `"shareholder"`. > 0 and ≤ 100. |

---

### `services`

| Field | Rule |
|-------|------|
| `banking.providers` | Array of valid enum values (may be empty) |
| `banking.preferredProvider` | See cross-field rules below |
| `additionalServices` | Array of valid enum values (may be empty) |

---

### `billing`

| Field | Rule |
|-------|------|
| `name` | Required, 1–200 characters |
| `email` | Required, valid email |
| `phone` | Required, **E.164 format**: `/^\+[1-9]\d{1,14}$/` |
| `address` | Required — full Address object |
| `paymentMethod` | Required, one of: `bank_transfer`, `card`, `crypto`, `paypal` |

**E.164 regex for billing phone:** `^\+[1-9]\d{1,14}$`

Valid: `+85212345678`, `+923001234567`, `+442071234567`
Invalid: `85212345678` (no `+`), `+0123456789` (0 after `+`), `+1` (too short)

---

### `complianceAccepted`

| Field | Rule |
|-------|------|
| `isAccepted` | Must be the literal boolean `true` — `false` causes 400 |
| `timestamp` | Required, non-empty string (ISO 8601 recommended) |

---

## Cross-field rules

These rules involve **multiple fields** and must be checked after all individual fields pass.

---

### Rule 1 — Shares must add up to `totalShares`

```
sum(persons[i].shareholding.shares for all shareholders) === shareCapital.totalShares
```

Example: `totalShares = 10000`, two shareholders each with 5000 shares → ✅

Example: `totalShares = 10000`, one with 6000, one with 5000 → ❌ (sum is 11000)

---

### Rule 2 — Percentages must add up to 100%

```
sum(persons[i].shareholding.percentage for all shareholders) ≈ 100  (tolerance ±0.01)
```

Valid: `50.0 + 50.0 = 100.0` ✅
Valid: `33.34 + 33.33 + 33.33 = 100.0` ✅
Invalid: `50.0 + 49.0 = 99.0` ❌

> **Floating point tip:** When dividing shares equally, use integer arithmetic to avoid
> floating-point drift. For 3 equal shareholders of 10000 shares:
> assign `percentage = [33.34, 33.33, 33.33]` (not three × 33.33).

---

### Rule 3 — Each percentage must match its share fraction

```
For each shareholder:
  |shareholding.percentage - (shareholding.shares / shareCapital.totalShares × 100)| ≤ 0.01
```

Example: `shares=5000, totalShares=10000` → expected `50.00` → send `50.0` ✅
Example: `shares=5000, totalShares=10000` → sent `60.0` → ❌

To calculate the correct percentage:
```typescript
const percentage = parseFloat(
  ((person.shares / shareCapital.totalShares) * 100).toFixed(2)
);
```

---

### Rule 4 — At least one director

Either:
- At least one person in `persons[]` has `"director"` in their `roles`, **OR**
- `services.additionalServices` includes `"nominee_director_service"`

If neither is true → 400 error.

---

### Rule 5 — Banking `preferredProvider` is required when real providers are selected

If `services.banking.providers` contains **any value other than** `"no_bank_account"`,
then `services.banking.preferredProvider` must be set to one of those providers.

```
if (providers.some(p => p !== 'no_bank_account')) {
  preferredProvider must be non-null AND must be one of providers
}
```

---

### Rule 6 — `no_bank_account` is exclusive

`"no_bank_account"` cannot appear alongside other providers.

```
if (providers.includes('no_bank_account') && providers.length > 1) → error
```

Valid: `["no_bank_account"]` ✅
Valid: `["airwallex", "currenxie"]` ✅
Invalid: `["no_bank_account", "airwallex"]` ❌

---

### Rule 7 — No duplicate emails among individual persons

Each `individual` person must have a **unique** email address.
Corporate persons are excluded from this check.

```
const emails = persons
  .filter(p => p.type === 'individual')
  .map(p => p.email);
// emails must all be distinct
```

---

## Frontend validation checklist (summary)

Use this as a step-by-step guide for your form validation logic.

```
APPLICANT
  [ ] firstName: non-empty, ≤100 chars
  [ ] lastName:  non-empty, ≤100 chars
  [ ] email:     valid email
  [ ] phone:     7–20 chars

COMPANY
  [ ] countryOfIncorporation: exactly 2 chars
  [ ] type: "private_limited_company"
  [ ] proposedCompanyName: non-empty, ≤200 chars
  [ ] alternativeNames: ≤3 items, each ≤100 chars
  [ ] natureOfBusiness: ≥1 item from allowed enum
  [ ] businessScopeDescription: ≥50 chars, ≤2000 chars

SHARE CAPITAL
  [ ] currency: non-empty, ≤3 chars
  [ ] totalAmount: positive integer
  [ ] totalShares: positive integer

PERSONS (for each person)
  [ ] type: "individual" or "corporate"
  [ ] roles: ≥1 role
  If individual:
    [ ] fullName: 2–200 chars
    [ ] nationality: exactly 2 chars
    [ ] email: valid email
    [ ] phone: 7–20 chars
    [ ] residentialAddress: all required subfields present
    [ ] documents.passport: FileReference (not null)
    [ ] documents.selfie: FileReference (not null)
    [ ] documents.addressProof: FileReference (not null)
  If corporate:
    [ ] companyName: 1–300 chars
    [ ] countryOfIncorporation: exactly 2 chars
    [ ] registrationNumber: 1–100 chars
  If shareholder:
    [ ] shareholding.shares: positive integer
    [ ] shareholding.percentage: >0 and ≤100

CROSS-FIELD
  [ ] sum(shares) === shareCapital.totalShares
  [ ] sum(percentages) ≈ 100 (within ±0.01)
  [ ] each percentage ≈ (shares/totalShares)*100 (within ±0.01)
  [ ] at least one director OR nominee_director_service selected
  [ ] no duplicate emails among individual persons

SERVICES
  [ ] if real providers selected → preferredProvider set to one of them
  [ ] no_bank_account not combined with other providers

BILLING
  [ ] name: non-empty, ≤200 chars
  [ ] email: valid email
  [ ] phone: E.164 format (starts with +, followed by 1–14 digits)
  [ ] address: all required subfields present
  [ ] paymentMethod: valid enum value

COMPLIANCE
  [ ] isAccepted: exactly true (boolean)
  [ ] timestamp: non-empty string

FILES (before submission)
  [ ] all required document uploads completed and FileReference objects stored
  [ ] no upload still pending / in-flight
```
