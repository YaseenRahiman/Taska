# Android Payment API Verification Report

## Executive Summary

⚠️ **CRITICAL DISCREPANCIES FOUND**: Your Android `PaymentsApiService.kt` does NOT match the backend API specification. Multiple endpoint mismatches detected.

---

## Backend API Specification (Actual Implementation)

### Base Path
```
/payments
```

### Authentication
- **Required**: JWT Bearer token via `@UseGuards(AuthGuard('jwt'), RolesGuard)`
- **Header**: `Authorization: Bearer <token>`

---

## Endpoint-by-Endpoint Analysis

### 1. ❌ CREATE PAYMENT INTENT (MISMATCH)

**Android (INCORRECT)**:
```kotlin
@POST("payments")
suspend fun initiatePayment(@Body request: CreatePaymentRequest): Response<PaymentResponse>
```

**Backend (ACTUAL)**:
```typescript
@Post('create-intent')
@Roles('CLIENT', 'ADMIN')
async createPaymentIntent(
  @CurrentUser() user: any,
  @Body() createPaymentDto: CreatePaymentDto,
): Promise<PaymentIntent>
```

**Corrections Needed**:
- ❌ Endpoint path: `/payments` → `/payments/create-intent`
- ❌ Response type: `PaymentResponse` → `PaymentIntent`
- ❌ Authorization: Requires CLIENT or ADMIN role

---

### 2. ✅ GET PAYMENT STATUS (CORRECT PATH, WRONG RESPONSE)

**Android**:
```kotlin
@GET("payments/{id}")
suspend fun getPaymentStatus(@Path("id") paymentId: String): Response<PaymentResponse>
```

**Backend**:
```typescript
@Get(':id')
async getPayment(
  @Param('id') paymentId: string,
  @CurrentUser() user: any,
): Promise<PaymentResponse | null>
```

**Status**: ✅ Path correct, ✅ Response type correct
**Note**: Backend validates user authorization (payer or payee only)

---

### 3. ❌ GET PAYMENT BY JOB ID (NOT IN BACKEND)

**Android (NO BACKEND EQUIVALENT)**:
```kotlin
@GET("payments/job/{jobId}")
suspend fun getPaymentByJobId(@Path("jobId") jobId: String): Response<PaymentResponse>
```

**Backend**: **THIS ENDPOINT DOES NOT EXIST**

**Solution**: Remove this endpoint or implement alternative logic using the general payments list endpoint with filtering.

---

### 4. ❌ GET PAYMENT HISTORY (WRONG PATH & PARAMS)

**Android (INCORRECT)**:
```kotlin
@GET("payments/history")
suspend fun getPaymentHistory(
    @Query("page") page: Int,
    @Query("limit") limit: Int
): Response<List<PaymentResponse>>
```

**Backend (ACTUAL)**:
```typescript
@Get()  // Just /payments, not /payments/history
async getUserPayments(
  @CurrentUser() user: any,
  @Query('page') page?: number,
  @Query('limit') limit?: number,
  @Query('type') type?: 'sent' | 'received' | 'all',
)
```

**Corrections Needed**:
- ❌ Path: `/payments/history` → `/payments`
- ❌ Missing query param: `type` ('sent' | 'received' | 'all')
- ❌ Response structure: Returns paginated object, not just array

---

### 5. ⚠️ MISSING ENDPOINTS IN ANDROID

**Backend endpoints NOT in Android**:

1. **Process Successful Payment** (Webhook/Callback)
   ```typescript
   @Post('process-success')
   async processSuccessfulPayment(
     @Body() body: { paymentId: string; providerTxnId: string }
   ): Promise<PaymentResponse>
   ```

2. **Process Failed Payment** (Webhook/Callback)
   ```typescript
   @Post('process-failure')
   async processFailedPayment(
     @Body() body: { paymentId: string; failureReason: string }
   ): Promise<{ success: boolean }>
   ```

3. **Release Payment** (Client/Admin)
   ```typescript
   @Patch(':id/release')
   @Roles('ADMIN', 'CLIENT')
   async releasePayment(
     @Param('id') paymentId: string,
     @CurrentUser() user: any,
   ): Promise<{ success: boolean }>
   ```

4. **Refund Payment** (Admin Only)
   ```typescript
   @Patch(':id/refund')
   @Roles('ADMIN')
   async refundPayment(
     @Param('id') paymentId: string,
     @Body() body: { refundReason: string },
     @CurrentUser() user: any,
   ): Promise<{ success: boolean }>
   ```

5. **Payment Statistics** (Admin Only)
   ```typescript
   @Get('statistics/overview')
   @Roles('ADMIN')
   async getPaymentStatistics()
   ```

6. **Webhook Endpoints**
   - `POST /payments/webhooks/stripe`
   - `POST /payments/webhooks/payfast`

---

## Data Transfer Objects (DTOs)

### CreatePaymentDto (Request)

**Backend Schema**:
```typescript
{
  jobId: string;              // CUID format (e.g., "cmgzjb71a0003aexl2yrhmcbf")
  amount: number;             // Decimal with 2 digits (e.g., 1500.00)
  paymentMethod: PaymentMethod; // Enum
  paymentProvider?: string;   // Optional: 'stripe' or 'payfast'
  metadata?: Record<string, any>; // Optional
}
```

**PaymentMethod Enum**:
```typescript
enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  EFT = 'EFT',
  MOBILE_MONEY = 'MOBILE_MONEY',
  WALLET = 'WALLET'
}
```

---

### PaymentIntent (Response for create-intent)

**Backend Schema**:
```typescript
interface PaymentIntent {
  paymentId: string;
  clientSecret?: string;    // Stripe only
  paymentUrl?: string;      // PayFast only
  amount: number;
  currency: string;         // "ZAR"
}
```

---

### PaymentResponse (Response for get payment)

**Backend Schema**:
```typescript
interface PaymentResponse {
  id: string;
  jobId: string;
  amount: number;           // Base amount (excluding fees)
  totalAmount: number;      // Total including VAT
  platformFee: number;      // Platform fee amount
  vatAmount: number;        // VAT amount
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
  paymentUrl?: string;
  clientSecret?: string;
  providerTxnId: string;
  createdAt: Date;
}
```

---

### Paginated Payments Response (for GET /payments)

**Backend Schema**:
```typescript
{
  payments: PaymentResponse[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

---

## Business Rules & Fees

### Platform Fee
```typescript
DEFAULT: 10%
Location: payments.service.ts:579
Method: calculatePlatformFee(amount, feePercentage = 10)
```
⚠️ **Your Android assumption of 15% is INCORRECT**

**Fee Calculation**:
```typescript
platformFee = Math.round((amount * 10 / 100) * 100) / 100
```

---

### VAT
```typescript
RATE: 15% (South African VAT)
Location: payments.service.ts:586
Method: calculateVAT(amount, vatRate = 15)
```
✅ **Your 15% assumption is correct, but it's VAT, not platform fee**

**VAT Calculation**:
```typescript
vatAmount = Math.round((amount * 15 / 100) * 100) / 100
```

---

### Total Amount Calculation

```typescript
totalAmount = amount + vatAmount
// Platform fee is deducted from amount during payout, NOT added to client charge
```

**Example Calculation**:
- Job Amount: R1,000.00
- VAT (15%): R150.00
- **Client Pays**: R1,150.00
- Platform Fee (10%): R100.00 (deducted from R1,000)
- **Artisan Receives**: R900.00

---

## Payment Methods Supported

From `create-payment.dto.ts`:

```typescript
enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',     // Stripe
  DEBIT_CARD = 'DEBIT_CARD',       // Stripe
  EFT = 'EFT',                     // PayFast
  MOBILE_MONEY = 'MOBILE_MONEY',   // PayFast
  WALLET = 'WALLET'                // Not implemented yet
}
```

**Payment Provider Routing**:
- `CREDIT_CARD` | `DEBIT_CARD` → **Stripe**
- `EFT` | `MOBILE_MONEY` → **PayFast**
- `WALLET` → Throws "Unsupported payment method"

---

## Payment Flow

### 1. Create Payment Intent
```
Client → POST /payments/create-intent
Backend:
  1. Validates job exists and user is client
  2. Validates job status is OPEN
  3. Finds accepted bid
  4. Calculates fees (10% platform + 15% VAT)
  5. Creates escrow account (Payment record)
  6. Routes to Stripe or PayFast
  7. Returns PaymentIntent with clientSecret or paymentUrl
```

### 2. Payment Processing
```
Stripe: Client uses clientSecret in Stripe SDK
PayFast: Client redirects to paymentUrl

Success → Webhook → POST /payments/process-success
Failure → Webhook → POST /payments/process-failure
```

### 3. Successful Payment
```
Backend:
  1. Updates Payment status to COMPLETED
  2. Sets paidAt timestamp
  3. Updates Job status to IN_PROGRESS
  4. Creates ActivityLog
  5. Sends notifications to both client and artisan
```

### 4. Payment Release (Job Completion)
```
Client/Admin → PATCH /payments/{id}/release
Backend:
  1. Validates escrow status is HELD
  2. Calculates artisan payout (amount - platform fee)
  3. Updates escrow status to RELEASED
  4. Credits artisan wallet
  5. Creates WalletTransaction
  6. Updates Job status to COMPLETED
  7. Sends notification to artisan
```

---

## Escrow System

All payments are held in escrow until job completion:

**Escrow Statuses**:
```typescript
enum EscrowStatus {
  HELD = 'HELD',           // Funds held, job in progress
  RELEASED = 'RELEASED',   // Funds released to artisan
  DISPUTED = 'DISPUTED',   // Payment disputed
  REFUNDED = 'REFUNDED'    // Funds refunded to client
}
```

**Key Points**:
- Funds are held when payment is successful
- Released when client marks job complete OR admin releases
- Can be refunded if job is cancelled (admin only)
- Can be disputed by either party

---

## Database Schema (Prisma)

**Payment Model**:
```prisma
model Payment {
  id              String        @id @default(cuid())
  jobId           String
  payerId         String        // Client ID
  payeeId         String        // Artisan ID
  amount          Decimal       @db.Decimal(10,2)
  platformFee     Decimal       @db.Decimal(10,2)
  vatAmount       Decimal       @db.Decimal(10,2)
  totalAmount     Decimal       @db.Decimal(10,2)
  currency        String        @default("ZAR")
  paymentMethod   PaymentMethod
  paymentProvider String        // "stripe" or "payfast"
  providerTxnId   String        // External transaction ID
  status          PaymentStatus @default(PENDING)
  escrowStatus    EscrowStatus  @default(HELD)
  paidAt          DateTime?
  releasedAt      DateTime?
  refundedAt      DateTime?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
}
```

---

## Corrected Android API Service

```kotlin
import retrofit2.Response
import retrofit2.http.*

interface PaymentsApiService {

    // 1. Create payment intent
    @POST("payments/create-intent")
    suspend fun createPaymentIntent(
        @Body request: CreatePaymentRequest
    ): Response<PaymentIntent>

    // 2. Get payment status
    @GET("payments/{id}")
    suspend fun getPayment(
        @Path("id") paymentId: String
    ): Response<PaymentResponse>

    // 3. Get user payments (paginated)
    @GET("payments")
    suspend fun getUserPayments(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20,
        @Query("type") type: String = "all" // "sent", "received", "all"
    ): Response<PaginatedPaymentsResponse>

    // 4. Release payment (job completion)
    @PATCH("payments/{id}/release")
    suspend fun releasePayment(
        @Path("id") paymentId: String
    ): Response<SuccessResponse>

    // 5. Process successful payment (webhook callback)
    @POST("payments/process-success")
    suspend fun processSuccessfulPayment(
        @Body request: PaymentSuccessRequest
    ): Response<PaymentResponse>

    // 6. Process failed payment (webhook callback)
    @POST("payments/process-failure")
    suspend fun processFailedPayment(
        @Body request: PaymentFailureRequest
    ): Response<SuccessResponse>
}
```

---

## Corrected Kotlin Data Classes

```kotlin
// Request DTOs
data class CreatePaymentRequest(
    val jobId: String,
    val amount: Double,
    val paymentMethod: PaymentMethod,
    val paymentProvider: String? = null,
    val metadata: Map<String, Any>? = null
)

enum class PaymentMethod {
    CREDIT_CARD,
    DEBIT_CARD,
    EFT,
    MOBILE_MONEY,
    WALLET
}

data class PaymentSuccessRequest(
    val paymentId: String,
    val providerTxnId: String
)

data class PaymentFailureRequest(
    val paymentId: String,
    val failureReason: String
)

// Response DTOs
data class PaymentIntent(
    val paymentId: String,
    val clientSecret: String?,  // Stripe only
    val paymentUrl: String?,    // PayFast only
    val amount: Double,
    val currency: String
)

data class PaymentResponse(
    val id: String,
    val jobId: String,
    val amount: Double,
    val totalAmount: Double,
    val platformFee: Double,
    val vatAmount: Double,
    val status: PaymentStatus,
    val paymentUrl: String? = null,
    val clientSecret: String? = null,
    val providerTxnId: String,
    val createdAt: String  // ISO 8601 format
)

enum class PaymentStatus {
    PENDING,
    PROCESSING,
    COMPLETED,
    FAILED,
    CANCELLED,
    REFUNDED
}

data class PaginatedPaymentsResponse(
    val payments: List<PaymentResponse>,
    val totalCount: Int,
    val page: Int,
    val limit: Int,
    val totalPages: Int
)

data class SuccessResponse(
    val success: Boolean
)
```

---

## Security & Authorization

### Role Requirements

| Endpoint | Required Role |
|----------|---------------|
| POST /payments/create-intent | CLIENT, ADMIN |
| GET /payments/:id | Any authenticated (with ownership check) |
| GET /payments | Any authenticated |
| PATCH /payments/:id/release | CLIENT, ADMIN |
| PATCH /payments/:id/refund | ADMIN only |
| GET /payments/statistics/overview | ADMIN only |

### Ownership Validation

Backend validates:
- User can only create payments for their own jobs
- User can only view payments they're involved in (payer or payee)
- Only job client or admin can release payment
- Only admin can refund payment

---

## Testing Requirements

### 1. Unit Tests Needed
- Fee calculations (10% platform, 15% VAT)
- Payment method routing (Stripe vs PayFast)
- Authorization checks
- Escrow state transitions

### 2. Integration Tests Needed
- Complete payment flow (create → process → release)
- Failed payment handling
- Refund flow
- Webhook processing

### 3. Edge Cases to Test
- Multiple payments for same job (should fail)
- Release payment before successful payment
- Refund after release (should fail)
- Invalid payment method

---

## Action Items

### Immediate (Critical)
1. ✅ Update endpoint path: `/payments` → `/payments/create-intent`
2. ✅ Remove non-existent endpoint: `/payments/job/{jobId}`
3. ✅ Fix history endpoint: `/payments/history` → `/payments`
4. ✅ Update response types: Add `PaymentIntent`, fix `PaginatedPaymentsResponse`
5. ✅ Correct platform fee: 15% → 10%
6. ✅ Clarify VAT vs platform fee in calculations

### High Priority
1. ⚡ Add missing endpoints: `release`, `process-success`, `process-failure`
2. ⚡ Implement payment webhook handling in Android
3. ⚡ Add `type` query parameter to payments list
4. ⚡ Handle nullable response for GET payment (404 case)

### Medium Priority
1. 🔧 Add admin payment statistics endpoint
2. 🔧 Implement payment dispute flow
3. 🔧 Add wallet payment method support

---

## Summary

| Category | Status |
|----------|--------|
| **Endpoint Accuracy** | ❌ 40% match (2/5 correct) |
| **DTO Structures** | ❌ Needs major updates |
| **Business Logic** | ⚠️ Platform fee incorrect |
| **Payment Methods** | ✅ Supported correctly |
| **Authentication** | ✅ JWT Bearer understood |
| **Escrow System** | ℹ️ Not implemented in Android |

**Overall Assessment**: 🔴 **MAJOR REFACTORING REQUIRED**

---

## Files to Update

1. **PaymentsApiService.kt** - Complete rewrite needed
2. **Payment DTOs** - Add missing classes, update existing
3. **Payment enums** - Match backend exactly
4. **Payment Repository** - Update to use corrected endpoints
5. **Payment ViewModel** - Handle new response structures

---

## Contact Backend Team About

1. ❓ Why is there no GET /payments/job/{jobId} endpoint?
2. ❓ Should Android handle webhooks or just poll payment status?
3. ❓ What's the expected flow for payment disputes in mobile app?
4. ❓ Is WALLET payment method roadmap or should we remove it?

---

**Generated**: 2025-10-31
**Backend Version**: Based on current implementation
**Android Version**: Taska Android Client Portal
