# Job Creation API Reference - Complete Documentation

**Document Version**: 1.0
**Backend Version**: Taska Platform v1.0.0
**Last Updated**: 2025-10-18
**Target Audience**: Frontend Developer

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication Requirements](#authentication-requirements)
3. [Complete CreateJobDto Specification](#complete-createjobdto-specification)
4. [Field-by-Field Breakdown](#field-by-field-breakdown)
5. [Enum Values](#enum-values)
6. [Valid Example Payloads](#valid-example-payloads)
7. [Category Reference](#category-reference)
8. [South African Province List](#south-african-province-list)
9. [API Endpoint Details](#api-endpoint-details)
10. [Image Upload Flow](#image-upload-flow)
11. [Validation Error Reference](#validation-error-reference)
12. [Draft vs Published Jobs](#draft-vs-published-jobs)
13. [Integration Checklist](#integration-checklist)

---

## Overview

The Job Creation API allows **CLIENT** users to post jobs for artisans to bid on. Jobs can be saved as drafts or published immediately.

**Endpoint**: `POST /jobs`
**Authentication**: Required (JWT Bearer token)
**Required Role**: CLIENT
**Content-Type**: `application/json`

---

## Authentication Requirements

### Required Headers

```typescript
headers: {
  'Authorization': 'Bearer <jwt_token>',
  'Content-Type': 'application/json'
}
```

### User Requirements

- User must be authenticated
- User role must be **CLIENT** (not ARTISAN or ADMIN)
- User account must be verified (`verifiedAt` is not null)

### Error Responses for Auth Issues

```typescript
// 401 Unauthorized - Invalid or missing token
{
  "statusCode": 401,
  "message": "Unauthorized"
}

// 403 Forbidden - User is not a CLIENT
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

---

## Complete CreateJobDto Specification

```typescript
interface CreateJobDto {
  // ============================================
  // REQUIRED FIELDS
  // ============================================

  /**
   * Job title - What needs to be done
   * @minLength 5
   * @maxLength 100
   */
  title: string;

  /**
   * Detailed description of the job
   * @minLength 20
   * @maxLength 2000
   */
  description: string;

  /**
   * Category ID - Must be a valid category from database
   * Use subcategories (e.g., "Plumbing", "Electrical") not parent categories
   */
  categoryId: string;

  /**
   * Budget amount in South African Rand (ZAR)
   * @minimum 50
   * @maximum 100000
   * @maxDecimalPlaces 2
   */
  budget: number;

  /**
   * Type of budget
   * @enum BudgetType
   * @values FIXED | HOURLY | NEGOTIABLE
   */
  budgetType: BudgetType;

  /**
   * Job urgency level
   * @enum UrgencyLevel
   * @values LOW | MEDIUM | HIGH | URGENT
   */
  urgency: UrgencyLevel;

  // ============================================
  // LOCATION FIELDS (ALL REQUIRED)
  // ============================================

  /**
   * Street address line 1
   * @maxLength 255
   */
  addressLine1: string;

  /**
   * City name
   * @maxLength 100
   */
  city: string;

  /**
   * Province - Must be valid South African province
   * @maxLength 100
   * @example "Western Cape" | "Gauteng" | "KwaZulu-Natal"
   */
  province: string;

  /**
   * Postal code - Must be numeric string
   * @maxLength 10
   * @isNumberString true
   * @example "8001" | "2000" | "4001"
   */
  postalCode: string;

  /**
   * Latitude coordinate for location
   * @isLatitude true
   * @example -33.9249
   */
  latitude: number;

  /**
   * Longitude coordinate for location
   * @isLongitude true
   * @example 18.4241
   */
  longitude: number;

  // ============================================
  // OPTIONAL FIELDS
  // ============================================

  /**
   * Street address line 2 (apartment, suite, etc.)
   * @maxLength 255
   * @optional
   */
  addressLine2?: string;

  /**
   * Array of image URLs (must upload images first)
   * @maxItems 5
   * @isUrl true for each item
   * @optional
   */
  images?: string[];

  /**
   * Specific job requirements
   * @maxItems 10
   * @maxLength 200 per item
   * @optional
   */
  requirements?: string[];

  /**
   * Preferred start date (ISO 8601 format)
   * @isDateString true
   * @optional
   */
  startDate?: string;

  /**
   * Preferred end date (ISO 8601 format)
   * @isDateString true
   * @optional
   */
  endDate?: string;

  /**
   * Save as draft (default: true)
   * If true, job will not be published immediately
   * @default true
   * @optional
   */
  isDraft?: boolean;
}
```

---

## Field-by-Field Breakdown

### title (REQUIRED)

**Type**: `string`
**Validation Rules**:
- `@IsString()` - Must be a string
- `@IsNotEmpty()` - Cannot be empty or whitespace
- `@MinLength(5)` - Minimum 5 characters
- `@MaxLength(100)` - Maximum 100 characters

**Valid Examples**:
```typescript
✅ "Fix leaking kitchen faucet"
✅ "Install new ceiling fan in bedroom"
✅ "Build custom kitchen cabinets"
✅ "Electrical wiring for home office"
```

**Invalid Examples**:
```typescript
❌ "Fix" // Too short (< 5 characters)
❌ "" // Empty string
❌ "   " // Only whitespace
❌ "A".repeat(101) // Too long (> 100 characters)
```

---

### description (REQUIRED)

**Type**: `string`
**Validation Rules**:
- `@IsString()` - Must be a string
- `@IsNotEmpty()` - Cannot be empty
- `@MinLength(20)` - Minimum 20 characters
- `@MaxLength(2000)` - Maximum 2000 characters

**Valid Example**:
```typescript
✅ "Kitchen faucet has been dripping for a week. Need professional plumber to fix or replace. The leak is coming from the base of the faucet and is causing water damage to the cabinet below. Prefer someone who can come on weekend."
```

**Invalid Examples**:
```typescript
❌ "Need plumber" // Too short (< 20 characters)
❌ "" // Empty
❌ "A".repeat(2001) // Too long
```

---

### categoryId (REQUIRED)

**Type**: `string`
**Validation Rules**:
- `@IsString()` - Must be a string
- `@IsNotEmpty()` - Cannot be empty
- Must be a valid category ID from database

**Important**: Use **subcategory IDs**, not parent category IDs.

**Valid Examples**:
```typescript
✅ "ckxxx-plumbing-id" // Plumbing subcategory
✅ "ckxxx-electrical-id" // Electrical subcategory
✅ "ckxxx-carpentry-id" // Carpentry subcategory
```

**Invalid Examples**:
```typescript
❌ "ckxxx-home-improvement-id" // Parent category, not subcategory
❌ "invalid-id" // Non-existent category
❌ "" // Empty string
```

**See**: [Category Reference](#category-reference) for complete list

---

### budget (REQUIRED)

**Type**: `number`
**Validation Rules**:
- `@Type(() => Number)` - Auto-converts strings to numbers
- `@IsNumber({ maxDecimalPlaces: 2 })` - Maximum 2 decimal places
- `@Min(50)` - Minimum R50
- `@Max(100000)` - Maximum R100,000

**Valid Examples**:
```typescript
✅ 500 // R500.00
✅ 1500.50 // R1,500.50
✅ 50 // Minimum allowed
✅ 100000 // Maximum allowed
```

**Invalid Examples**:
```typescript
❌ 49 // Below minimum
❌ 100001 // Above maximum
❌ 500.123 // More than 2 decimal places
❌ "500" // String (will be auto-converted if properly formatted)
❌ -500 // Negative number
```

---

### budgetType (REQUIRED)

**Type**: `BudgetType` enum
**Validation Rules**:
- `@IsEnum(BudgetType)` - Must be one of the enum values

**Allowed Values**:
```typescript
enum BudgetType {
  FIXED = 'FIXED',        // Fixed price for entire job
  HOURLY = 'HOURLY',      // Hourly rate
  NEGOTIABLE = 'NEGOTIABLE' // Open to negotiation
}
```

**Usage Examples**:
```typescript
✅ "FIXED" // Most common for one-time jobs
✅ "HOURLY" // For ongoing work or time-based jobs
✅ "NEGOTIABLE" // For complex jobs where budget is flexible
```

**Invalid Examples**:
```typescript
❌ "fixed" // Lowercase not allowed
❌ "Fixed" // Wrong case
❌ "DAILY" // Not a valid option
❌ "" // Empty
```

---

### urgency (REQUIRED)

**Type**: `UrgencyLevel` enum
**Validation Rules**:
- `@IsEnum(UrgencyLevel)` - Must be one of the enum values

**Allowed Values**:
```typescript
enum UrgencyLevel {
  LOW = 'LOW',        // Can wait several weeks
  MEDIUM = 'MEDIUM',  // Within 1-2 weeks
  HIGH = 'HIGH',      // Within a few days
  URGENT = 'URGENT'   // Needs immediate attention
}
```

**Usage Guidance**:
```typescript
LOW:    "Can be done anytime in the next month"
MEDIUM: "Would like done within 1-2 weeks"
HIGH:   "Need done within 2-3 days"
URGENT: "Emergency - need done today/tomorrow"
```

---

### addressLine1 (REQUIRED)

**Type**: `string`
**Validation Rules**:
- `@IsString()` - Must be a string
- `@IsNotEmpty()` - Cannot be empty
- `@MaxLength(255)` - Maximum 255 characters

**Valid Examples**:
```typescript
✅ "123 Main Street"
✅ "456 Oak Avenue"
✅ "Unit 5, 789 Pine Road"
```

**Invalid Examples**:
```typescript
❌ "" // Empty
❌ "   " // Only whitespace
❌ "A".repeat(256) // Too long
```

---

### addressLine2 (OPTIONAL)

**Type**: `string | undefined`
**Validation Rules**:
- `@IsString()` - Must be a string if provided
- `@IsOptional()` - Can be omitted
- `@MaxLength(255)` - Maximum 255 characters if provided

**Valid Examples**:
```typescript
✅ "Apartment 4B"
✅ "Suite 200"
✅ "Building C"
✅ undefined // Can be omitted
```

---

### city (REQUIRED)

**Type**: `string`
**Validation Rules**:
- `@IsString()` - Must be a string
- `@IsNotEmpty()` - Cannot be empty
- `@MaxLength(100)` - Maximum 100 characters

**Valid Examples**:
```typescript
✅ "Cape Town"
✅ "Johannesburg"
✅ "Durban"
✅ "Pretoria"
✅ "Port Elizabeth"
```

---

### province (REQUIRED)

**Type**: `string`
**Validation Rules**:
- `@IsString()` - Must be a string
- `@IsNotEmpty()` - Cannot be empty
- `@MaxLength(100)` - Maximum 100 characters

**Must be a valid South African province**. See [Province List](#south-african-province-list)

**Valid Examples**:
```typescript
✅ "Western Cape"
✅ "Gauteng"
✅ "KwaZulu-Natal"
```

**Invalid Examples**:
```typescript
❌ "western cape" // Wrong case
❌ "WC" // Abbreviation not accepted
❌ "California" // Not a South African province
```

---

### postalCode (REQUIRED)

**Type**: `string` (must contain only numbers)
**Validation Rules**:
- `@IsNumberString()` - Must be a numeric string
- `@IsNotEmpty()` - Cannot be empty
- `@MaxLength(10)` - Maximum 10 characters

**Valid Examples**:
```typescript
✅ "8001" // Cape Town Central
✅ "2000" // Johannesburg
✅ "4001" // Durban
✅ "0001" // Leading zeros allowed
```

**Invalid Examples**:
```typescript
❌ "8001A" // Contains letters
❌ "800 1" // Contains space
❌ "" // Empty
❌ 8001 // Number instead of string
```

---

### latitude (REQUIRED)

**Type**: `number`
**Validation Rules**:
- `@IsLatitude()` - Must be valid latitude (-90 to 90)

**South African Latitude Range**: Approximately -22° to -35°

**Valid Examples**:
```typescript
✅ -33.9249 // Cape Town
✅ -26.2041 // Johannesburg
✅ -29.8587 // Durban
✅ -25.7479 // Pretoria
```

**Invalid Examples**:
```typescript
❌ 91 // Out of range
❌ -91 // Out of range
❌ "33.9249" // String instead of number
```

---

### longitude (REQUIRED)

**Type**: `number`
**Validation Rules**:
- `@IsLongitude()` - Must be valid longitude (-180 to 180)

**South African Longitude Range**: Approximately 16° to 33°

**Valid Examples**:
```typescript
✅ 18.4241 // Cape Town
✅ 28.0473 // Johannesburg
✅ 31.0218 // Durban
✅ 28.2293 // Pretoria
```

**Invalid Examples**:
```typescript
❌ 181 // Out of range
❌ -181 // Out of range
❌ "18.4241" // String instead of number
```

---

### images (OPTIONAL)

**Type**: `string[]` (array of URLs)
**Validation Rules**:
- `@IsArray()` - Must be an array
- `@IsOptional()` - Can be omitted
- `@ArrayMaxSize(5)` - Maximum 5 images
- `@IsUrl({}, { each: true })` - Each item must be a valid URL

**Important**: Images must be uploaded FIRST using the image upload endpoint, then include the returned URLs

**Valid Examples**:
```typescript
✅ [] // Empty array
✅ ["https://example.com/image1.jpg"]
✅ [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg",
    "https://example.com/image3.jpg"
  ]
✅ undefined // Can be omitted entirely
```

**Invalid Examples**:
```typescript
❌ ["image1.jpg"] // Not a full URL
❌ ["not-a-url"] // Invalid URL
❌ ["url1", "url2", "url3", "url4", "url5", "url6"] // More than 5 items
❌ [""] // Empty string in array
```

**See**: [Image Upload Flow](#image-upload-flow)

---

### requirements (OPTIONAL)

**Type**: `string[]`
**Validation Rules**:
- `@IsArray()` - Must be an array
- `@IsOptional()` - Can be omitted
- `@ArrayMaxSize(10)` - Maximum 10 requirements
- `@IsString({ each: true })` - Each item must be a string
- `@MaxLength(200, { each: true })` - Each item max 200 characters

**Valid Examples**:
```typescript
✅ [] // Empty array
✅ ["Must have plumbing license"]
✅ [
    "Must have plumbing license",
    "Provide own tools",
    "Available weekends",
    "5-year warranty required"
  ]
✅ undefined // Can be omitted
```

**Invalid Examples**:
```typescript
❌ ["A".repeat(201)] // Item too long (> 200 chars)
❌ ["req1", "req2", ..., "req11"] // More than 10 items
❌ [123] // Non-string item
❌ [""] // Empty string item
```

---

### startDate (OPTIONAL)

**Type**: `string` (ISO 8601 date string)
**Validation Rules**:
- `@IsDateString()` - Must be valid ISO 8601 date
- `@IsOptional()` - Can be omitted

**Valid Examples**:
```typescript
✅ "2024-01-15T09:00:00Z" // Full ISO 8601
✅ "2024-01-15T09:00:00.000Z" // With milliseconds
✅ "2024-01-15" // Date only
✅ undefined // Can be omitted
```

**Invalid Examples**:
```typescript
❌ "15/01/2024" // Wrong format
❌ "Jan 15, 2024" // Not ISO format
❌ "2024-01-15 09:00:00" // Missing T separator
```

---

### endDate (OPTIONAL)

**Type**: `string` (ISO 8601 date string)
**Validation Rules**:
- `@IsDateString()` - Must be valid ISO 8601 date
- `@IsOptional()` - Can be omitted

**Same validation as startDate**

**Business Logic**: If both startDate and endDate are provided, endDate should be after startDate (not enforced by DTO, but logical)

---

### isDraft (OPTIONAL)

**Type**: `boolean`
**Default**: `true`
**Validation Rules**:
- `@IsBoolean()` - Must be boolean
- `@IsOptional()` - Can be omitted

**Behavior**:
- `true` (default): Job saved as DRAFT, not visible to artisans
- `false`: Job published immediately as OPEN, visible to artisans

**Valid Examples**:
```typescript
✅ true // Save as draft
✅ false // Publish immediately
✅ undefined // Defaults to true
```

**Invalid Examples**:
```typescript
❌ "true" // String instead of boolean
❌ 1 // Number instead of boolean
❌ "yes" // Not a boolean
```

**See**: [Draft vs Published Jobs](#draft-vs-published-jobs)

---

## Enum Values

### BudgetType

```typescript
enum BudgetType {
  FIXED = 'FIXED',
  HOURLY = 'HOURLY',
  NEGOTIABLE = 'NEGOTIABLE'
}
```

**Use Cases**:
- **FIXED**: One-time jobs with fixed price (e.g., "Fix sink - R500")
- **HOURLY**: Time-based work (e.g., "Gardening - R150/hour")
- **NEGOTIABLE**: Complex jobs where price is flexible (e.g., "Kitchen renovation - negotiable")

---

### UrgencyLevel

```typescript
enum UrgencyLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}
```

**Urgency Guidelines**:
- **LOW**: 3+ weeks timeline
- **MEDIUM**: 1-2 weeks timeline
- **HIGH**: 2-5 days timeline
- **URGENT**: 24-48 hours timeline

---

## Valid Example Payloads

### Example 1: Minimal Required Fields (Draft)

```json
{
  "title": "Fix leaking kitchen faucet",
  "description": "Kitchen faucet has been dripping for a week. Need professional plumber to fix or replace. The leak is coming from the base.",
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

**Result**: Job saved as DRAFT (isDraft defaults to true)

---

### Example 2: Complete Job with All Fields (Published)

```json
{
  "title": "Install new ceiling fan in bedroom",
  "description": "Need to install a new ceiling fan in the master bedroom. Electrical point already exists. Fan will be provided. Need COC certificate after completion. Prefer work done on weekend.",
  "categoryId": "clxxx-electrical-category-id",
  "budget": 500,
  "budgetType": "FIXED",
  "urgency": "MEDIUM",
  "addressLine1": "456 Oak Avenue",
  "addressLine2": "Apartment 4B",
  "city": "Johannesburg",
  "province": "Gauteng",
  "postalCode": "2001",
  "latitude": -26.2041,
  "longitude": 28.0473,
  "images": [
    "https://taska.co.za/uploads/jobs/job_1234567890.webp",
    "https://taska.co.za/uploads/jobs/job_1234567891.webp"
  ],
  "requirements": [
    "COC required",
    "Bring own tools",
    "Available weekends"
  ],
  "startDate": "2024-01-20T09:00:00Z",
  "endDate": "2024-01-20T17:00:00Z",
  "isDraft": false
}
```

**Result**: Job published immediately as OPEN

---

### Example 3: Carpentry Job with Negotiable Budget

```json
{
  "title": "Build custom kitchen cabinets",
  "description": "Need custom kitchen cabinets built for a small kitchen renovation. Measurements and design ready. Looking for quality craftsmanship with solid wood materials. Must provide portfolio of previous work.",
  "categoryId": "clxxx-carpentry-category-id",
  "budget": 15000,
  "budgetType": "NEGOTIABLE",
  "urgency": "LOW",
  "addressLine1": "789 Pine Road",
  "city": "Durban",
  "province": "KwaZulu-Natal",
  "postalCode": "4001",
  "latitude": -29.8587,
  "longitude": 31.0218,
  "requirements": [
    "Portfolio of previous work required",
    "3-year warranty minimum",
    "Use quality materials",
    "Provide detailed quote"
  ],
  "startDate": "2024-02-01T08:00:00Z",
  "isDraft": false
}
```

---

### Example 4: Urgent Job

```json
{
  "title": "Emergency electrical repair - power outage",
  "description": "Half of the house has no power. Need urgent electrician to diagnose and fix the problem. Suspect issue with distribution board or main circuit breaker.",
  "categoryId": "clxxx-electrical-category-id",
  "budget": 1500,
  "budgetType": "NEGOTIABLE",
  "urgency": "URGENT",
  "addressLine1": "321 Emergency Lane",
  "city": "Pretoria",
  "province": "Gauteng",
  "postalCode": "0001",
  "latitude": -25.7479,
  "longitude": 28.2293,
  "requirements": [
    "Available immediately",
    "After-hours call-out accepted"
  ],
  "isDraft": false
}
```

---

## Category Reference

### Available Categories (Seed Data)

Based on the seed data, here are the available categories:

#### Home Improvement (Parent)
- **Plumbing** - `categoryId: [get-from-db]`
  - Description: "Plumbing repairs and installations"
  - Use for: Leaks, installations, drain cleaning, etc.

- **Electrical** - `categoryId: [get-from-db]`
  - Description: "Electrical work and installations"
  - Use for: Wiring, installations, repairs, COC certificates

- **Carpentry** - `categoryId: [get-from-db]`
  - Description: "Wood work and carpentry services"
  - Use for: Furniture, cabinets, decking, wood repairs

- **Painting** - `categoryId: [get-from-db]`
  - Description: "Interior and exterior painting"
  - Use for: House painting, wall painting, roof painting

- **Tiling** - `categoryId: [get-from-db]`
  - Description: "Floor and wall tiling services"
  - Use for: Bathroom tiling, kitchen backsplash, floor tiling

#### Garden & Landscaping (Parent)
- **Garden Maintenance** - `categoryId: [get-from-db]`
  - Description: "Regular garden upkeep and maintenance"

- **Landscaping** - `categoryId: [get-from-db]`
  - Description: "Garden design and landscaping"

- **Tree Services** - `categoryId: [get-from-db]`
  - Description: "Tree felling and maintenance"

#### Technology (Parent)
- **Computer Repair** - `categoryId: [get-from-db]`
  - Description: "Computer and laptop repairs"

- **Web Development** - `categoryId: [get-from-db]`
  - Description: "Website development and design"

- **Mobile App Development** - `categoryId: [get-from-db]`
  - Description: "Mobile application development"

#### Automotive (Parent)
- **Car Repair** - `categoryId: [get-from-db]`
  - Description: "Vehicle maintenance and repairs"

- **Car Wash** - `categoryId: [get-from-db]`
  - Description: "Vehicle cleaning services"

#### Cleaning (Parent)
- **House Cleaning** - `categoryId: [get-from-db]`
  - Description: "Residential cleaning services"

- **Office Cleaning** - `categoryId: [get-from-db]`
  - Description: "Commercial cleaning services"

- **Carpet Cleaning** - `categoryId: [get-from-db]`
  - Description: "Professional carpet cleaning"

### How to Get Category IDs

**Endpoint**: `GET /categories`

```typescript
// Request
GET /categories HTTP/1.1

// Response
[
  {
    "id": "clxxx-home-improvement-id",
    "name": "Home Improvement",
    "description": "General home improvement and renovation services",
    "isActive": true,
    "parentId": null,
    "sortOrder": 1,
    "children": [
      {
        "id": "clxxx-plumbing-id",
        "name": "Plumbing",
        "description": "Plumbing repairs and installations",
        "isActive": true,
        "parentId": "clxxx-home-improvement-id",
        "sortOrder": 1
      },
      // ... more subcategories
    ]
  },
  // ... more parent categories
]
```

**Frontend Implementation**:
```typescript
// 1. Fetch categories on app load
const categories = await fetch('/categories').then(r => r.json());

// 2. Store in state/context
const [categories, setCategories] = useState([]);

// 3. Filter for subcategories only
const subcategories = categories
  .flatMap(cat => cat.children)
  .filter(cat => cat.isActive);

// 4. Render in dropdown
<select name="categoryId">
  {subcategories.map(cat => (
    <option key={cat.id} value={cat.id}>
      {cat.name}
    </option>
  ))}
</select>
```

---

## South African Province List

**All 9 Official Provinces**:

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
] as const;
```

### Province Details

| Province | Major Cities | Approximate Coordinates |
|----------|--------------|------------------------|
| **Eastern Cape** | Port Elizabeth, East London | -33.0°, 26.5° |
| **Free State** | Bloemfontein, Welkom | -29.0°, 26.5° |
| **Gauteng** | Johannesburg, Pretoria | -26.2°, 28.0° |
| **KwaZulu-Natal** | Durban, Pietermaritzburg | -29.5°, 30.5° |
| **Limpopo** | Polokwane, Tzaneen | -24.0°, 29.5° |
| **Mpumalanga** | Nelspruit, Witbank | -25.5°, 30.0° |
| **Northern Cape** | Kimberley, Upington | -29.0°, 23.0° |
| **North West** | Rustenburg, Mahikeng | -26.0°, 25.5° |
| **Western Cape** | Cape Town, Stellenbosch | -33.5°, 19.0° |

### Frontend Dropdown Implementation

```typescript
// provinces.ts
export const SA_PROVINCES = [
  'Eastern Cape',
  'Free State',
  'Gauteng',
  'KwaZulu-Natal',
  'Limpopo',
  'Mpumalanga',
  'Northern Cape',
  'North West',
  'Western Cape'
] as const;

export type SAProvince = typeof SA_PROVINCES[number];

// JobForm.tsx
import { SA_PROVINCES } from './provinces';

<select name="province" required>
  <option value="">Select Province</option>
  {SA_PROVINCES.map(province => (
    <option key={province} value={province}>
      {province}
    </option>
  ))}
</select>
```

---

## API Endpoint Details

### Create Job

**Endpoint**: `POST /jobs`

**Request**:
```http
POST /jobs HTTP/1.1
Host: api.taska.co.za
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "title": "Fix leaking kitchen faucet",
  "description": "Kitchen faucet has been dripping...",
  "categoryId": "clxxx-plumbing-id",
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

**Success Response** (201 Created):
```json
{
  "id": "clxxx-job-id",
  "clientId": "clxxx-client-id",
  "categoryId": "clxxx-plumbing-id",
  "title": "Fix leaking kitchen faucet",
  "description": "Kitchen faucet has been dripping...",
  "budget": "800.00",
  "budgetType": "FIXED",
  "urgency": "HIGH",
  "status": "DRAFT",
  "addressLine1": "123 Main Street",
  "addressLine2": null,
  "city": "Cape Town",
  "province": "Western Cape",
  "postalCode": "8001",
  "latitude": -33.9249,
  "longitude": 18.4241,
  "images": [],
  "requirements": [],
  "startDate": null,
  "endDate": null,
  "completedAt": null,
  "cancelledAt": null,
  "cancellationReason": null,
  "createdAt": "2024-01-10T10:30:00.000Z",
  "updatedAt": "2024-01-10T10:30:00.000Z",
  "category": {
    "id": "clxxx-plumbing-id",
    "name": "Plumbing",
    "description": "Plumbing repairs and installations"
  }
}
```

**Error Response** (400 Bad Request):
```json
{
  "statusCode": 400,
  "message": [
    "categoryId should not be empty",
    "categoryId must be a string",
    "budgetType must be one of the following values: FIXED, HOURLY, NEGOTIABLE"
  ],
  "error": "Bad Request"
}
```

---

### Publish Draft Job

Once a job is created as draft, it can be published:

**Endpoint**: `PUT /jobs/:id/publish`

**Request**:
```http
PUT /jobs/clxxx-job-id/publish HTTP/1.1
Host: api.taska.co.za
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response** (200 OK):
```json
{
  "id": "clxxx-job-id",
  "status": "OPEN",
  "updatedAt": "2024-01-10T10:35:00.000Z",
  // ... rest of job data
}
```

---

## Image Upload Flow

Images must be uploaded BEFORE creating the job, then include the returned URLs in the `images` array.

### Upload Single Image

**Endpoint**: `POST /jobs/upload-image`

**Request** (multipart/form-data):
```http
POST /jobs/upload-image HTTP/1.1
Host: api.taska.co.za
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary

------WebKitFormBoundary
Content-Disposition: form-data; name="file"; filename="kitchen-leak.jpg"
Content-Type: image/jpeg

[binary image data]
------WebKitFormBoundary--
```

**Success Response** (201 Created):
```json
{
  "url": "/uploads/jobs/job_1234567890.webp",
  "size": 245678,
  "format": "webp"
}
```

**Error Response** (400 Bad Request):
```json
{
  "statusCode": 400,
  "message": "File too large. Maximum size is 5MB",
  "error": "Bad Request"
}
```

### Upload Multiple Images (Max 5)

**Endpoint**: `POST /jobs/upload-images`

**Request** (multipart/form-data):
```http
POST /jobs/upload-images HTTP/1.1
Host: api.taska.co.za
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary

------WebKitFormBoundary
Content-Disposition: form-data; name="files"; filename="image1.jpg"
Content-Type: image/jpeg

[binary image data]
------WebKitFormBoundary
Content-Disposition: form-data; name="files"; filename="image2.jpg"
Content-Type: image/jpeg

[binary image data]
------WebKitFormBoundary--
```

**Success Response** (201 Created):
```json
[
  {
    "url": "/uploads/jobs/job_1234567890.webp",
    "size": 245678,
    "format": "webp"
  },
  {
    "url": "/uploads/jobs/job_1234567891.webp",
    "size": 198234,
    "format": "webp"
  }
]
```

### Frontend Implementation Example

```typescript
// ImageUpload.tsx
const uploadImages = async (files: File[]) => {
  const formData = new FormData();

  // For multiple files
  files.forEach(file => {
    formData.append('files', file);
  });

  const response = await fetch('/jobs/upload-images', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      // Don't set Content-Type - browser will set it with boundary
    },
    body: formData
  });

  if (!response.ok) {
    throw new Error('Upload failed');
  }

  const uploadedImages = await response.json();
  return uploadedImages.map(img => img.url);
};

// Then use in job creation
const handleSubmit = async (formData) => {
  // 1. Upload images first
  const imageUrls = await uploadImages(selectedFiles);

  // 2. Create job with image URLs
  const jobData = {
    ...formData,
    images: imageUrls
  };

  const response = await fetch('/jobs', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(jobData)
  });
};
```

---

## Validation Error Reference

### Common Validation Errors

```typescript
// Missing Required Fields
{
  "statusCode": 400,
  "message": [
    "title should not be empty",
    "description should not be empty",
    "categoryId should not be empty",
    "budget should not be empty",
    "budgetType should not be empty"
  ],
  "error": "Bad Request"
}

// Invalid Enum Values
{
  "statusCode": 400,
  "message": [
    "budgetType must be one of the following values: FIXED, HOURLY, NEGOTIABLE",
    "urgency must be one of the following values: LOW, MEDIUM, HIGH, URGENT"
  ],
  "error": "Bad Request"
}

// String Length Violations
{
  "statusCode": 400,
  "message": [
    "title must be longer than or equal to 5 characters",
    "description must be longer than or equal to 20 characters",
    "title must be shorter than or equal to 100 characters"
  ],
  "error": "Bad Request"
}

// Number Range Violations
{
  "statusCode": 400,
  "message": [
    "budget must not be less than 50",
    "budget must not be greater than 100000"
  ],
  "error": "Bad Request"
}

// Invalid Coordinates
{
  "statusCode": 400,
  "message": [
    "latitude must be a latitude string or number",
    "longitude must be a longitude string or number"
  ],
  "error": "Bad Request"
}

// Array Violations
{
  "statusCode": 400,
  "message": [
    "images must contain no more than 5 elements",
    "requirements must contain no more than 10 elements",
    "each value in images must be a URL address"
  ],
  "error": "Bad Request"
}

// Location Field Issues
{
  "statusCode": 400,
  "message": [
    "addressLine1 should not be empty",
    "city should not be empty",
    "province should not be empty",
    "postalCode must be a number string",
    "postalCode should not be empty"
  ],
  "error": "Bad Request"
}
```

### Error Handling Strategy

```typescript
// Frontend error handler
const handleJobCreationError = (error: any) => {
  if (error.statusCode === 400 && error.message) {
    // Validation errors - show to user
    const errors = Array.isArray(error.message)
      ? error.message
      : [error.message];

    // Map to form fields
    const fieldErrors = {};
    errors.forEach(err => {
      if (err.includes('title')) {
        fieldErrors.title = err;
      } else if (err.includes('description')) {
        fieldErrors.description = err;
      }
      // ... map other fields
    });

    return fieldErrors;
  } else if (error.statusCode === 401) {
    // Unauthorized - redirect to login
    redirectToLogin();
  } else if (error.statusCode === 403) {
    // Not a client - show error
    showError('Only clients can create jobs');
  }
};
```

---

## Draft vs Published Jobs

### Job Status Flow

```
DRAFT → OPEN → IN_PROGRESS → COMPLETED
             ↘ CANCELLED
             ↘ DISPUTED
```

### Draft Jobs

**Characteristics**:
- Status: `DRAFT`
- Not visible to artisans
- Can be edited freely
- Can be deleted without restrictions
- Owner can publish when ready

**Use Cases**:
- Save incomplete job for later
- Review job details before publishing
- Wait for images to upload
- Get approval before posting

**Publishing**:
```http
PUT /jobs/:id/publish HTTP/1.1
```

### Published Jobs (Open)

**Characteristics**:
- Status: `OPEN`
- Visible to all artisans
- Can receive bids
- Limited editing (can't change budget/category)
- Shows in search results

**Restrictions**:
- Cannot change budget after bids received
- Cannot change category
- Cannot delete if has bids

---

## Integration Checklist

### Frontend Setup

- [ ] **Authentication**
  - [ ] Store JWT token securely
  - [ ] Include token in all requests
  - [ ] Handle 401/403 errors
  - [ ] Verify user is CLIENT role

- [ ] **Categories**
  - [ ] Fetch categories on app load
  - [ ] Filter for subcategories only
  - [ ] Cache categories locally
  - [ ] Render category dropdown

- [ ] **Province Selection**
  - [ ] Add province dropdown
  - [ ] Use exact province names
  - [ ] Validate province selection

- [ ] **Location/Geocoding**
  - [ ] Implement address search
  - [ ] Get coordinates from address
  - [ ] Validate coordinates in SA range
  - [ ] Show map preview

- [ ] **Budget**
  - [ ] Enforce min (R50) and max (R100,000)
  - [ ] Format as currency display
  - [ ] Send as number, not string
  - [ ] Add budget type selection

- [ ] **Images**
  - [ ] Implement image upload component
  - [ ] Upload before job creation
  - [ ] Show upload progress
  - [ ] Limit to 5 images
  - [ ] Validate file size/type
  - [ ] Store returned URLs

- [ ] **Requirements**
  - [ ] Dynamic requirement list
  - [ ] Max 10 requirements
  - [ ] Max 200 chars each
  - [ ] Add/remove functionality

- [ ] **Date Selection**
  - [ ] Date/time picker for start date
  - [ ] Optional end date
  - [ ] Convert to ISO 8601 format
  - [ ] Validate endDate > startDate

- [ ] **Draft/Publish**
  - [ ] Toggle for save as draft
  - [ ] Clear explanation to user
  - [ ] Publish draft functionality
  - [ ] Show draft status in UI

### Validation

- [ ] **Frontend Validation**
  - [ ] Title: 5-100 chars
  - [ ] Description: 20-2000 chars
  - [ ] Budget: 50-100000
  - [ ] PostalCode: numeric only
  - [ ] All required fields present
  - [ ] Real-time validation feedback

- [ ] **Backend Integration**
  - [ ] Handle 400 validation errors
  - [ ] Map errors to form fields
  - [ ] Show user-friendly messages
  - [ ] Clear errors on correction

### Testing Checklist

- [ ] **Happy Path**
  - [ ] Create minimal job (draft)
  - [ ] Create complete job (published)
  - [ ] Upload images
  - [ ] Publish draft job

- [ ] **Error Cases**
  - [ ] Missing required fields
  - [ ] Invalid enum values
  - [ ] Budget out of range
  - [ ] Invalid coordinates
  - [ ] Too many images/requirements
  - [ ] Invalid category ID
  - [ ] Unauthorized access

- [ ] **Edge Cases**
  - [ ] Very long descriptions
  - [ ] Special characters in text
  - [ ] Multiple concurrent uploads
  - [ ] Network failures
  - [ ] Session expiry during creation

### TypeScript Types

```typescript
// types/job.ts

export enum BudgetType {
  FIXED = 'FIXED',
  HOURLY = 'HOURLY',
  NEGOTIABLE = 'NEGOTIABLE'
}

export enum UrgencyLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum JobStatus {
  DRAFT = 'DRAFT',
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  DISPUTED = 'DISPUTED'
}

export interface CreateJobDto {
  // Required
  title: string;
  description: string;
  categoryId: string;
  budget: number;
  budgetType: BudgetType;
  urgency: UrgencyLevel;
  addressLine1: string;
  city: string;
  province: string;
  postalCode: string;
  latitude: number;
  longitude: number;

  // Optional
  addressLine2?: string;
  images?: string[];
  requirements?: string[];
  startDate?: string;
  endDate?: string;
  isDraft?: boolean;
}

export interface Job extends CreateJobDto {
  id: string;
  clientId: string;
  status: JobStatus;
  completedAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  iconUrl: string | null;
  isActive: boolean;
  parentId: string | null;
  sortOrder: number;
  children?: Category[];
}

export interface ImageUploadResponse {
  url: string;
  size: number;
  format: string;
}
```

---

## Complete Form Example

```tsx
// JobCreateForm.tsx
import React, { useState, useEffect } from 'react';
import { CreateJobDto, BudgetType, UrgencyLevel, Category } from './types';

const JobCreateForm = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [formData, setFormData] = useState<CreateJobDto>({
    title: '',
    description: '',
    categoryId: '',
    budget: 50,
    budgetType: BudgetType.FIXED,
    urgency: UrgencyLevel.MEDIUM,
    addressLine1: '',
    city: '',
    province: '',
    postalCode: '',
    latitude: 0,
    longitude: 0,
    requirements: [],
    isDraft: true
  });

  useEffect(() => {
    // Fetch categories
    fetch('/api/categories')
      .then(r => r.json())
      .then(data => setCategories(data));
  }, []);

  const handleImageUpload = async (files: FileList) => {
    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });

    const response = await fetch('/api/jobs/upload-images', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getToken()}`
      },
      body: formData
    });

    const uploaded = await response.json();
    setImageUrls(uploaded.map(img => img.url));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const jobData = {
      ...formData,
      images: imageUrls
    };

    const response = await fetch('/api/jobs', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(jobData)
    });

    if (response.ok) {
      const job = await response.json();
      console.log('Job created:', job);
      // Redirect or show success
    } else {
      const error = await response.json();
      console.error('Validation errors:', error.message);
      // Show errors to user
    }
  };

  const subcategories = categories
    .flatMap(cat => cat.children || [])
    .filter(cat => cat.isActive);

  return (
    <form onSubmit={handleSubmit}>
      {/* Title */}
      <input
        type="text"
        name="title"
        placeholder="Job title (5-100 characters)"
        minLength={5}
        maxLength={100}
        required
        value={formData.title}
        onChange={e => setFormData({...formData, title: e.target.value})}
      />

      {/* Description */}
      <textarea
        name="description"
        placeholder="Job description (20-2000 characters)"
        minLength={20}
        maxLength={2000}
        required
        value={formData.description}
        onChange={e => setFormData({...formData, description: e.target.value})}
      />

      {/* Category */}
      <select
        name="categoryId"
        required
        value={formData.categoryId}
        onChange={e => setFormData({...formData, categoryId: e.target.value})}
      >
        <option value="">Select Category</option>
        {subcategories.map(cat => (
          <option key={cat.id} value={cat.id}>{cat.name}</option>
        ))}
      </select>

      {/* Budget */}
      <input
        type="number"
        name="budget"
        min={50}
        max={100000}
        step={0.01}
        required
        value={formData.budget}
        onChange={e => setFormData({...formData, budget: parseFloat(e.target.value)})}
      />

      {/* Budget Type */}
      <select
        name="budgetType"
        required
        value={formData.budgetType}
        onChange={e => setFormData({...formData, budgetType: e.target.value as BudgetType})}
      >
        <option value="FIXED">Fixed Price</option>
        <option value="HOURLY">Hourly Rate</option>
        <option value="NEGOTIABLE">Negotiable</option>
      </select>

      {/* Urgency */}
      <select
        name="urgency"
        required
        value={formData.urgency}
        onChange={e => setFormData({...formData, urgency: e.target.value as UrgencyLevel})}
      >
        <option value="LOW">Low (3+ weeks)</option>
        <option value="MEDIUM">Medium (1-2 weeks)</option>
        <option value="HIGH">High (2-5 days)</option>
        <option value="URGENT">Urgent (24-48 hours)</option>
      </select>

      {/* Address */}
      <input
        type="text"
        name="addressLine1"
        placeholder="Street address"
        maxLength={255}
        required
        value={formData.addressLine1}
        onChange={e => setFormData({...formData, addressLine1: e.target.value})}
      />

      {/* City */}
      <input
        type="text"
        name="city"
        placeholder="City"
        maxLength={100}
        required
        value={formData.city}
        onChange={e => setFormData({...formData, city: e.target.value})}
      />

      {/* Province */}
      <select
        name="province"
        required
        value={formData.province}
        onChange={e => setFormData({...formData, province: e.target.value})}
      >
        <option value="">Select Province</option>
        <option value="Eastern Cape">Eastern Cape</option>
        <option value="Free State">Free State</option>
        <option value="Gauteng">Gauteng</option>
        <option value="KwaZulu-Natal">KwaZulu-Natal</option>
        <option value="Limpopo">Limpopo</option>
        <option value="Mpumalanga">Mpumalanga</option>
        <option value="Northern Cape">Northern Cape</option>
        <option value="North West">North West</option>
        <option value="Western Cape">Western Cape</option>
      </select>

      {/* Postal Code */}
      <input
        type="text"
        name="postalCode"
        placeholder="Postal code (numbers only)"
        pattern="[0-9]+"
        maxLength={10}
        required
        value={formData.postalCode}
        onChange={e => setFormData({...formData, postalCode: e.target.value})}
      />

      {/* Coordinates - use geocoding service */}
      <input type="hidden" name="latitude" value={formData.latitude} />
      <input type="hidden" name="longitude" value={formData.longitude} />

      {/* Image Upload */}
      <input
        type="file"
        multiple
        accept="image/*"
        max={5}
        onChange={e => e.target.files && handleImageUpload(e.target.files)}
      />

      {/* Draft/Publish */}
      <label>
        <input
          type="checkbox"
          checked={formData.isDraft}
          onChange={e => setFormData({...formData, isDraft: e.target.checked})}
        />
        Save as draft
      </label>

      <button type="submit">
        {formData.isDraft ? 'Save Draft' : 'Publish Job'}
      </button>
    </form>
  );
};
```

---

## Geocoding Recommendations

For converting addresses to coordinates, use one of these services:

### Google Maps Geocoding API

```typescript
const geocodeAddress = async (address: string) => {
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_API_KEY}`
  );
  const data = await response.json();

  if (data.results[0]) {
    return {
      latitude: data.results[0].geometry.location.lat,
      longitude: data.results[0].geometry.location.lng
    };
  }

  throw new Error('Address not found');
};

// Usage
const coords = await geocodeAddress('123 Main Street, Cape Town, Western Cape');
```

### OpenStreetMap Nominatim (Free)

```typescript
const geocodeAddress = async (address: string) => {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`
  );
  const data = await response.json();

  if (data[0]) {
    return {
      latitude: parseFloat(data[0].lat),
      longitude: parseFloat(data[0].lon)
    };
  }

  throw new Error('Address not found');
};
```

---

## Summary

### Key Points to Remember

1. **Authentication**: JWT token required, CLIENT role only
2. **Required Fields**: 11 required fields minimum
3. **Location**: All location fields (address, city, province, postal, lat, lng) are REQUIRED
4. **Enums**: Use exact uppercase values (FIXED, not fixed)
5. **Province**: Use exact names from official list
6. **Postal Code**: String of numbers only
7. **Budget**: Number between 50 and 100,000
8. **Images**: Upload first, then include URLs (max 5)
9. **Requirements**: Max 10 items, 200 chars each
10. **Draft**: Defaults to true, set false to publish immediately

### Quick Reference

```typescript
// Minimum valid job
{
  title: "5+ char title",
  description: "20+ char description",
  categoryId: "valid-subcategory-id",
  budget: 50-100000,
  budgetType: "FIXED|HOURLY|NEGOTIABLE",
  urgency: "LOW|MEDIUM|HIGH|URGENT",
  addressLine1: "street address",
  city: "city name",
  province: "SA Province Name",
  postalCode: "0000",
  latitude: -33.9249,
  longitude: 18.4241
}
```

---

**End of Documentation**

For questions or issues, contact backend team or refer to:
- API Swagger Docs: `/api/docs`
- Backend Repository: [repository-url]
- Support: support@taska.co.za
