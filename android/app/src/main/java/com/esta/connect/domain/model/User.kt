package com.esta.connect.domain.model

data class User(
    val id: String,
    val firstName: String,
    val lastName: String,
    val employeeId: String,
    val email: String?,
    val role: UserRole,
    val department: Department?,
    val cabinet: String?,
    val extension: String?,
    val status: UserStatus,
    val avatarUrl: String?,
    val sipAccount: SipAccount?,
)

val User.fullName: String get() = "$firstName $lastName"

enum class UserRole {
    SUPER_ADMIN, OFFICE_ADMIN, MANAGER, EMPLOYEE, RECEPTION
}

enum class UserStatus {
    ONLINE, OFFLINE, BUSY, IN_CALL, DO_NOT_DISTURB, AWAY, MEETING
}
