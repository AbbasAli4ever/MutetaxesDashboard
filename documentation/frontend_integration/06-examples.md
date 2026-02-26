# 06 — Full Payload Examples

---

## Example 1 — Single individual shareholder + director

The simplest valid registration: one person who is both shareholder (100%) and director.

```json
{
  "applicant": {
    "firstName": "John",
    "lastName":  "Doe",
    "email":     "john.doe@example.com",
    "phone":     "+85212345678"
  },
  "company": {
    "countryOfIncorporation":   "HK",
    "type":                     "private_limited_company",
    "proposedCompanyName":      "TestCo Limited",
    "alternativeNames":         ["TestCo Tech", "TestCo Holdings"],
    "natureOfBusiness":         ["it_saas"],
    "businessScopeDescription": "The company will develop and sell cloud-based software products for small businesses in the Asia-Pacific region, focusing on workflow automation and payment integrations."
  },
  "shareCapital": {
    "currency":    "HKD",
    "totalAmount": 10000,
    "totalShares": 10000
  },
  "persons": [
    {
      "type":  "individual",
      "roles": ["shareholder", "director"],

      "fullName":           "John Doe",
      "nationality":        "HK",
      "email":              "john.doe@example.com",
      "phone":              "+85212345678",
      "residentialAddress": {
        "street":     "1 Queens Road Central",
        "city":       "Hong Kong",
        "state":      "",
        "postalCode": "000000",
        "country":    "HK"
      },

      "companyName":            null,
      "countryOfIncorporation": null,
      "registrationNumber":     null,

      "shareholding": {
        "shares":     10000,
        "percentage": 100.0
      },

      "documents": {
        "passport": {
          "key":      "uploads/passport/uuid-1/passport_john.pdf",
          "url":      "https://storage.example.com/company-formation/uploads/passport/uuid-1/passport_john.pdf",
          "fileName": "passport_john.pdf",
          "mimeType": "application/pdf",
          "size":     204800
        },
        "selfie": {
          "key":      "uploads/selfie/uuid-2/selfie_john.jpg",
          "url":      "https://storage.example.com/company-formation/uploads/selfie/uuid-2/selfie_john.jpg",
          "fileName": "selfie_john.jpg",
          "mimeType": "image/jpeg",
          "size":     512000
        },
        "addressProof": {
          "key":      "uploads/addressProof/uuid-3/address_john.pdf",
          "url":      "https://storage.example.com/company-formation/uploads/addressProof/uuid-3/address_john.pdf",
          "fileName": "address_john.pdf",
          "mimeType": "application/pdf",
          "size":     153600
        },
        "certificate_of_incorporation": null,
        "business_license":             null,
        "others":                       null
      }
    }
  ],
  "services": {
    "banking": {
      "providers":         ["no_bank_account"],
      "preferredProvider": null
    },
    "additionalServices": []
  },
  "billing": {
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
  },
  "complianceAccepted": {
    "isAccepted": true,
    "timestamp":  "2026-02-13T10:30:00Z"
  }
}
```

---

## Example 2 — Two persons: individual director + corporate shareholder (50/50)

Two shareholders splitting 10,000 shares equally. The individual is the director;
the corporate entity holds 50% shares only.

```json
{
  "applicant": {
    "firstName": "Shoaib",
    "lastName":  "Ahmed",
    "email":     "shoaib@example.com",
    "phone":     "+923001234567"
  },
  "company": {
    "countryOfIncorporation":   "HK",
    "type":                     "private_limited_company",
    "proposedCompanyName":      "SwiftNine Limited",
    "alternativeNames":         ["SwiftNine Tech", "SwiftNine Holdings"],
    "natureOfBusiness":         ["ecommerce", "it_saas"],
    "businessScope":            "software",
    "businessScopeDescription": "The company will develop and sell software-as-a-service products targeting small and medium-sized e-commerce businesses in the Asia-Pacific region, including inventory management tools and payment integrations."
  },
  "shareCapital": {
    "currency":    "HKD",
    "totalAmount": 10000,
    "totalShares": 10000
  },
  "persons": [
    {
      "type":  "individual",
      "roles": ["shareholder", "director"],

      "fullName":           "Abbas Khan",
      "nationality":        "CN",
      "email":              "abbas@example.com",
      "phone":              "+85298765432",
      "residentialAddress": {
        "street":     "12 Nathan Road, Tsim Sha Tsui",
        "city":       "Hong Kong",
        "state":      "",
        "postalCode": "000000",
        "country":    "HK"
      },

      "companyName":            null,
      "countryOfIncorporation": null,
      "registrationNumber":     null,

      "shareholding": {
        "shares":     5000,
        "percentage": 50.0
      },

      "documents": {
        "passport": {
          "key":      "uploads/passport/uuid-a/passport_abbas.pdf",
          "url":      "https://storage.example.com/company-formation/uploads/passport/uuid-a/passport_abbas.pdf",
          "fileName": "passport_abbas.pdf",
          "mimeType": "application/pdf",
          "size":     204800
        },
        "selfie": {
          "key":      "uploads/selfie/uuid-b/selfie_abbas.jpg",
          "url":      "https://storage.example.com/company-formation/uploads/selfie/uuid-b/selfie_abbas.jpg",
          "fileName": "selfie_abbas.jpg",
          "mimeType": "image/jpeg",
          "size":     512000
        },
        "addressProof": {
          "key":      "uploads/addressProof/uuid-c/address_abbas.pdf",
          "url":      "https://storage.example.com/company-formation/uploads/addressProof/uuid-c/address_abbas.pdf",
          "fileName": "address_proof_abbas.pdf",
          "mimeType": "application/pdf",
          "size":     153600
        },
        "certificate_of_incorporation": null,
        "business_license":             null,
        "others":                       null
      }
    },
    {
      "type":  "corporate",
      "roles": ["shareholder"],

      "fullName":           null,
      "nationality":        null,
      "email":              null,
      "phone":              null,
      "residentialAddress": null,

      "companyName":            "Acme Holdings Pte. Ltd.",
      "countryOfIncorporation": "SG",
      "registrationNumber":     "202300001Z",

      "shareholding": {
        "shares":     5000,
        "percentage": 50.0
      },

      "documents": {
        "passport":    null,
        "selfie":      null,
        "addressProof": null,
        "certificate_of_incorporation": {
          "key":      "uploads/certificate_of_incorporation/uuid-d/coi_acme.pdf",
          "url":      "https://storage.example.com/company-formation/uploads/certificate_of_incorporation/uuid-d/coi_acme.pdf",
          "fileName": "acme_certificate_of_incorporation.pdf",
          "mimeType": "application/pdf",
          "size":     307200
        },
        "business_license": {
          "key":      "uploads/business_license/uuid-e/bl_acme.pdf",
          "url":      "https://storage.example.com/company-formation/uploads/business_license/uuid-e/bl_acme.pdf",
          "fileName": "acme_business_license.pdf",
          "mimeType": "application/pdf",
          "size":     102400
        },
        "others": null
      }
    }
  ],
  "services": {
    "banking": {
      "providers":         ["airwallex", "currenxie"],
      "preferredProvider": "currenxie"
    },
    "additionalServices": [
      "annual_secretarial_service",
      "registered_address_renewal"
    ]
  },
  "billing": {
    "name":          "Zaeem ul Hassan",
    "email":         "zaeem@example.com",
    "phone":         "+923211234567",
    "address": {
      "street":     "14-B Model Town",
      "city":       "Lahore",
      "state":      "Punjab",
      "postalCode": "54700",
      "country":    "PK"
    },
    "paymentMethod": "paypal"
  },
  "complianceAccepted": {
    "isAccepted": true,
    "timestamp":  "2026-02-13T10:30:00Z"
  }
}
```

---

## Example 3 — Three-way share split (with percentage precision note)

10,000 shares divided between three individual shareholders.
To avoid floating-point precision errors, use one person with 33.34% and two with 33.33%.

```json
"shareCapital": {
  "currency":    "HKD",
  "totalAmount": 10000,
  "totalShares": 10000
},
"persons": [
  {
    "shareholding": { "shares": 3334, "percentage": 33.34 },
    ...
  },
  {
    "shareholding": { "shares": 3333, "percentage": 33.33 },
    ...
  },
  {
    "shareholding": { "shares": 3333, "percentage": 33.33 },
    ...
  }
]
```

> `33.34 + 33.33 + 33.33 = 100.00` ✅
> `3334 + 3333 + 3333 = 10000` ✅

**Do NOT use:** `33.33 × 3 = 99.99` or `10000/3 = 3333.33...` (non-integer shares).

---

## Example 4 — Director-only person (no shareholding)

A person who is only a director and holds no shares. `shareholding` must be `null`.

```json
{
  "type":  "individual",
  "roles": ["director"],

  "fullName":           "Jane Smith",
  "nationality":        "GB",
  "email":              "jane.smith@example.com",
  "phone":              "+442071234567",
  "residentialAddress": {
    "street":     "10 Downing Street",
    "city":       "London",
    "state":      "England",
    "postalCode": "SW1A 2AA",
    "country":    "GB"
  },

  "companyName":            null,
  "countryOfIncorporation": null,
  "registrationNumber":     null,

  "shareholding": null,

  "documents": {
    "passport":    { "key": "...", "url": "...", "fileName": "passport_jane.pdf", "mimeType": "application/pdf", "size": 204800 },
    "selfie":      { "key": "...", "url": "...", "fileName": "selfie_jane.jpg",   "mimeType": "image/jpeg",      "size": 512000 },
    "addressProof":{ "key": "...", "url": "...", "fileName": "address_jane.pdf",  "mimeType": "application/pdf", "size": 102400 },
    "certificate_of_incorporation": null,
    "business_license": null,
    "others": null
  }
}
```

---

## Example 5 — Nominee director (no person with director role)

If no person has the `"director"` role, you **must** include `"nominee_director_service"`
in `additionalServices`.

```json
"persons": [
  {
    "type":  "individual",
    "roles": ["shareholder"],
    ...
  }
],
"services": {
  "banking": { "providers": ["no_bank_account"], "preferredProvider": null },
  "additionalServices": ["nominee_director_service"]
}
```

---

## Success response

Regardless of how many persons are in the payload, the success response is always:

```json
{
  "id":          "550e8400-e29b-41d4-a716-446655440000",
  "status":      "pending_review",
  "submittedAt": "2026-02-13T10:30:00.000Z"
}
```

Store the `id` — the user will need it for any follow-up queries.
