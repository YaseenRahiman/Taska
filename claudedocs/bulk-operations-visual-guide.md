# Bulk Operations Module - Visual Testing Guide

**Purpose**: This guide describes what each screen should look like for visual validation.

---

## 1. Main Page - Desktop View (1920px)

### Layout Description
```
┌─────────────────────────────────────────────────────────────────────┐
│ Breadcrumb: Admin / Bulk Operations                                 │
│                                                                      │
│ Bulk Operations                                                      │
│ Manage users, send emails, moderate content, and import/export...   │
│                                                                      │
│ ┌──────────────────────────────────────────────────────────────┐   │
│ │ [Users] [Email] [Moderation] [Import/Export] [History]       │   │
│ │   👤      ✉️       🛡️            📄            📜            │   │
│ │ ───────                                                       │   │
│ │ (blue underline under active tab)                            │   │
│ └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│ [TAB CONTENT AREA]                                                   │
│                                                                      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

**Expected Visual Elements**:
- Breadcrumb: Gray text, last item bold
- Title: 3xl, bold, dark gray (#111827)
- Description: Regular weight, medium gray (#6B7280)
- Tabs: Horizontal bar, white background
- Active tab: Blue bottom border (2px), blue text (#2563EB)
- Inactive tabs: Gray text, transparent border
- Hover state: Gray bottom border, darker gray text
- Icons: 20px size, aligned with text
- Content area: White background, rounded corners, shadow

---

## 2. User Actions Tab

### Layout
```
┌─────────────────────────────────────────────────────────────────────┐
│ UserSelectionTable                                                   │
│ ┌──────────────────────────────────────────────────────────────┐   │
│ │ ☐ Select All  |  Search: [___________] 🔍                    │   │
│ ├──────────────────────────────────────────────────────────────┤   │
│ │ ☐ | Name      | Email            | Role    | Status  | Date  │   │
│ │ ☐ | John Doe  | john@example.com | Client  | Active  | 11/01 │   │
│ │ ☑ | Jane Smith| jane@example.com | Artisan | Active  | 11/02 │   │
│ │ ☑ | Bob Jones | bob@example.com  | Client  | Inactive| 11/03 │   │
│ │ ...                                                            │   │
│ └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│ 2 users selected                                                     │
│                                                                      │
│ [Ban Users] [Suspend Users] [Verify Users] [Delete Users]           │
│                                                    ^─ red button     │
└─────────────────────────────────────────────────────────────────────┘
```

**Expected Visual Elements**:
- Table: White background, gray borders
- Header row: Light gray background (#F9FAFB)
- Checkboxes: Blue when checked, gray border when unchecked
- Selected rows: Light blue background (#EFF6FF)
- Action buttons: Blue primary, red for delete
- Disabled buttons: Gray, cursor not-allowed
- Selected count: Small gray text above buttons

---

## 3. Ban Users Modal

### Layout
```
┌─────────────────────────────────────────────────────────┐
│ Ban Users                                          [×]   │
│                                                          │
│ You are about to ban 2 users. This action is permanent. │
│                                                          │
│ Reason * (required)                                      │
│ ┌────────────────────────────────────────────────────┐ │
│ │                                                    │ │
│ │ [Type reason here...]                             │ │
│ │                                                    │ │
│ └────────────────────────────────────────────────────┘ │
│ 0/500 characters                                         │
│                                                          │
│                              [Cancel]  [Ban Users]       │
│                                           ^─ red button  │
└─────────────────────────────────────────────────────────┘
```

**Expected Visual Elements**:
- Modal: Centered, white background, shadow, rounded corners
- Title: Bold, large font
- Close button: Top right, gray, hover → dark gray
- Warning text: Orange/yellow background badge
- Textarea: White background, gray border, rounded
- Character counter: Small gray text, right-aligned
- Buttons: Cancel (gray), Action (red for destructive)
- Focus: Blue ring around active element

---

## 4. Email Campaigns Tab

### Layout
```
┌─────────────────────────────────────────────────────────────────────┐
│ Recipient Selection                                                  │
│ ◉ All Users (150 recipients)                                        │
│ ○ Specific Users                                                     │
│                                                                      │
│ Email Template                                                       │
│ [Select Template ▼]                                                 │
│                                                                      │
│ Subject * (required)                                                 │
│ [___________________________________________________] 0/100          │
│                                                                      │
│ Email Body * (required)                                              │
│ ┌──────────────────────────────────────────────────────────────┐   │
│ │                                                               │   │
│ │                                                               │   │
│ │                                                               │   │
│ └──────────────────────────────────────────────────────────────┘   │
│ 0/2000 characters                                                    │
│                                                                      │
│ ☑ Send Immediately                                                   │
│                                                                      │
│                    [Preview Email]  [Send Email]                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Expected Visual Elements**:
- Radio buttons: Blue when selected
- Recipient count: Badge style, blue background
- Dropdown: Gray border, arrow icon
- Text inputs: Full width, gray border, rounded
- Character counters: Right-aligned, small gray text
- Textarea: Tall (150px), resizable
- Checkbox: Blue when checked
- Preview button: Gray/white
- Send button: Blue primary, disabled if invalid

---

## 5. Content Moderation Tab

### Layout
```
┌─────────────────────────────────────────────────────────────────────┐
│ ┌────────────────────────────────────────────┐                      │
│ │ [Jobs]  [Reviews]  [Comments]              │                      │
│ │  ──── (blue underline)                     │                      │
│ └────────────────────────────────────────────┘                      │
│                                                                      │
│ Pending Jobs                                                         │
│ ┌──────────────────────────────────────────────────────────────┐   │
│ │ ☐ | Title              | Client    | Category  | Status      │   │
│ │ ☑ | Fix leaking pipe   | John Doe  | Plumbing  | ⏳ Pending  │   │
│ │ ☑ | Paint living room  | Jane Smith| Painting  | ⏳ Pending  │   │
│ │ ...                                                            │   │
│ └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│ 2 selected                                                           │
│                                                                      │
│ [Approve Jobs]  [Reject Jobs]                                       │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

**Expected Visual Elements**:
- Sub-tabs: Smaller than main tabs, same style
- Status badges:
  - Pending: Yellow background (#FEF3C7), yellow text
  - Approved: Green background (#D1FAE5), green text
  - Rejected: Red background (#FEE2E2), red text
- Content preview: Truncated text with "..." if long
- Action buttons: Green for approve, red for reject

---

## 6. Import/Export Tab

### Layout
```
┌─────────────────────────────────────────────────────────────────────┐
│ Export Data                                                          │
│ ┌──────────────────────────────────────────────────────────────┐   │
│ │ Entity Type: [Users ▼]    Format: [CSV ▼]                    │   │
│ │                                                               │   │
│ │ Filters                                                       │   │
│ │ Status: [All ▼]  Role: [All ▼]  Date: [___] to [___]        │   │
│ │                                                               │   │
│ │ Columns to Export                                             │   │
│ │ ☑ Name  ☑ Email  ☑ Role  ☑ Status  ☐ Phone  ☐ Address      │   │
│ │                                                               │   │
│ │                                        [Export] 📥            │   │
│ └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│ Import Data                                                          │
│ ┌──────────────────────────────────────────────────────────────┐   │
│ │ ┌─────────────────────────────────────────────────────────┐  │   │
│ │ │           📁                                            │  │   │
│ │ │   Drag & drop CSV file here, or click to browse       │  │   │
│ │ │                                                         │  │   │
│ │ └─────────────────────────────────────────────────────────┘  │   │
│ │                                                               │   │
│ │ Supported: CSV files up to 10MB                              │   │
│ └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

**Expected Visual Elements**:
- Sections: Separated by spacing, optional border
- Dropdowns: Gray background, chevron icon
- Filter row: Flex layout, evenly spaced
- Checkboxes: Grid layout, 4-6 per row
- Export button: Blue, with download icon
- Dropzone: Dashed border, gray background on hover
- File icon: Large, centered
- Help text: Small, gray, centered

---

## 7. CSV Import Preview

### Layout (After file uploaded)
```
┌─────────────────────────────────────────────────────────────────────┐
│ CSV Preview (100 rows detected)                                      │
│ ┌──────────────────────────────────────────────────────────────┐   │
│ │ Name        | Email            | Role    | Status            │   │
│ │ John Doe    | john@example.com | Client  | Active            │   │
│ │ Jane Smith  | jane@example.com | Artisan | Active            │   │
│ │ ...                                                            │   │
│ └──────────────────────────────────────────────────────────────┘   │
│ Showing first 10 rows                                                │
│                                                                      │
│ Column Mapping                                                       │
│ CSV Column → System Field                                            │
│ name       → [name ▼]                                               │
│ email      → [email_address ▼]                                      │
│ role       → [role ▼]                                               │
│ status     → [status ▼]                                             │
│                                                                      │
│ Validation Results                                                   │
│ ✅ All 100 rows valid                                               │
│                                                                      │
│ [Cancel]  [Import Users]                                            │
└─────────────────────────────────────────────────────────────────────┘
```

**Expected Visual Elements**:
- Preview table: Smaller font, scrollable
- Row count badge: Blue background, white text
- Mapping section: Two-column layout
- Arrows: → between CSV and system columns
- Dropdowns: Auto-selected if names match
- Validation: Green checkmark if valid, red X if errors
- Error details: Expandable section with row numbers

---

## 8. Operation History Tab

### Layout
```
┌─────────────────────────────────────────────────────────────────────┐
│ Filters                                                              │
│ Type: [All ▼]  Status: [All ▼]  Date: [Last 30 days ▼]             │
│                                                         [Clear]      │
│                                                                      │
│ Operations                                                           │
│ ┌──────────────────────────────────────────────────────────────┐   │
│ │ Type    Status    Progress  Started         Actions           │   │
│ │ ✉️ Email 🟢 Done   100%    11/08 10:30 AM  [View] [Delete]   │   │
│ │ 🚫 Ban   🟢 Done   100%    11/08 09:15 AM  [View] [Delete]   │   │
│ │ 📤 Export🔵 Running 45%    11/08 11:00 AM  [View] [Delete]   │   │
│ │ 📥 Import🟡 Pending 0%     11/08 11:05 AM  [View] [Delete]   │   │
│ │ ...                                                            │   │
│ └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│ Showing 1-10 of 47 operations                                        │
│ [« Previous]  [1] [2] [3] ... [5]  [Next »]                         │
└─────────────────────────────────────────────────────────────────────┘
```

**Expected Visual Elements**:
- Filter row: Flex layout, aligned left, clear button right
- Type icons: Emoji or lucide-react icons
- Status badges:
  - Pending: Yellow (#FEF3C7)
  - Running: Blue (#DBEAFE)
  - Completed: Green (#D1FAE5)
  - Failed: Red (#FEE2E2)
- Progress bar: Blue fill, gray background, percentage label
- Timestamps: Small gray text
- Action buttons: Small, icon + text
- Pagination: Centered, numbered pages, prev/next arrows

---

## 9. Operation Progress Modal

### Layout
```
┌─────────────────────────────────────────────────────────┐
│ Operation Details                                  [×]   │
│                                                          │
│ Email Campaign #12345                                    │
│ Status: 🟢 Completed                                     │
│                                                          │
│ ┌────────────────────────────────────────────────────┐ │
│ │ ████████████████████████████████████████ 100%     │ │
│ └────────────────────────────────────────────────────┘ │
│                                                          │
│ Statistics                                               │
│ Total: 150  |  Processed: 150  |  Succeeded: 145        │
│ Failed: 5                                                │
│                                                          │
│ Operation Logs                                           │
│ ┌────────────────────────────────────────────────────┐ │
│ │ [10:30:15] Operation started                      │ │
│ │ [10:30:16] Processing batch 1/3 (50 users)       │ │
│ │ [10:30:45] Batch 1 completed: 48 sent, 2 failed  │ │
│ │ [10:31:00] Processing batch 2/3 (50 users)       │ │
│ │ [10:31:30] Batch 2 completed: 49 sent, 1 failed  │ │
│ │ [10:31:45] Processing batch 3/3 (50 users)       │ │
│ │ [10:32:15] Batch 3 completed: 48 sent, 2 failed  │ │
│ │ [10:32:16] Operation completed successfully       │ │
│ └────────────────────────────────────────────────────┘ │
│                                                          │
│                                             [Close]      │
└─────────────────────────────────────────────────────────┘
```

**Expected Visual Elements**:
- Modal: Larger than action modals (600px wide)
- Operation ID: Monospace font, gray
- Status badge: Same as table, with icon
- Progress bar: Full width, animated if running
- Stats: Grid layout, 4 columns
- Logs: Scrollable box, monospace font, timestamped
- Timestamps: Gray, small font
- Success/failure counts: Green/red text
- Close button: Bottom right

---

## 10. Mobile View (375px)

### Main Page
```
┌─────────────────────────────────┐
│ Admin / Bulk Operations         │
│                                 │
│ Bulk Operations                 │
│ Manage users, send emails...    │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 👤 User Actions          ▼  │ │
│ └─────────────────────────────┘ │
│ (Click to expand dropdown)      │
│                                 │
│ [TAB CONTENT]                   │
│ (Scrollable)                    │
│                                 │
└─────────────────────────────────┘
```

### Dropdown Expanded
```
┌─────────────────────────────────┐
│ ┌─────────────────────────────┐ │
│ │ 👤 User Actions          ▲  │ │
│ ├─────────────────────────────┤ │
│ │ 👤 User Actions             │ │
│ │ Ban, suspend, verify users  │ │
│ │                             │ │
│ │ ✉️ Email Campaigns          │ │
│ │ Send bulk emails with...    │ │
│ │                             │ │
│ │ 🛡️ Content Moderation       │ │
│ │ Moderate jobs, reviews...   │ │
│ │                             │ │
│ │ 📄 Import/Export            │ │
│ │ Import and export data...   │ │
│ │                             │ │
│ │ 📜 Operation History        │ │
│ │ View and track all...       │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

**Expected Visual Elements**:
- Dropdown: Full width, white background
- Each option: Icon + label + description
- Active option: Blue background (#EFF6FF)
- Touch targets: ≥44px height
- Descriptions: Smaller, gray text
- Chevron: Rotates when expanded

---

## 11. Toast Notifications

### Success Toast
```
┌─────────────────────────────────────────┐
│ ✅  3 users banned successfully         │
│                                    [×]  │
└─────────────────────────────────────────┘
```

### Error Toast
```
┌─────────────────────────────────────────┐
│ ❌  Failed to send email. Try again.    │
│                                    [×]  │
└─────────────────────────────────────────┘
```

**Expected Visual Elements**:
- Success: Green background (#10B981), white text
- Error: Red background (#EF4444), white text
- Icon: Left side, white
- Message: Center-left aligned
- Close button: Right side, white X
- Position: Top-right of screen
- Animation: Slide in from right, fade out
- Duration: 5 seconds auto-dismiss

---

## 12. Loading States

### Button Loading
```
[🔄 Processing...] (button disabled, spinner animating)
```

### Table Loading (Skeleton)
```
┌──────────────────────────────────────────────────────────┐
│ ░░░░░░ | ░░░░░░░░░░░░░░░░ | ░░░░░░ | ░░░░░░ | ░░░░░░  │
│ ░░░░░░ | ░░░░░░░░░░░░░░░░ | ░░░░░░ | ░░░░░░ | ░░░░░░  │
│ ░░░░░░ | ░░░░░░░░░░░░░░░░ | ░░░░░░ | ░░░░░░ | ░░░░░░  │
└──────────────────────────────────────────────────────────┘
```

**Expected Visual Elements**:
- Skeleton: Gray gradient (#E5E7EB to #F3F4F6)
- Animation: Shimmer/pulse effect
- Layout: Same as actual content
- Duration: Until data loads

---

## 13. Empty States

### No Users
```
┌──────────────────────────────────────────────────────────┐
│                                                           │
│                        📭                                 │
│                  No users found                           │
│            Try adjusting your filters                     │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

### No Operations
```
┌──────────────────────────────────────────────────────────┐
│                                                           │
│                        📜                                 │
│              No operations found                          │
│    Start by creating a bulk action above                 │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

**Expected Visual Elements**:
- Icon: Large (64px), centered, gray
- Message: Bold, large font, centered
- Subtitle: Smaller, gray, centered
- Spacing: Generous padding (80px vertical)
- Background: Light gray or white

---

## Color Palette Reference

### Primary Colors
- **Blue**: #2563EB (primary actions, links, active states)
- **Gray Dark**: #111827 (headings, text)
- **Gray Medium**: #6B7280 (body text, labels)
- **Gray Light**: #E5E7EB (borders, dividers)
- **Gray BG**: #F9FAFB (table headers, backgrounds)

### Status Colors
- **Success Green**: #10B981 (success messages, approved status)
- **Error Red**: #EF4444 (errors, failed status, delete actions)
- **Warning Yellow**: #F59E0B (warnings, pending status)
- **Info Blue**: #3B82F6 (informational, running status)

### Semantic Colors
- **Danger**: #DC2626 (destructive actions like ban, delete)
- **Primary**: #2563EB (primary actions like send, import)
- **Secondary**: #6B7280 (cancel, secondary actions)

---

## Typography Reference

### Font Sizes
- **3xl (30px)**: Page titles
- **2xl (24px)**: Section headings
- **xl (20px)**: Card titles
- **lg (18px)**: Subheadings
- **base (16px)**: Body text
- **sm (14px)**: Labels, help text
- **xs (12px)**: Captions, timestamps

### Font Weights
- **Bold (700)**: Headings, important text
- **Medium (500)**: Labels, tab names
- **Regular (400)**: Body text

---

## Spacing Reference

### Common Spacings (Tailwind scale)
- **1 (4px)**: Tight spacing between related elements
- **2 (8px)**: Comfortable spacing
- **4 (16px)**: Standard component spacing
- **6 (24px)**: Section spacing
- **8 (32px)**: Large section spacing

---

## Icon Reference

### lucide-react Icons Used
- **Users**: User actions, user selection
- **Mail**: Email campaigns
- **Shield**: Content moderation
- **FileText**: Import/export, documents
- **History**: Operation history
- **ChevronDown**: Dropdowns, expanded state
- **X**: Close buttons
- **Check**: Success states
- **AlertCircle**: Errors, warnings
- **Search**: Search functionality
- **Download**: Export actions
- **Upload**: Import actions
- **Trash2**: Delete actions
- **Eye**: View details

---

## Visual Testing Checklist

When visually inspecting the application, verify:

- [ ] All colors match the palette
- [ ] Font sizes consistent across similar elements
- [ ] Spacing uniform and predictable
- [ ] Icons sized appropriately (usually 16-20px)
- [ ] Borders subtle (1px, gray)
- [ ] Shadows subtle (sm or md)
- [ ] Rounded corners consistent (usually 4-8px)
- [ ] Hover states visible but not jarring
- [ ] Focus states clearly visible
- [ ] Active states distinguishable
- [ ] Disabled states grayed out appropriately
- [ ] Loading states smooth and clear
- [ ] Animations smooth (no jank)
- [ ] Text readable (contrast ≥4.5:1)
- [ ] Buttons appropriately sized
- [ ] Touch targets ≥44px on mobile
- [ ] No layout shifts during load
- [ ] No visual bugs or glitches

---

**End of Visual Testing Guide**
