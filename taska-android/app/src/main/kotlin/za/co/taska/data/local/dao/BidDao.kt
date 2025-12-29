package za.co.taska.data.local.dao

import androidx.room.*
import kotlinx.coroutines.flow.Flow
import za.co.taska.data.local.entity.BidEntity

/**
 * Bid DAO
 * Data Access Object for Bid operations
 */
@Dao
interface BidDao {

    @Query("SELECT * FROM bids ORDER BY created_at DESC")
    fun getAllBids(): Flow<List<BidEntity>>

    @Query("SELECT * FROM bids WHERE status = :status ORDER BY created_at DESC")
    fun getBidsByStatus(status: String): Flow<List<BidEntity>>

    @Query("SELECT * FROM bids WHERE id = :bidId")
    suspend fun getBidById(bidId: String): BidEntity?

    @Query("SELECT * FROM bids WHERE sync_status != 'SYNCED'")
    suspend fun getUnsyncedBids(): List<BidEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertBid(bid: BidEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertBids(bids: List<BidEntity>)

    @Update
    suspend fun updateBid(bid: BidEntity)

    @Delete
    suspend fun deleteBid(bid: BidEntity)

    @Query("DELETE FROM bids")
    suspend fun clearAll()
}
