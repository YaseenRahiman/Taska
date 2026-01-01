package za.co.taska.data.remote.api

import retrofit2.Response
import retrofit2.http.*
import za.co.taska.data.remote.dto.request.*
import za.co.taska.data.remote.dto.response.*

/**
 * Monetization API Service
 * Retrofit interface for credits, boosts, and level endpoints
 */
interface MonetizationApiService {

    // ========== CREDITS ENDPOINTS ==========

    @GET("credits/balance")
    suspend fun getCreditBalance(): Response<CreditBalanceResponse>

    @GET("credits/bundles")
    suspend fun getCreditBundles(): Response<List<CreditBundleResponse>>

    @POST("credits/purchase")
    suspend fun purchaseCredits(
        @Body request: PurchaseCreditsRequest
    ): Response<PurchaseResultResponse>

    @POST("credits/redeem-voucher")
    suspend fun redeemVoucher(
        @Body request: RedeemVoucherRequest
    ): Response<VoucherRedemptionResponse>

    @POST("credits/spend")
    suspend fun spendCredits(
        @Body request: SpendCreditsRequest
    ): Response<PurchaseResultResponse>

    @POST("credits/convert-from-wallet")
    suspend fun convertWalletToCredits(
        @Body request: ConvertWalletToCreditsRequest
    ): Response<PurchaseResultResponse>

    @POST("credits/auto-topup")
    suspend fun configureAutoTopUp(
        @Body request: ConfigureAutoTopUpRequest
    ): Response<CreditBalanceResponse>

    @GET("credits/transactions")
    suspend fun getCreditTransactions(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20,
        @Query("type") type: String? = null
    ): Response<PaginatedCreditTransactionsResponse>

    @GET("credits/action-costs")
    suspend fun getActionCosts(): Response<CreditActionCostsResponse>

    // ========== BOOSTS ENDPOINTS ==========

    @GET("boosts/configs")
    suspend fun getBoostConfigs(): Response<List<BoostConfigResponse>>

    @GET("boosts/active")
    suspend fun getActiveBoost(): Response<ActiveBoostResponse>

    @GET("boosts/percentage")
    suspend fun getBoostPercentage(): Response<BoostPercentageResponse>

    @POST("boosts/activate")
    suspend fun activateBoost(
        @Body request: ActivateBoostRequest
    ): Response<BoostActivationResponse>

    @GET("boosts/history")
    suspend fun getBoostHistory(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 10
    ): Response<PaginatedBoostHistoryResponse>

    @GET("boosts/featured")
    suspend fun hasFeaturedBadge(): Response<FeaturedBadgeResponse>

    // ========== ARTISAN LEVELS ENDPOINTS ==========

    @GET("artisan-levels/my-level")
    suspend fun getMyLevel(): Response<ArtisanLevelResponse>

    @GET("artisan-levels/user/{userId}")
    suspend fun getUserLevel(
        @Path("userId") userId: String
    ): Response<ArtisanLevelResponse>

    @GET("artisan-levels/fee-rate")
    suspend fun getFeeRate(): Response<FeeRateResponse>

    @GET("artisan-levels/level-configs")
    suspend fun getLevelConfigs(): Response<List<LevelConfigResponse>>

    @GET("artisan-levels/level-history")
    suspend fun getLevelHistory(): Response<List<ArtisanLevelResponse>>

    @POST("artisan-levels/use-free-bid")
    suspend fun useFreeBid(): Response<FreeBidUsageResponse>

    @POST("artisan-levels/use-free-boost")
    suspend fun useFreeBoost(): Response<FreeBoostUsageResponse>

    @POST("artisan-levels/request-verification")
    suspend fun requestVerification(
        @Body request: RequestVerificationRequest
    ): Response<MessageResponse>
}
