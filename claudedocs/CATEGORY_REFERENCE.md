# Category Reference - Actual Database IDs

**Generated**: 2025-10-18
**Database**: Taska Production Seed Data

---

## How to Use Categories

1. **Fetch categories** from `GET /categories` on app load
2. **Use subcategory IDs** (children) in `categoryId` field, NOT parent IDs
3. **Display hierarchy** in UI: Parent → Subcategory
4. **Filter active only**: Check `isActive: true`

---

## Complete Category Structure

### Home Improvement
**Parent ID**: `cmge564r300057hbm69wr0map`

| Subcategory | ID | Description |
|-------------|-----|-------------|
| **Plumbing** | `cmge564r300067hbmwky6a49t` | Plumbing repairs and installations |
| **Electrical** | `cmge564r300077hbmnllb8wkg` | Electrical work and installations |
| **Carpentry** | `cmge564r300087hbm87t9spc2` | Wood work and carpentry services |
| **Painting** | `cmge564r300097hbmatnp95rx` | Interior and exterior painting |
| **Tiling** | `cmge564r3000a7hbmzlrh9mii` | Floor and wall tiling services |

### Garden & Landscaping
**Parent ID**: `cmge564so000m7hbm9agwtmdl`

| Subcategory | ID | Description |
|-------------|-----|-------------|
| **Garden Maintenance** | `cmge564so000n7hbmy9qr5b3l` | Regular garden upkeep and maintenance |
| **Landscaping** | `cmge564so000o7hbmg7cwt3ps` | Garden design and landscaping |
| **Tree Services** | `cmge564so000p7hbm40g93met` | Tree felling and maintenance |

### Technology
**Parent ID**: `cmge564sc000b7hbm3ia6gyw8`

| Subcategory | ID | Description |
|-------------|-----|-------------|
| **Computer Repair** | `cmge564sd000c7hbmfnv22fqr` | Computer and laptop repairs |
| **Web Development** | `cmge564sd000d7hbm514b7rtf` | Website development and design |
| **Mobile App Development** | `cmge564sd000e7hbm5xzo2odt` | Mobile application development |

### Automotive
**Parent ID**: `cmge564sm000j7hbmxq6lwi2s`

| Subcategory | ID | Description |
|-------------|-----|-------------|
| **Car Repair** | `cmge564sm000k7hbmmm8pqxqx` | Vehicle maintenance and repairs |
| **Car Wash** | `cmge564sm000l7hbmvad1gaqk` | Vehicle cleaning services |

### Cleaning
**Parent ID**: `cmge564sf000f7hbmozlccr25`

| Subcategory | ID | Description |
|-------------|-----|-------------|
| **House Cleaning** | `cmge564sf000g7hbm0tzm03af` | Residential cleaning services |
| **Office Cleaning** | `cmge564sf000h7hbmbtbvgiem` | Commercial cleaning services |
| **Carpet Cleaning** | `cmge564sf000i7hbm0xdyue9h` | Professional carpet cleaning |

---

## Valid categoryId Values

Copy these IDs for testing:

```typescript
// Home Improvement
const PLUMBING = "cmge564r300067hbmwky6a49t";
const ELECTRICAL = "cmge564r300077hbmnllb8wkg";
const CARPENTRY = "cmge564r300087hbm87t9spc2";
const PAINTING = "cmge564r300097hbmatnp95rx";
const TILING = "cmge564r3000a7hbmzlrh9mii";

// Garden & Landscaping
const GARDEN_MAINTENANCE = "cmge564so000n7hbmy9qr5b3l";
const LANDSCAPING = "cmge564so000o7hbmg7cwt3ps";
const TREE_SERVICES = "cmge564so000p7hbm40g93met";

// Technology
const COMPUTER_REPAIR = "cmge564sd000c7hbmfnv22fqr";
const WEB_DEVELOPMENT = "cmge564sd000d7hbm514b7rtf";
const MOBILE_APP_DEVELOPMENT = "cmge564sd000e7hbm5xzo2odt";

// Automotive
const CAR_REPAIR = "cmge564sm000k7hbmmm8pqxqx";
const CAR_WASH = "cmge564sm000l7hbmvad1gaqk";

// Cleaning
const HOUSE_CLEANING = "cmge564sf000g7hbm0tzm03af";
const OFFICE_CLEANING = "cmge564sf000h7hbmbtbvgiem";
const CARPET_CLEANING = "cmge564sf000i7hbm0xdyue9h";
```

---

## Example Payloads with Real IDs

### Plumbing Job
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

### Electrical Job
```json
{
  "title": "Install new ceiling fan",
  "description": "Need to install a new ceiling fan in the master bedroom. Electrical point already exists.",
  "categoryId": "cmge564r300077hbmnllb8wkg",
  "budget": 500,
  "budgetType": "FIXED",
  "urgency": "MEDIUM",
  "addressLine1": "456 Oak Avenue",
  "city": "Johannesburg",
  "province": "Gauteng",
  "postalCode": "2001",
  "latitude": -26.2041,
  "longitude": 28.0473
}
```

### Carpentry Job
```json
{
  "title": "Build custom kitchen cabinets",
  "description": "Need custom kitchen cabinets built for a small kitchen renovation. Measurements and design ready.",
  "categoryId": "cmge564r300087hbm87t9spc2",
  "budget": 15000,
  "budgetType": "NEGOTIABLE",
  "urgency": "LOW",
  "addressLine1": "789 Pine Road",
  "city": "Durban",
  "province": "KwaZulu-Natal",
  "postalCode": "4001",
  "latitude": -29.8587,
  "longitude": 31.0218
}
```

### Web Development Job
```json
{
  "title": "Simple business website",
  "description": "Need a simple 5-page website for my small business with contact form and gallery.",
  "categoryId": "cmge564sd000d7hbm514b7rtf",
  "budget": 5000,
  "budgetType": "FIXED",
  "urgency": "MEDIUM",
  "addressLine1": "159 Code Street",
  "city": "Cape Town",
  "province": "Western Cape",
  "postalCode": "8001",
  "latitude": -33.9249,
  "longitude": 18.4241
}
```

### Garden Maintenance Job
```json
{
  "title": "Weekly garden maintenance",
  "description": "Looking for reliable gardener for weekly maintenance. Lawn mowing, weeding, and general upkeep required.",
  "categoryId": "cmge564so000n7hbmy9qr5b3l",
  "budget": 300,
  "budgetType": "HOURLY",
  "urgency": "LOW",
  "addressLine1": "321 Garden Lane",
  "city": "Pretoria",
  "province": "Gauteng",
  "postalCode": "0001",
  "latitude": -25.7479,
  "longitude": 28.2293
}
```

### House Cleaning Job
```json
{
  "title": "Deep house cleaning service",
  "description": "Need thorough deep cleaning of 3-bedroom house. All rooms, bathrooms, kitchen, and windows.",
  "categoryId": "cmge564sf000g7hbm0tzm03af",
  "budget": 800,
  "budgetType": "FIXED",
  "urgency": "HIGH",
  "addressLine1": "654 Clean Avenue",
  "city": "Durban",
  "province": "KwaZulu-Natal",
  "postalCode": "4001",
  "latitude": -29.8587,
  "longitude": 31.0218
}
```

---

## Frontend Category Dropdown Implementation

```typescript
// CategorySelect.tsx
import { useState, useEffect } from 'react';

interface Category {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
  isActive: boolean;
  children?: Category[];
}

export function CategorySelect({ value, onChange }: {
  value: string;
  onChange: (categoryId: string) => void;
}) {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then(data => setCategories(data));
  }, []);

  // Group subcategories by parent
  const groupedCategories = categories
    .filter(cat => cat.parentId === null)
    .map(parent => ({
      parent,
      children: categories.filter(cat => cat.parentId === parent.id && cat.isActive)
    }));

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required
    >
      <option value="">Select a category</option>
      {groupedCategories.map(({ parent, children }) => (
        <optgroup key={parent.id} label={parent.name}>
          {children.map(child => (
            <option key={child.id} value={child.id}>
              {child.name}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
```

---

## API Response Format

### GET /categories

```json
[
  {
    "id": "cmge564r300057hbm69wr0map",
    "name": "Home Improvement",
    "description": "General home improvement and renovation services",
    "iconUrl": null,
    "isActive": true,
    "parentId": null,
    "sortOrder": 1,
    "createdAt": "2024-01-10T10:00:00.000Z",
    "updatedAt": "2024-01-10T10:00:00.000Z",
    "children": [
      {
        "id": "cmge564r300067hbmwky6a49t",
        "name": "Plumbing",
        "description": "Plumbing repairs and installations",
        "iconUrl": null,
        "isActive": true,
        "parentId": "cmge564r300057hbm69wr0map",
        "sortOrder": 1,
        "createdAt": "2024-01-10T10:00:00.000Z",
        "updatedAt": "2024-01-10T10:00:00.000Z"
      }
    ]
  }
]
```

---

## Validation

### ✅ Valid categoryId Examples
```typescript
"cmge564r300067hbmwky6a49t" // Plumbing - VALID (subcategory)
"cmge564r300077hbmnllb8wkg" // Electrical - VALID (subcategory)
"cmge564sd000d7hbm514b7rtf" // Web Development - VALID (subcategory)
```

### ❌ Invalid categoryId Examples
```typescript
"cmge564r300057hbm69wr0map" // Home Improvement - INVALID (parent category)
"cmge564sc000b7hbm3ia6gyw8" // Technology - INVALID (parent category)
"invalid-id"                 // INVALID (doesn't exist)
""                          // INVALID (empty)
```

---

## Testing Checklist

- [ ] Fetch categories from `/categories` endpoint
- [ ] Filter for subcategories only (`parentId !== null`)
- [ ] Check `isActive` flag
- [ ] Display categories grouped by parent
- [ ] Use subcategory ID in job creation
- [ ] Test with each category type
- [ ] Verify validation errors for invalid IDs
- [ ] Test dropdown selection

---

## Notes

1. **Dynamic Categories**: Always fetch from API, don't hardcode IDs
2. **Subcategories Only**: Job creation requires subcategory IDs
3. **Active Check**: Filter by `isActive: true`
4. **Parent Display**: Show parent name for better UX (e.g., "Home Improvement → Plumbing")
5. **Caching**: Cache categories in context/state to avoid repeated fetches
6. **Validation**: Backend validates category exists and is a subcategory

---

## Contact

For category-related questions:
- Backend Team: backend@taska.co.za
- API Docs: `/api/docs`
