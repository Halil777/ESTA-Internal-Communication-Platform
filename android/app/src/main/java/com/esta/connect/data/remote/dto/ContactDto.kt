package com.esta.connect.data.remote.dto

data class ContactDto(
    val id: String,
    val firstName: String,
    val lastName: String,
    val extension: String?,
    val department: DepartmentDto?,
    val cabinet: String?,
    val status: String,
    val avatarUrl: String?,
)

data class DepartmentDto(
    val id: String,
    val name: String,
    val code: String,
    val floor: Int?,
    val memberCount: Int,
    val groupExtension: String?,
)

data class UserDto(
    val id: String,
    val firstName: String,
    val lastName: String,
    val employeeId: String,
    val email: String?,
    val role: String,
    val department: DepartmentDto?,
    val cabinet: String?,
    val extension: String?,
    val status: String,
    val avatarUrl: String?,
)
