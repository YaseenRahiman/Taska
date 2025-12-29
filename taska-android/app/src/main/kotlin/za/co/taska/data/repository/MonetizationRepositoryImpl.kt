package za.co.taska.data.repository

import za.co.taska.data.mapper.toDomain
import za.co.taska.data.remote.api.MonetizationApiService
import za.co.taska.data.remote.dto.request.*
import za.co.taska.domain.model.*
import za.co.taska.domain.repository.*
import javax.inject.Inject

/**
 * Monetization Repository Implementation
 * Handles all monetization API calls with comprehensive error handling
 */
class MonetizationRepositoryImpl @Inject constructor(
    private val apiService: MonetizationApiService
) : MonetizationRepository {

    // ========== CREDITS OPERATIONS ==========

    override suspend fun getCreditBalance(): Result<CreditWallet> {
        return try {
            val response = apiService.getCreditBalance()
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.toDomain())
            } else {
                Result.failure(Exception(getErrorMessage(response.code(), "fetch credit balance")))
            }
        } catch (e: Exception) {
            Result.failure(Exception("Network error: ${e.message}", e))
        }
    }

    override suspend fun getCreditBundles(): Result<List<CreditBundle>> {
        return try {
            val response = apiService.getCreditBundles()
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.map { it.toDomain() })
            } else {
                Result.failure(Exception(getErrorMessage(response.code(), "fetch credit bundles")))
            }
        } catch (e: Exception) {
            Result.failure(Exception("Network error: ${e.message}", e))
        }
    }

    override suspend fun purchaseCredits(
        bundleId: String,
        purchaseMethod: CreditPurchaseMethod,
        providerTxnId: String?
    ): Result<CreditWallet> {
        return try {
            val request = PurchaseCreditsRequest(
                bundleId = bundleId,
                purchaseMethod = purchaseMethod.name,
                providerTxnId = providerTxnId
            )
            val response = apiService.purchaseCredits(request)
            if (response.isSuccessful && response.body() != null) {
                // Fetch updated balance after purchase
                getCreditBalance()
            } else {
                val errorMessage = when (response.code()) {
                    400 -> "Invalid purchase request"
                    402 -> "Payment failed"
                    404 -> "Bundle not found"
                    else -> "Failed to purchase credits: ${response.message()}"
                }
                Result.failure(Exception(errorMessage))
            }
        } catch (e: Exception) {
            Result.failure(Exception("Network error: ${e.message}", e))
        }
    }

    override suspend fun redeemVoucher(voucherCode: String): Result<VoucherResult> {
        return try {
            val request = RedeemVoucherRequest(voucherCode = voucherCode)
            val response = apiService.redeemVoucher(request)
            if (response.isSuccessful && response.body() != null) {
                val body = response.body()!!
                Result.success(
                    VoucherResult(
                        success = body.success,
                        creditsAwarded = body.creditsAwarded ?: 0,
                        newBalance = body.newBalance ?: 0,
                        message = body.message ?: "Voucher redeemed successfully"
                    )
                )
            } else {
                val errorMessage = when (response.code()) {
                    400 -> "Invalid voucher code"
                    404 -> "Voucher not found"
                    409 -> "Voucher has already been used"
                    410 -> "Voucher has expired"
                    else -> "Failed to redeem voucher: ${response.message()}"
                }
                Result.failure(Exception(errorMessage))
            }
        } catch (e: Exception) {
            Result.failure(Exception("Network error: ${e.message}", e))
        }
    }

    override suspend fun spendCredits(
        action: CreditAction,
        reference: String?
    ): Result<CreditWallet> {
        return try {
            val request = SpendCreditsRequest(
                action = action.name,
                reference = reference
            )
            val response = apiService.spendCredits(request)
            if (response.isSuccessful && response.body() != null) {
                getCreditBalance()
            } else {
                val errorMessage = when (response.code()) {
                    400 -> "Invalid spend request"
                    402 -> "Insufficient credits"
                    else -> "Failed to spend credits: ${response.message()}"
                }
                Result.failure(Exception(errorMessage))
            }
        } catch (e: Exception) {
            Result.failure(Exception("Network error: ${e.message}", e))
        }
    }

    override suspend fun convertWalletToCredits(amountZar: Double): Result<CreditWallet> {
        return try {
            val request = ConvertWalletToCreditsRequest(amountZar = amountZar)
            val response = apiService.convertWalletToCredits(request)
            if (response.isSuccessful) {
                getCreditBalance()
            } else {
                val errorMessage = when (response.code()) {
                    400 -> "Invalid conversion amount"
                    402 -> "Insufficient wallet balance"
                    else -> "Failed to convert wallet: ${response.message()}"
                }
                Result.failure(Exception(errorMessage))
            }
        } catch (e: Exception) {
            Result.failure(Exception("Network error: ${e.message}", e))
        }
    }

    override suspend fun configureAutoTopUp(
        enabled: Boolean,
        threshold: Int?,
        amount: Int?,
        source: AutoTopUpSource?
    ): Result<CreditWallet> {
        return try {
            val request = ConfigureAutoTopUpRequest(
                enabled = enabled,
                threshold = threshold,
                amount = amount,
                source = source?.name
            )
            val response = apiService.configureAutoTopUp(request)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.toDomain())
            } else {
                Result.failure(Exception("Failed to configure auto top-up: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(Exception("Network error: ${e.message}", e))
        }
    }

    override suspend fun getCreditTransactions(
        page: Int,
        limit: Int,
        type: CreditTransactionType?
    ): Result<PaginatedTransactions> {
        return try {
            val response = apiService.getCreditTransactions(
                page = page,
                limit = limit,
                type = type?.name
            )
            if (response.isSuccessful && response.body() != null) {
                val body = response.body()!!
                Result.success(
                    PaginatedTransactions(
                        transactions = body.data.map { it.toDomain() },
                        total = body.total,
                        page = body.page,
                        limit = body.limit,
                        totalPages = body.totalPages
                    )
                )
            } else {
                Result.failure(Exception(getErrorMessage(response.code(), "fetch transactions")))
            }
        } catch (e: Exception) {
            Result.failure(Exception("Network error: ${e.message}", e))
        }
    }

    override suspend fun getActionCosts(): Result<Map<CreditAction, Int>> {
        return try {
            val response = apiService.getActionCosts()
            if (response.isSuccessful && response.body() != null) {
                val body = response.body()!!
                Result.success(
                    mapOf(
                        CreditAction.BID to body.bid,
                        CreditAction.BOOST to body.boost,
                        CreditAction.SUPER_BOOST to body.superBoost,
                        CreditAction.FEATURE_PROFILE to body.featureProfile,
                        CreditAction.UNLOCK_CONTACT to body.unlockContact,
                        CreditAction.JOB_ALERT to body.jobAlert
                    )
                )
            } else {
                Result.failure(Exception(getErrorMessage(response.code(), "fetch action costs")))
            }
        } catch (e: Exception) {
            Result.failure(Exception("Network error: ${e.message}", e))
        }
    }

    // ========== BOOSTS OPERATIONS ==========

    override suspend fun getBoostConfigs(): Result<List<BoostConfig>> {
        return try {
            val response = apiService.getBoostConfigs()
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.map { it.toDomain() })
            } else {
                Result.failure(Exception(getErrorMessage(response.code(), "fetch boost configs")))
            }
        } catch (e: Exception) {
            Result.failure(Exception("Network error: ${e.message}", e))
        }
    }

    override suspend fun getActiveBoost(): Result<ProfileBoost?> {
        return try {
            val response = apiService.getActiveBoost()
            if (response.isSuccessful && response.body() != null) {
                val body = response.body()!!
                Result.success(body.boost?.toDomain())
            } else {
                Result.failure(Exception(getErrorMessage(response.code(), "fetch active boost")))
            }
        } catch (e: Exception) {
            Result.failure(Exception("Network error: ${e.message}", e))
        }
    }

    override suspend fun getBoostPercentage(): Result<Int> {
        return try {
            val response = apiService.getBoostPercentage()
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.boostPercentage)
            } else {
                Result.failure(Exception(getErrorMessage(response.code(), "fetch boost percentage")))
            }
        } catch (e: Exception) {
            Result.failure(Exception("Network error: ${e.message}", e))
        }
    }

    override suspend fun activateBoost(
        boostType: BoostType,
        useFreeBoost: Boolean
    ): Result<ProfileBoost> {
        return try {
            val request = ActivateBoostRequest(
                boostType = boostType.name,
                useFreeBoost = useFreeBoost
            )
            val response = apiService.activateBoost(request)
            if (response.isSuccessful && response.body() != null) {
                val body = response.body()!!
                if (body.success && body.boost != null) {
                    Result.success(body.boost.toDomain())
                } else {
                    Result.failure(Exception(body.message))
                }
            } else {
                val errorMessage = when (response.code()) {
                    400 -> "Cannot activate boost - you may already have an active boost"
                    402 -> "Insufficient credits for boost"
                    else -> "Failed to activate boost: ${response.message()}"
                }
                Result.failure(Exception(errorMessage))
            }
        } catch (e: Exception) {
            Result.failure(Exception("Network error: ${e.message}", e))
        }
    }

    override suspend fun getBoostHistory(page: Int, limit: Int): Result<List<ProfileBoost>> {
        return try {
            val response = apiService.getBoostHistory(page, limit)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.data.map { it.toDomain() })
            } else {
                Result.failure(Exception(getErrorMessage(response.code(), "fetch boost history")))
            }
        } catch (e: Exception) {
            Result.failure(Exception("Network error: ${e.message}", e))
        }
    }

    override suspend fun hasFeaturedBadge(): Result<Boolean> {
        return try {
            val response = apiService.hasFeaturedBadge()
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.hasFeaturedBadge)
            } else {
                Result.failure(Exception(getErrorMessage(response.code(), "check featured badge")))
            }
        } catch (e: Exception) {
            Result.failure(Exception("Network error: ${e.message}", e))
        }
    }

    // ========== LEVEL OPERATIONS ==========

    override suspend fun getMyLevel(): Result<ArtisanLevel> {
        return try {
            val response = apiService.getMyLevel()
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.toDomain())
            } else {
                Result.failure(Exception(getErrorMessage(response.code(), "fetch your level")))
            }
        } catch (e: Exception) {
            Result.failure(Exception("Network error: ${e.message}", e))
        }
    }

    override suspend fun getUserLevel(userId: String): Result<ArtisanLevel> {
        return try {
            val response = apiService.getUserLevel(userId)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.toDomain())
            } else {
                Result.failure(Exception(getErrorMessage(response.code(), "fetch user level")))
            }
        } catch (e: Exception) {
            Result.failure(Exception("Network error: ${e.message}", e))
        }
    }

    override suspend fun getFeeRate(): Result<FeeInfo> {
        return try {
            val response = apiService.getFeeRate()
            if (response.isSuccessful && response.body() != null) {
                val body = response.body()!!
                Result.success(
                    FeeInfo(
                        feePercent = body.feePercent,
                        sampleJobAmount = body.sampleFee.jobAmount,
                        sampleFeeAmount = body.sampleFee.feeAmount
                    )
                )
            } else {
                Result.failure(Exception(getErrorMessage(response.code(), "fetch fee rate")))
            }
        } catch (e: Exception) {
            Result.failure(Exception("Network error: ${e.message}", e))
        }
    }

    override suspend fun getLevelConfigs(): Result<List<LevelRequirement>> {
        return try {
            val response = apiService.getLevelConfigs()
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.map { it.toDomain() })
            } else {
                Result.failure(Exception(getErrorMessage(response.code(), "fetch level configs")))
            }
        } catch (e: Exception) {
            Result.failure(Exception("Network error: ${e.message}", e))
        }
    }

    override suspend fun getLevelHistory(): Result<List<ArtisanLevel>> {
        return try {
            val response = apiService.getLevelHistory()
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.map { it.toDomain() })
            } else {
                Result.failure(Exception(getErrorMessage(response.code(), "fetch level history")))
            }
        } catch (e: Exception) {
            Result.failure(Exception("Network error: ${e.message}", e))
        }
    }

    override suspend fun useFreeBid(): Result<FreeBidResult> {
        return try {
            val response = apiService.useFreeBid()
            if (response.isSuccessful && response.body() != null) {
                val body = response.body()!!
                Result.success(
                    FreeBidResult(
                        success = body.success,
                        remaining = body.remaining
                    )
                )
            } else {
                val errorMessage = when (response.code()) {
                    400 -> "No free bids available"
                    else -> "Failed to use free bid: ${response.message()}"
                }
                Result.failure(Exception(errorMessage))
            }
        } catch (e: Exception) {
            Result.failure(Exception("Network error: ${e.message}", e))
        }
    }

    override suspend fun useFreeBoost(): Result<FreeBoostResult> {
        return try {
            val response = apiService.useFreeBoost()
            if (response.isSuccessful && response.body() != null) {
                val body = response.body()!!
                Result.success(
                    FreeBoostResult(
                        success = body.success,
                        remaining = body.remaining
                    )
                )
            } else {
                val errorMessage = when (response.code()) {
                    400 -> "No free boosts available"
                    else -> "Failed to use free boost: ${response.message()}"
                }
                Result.failure(Exception(errorMessage))
            }
        } catch (e: Exception) {
            Result.failure(Exception("Network error: ${e.message}", e))
        }
    }

    override suspend fun requestVerification(type: VerificationType): Result<Unit> {
        return try {
            val request = RequestVerificationRequest(
                type = type.name.lowercase()
            )
            val response = apiService.requestVerification(request)
            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                val errorMessage = when (response.code()) {
                    400 -> "Invalid verification request"
                    409 -> "Verification already in progress"
                    else -> "Failed to request verification: ${response.message()}"
                }
                Result.failure(Exception(errorMessage))
            }
        } catch (e: Exception) {
            Result.failure(Exception("Network error: ${e.message}", e))
        }
    }

    // ========== HELPER FUNCTIONS ==========

    private fun getErrorMessage(code: Int, operation: String): String {
        return when (code) {
            401 -> "Please login to $operation"
            403 -> "You don't have permission to $operation"
            404 -> "Resource not found"
            500 -> "Server error while trying to $operation"
            else -> "Failed to $operation"
        }
    }
}
