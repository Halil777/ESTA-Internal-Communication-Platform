package com.esta.connect.domain.model

data class Contact(
    val id: String,
    val firstName: String,
    val lastName: String,
    val extension: String?,
    val department: Department?,
    val cabinet: String?,
    val status: UserStatus,
    val avatarUrl: String?,
    val isFavorite: Boolean,
)

val Contact.fullName: String get() = "$firstName $lastName"
val Contact.initials: String get() = "${firstName.firstOrNull() ?: ""}${lastName.firstOrNull() ?: ""}".uppercase()
val Contact.isAvailable: Boolean get() = status == UserStatus.ONLINE
