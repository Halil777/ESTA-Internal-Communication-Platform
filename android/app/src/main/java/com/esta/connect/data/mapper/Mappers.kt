package com.esta.connect.data.mapper

import com.esta.connect.core.database.entity.CallRecordEntity
import com.esta.connect.core.database.entity.ContactEntity
import com.esta.connect.data.remote.dto.CallRecordDto
import com.esta.connect.data.remote.dto.ContactDto
import com.esta.connect.data.remote.dto.DepartmentDto
import com.esta.connect.data.remote.dto.SipProvisioningDto
import com.esta.connect.domain.model.CallDirection
import com.esta.connect.domain.model.CallRecord
import com.esta.connect.domain.model.CallStatus
import com.esta.connect.domain.model.Contact
import com.esta.connect.domain.model.Department
import com.esta.connect.domain.model.SipAccount
import com.esta.connect.domain.model.SipTransport
import com.esta.connect.domain.model.UserStatus
import java.time.Instant

fun ContactDto.toEntity(isFavorite: Boolean = false) = ContactEntity(
    id = id,
    firstName = firstName,
    lastName = lastName,
    extension = extension,
    departmentId = department?.id,
    departmentName = department?.name,
    cabinet = cabinet,
    status = status,
    avatarUrl = avatarUrl,
    isFavorite = isFavorite,
)

fun ContactEntity.toDomain() = Contact(
    id = id,
    firstName = firstName,
    lastName = lastName,
    extension = extension,
    department = departmentId?.let { deptId ->
        Department(
            id = deptId,
            name = departmentName ?: "",
            code = "",
            floor = null,
            groupExtension = null,
        )
    },
    cabinet = cabinet,
    status = status.toUserStatus(),
    avatarUrl = avatarUrl,
    isFavorite = isFavorite,
)

fun DepartmentDto.toDomain() = Department(
    id = id,
    name = name,
    code = code,
    floor = floor,
    memberCount = memberCount,
    groupExtension = groupExtension,
)

fun CallRecordDto.toEntity() = CallRecordEntity(
    id = id,
    callUuid = callUuid,
    direction = direction,
    status = status,
    remoteContactId = remoteContactId,
    remoteExtension = remoteExtension,
    remoteName = remoteName,
    startedAt = runCatching { Instant.parse(startedAt).toEpochMilli() }.getOrDefault(0L),
    answeredAt = answeredAt?.let { runCatching { Instant.parse(it).toEpochMilli() }.getOrNull() },
    endedAt = endedAt?.let { runCatching { Instant.parse(it).toEpochMilli() }.getOrNull() },
    durationSeconds = durationSeconds,
    failureReason = failureReason,
    isSeen = true,
)

fun CallRecordEntity.toDomain() = CallRecord(
    id = id,
    callUuid = callUuid,
    direction = if (direction == "INCOMING") CallDirection.INCOMING else CallDirection.OUTGOING,
    status = status.toCallStatus(),
    remoteContact = null,
    remoteExtension = remoteExtension,
    remoteName = remoteName,
    startedAt = Instant.ofEpochMilli(startedAt),
    answeredAt = answeredAt?.let { Instant.ofEpochMilli(it) },
    endedAt = endedAt?.let { Instant.ofEpochMilli(it) },
    durationSeconds = durationSeconds,
    failureReason = failureReason,
)

fun SipProvisioningDto.toDomain() = SipAccount(
    username = username,
    password = password,
    domain = domain,
    extension = extension,
    transport = when (transport.uppercase()) {
        "TLS" -> SipTransport.TLS
        "TCP" -> SipTransport.TCP
        else -> SipTransport.UDP
    },
    port = port,
    stunServer = stunServer,
)

private fun String.toUserStatus(): UserStatus = when (uppercase()) {
    "ONLINE" -> UserStatus.ONLINE
    "BUSY" -> UserStatus.BUSY
    "IN_CALL" -> UserStatus.IN_CALL
    "DO_NOT_DISTURB" -> UserStatus.DO_NOT_DISTURB
    "AWAY" -> UserStatus.AWAY
    "MEETING" -> UserStatus.MEETING
    else -> UserStatus.OFFLINE
}

private fun String.toCallStatus(): CallStatus = when (uppercase()) {
    "COMPLETED" -> CallStatus.COMPLETED
    "MISSED" -> CallStatus.MISSED
    "REJECTED" -> CallStatus.REJECTED
    "BUSY" -> CallStatus.BUSY
    "TIMEOUT" -> CallStatus.TIMEOUT
    else -> CallStatus.FAILED
}
