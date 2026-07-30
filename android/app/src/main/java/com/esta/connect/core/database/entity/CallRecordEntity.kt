package com.esta.connect.core.database.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "call_records")
data class CallRecordEntity(
    @PrimaryKey val id: String,
    val callUuid: String,
    val direction: String,
    val status: String,
    val remoteContactId: String?,
    val remoteExtension: String,
    val remoteName: String?,
    val startedAt: Long,
    val answeredAt: Long?,
    val endedAt: Long?,
    val durationSeconds: Long,
    val failureReason: String?,
    val isSeen: Boolean = true,
)
