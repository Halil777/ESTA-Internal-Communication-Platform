package com.esta.connect.domain.repository

import com.esta.connect.core.network.NetworkResult
import com.esta.connect.domain.model.CallRecord
import kotlinx.coroutines.flow.Flow

interface CallRepository {
    fun getCallHistory(): Flow<List<CallRecord>>
    fun getMissedCalls(): Flow<List<CallRecord>>
    suspend fun syncCallHistory(): NetworkResult<Unit>
    suspend fun saveCallRecord(record: CallRecord)
    suspend fun markMissedCallsSeen()
    fun getUnseenMissedCallCount(): Flow<Int>
}
