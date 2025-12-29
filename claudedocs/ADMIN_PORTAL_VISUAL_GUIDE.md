# Admin Portal Visual Architecture Guide

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (Client)                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Next.js 14 App Router                      │   │
│  │  ┌──────────────────────────────────────────────────┐  │   │
│  │  │           Admin Portal Routes                    │  │   │
│  │  │  /admin/dashboard    /admin/users               │  │   │
│  │  │  /admin/payments     /admin/reviews             │  │   │
│  │  │  /admin/settings/*   /admin/financial           │  │   │
│  │  └──────────────────────────────────────────────────┘  │   │
│  │                                                         │   │
│  │  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐ │   │
│  │  │   Zustand   │  │ React Query  │  │ React Hook   │ │   │
│  │  │   Stores    │  │   Cache      │  │    Form      │ │   │
│  │  │ (UI State)  │  │(Server Data) │  │ (Form State) │ │   │
│  │  └─────────────┘  └──────────────┘  └──────────────┘ │   │
│  │                                                         │   │
│  │  ┌──────────────────────────────────────────────────┐ │   │
│  │  │          Component Library                       │ │   │
│  │  │  • AdminDataTable  • AdminStatCard              │ │   │
│  │  │  • SettingsPanel   • ApprovalQueueCard          │ │   │
│  │  │  • AuditLogViewer  • Modals & Forms             │ │   │
│  │  └──────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  API Client (Axios)                     │   │
│  │  • Auth Interceptors  • Token Refresh  • Error Handler │   │
│  └─────────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTPS/REST
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                    Backend API (NestJS)                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │           /admin/* API Endpoints                        │   │
│  │  • User Management    • Payment Approval                │   │
│  │  • Review Moderation  • System Settings                 │   │
│  │  • Financial Reports  • Audit Logs                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Database (PostgreSQL)                      │   │
│  │  • Users  • Payments  • Reviews  • Settings             │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## User Flow Diagrams

### Payment Approval Workflow

```
┌─────────┐
│  Admin  │
└────┬────┘
     │
     ▼
┌─────────────────────────┐
│ Navigate to /admin/     │
│ payments                │
└────┬────────────────────┘
     │
     ▼
┌─────────────────────────┐
│ Payment Queue Loads     │
│ (Auto-refresh 30s)      │
└────┬────────────────────┘
     │
     ▼
┌─────────────────────────┐
│ Click Payment Card      │
│ to View Details         │
└────┬────────────────────┘
     │
     ├──────────────┬──────────────┐
     ▼              ▼              ▼
┌─────────┐   ┌─────────┐   ┌─────────┐
│ Approve │   │ Reject  │   │  View   │
│ Payment │   │ Payment │   │  Job    │
└────┬────┘   └────┬────┘   └─────────┘
     │              │
     │              ▼
     │         ┌─────────┐
     │         │  Enter  │
     │         │ Reason  │
     │         └────┬────┘
     │              │
     ▼              ▼
┌─────────────────────────┐
│ POST /admin/payments/   │
│ :id/approve|reject      │
└────┬────────────────────┘
     │
     ▼
┌─────────────────────────┐
│ Update Queue            │
│ Show Toast              │
│ Invalidate Cache        │
└─────────────────────────┘
```

### Review Moderation Workflow

```
┌─────────┐
│  Admin  │
└────┬────┘
     │
     ▼
┌─────────────────────────┐
│ Navigate to /admin/     │
│ reviews                 │
└────┬────────────────────┘
     │
     ▼
┌─────────────────────────┐
│ Select Filter:          │
│ • Flagged               │
│ • Unverified            │
│ • All                   │
└────┬────────────────────┘
     │
     ▼
┌─────────────────────────┐
│ Review Grid Displays    │
│ (Card View)             │
└────┬────────────────────┘
     │
     ▼
┌─────────────────────────┐
│ Click Review Card       │
│ → Detail Modal Opens    │
└────┬────────────────────┘
     │
     ├──────────┬──────────┬──────────┐
     ▼          ▼          ▼          ▼
┌─────────┐ ┌───────┐ ┌────────┐ ┌────────┐
│  Edit   │ │Approve│ │ Reject │ │  View  │
│Comment  │ │       │ │        │ │Images  │
└────┬────┘ └───┬───┘ └───┬────┘ └────────┘
     │          │          │
     ▼          ▼          ▼
┌─────────────────────────┐
│ PATCH /admin/reviews/:id│
│ POST .../approve|reject │
└────┬────────────────────┘
     │
     ▼
┌─────────────────────────┐
│ Update Review List      │
│ Show Success Toast      │
│ Close Modal             │
└─────────────────────────┘
```

### Currency Configuration Workflow

```
┌─────────┐
│  Admin  │
└────┬────┘
     │
     ▼
┌─────────────────────────┐
│ Navigate to /admin/     │
│ settings/currency       │
└────┬────────────────────┘
     │
     ▼
┌─────────────────────────┐
│ Currency List Loads     │
│ (Table View)            │
└────┬────────────────────┘
     │
     ├──────────┬──────────┬──────────┐
     ▼          ▼          ▼          ▼
┌─────────┐ ┌───────┐ ┌────────┐ ┌────────┐
│   Add   │ │ Edit  │ │ Toggle │ │  Set   │
│Currency │ │       │ │ Active │ │Default │
└────┬────┘ └───┬───┘ └───┬────┘ └───┬────┘
     │          │          │          │
     ▼          ▼          │          │
┌─────────────────────┐   │          │
│ Currency Form Modal │   │          │
│ • Code (ZAR)        │   │          │
│ • Symbol (R)        │   │          │
│ • Name              │   │          │
│ • Exchange Rate     │   │          │
│   - Manual Input    │   │          │
│   - API Auto-Update │   │          │
│ • Active Toggle     │   │          │
│ • Default Toggle    │   │          │
└────┬────────────────┘   │          │
     │                    │          │
     ▼                    ▼          ▼
┌─────────────────────────────────────┐
│ POST/PUT /admin/settings/currencies │
└────┬────────────────────────────────┘
     │
     ▼
┌─────────────────────────┐
│ Update Currency Table   │
│ Show Success Toast      │
│ Close Modal             │
│ Log to Audit Trail      │
└─────────────────────────┘
```

## Component Interaction Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                     Admin Layout                               │
│  ┌──────────────┐  ┌────────────────────────────────────────┐ │
│  │   Sidebar    │  │            Main Content Area           │ │
│  │              │  │                                        │ │
│  │ • Dashboard  │  │  ┌──────────────────────────────────┐ │ │
│  │ • Users      │  │  │         Page Component           │ │ │
│  │ • Payments   │  │  │  ┌────────────────────────────┐ │ │ │
│  │ • Reviews    │  │  │  │   AdminDataTable           │ │ │ │
│  │ • Moderation │  │  │  │  ┌──────────────────────┐ │ │ │ │
│  │ • Settings   │  │  │  │  │    FilterBar         │ │ │ │ │
│  │ • Financial  │  │  │  │  │ • Role               │ │ │ │ │
│  │              │  │  │  │  │ • Status             │ │ │ │ │
│  └──────────────┘  │  │  │  │ • Search             │ │ │ │ │
│                    │  │  │  └──────────────────────┘ │ │ │ │
│  ┌──────────────┐  │  │  │  ┌──────────────────────┐ │ │ │ │
│  │   Header     │  │  │  │  │    Table Body        │ │ │ │ │
│  │ • Breadcrumb │  │  │  │  │ • Sortable Columns   │ │ │ │ │
│  │ • User Menu  │  │  │  │  │ • Row Selection      │ │ │ │ │
│  │ • Notifs     │  │  │  │  │ • Row Actions        │ │ │ │ │
│  └──────────────┘  │  │  │  └──────────────────────┘ │ │ │ │
│                    │  │  │  ┌──────────────────────┐ │ │ │ │
│                    │  │  │  │    Pagination        │ │ │ │ │
│                    │  │  │  │ • Prev/Next          │ │ │ │ │
│                    │  │  │  │ • Page Size          │ │ │ │ │
│                    │  │  │  └──────────────────────┘ │ │ │ │
│                    │  │  └────────────────────────────┘ │ │ │
│                    │  │                                  │ │ │
│                    │  │  ┌────────────────────────────┐ │ │ │
│                    │  │  │    Action Modals           │ │ │ │
│                    │  │  │ • User Detail              │ │ │ │
│                    │  │  │ • Approval Form            │ │ │ │
│                    │  │  │ • Confirmation Dialog      │ │ │ │
│                    │  │  └────────────────────────────┘ │ │ │
│                    │  └──────────────────────────────────┘ │ │
│                    └────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘

                              │
                              ▼
              ┌───────────────────────────────┐
              │   State Management Layer      │
              │                               │
              │  ┌─────────────────────────┐  │
              │  │    Zustand Store        │  │
              │  │ • UI State              │  │
              │  │ • Filters               │  │
              │  │ • Selections            │  │
              │  └─────────────────────────┘  │
              │                               │
              │  ┌─────────────────────────┐  │
              │  │    React Query Cache    │  │
              │  │ • Server Data           │  │
              │  │ • Auto Refetch          │  │
              │  │ • Optimistic Updates    │  │
              │  └─────────────────────────┘  │
              └───────────────────────────────┘
```

## Data Flow Diagram

```
User Interaction
      │
      ▼
┌─────────────┐
│   UI Event  │ (click, change, submit)
└─────┬───────┘
      │
      ▼
┌─────────────┐
│  Component  │ (handler function)
│   Handler   │
└─────┬───────┘
      │
      ├──────────────┬──────────────┐
      │              │              │
      ▼              ▼              ▼
┌──────────┐  ┌──────────┐  ┌──────────┐
│ Update   │  │  API     │  │  Form    │
│ Zustand  │  │  Call    │  │  Submit  │
│  Store   │  │(mutation)│  │          │
└─────┬────┘  └────┬─────┘  └────┬─────┘
      │            │              │
      ▼            ▼              ▼
┌──────────┐  ┌──────────┐  ┌──────────┐
│ Trigger  │  │ React    │  │ Validate │
│ Re-      │  │ Query    │  │   +      │
│ render   │  │ Cache    │  │ Submit   │
└──────────┘  └────┬─────┘  └────┬─────┘
                   │              │
                   ▼              ▼
              ┌─────────────────────┐
              │   Backend API       │
              │  (NestJS)           │
              └─────┬───────────────┘
                    │
                    ▼
              ┌─────────────────────┐
              │   Database          │
              │  (PostgreSQL)       │
              └─────┬───────────────┘
                    │
                    ▼
              ┌─────────────────────┐
              │   Response          │
              └─────┬───────────────┘
                    │
                    ▼
              ┌─────────────────────┐
              │ Update React Query  │
              │ Cache & UI          │
              └─────┬───────────────┘
                    │
                    ▼
              ┌─────────────────────┐
              │   Show Toast        │
              │   Notification      │
              └─────────────────────┘
```

## Responsive Layout Breakpoints

```
Mobile (< 640px)
┌────────────────┐
│   Top Bar      │
│  [≡] Taska     │
├────────────────┤
│                │
│   Content      │
│   (Stacked)    │
│                │
│   • Cards      │
│   • Lists      │
│   • Forms      │
│                │
└────────────────┘

Tablet (640px - 1024px)
┌────────────────────────┐
│     Top Bar            │
│  [≡] Taska    [User]   │
├────────────────────────┤
│           │            │
│  Drawer   │  Content   │
│  (Toggle) │  (2 cols)  │
│           │            │
│  • Nav    │  ┌──┐ ┌──┐ │
│  • Links  │  │  │ │  │ │
│           │  └──┘ └──┘ │
│           │            │
└────────────────────────┘

Desktop (> 1024px)
┌──────────────────────────────────┐
│  Header                   [User] │
│  Breadcrumb > Path > Here        │
├────────┬─────────────────────────┤
│        │                         │
│  Side  │      Main Content       │
│  bar   │      (Grid/Table)       │
│        │                         │
│  Nav   │  ┌────┐ ┌────┐ ┌────┐  │
│  •     │  │Card│ │Card│ │Card│  │
│  •     │  └────┘ └────┘ └────┘  │
│  •     │                         │
│        │  ┌──────────────────┐  │
│        │  │   Data Table     │  │
│        │  │                  │  │
│        │  └──────────────────┘  │
└────────┴─────────────────────────┘
```

## State Update Flow

```
Initial Load
     │
     ▼
┌─────────────┐
│ Page Mounts │
└─────┬───────┘
      │
      ▼
┌─────────────┐
│ useQuery    │
│ Executes    │
└─────┬───────┘
      │
      ▼
┌─────────────┐
│ Loading     │
│ State = true│
└─────┬───────┘
      │
      ▼
┌─────────────┐
│ API Call    │
└─────┬───────┘
      │
      ▼
┌─────────────┐
│ Response    │
│ Received    │
└─────┬───────┘
      │
      ▼
┌─────────────┐
│ Cache       │
│ Updated     │
└─────┬───────┘
      │
      ▼
┌─────────────┐
│ Component   │
│ Re-renders  │
└─────┬───────┘
      │
      ▼
┌─────────────┐
│ Data        │
│ Displayed   │
└─────────────┘

User Action (Mutation)
     │
     ▼
┌─────────────┐
│ useMutation │
│ Called      │
└─────┬───────┘
      │
      ▼
┌─────────────┐
│ Optimistic  │
│ Update UI   │
└─────┬───────┘
      │
      ▼
┌─────────────┐
│ API Call    │
└─────┬───────┘
      │
      ├─────────┬─────────┐
      │         │         │
   Success   Error    Loading
      │         │         │
      ▼         ▼         ▼
┌─────────┐ ┌───────┐ ┌───────┐
│Invalidate│ │Rollback│ │ Show  │
│ Queries │ │  UI    │ │Spinner│
└────┬────┘ └───┬───┘ └───────┘
     │          │
     ▼          ▼
┌─────────┐ ┌───────┐
│ Refetch │ │ Show  │
│  Data   │ │ Error │
└────┬────┘ └───────┘
     │
     ▼
┌─────────┐
│  Toast  │
│Notification│
└─────────┘
```

## File Organization Visual

```
frontend/src/
│
├─ app/
│  └─ admin/                      [Admin Portal]
│     ├─ layout.tsx               → Shell + Nav
│     ├─ dashboard/               → Overview
│     ├─ users/                   → User Mgmt
│     │  ├─ page.tsx
│     │  ├─ [id]/page.tsx
│     │  └─ components/
│     ├─ clients/                 → Client Mgmt
│     ├─ payments/                → Payment Approval
│     │  ├─ page.tsx
│     │  └─ escrow/
│     ├─ reviews/                 → Review Moderation
│     ├─ moderation/              → Content Mod
│     ├─ settings/                → Configuration
│     │  ├─ page.tsx             → Settings Hub
│     │  ├─ currency/            → Currency Config
│     │  ├─ maps/                → Map API Config
│     │  ├─ escrow/              → Escrow Config
│     │  └─ components/
│     └─ financial/               → Financial Dashboard
│
├─ components/
│  ├─ admin/                      [Shared Admin Components]
│  │  ├─ AdminDataTable.tsx      → Reusable table
│  │  ├─ AdminStatCard.tsx       → Metric cards
│  │  ├─ ApprovalQueueCard.tsx   → Approval workflow
│  │  ├─ SettingsPanel.tsx       → Settings layout
│  │  ├─ AuditLogViewer.tsx      → Activity logs
│  │  ├─ ExportButton.tsx        → Data export
│  │  └─ DateRangePicker.tsx     → Date selection
│  │
│  ├─ ui/                         [Base UI Components]
│  │  ├─ button.tsx
│  │  ├─ card.tsx
│  │  ├─ dialog.tsx
│  │  ├─ input.tsx
│  │  └─ ...
│  │
│  └─ providers/                  [Context Providers]
│     ├─ auth-provider.tsx
│     ├─ query-provider.tsx
│     └─ theme-provider.tsx
│
├─ lib/
│  ├─ api/                        [API Clients]
│  │  └─ admin.ts                → Admin endpoints
│  │
│  ├─ validations/                [Zod Schemas]
│  │  └─ admin.ts                → Admin validations
│  │
│  └─ utils.ts                    [Utilities]
│
├─ hooks/                         [Custom Hooks]
│  ├─ useAdminData.ts            → Admin queries
│  ├─ useUserActions.ts          → User mutations
│  └─ usePaymentApproval.ts      → Payment mutations
│
└─ stores/                        [Zustand Stores]
   ├─ adminStore.ts              → Admin UI state
   └─ authStore.ts               → Auth state
```

## Security Flow

```
┌──────────┐
│  Admin   │
│  Login   │
└────┬─────┘
     │
     ▼
┌─────────────────┐
│ POST /auth/login│
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│ Verify Credentials│
│ Check Role=ADMIN│
└────┬────────────┘
     │
     ├─────────────┬──────────────┐
     │             │              │
  Success       Invalid       Not Admin
     │             │              │
     ▼             ▼              ▼
┌─────────┐   ┌────────┐    ┌─────────┐
│ Return  │   │ Return │    │ Return  │
│ Tokens  │   │  401   │    │  403    │
└────┬────┘   └────────┘    └─────────┘
     │
     ▼
┌─────────────────┐
│ Store Tokens    │
│ localStorage    │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│ Redirect to     │
│ /admin/dashboard│
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│ Protected Route │
│ Check:          │
│ • Token exists  │
│ • Role = ADMIN  │
│ • Not expired   │
└────┬────────────┘
     │
     ├────────────┬────────────┐
     │            │            │
  Valid       Expired      No Token
     │            │            │
     ▼            ▼            ▼
┌─────────┐  ┌────────┐  ┌──────────┐
│ Allow   │  │Refresh │  │ Redirect │
│ Access  │  │ Token  │  │ to Login │
└─────────┘  └────┬───┘  └──────────┘
                  │
                  ▼
            ┌──────────┐
            │ Success? │
            └────┬─────┘
                 │
            ┌────┴────┐
            ▼         ▼
         Success   Failed
            │         │
            ▼         ▼
       ┌─────────┐ ┌──────────┐
       │Continue │ │ Redirect │
       │         │ │ to Login │
       └─────────┘ └──────────┘
```

This visual guide provides diagrams and flowcharts to help understand the admin portal architecture, user flows, component interactions, and data management patterns.
