# 03 — Payload Reference

`POST /api/v1/registrations` expects a single JSON object with 7 top-level keys.

```json
{
  "applicant":          { ... },
  "company":            { ... },
  "shareCapital":       { ... },
  "persons":            [ ... ],
  "services":           { ... },
  "billing":            { ... },
  "complianceAccepted": { ... }
}
```

---

## Shared sub-types

### Address

Used in `persons[n].residentialAddress` and `billing.address`.

```typescript
{
  street:     string,   // min 1 char — full street line
  city:       string,   // min 1, max 100 chars
  state:      string,   // optional region/state (default empty string "")
  postalCode: string,   // min 1, max 20 chars
  country:    string,   // ISO 3166-1 alpha-2, exactly 2 chars (e.g. "HK", "SG", "PK")
}
```

### FileReference

Used inside `persons[n].documents.*`.

```typescript
{
  key:      string,   // storage key returned by the presign endpoint
  url:      string,   // must be a valid URL (the publicUrl from presign)
  fileName: string,   // original file name
  mimeType: string,   // MIME type
  size:     number,   // integer > 0 (bytes)
}
```

Send `null` for any document that does not apply.

---

## 1. `applicant`

The person filling out the form (does not have to be a shareholder/director).

```typescript
{
  firstName: string,   // min 1, max 100 chars
  lastName:  string,   // min 1, max 100 chars
  email:     string,   // valid email address
  phone:     string,   // min 7, max 20 chars — any format accepted here
}
```

**Example**
```json
{
  "firstName": "John",
  "lastName":  "Doe",
  "email":     "john@example.com",
  "phone":     "+85212345678"
}
```

---

## 2. `company`

Details of the company being incorporated.

```typescript
{
  countryOfIncorporation:   string,   // ISO 2-char country code. Always "HK" for HK formation
  type:                     string,   // enum — see allowed values below
  proposedCompanyName:      string,   // min 1, max 200 chars
  alternativeNames:         string[], // max 3 items, each min 1 max 100 chars (default: [])
  natureOfBusiness:         string[], // enum[] — min 1 item — see allowed values below
  businessScope:            string?,  // optional free-text short scope tag
  businessScopeDescription: string,   // min 50, max 2000 chars — detailed description
}
```

### `type` allowed values

| Value | Meaning |
|-------|---------|
| `private_limited_company` | Standard HK private limited company (only value currently) |

### `natureOfBusiness` allowed values

| Value | Label |
|-------|-------|
| `ecommerce` | E-Commerce |
| `trading` | Trading |
| `consulting` | Consulting |
| `it_saas` | IT / SaaS |
| `services` | Services |
| `other` | Other |

At least one must be selected. Multiple values are allowed.

**Example**
```json
{
  "countryOfIncorporation":   "HK",
  "type":                     "private_limited_company",
  "proposedCompanyName":      "SwiftNine Limited",
  "alternativeNames":         ["SwiftNine Tech", "SwiftNine Holdings"],
  "natureOfBusiness":         ["it_saas", "ecommerce"],
  "businessScope":            "software",
  "businessScopeDescription": "The company will develop and sell cloud-based SaaS products targeting SMEs across the Asia-Pacific region, including workflow automation and payment integrations."
}
```

---

## 3. `shareCapital`

The authorised share capital of the company.

```typescript
{
  currency:    string,  // 3-char currency code, default "HKD"
  totalAmount: number,  // integer > 0 — total capital value (e.g. 10000 means HKD 10,000)
  totalShares: number,  // integer > 0 — total number of shares issued
}
```

> The sum of all shareholder `shares` values in `persons[]` **must equal** `totalShares`.

**Example**
```json
{
  "currency":    "HKD",
  "totalAmount": 10000,
  "totalShares": 10000
}
```

---

## 4. `persons`

An array of all shareholders and/or directors involved in the company.
**Minimum 1 person.**

Each person has a `type` of either `"individual"` or `"corporate"` and different
required fields depending on that type.

### Common fields (all person types)

```typescript
{
  type:  "individual" | "corporate",
  roles: Array<"shareholder" | "director">,  // min 1 role
  // ... type-specific fields ...
  shareholding: ShareholdingObject | null,
  documents:    DocumentsObject,
}
```

- `roles` must contain at least one of `"shareholder"` or `"director"`.
- `shareholding` is required when `roles` includes `"shareholder"`. Send `null` for director-only persons.

---

### `individual` person fields

```typescript
{
  type:               "individual",
  roles:              Array<"shareholder" | "director">,

  // Required for individual
  fullName:           string,   // min 2, max 200 chars
  nationality:        string,   // ISO 2-char country code
  email:              string,   // valid email — must be unique among individuals
  phone:              string,   // min 7, max 20 chars
  residentialAddress: Address,  // see Address type above

  // Not applicable — send null
  companyName:            null,
  countryOfIncorporation: null,
  registrationNumber:     null,

  // Required if shareholder
  shareholding: {
    shares:     number,  // integer > 0
    percentage: number,  // > 0 and ≤ 100 — must match (shares / totalShares) × 100 within ±0.01
  } | null,

  // Documents — passport, selfie, addressProof are all required for individual
  documents: {
    passport:                    FileReference,  // REQUIRED
    selfie:                      FileReference,  // REQUIRED
    addressProof:                FileReference,  // REQUIRED
    certificate_of_incorporation: null,
    business_license:             null,
    others:                       null,
  },
}
```

---

### `corporate` person fields

```typescript
{
  type:  "corporate",
  roles: Array<"shareholder" | "director">,

  // Required for corporate
  companyName:            string,  // min 1, max 300 chars
  countryOfIncorporation: string,  // ISO 2-char country code
  registrationNumber:     string,  // min 1, max 100 chars

  // Not applicable — send null (or omit)
  fullName:           null,
  nationality:        null,
  email:              null,
  phone:              null,
  residentialAddress: null,

  // Required if shareholder
  shareholding: {
    shares:     number,
    percentage: number,
  } | null,

  // Documents — none strictly required, but provide what you have
  documents: {
    passport:                    null,
    selfie:                      null,
    addressProof:                null,
    certificate_of_incorporation: FileReference | null,
    business_license:             FileReference | null,
    others:                       FileReference | null,
  },
}
```

---

## 5. `services`

Service selections for the new company.

```typescript
{
  banking: {
    providers:         string[],       // enum[] — see below (default: [])
    preferredProvider: string | null,  // one of the selected providers (or null if no_bank_account)
  },
  additionalServices: string[],        // enum[] — see below (default: [])
}
```

### `banking.providers` allowed values

| Value | Label |
|-------|-------|
| `airwallex` | Airwallex |
| `paypal` | PayPal |
| `payoneer` | Payoneer |
| `currenxie` | Currenxie |
| `stripe` | Stripe |
| `bank_account_assistance` | Bank Account Assistance |
| `no_bank_account` | No Bank Account Needed |

**Rules:**
- If you select one or more real banking providers (anything except `no_bank_account`),
  you **must** also set `preferredProvider` to one of the selected providers.
- `no_bank_account` **cannot** be combined with other providers.
- If `providers` is empty or only `no_bank_account`, set `preferredProvider: null`.

### `additionalServices` allowed values

| Value | Label |
|-------|-------|
| `annual_secretarial_service` | Annual Secretarial Service |
| `registered_address_renewal` | Registered Address Renewal |
| `accounting_bookkeeping` | Accounting & Bookkeeping |
| `audit_arrangement` | Audit Arrangement |
| `br_renewal_handling` | BR Renewal Handling |
| `virtual_office` | Virtual Office |
| `phone_number_efax` | Phone Number / eFax |
| `nominee_shareholder_service` | Nominee Shareholder Service |
| `nominee_director_service` | Nominee Director Service |
| `compliance_support` | Compliance Support |
| `visa_application_support` | Visa Application Support |
| `paypal_stripe_setup_guidance` | PayPal / Stripe Setup Guidance |

**Example — with banking providers**
```json
{
  "banking": {
    "providers": ["airwallex", "currenxie"],
    "preferredProvider": "currenxie"
  },
  "additionalServices": ["annual_secretarial_service", "registered_address_renewal"]
}
```

**Example — no bank account**
```json
{
  "banking": {
    "providers": ["no_bank_account"],
    "preferredProvider": null
  },
  "additionalServices": []
}
```

---

## 6. `billing`

Invoice and payment details.

```typescript
{
  name:          string,  // min 1, max 200 chars
  email:         string,  // valid email
  phone:         string,  // E.164 format: +[country code][number], e.g. "+85212345678"
  address:       Address, // see Address type above
  paymentMethod: string,  // enum — see below
}
```

> **Important:** `billing.phone` must be in **E.164 format** — starts with `+`, followed
> by country code and number, 2–15 digits total. Example: `+85212345678`, `+923001234567`.
> This is stricter than the `phone` fields on `applicant` and `persons`.

### `paymentMethod` allowed values

| Value | Label |
|-------|-------|
| `bank_transfer` | Bank Transfer |
| `card` | Credit / Debit Card |
| `crypto` | Cryptocurrency |
| `paypal` | PayPal |

**Example**
```json
{
  "name":          "John Doe",
  "email":         "billing@example.com",
  "phone":         "+85212345678",
  "address": {
    "street":     "1 Queens Road Central",
    "city":       "Hong Kong",
    "state":      "",
    "postalCode": "000000",
    "country":    "HK"
  },
  "paymentMethod": "bank_transfer"
}
```

---

## 7. `complianceAccepted`

The user's acceptance of terms and compliance.

```typescript
{
  isAccepted: true,    // MUST be the literal boolean true — false is rejected with 400
  timestamp:  string,  // ISO 8601 datetime string of when user accepted
}
```

**Example**
```json
{
  "isAccepted": true,
  "timestamp": "2026-02-13T10:30:00Z"
}
```
