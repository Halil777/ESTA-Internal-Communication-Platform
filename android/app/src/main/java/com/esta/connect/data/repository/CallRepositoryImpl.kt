package com.esta.connect.data.repository

import com.esta.connect.core.database.dao.CallRecordDao
import com.esta.connect.core.network.NetworkResult
import com.esta.connect.core.network.api.EstaApiService
import com.esta.connect.core.network.safeApiCall
import com.esta.connect.data.mapper.toDomain
import com.esta.connect.data.mapper.toEntity
import com.esta.connect.domain.model.CallRecord
import com.esta.connect.domain.model.isMissed
import com.esta.connect.domain.repository.CallRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject

class CallRepositoryImpl @Inject constructor(
    private val callRecordDao: CallRecordDao,
    private val apiService: EstaApiService,
) : CallRepository {

    override fun getCallHistory(): Flow<List<CallRecord>> =
        callRecordDao.getAll().map { list -> list.map { it.toDomain() } }

    override fun getMissedCalls(): Flow<List<CallRecord>> =
        callRecordDao.getMissed().map { list -> list.map { it.toDomain() } }

    override suspend fun syncCallHistory(): NetworkResult<Unit> = safeApiCall {
        val records = apiService.getCallHistory()
        callRecordDao.upsertAll(records.map { it.toEntity() })
    }

    override suspend fun saveCallRecord(record: CallRecord) {
        callRecordDao.upsert(record.toEntity())
    }

    override suspend fun markMissedCallsSeen() {
        callRecordDao.markAllMissedSeen()
    }

    override fun getUnseenMissedCallCount(): Flow<Int> =
        callRecordDao.getUnseenMissedCount()

    private fun CallRecord.toEntity() = com.esta.connect.core.database.entity.CallRecordEntity(
        id = id,
        callUuid = callUuid,
        direction = direction.name,
        status = status.name,
        remoteContactId = remoteContact?.id,
        remoteExtension = remoteExtension,
        remoteName = remoteName,
        startedAt = startedAt.toEpochMilli(),
        answeredAt = answeredAt?.toEpochMilli(),
        endedAt = endedAt?.toEpochMilli(),
        durationSeconds = durationSeconds,
        failureReason = failureReason,
        isSeen = !isMissed,
    )
}
