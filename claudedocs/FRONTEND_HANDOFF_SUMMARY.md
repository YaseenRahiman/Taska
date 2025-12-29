# Frontend Job Creation - Complete Handoff Package

**Created**: 2025-10-18
**Backend Version**: Taska Platform v1.0.0
**Status**: ✅ Ready for Frontend Integration

---

## 📦 What You're Getting

This package contains everything the frontend architect needs to implement job creation functionality without errors.

### Documentation Files

1. **JOB_CREATION_API_REFERENCE.md** (Complete Guide)
   - Complete CreateJobDto specification
   - Field-by-field validation rules
   - Enum values and usage
   - Valid example payloads
   - Error handling guide
   - Integration checklist
   - TypeScript examples

2. **JOB_CREATION_QUICK_REFERENCE.md** (Quick Lookup)
   - Minimal valid payload
   - Field validation summary table
   - Common errors
   - Key points checklist

3. **CATEGORY_REFERENCE.md** (Category Data)
   - All 16 subcategories with actual database IDs
   - Grouped by parent category
   - Valid example payloads with real IDs
   - Category dropdown implementation
   - Testing checklist

4. **job-creation.types.ts** (TypeScript Types)
   - Complete type definitions
   - Validation helper class
   - Enum types
   - Helper functions
   - Ready to copy to frontend project

---

## 🎯 Quick Start

### Step 1: Review the DTO Structure
```typescript
// Minimum required fields
{
  title: string;              // 5-100 chars
  description: string;        // 20-2000 chars
  categoryId: string;         // Valid subcategory ID
  budget: number;            // 50-100000
  budgetType: BudgetType;    // FIXED | HOURLY | NEGOTIABLE
  urgency: UrgencyLevel;     // LOW | MEDIUM | HIGH | URGENT
  addressLine1: string;      // Max 255 chars
  city: string;              // Max 100 chars
  province: string;          // Valid SA province
  postalCode: string;        // Numeric string
  latitude: number;          // Valid latitude
  longitude: number;         // Valid longitude
}
```

### Step 2: Copy TypeScript Types
```bash
cp claudedocs/job-creation.types.ts frontend/src/types/
```

### Step 3: Test with Valid Payload

**Plumbing Example**:
```json
{
  "title": "Fix leaking kitchen faucet",
  "description": "Kitchen faucet has been dripping for a week. Need professional plumber to fix or replace.",
  "categoryId": "cmge564r300067hbmwky6a49t",
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

**Expected Response**: 201 Created with job object

---

## 🔑 Key Points to Fix Current Errors

### Your Current Validation Errors

```
❌ categoryId should not be empty
❌ budgetType must be one of the following values: FIXED, HOURLY, NEGOTIABLE
❌ addressLine1 should not be empty
❌ city should not be empty
❌ province should not be empty
❌ postalCode must be a number string
❌ latitude must be a latitude string or number
❌ longitude must be a longitude string or number
```

### Solutions

1. **categoryId**: Use subcategory IDs from CATEGORY_REFERENCE.md
   ```typescript
   ✅ "cmge564r300067hbmwky6a49t" // Plumbing subcategory
   ❌ "cmge564r300057hbm69wr0map" // Parent category (Home Improvement)
   ```

2. **budgetType**: Use UPPERCASE enum values
   ```typescript
   ✅ "FIXED"
   ❌ "fixed" or "Fixed"
   ```

3. **Location Fields**: All are REQUIRED (not optional)
   ```typescript
   addressLine1: "123 Main Street"  // Required
   city: "Cape Town"                // Required
   province: "Western Cape"         // Required (exact name)
   postalCode: "8001"              // Required (numeric string)
   latitude: -33.9249              // Required (number)
   longitude: 18.4241              // Required (number)
   ```

4. **postalCode**: Must be a string containing only numbers
   ```typescript
   ✅ "8001"
   ❌ 8001 (number instead of string)
   ❌ "8001A" (contains letters)
   ```

5. **Coordinates**: Must be numbers (not strings)
   ```typescript
   ✅ latitude: -33.9249
   ❌ latitude: "-33.9249" (string)
   ```

---

## 📋 Implementation Checklist

### Authentication
- [ ] Include JWT token in Authorization header
- [ ] Verify user has CLIENT role
- [ ] Handle 401/403 errors

### Form Fields

**Required Fields**:
- [ ] Title (5-100 chars)
- [ ] Description (20-2000 chars)
- [ ] Category (subcategory dropdown)
- [ ] Budget (50-100000, number)
- [ ] Budget Type (FIXED/HOURLY/NEGOTIABLE)
- [ ] Urgency (LOW/MEDIUM/HIGH/URGENT)
- [ ] Address Line 1 (max 255 chars)
- [ ] City (max 100 chars)
- [ ] Province (dropdown with exact names)
- [ ] Postal Code (numeric string)
- [ ] Latitude (number)
- [ ] Longitude (number)

**Optional Fields**:
- [ ] Address Line 2
- [ ] Images (max 5, upload first)
- [ ] Requirements (max 10 items)
- [ ] Start Date (ISO 8601)
- [ ] End Date (ISO 8601)
- [ ] Is Draft (boolean, default true)

### Validation
- [ ] Frontend validation before submit
- [ ] Backend error handling
- [ ] Display field-specific errors
- [ ] Clear errors on correction

### Category Integration
- [ ] Fetch categories from `/categories`
- [ ] Filter for subcategories only
- [ ] Group by parent in UI
- [ ] Use subcategory ID in payload

### Location/Geocoding
- [ ] Address search/autocomplete
- [ ] Get coordinates from address
- [ ] Validate coordinates in SA range
- [ ] Province dropdown with exact names

### Image Upload
- [ ] Upload images first (separate endpoint)
- [ ] Store returned URLs
- [ ] Include URLs in job creation
- [ ] Limit to 5 images

### Draft/Publish
- [ ] Toggle for save as draft
- [ ] Explain draft vs published
- [ ] Implement publish draft functionality

---

## 🧪 Testing Guide

### Test Cases

1. **Minimal Valid Job (Draft)**
   - Use plumbing example from CATEGORY_REFERENCE.md
   - Should return 201 with DRAFT status

2. **Complete Job (Published)**
   - Include all optional fields
   - Set isDraft: false
   - Should return 201 with OPEN status

3. **Invalid Category ID**
   - Use parent category ID
   - Should return 400 with validation error

4. **Invalid Enum**
   - Use lowercase budget type
   - Should return 400 with enum error

5. **Missing Required Fields**
   - Omit location fields
   - Should return 400 with specific field errors

6. **Budget Out of Range**
   - Try budget < 50 or > 100000
   - Should return 400 with range error

7. **Invalid Coordinates**
   - Try latitude > 90
   - Should return 400 with coordinate error

8. **Image Upload Flow**
   - Upload image first
   - Get URL from response
   - Include in job creation
   - Should succeed with image in response

### Test Data

**Valid Category IDs** (from CATEGORY_REFERENCE.md):
```typescript
Plumbing:     "cmge564r300067hbmwky6a49t"
Electrical:   "cmge564r300077hbmnllb8wkg"
Carpentry:    "cmge564r300087hbm87t9spc2"
Web Dev:      "cmge564sd000d7hbm514b7rtf"
Garden:       "cmge564so000n7hbmy9qr5b3l"
House Clean:  "cmge564sf000g7hbm0tzm03af"
```

**Valid Provinces**:
```typescript
"Western Cape"
"Gauteng"
"KwaZulu-Natal"
"Eastern Cape"
"Free State"
"Limpopo"
"Mpumalanga"
"Northern Cape"
"North West"
```

**Valid Coordinates** (South Africa):
```typescript
Cape Town:      { lat: -33.9249, lng: 18.4241 }
Johannesburg:   { lat: -26.2041, lng: 28.0473 }
Durban:         { lat: -29.8587, lng: 31.0218 }
Pretoria:       { lat: -25.7479, lng: 28.2293 }
```

---

## 🛠️ Common Issues & Solutions

### Issue 1: "categoryId should not be empty"
**Cause**: Using parent category ID or invalid ID
**Solution**: Use subcategory IDs from CATEGORY_REFERENCE.md

### Issue 2: "budgetType must be one of the following values"
**Cause**: Lowercase or wrong case
**Solution**: Use UPPERCASE: "FIXED", "HOURLY", "NEGOTIABLE"

### Issue 3: "postalCode must be a number string"
**Cause**: Sending as number or contains letters
**Solution**: Send as string with only digits: "8001"

### Issue 4: "latitude must be a latitude string or number"
**Cause**: Sending as string
**Solution**: Send as number: -33.9249 (not "-33.9249")

### Issue 5: "requirements must be an array"
**Cause**: Sending as string or missing
**Solution**: Send as array: ["requirement 1", "requirement 2"] or omit entirely

### Issue 6: 403 Forbidden
**Cause**: User is not CLIENT role
**Solution**: Ensure logged-in user has CLIENT role

---

## 📞 Support

### Documentation Files
- **Complete Guide**: `JOB_CREATION_API_REFERENCE.md`
- **Quick Reference**: `JOB_CREATION_QUICK_REFERENCE.md`
- **Categories**: `CATEGORY_REFERENCE.md`
- **TypeScript Types**: `job-creation.types.ts`

### API Endpoints
- **Create Job**: `POST /jobs`
- **Get Categories**: `GET /categories`
- **Upload Image**: `POST /jobs/upload-image`
- **Upload Images**: `POST /jobs/upload-images`
- **Publish Draft**: `PUT /jobs/:id/publish`

### Testing Endpoints
- API Swagger: `http://localhost:3000/api/docs`
- Health Check: `http://localhost:3000/health`

### Backend Team Contact
- Email: backend@taska.co.za
- Repository: [repository-url]

---

## ✅ Success Criteria

Your job creation is working when:

1. ✅ Form submits without validation errors
2. ✅ Response status is 201 Created
3. ✅ Response contains job object with ID
4. ✅ Job appears in database
5. ✅ Draft jobs have status "DRAFT"
6. ✅ Published jobs have status "OPEN"
7. ✅ Images upload successfully
8. ✅ Categories display correctly
9. ✅ Validation errors show field-specific messages
10. ✅ User can publish draft jobs

---

## 🚀 Next Steps

1. **Review** the complete API reference
2. **Copy** TypeScript types to your project
3. **Test** with provided valid payloads
4. **Implement** form with all required fields
5. **Integrate** category dropdown
6. **Add** location/geocoding
7. **Test** with all test cases
8. **Deploy** to staging for UAT

---

**Ready to integrate! All backend requirements documented and validated.** 🎉
