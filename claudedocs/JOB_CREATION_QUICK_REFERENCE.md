# Job Creation API - Quick Reference

**For**: Frontend Developer
**Date**: 2025-10-18

---

## Endpoint

```
POST /jobs
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

---

## Minimal Valid Payload

```json
{
  "title": "Fix leaking kitchen faucet",
  "description": "Kitchen faucet has been dripping for a week. Need professional plumber to fix or replace.",
  "categoryId": "clxxx-plumbing-category-id",
  "budget": 800,
  "budgetType": "FIXED",
  "urgency": "HIGH",
  "addressLine1": "123 Main Street",
  "city": "Cape Town",
  "province": "Western Cape",
  "postalCode": "8001",
  "latitude": -33.9249,
  "longitude": 18.4241
}
```

---

## Field Validation Summary

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `title` | string | ✅ | 5-100 chars |
| `description` | string | ✅ | 20-2000 chars |
| `categoryId` | string | ✅ | Valid subcategory ID |
| `budget` | number | ✅ | 50-100000, max 2 decimals |
| `budgetType` | enum | ✅ | FIXED \| HOURLY \| NEGOTIABLE |
| `urgency` | enum | ✅ | LOW \| MEDIUM \| HIGH \| URGENT |
| `addressLine1` | string | ✅ | Max 255 chars |
| `addressLine2` | string | ❌ | Max 255 chars |
| `city` | string | ✅ | Max 100 chars |
| `province` | string | ✅ | Valid SA province |
| `postalCode` | string | ✅ | Numeric, max 10 chars |
| `latitude` | number | ✅ | Valid latitude |
| `longitude` | number | ✅ | Valid longitude |
| `images` | string[] | ❌ | Max 5 URLs |
| `requirements` | string[] | ❌ | Max 10 items, 200 chars each |
| `startDate` | string | ❌ | ISO 8601 date |
| `endDate` | string | ❌ | ISO 8601 date |
| `isDraft` | boolean | ❌ | Default: true |

---

## South African Provinces

```typescript
const SA_PROVINCES = [
  'Eastern Cape',
  'Free State',
  'Gauteng',
  'KwaZulu-Natal',
  'Limpopo',
  'Mpumalanga',
  'Northern Cape',
  'North West',
  'Western Cape'
];
```

**Important**: Use exact names with proper capitalization.

---

## Enums

### BudgetType
```typescript
'FIXED'      // Fixed price for entire job
'HOURLY'     // Hourly rate
'NEGOTIABLE' // Open to negotiation
```

### UrgencyLevel
```typescript
'LOW'     // 3+ weeks
'MEDIUM'  // 1-2 weeks
'HIGH'    // 2-5 days
'URGENT'  // 24-48 hours
```

---

## Image Upload Flow

**Step 1**: Upload images first
```http
POST /jobs/upload-images
Content-Type: multipart/form-data

files: [file1, file2, ...]
```

**Step 2**: Use returned URLs in job creation
```json
{
  "images": [
    "/uploads/jobs/job_1234567890.webp",
    "/uploads/jobs/job_1234567891.webp"
  ]
}
```

---

## Common Errors

### Missing Required Fields
```json
{
  "statusCode": 400,
  "message": [
    "categoryId should not be empty",
    "budgetType must be one of the following values: FIXED, HOURLY, NEGOTIABLE"
  ]
}
```

### Invalid Enum
```json
{
  "statusCode": 400,
  "message": [
    "budgetType must be one of the following values: FIXED, HOURLY, NEGOTIABLE"
  ]
}
```

### Budget Out of Range
```json
{
  "statusCode": 400,
  "message": [
    "budget must not be less than 50",
    "budget must not be greater than 100000"
  ]
}
```

---

## Success Response

```json
{
  "id": "clxxx-job-id",
  "status": "DRAFT",
  "title": "Fix leaking kitchen faucet",
  "budget": "800.00",
  "budgetType": "FIXED",
  "urgency": "HIGH",
  "createdAt": "2024-01-10T10:30:00.000Z",
  "updatedAt": "2024-01-10T10:30:00.000Z",
  // ... rest of job data
}
```

---

## Publishing a Draft

```http
PUT /jobs/:id/publish
Authorization: Bearer <jwt-token>
```

Changes status from `DRAFT` to `OPEN` and makes job visible to artisans.

---

## Key Points

1. ✅ **Upload images BEFORE creating job**
2. ✅ **Use subcategory IDs, not parent categories**
3. ✅ **Province names must be exact (case-sensitive)**
4. ✅ **PostalCode is a numeric string, not a number**
5. ✅ **Budget is a number with max 2 decimals**
6. ✅ **Enum values must be UPPERCASE**
7. ✅ **Default isDraft is true (creates draft)**
8. ✅ **All location fields are REQUIRED**
9. ✅ **Title min 5 chars, description min 20 chars**
10. ✅ **Valid coordinates in South Africa range**

---

## Complete Documentation

See `JOB_CREATION_API_REFERENCE.md` for:
- Detailed field specifications
- Category reference
- TypeScript types
- Complete examples
- Error handling
- Integration checklist
