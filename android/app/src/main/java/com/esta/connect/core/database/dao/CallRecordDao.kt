package com.esta.connect.core.database.dao

import androidx.room.Dao
import androidx.room.Query
import androidx.room.Upsert
import com.esta.connect.core.database.entity.CallRecordEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface CallRecordDao {

    @Upsert
    suspend fun upsert(record: CallRecordEntity)

    @Upsert
    suspend fun upsertAll(records: List<CallRecordEntity>)

    @Query("SELECT * FROM call_records ORDER BY startedAt DESC LIMIT 200")
    fun getAll(): Flow<List<CallRecordEntity>>

    @Query("SELECT * FROM call_records WHERE status = 'MISSED' ORDER BY startedAt DESC")
    fun getMissed(): Flow<List<CallRecordEntity>>

    @Query("SELECT COUNT(*) FROM call_records WHERE status = 'MISSED' AND isSeen = 0")
    fun getUnseenMissedCount(): Flow<Int>

    @Query("UPDATE call_records SET isSeen = 1 WHERE status = 'MISSED'")
    suspend fun markAllMissedSeen()

    @Query("DELETE FROM call_records WHERE startedAt < :beforeTimestamp")
    suspend fun deleteOlderThan(beforeTimestamp: Long)
}
