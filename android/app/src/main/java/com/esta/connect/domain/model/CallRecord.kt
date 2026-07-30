package com.esta.connect.domain.model

import java.time.Instant

data class CallRecord(
    val id: String,
    val callUuid: String,
    val direction: CallDirection,
    val status: CallStatus,
    val remoteContact: Contact?,
    val remoteExtension: String,
    val remoteName: String?,
    val startedAt: Instant,
    val answeredAt: Instant?,
    val endedAt: Instant?,
    val durationSeconds: Long,
    val failureReason: String?,
)

enum class CallDirection { INCOMING, OUTGOING }

enum class CallStatus {
    COMPLETED, MISSED, REJECTED, BUSY, TIMEOUT, FAILED
}

val CallRecord.isMissed: Boolean get() = status == CallStatus.MISSED
val CallRecord.displayName: String get() = remoteName ?: remoteExtension
