package com.esta.connect.data.remote.dto

data class CallRecordDto(
    val id: String,
    val callUuid: String,
    val direction: String,
    val status: String,
    val remoteContactId: String?,
    val remoteExtension: String,
    val remoteName: String?,
    val startedAt: String,
    val answeredAt: String?,
    val endedAt: String?,
    val durationSeconds: Long,
    val failureReason: String?,
)
