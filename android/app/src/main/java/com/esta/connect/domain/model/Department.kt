package com.esta.connect.domain.model

data class Department(
    val id: String,
    val name: String,
    val code: String,
    val floor: Int?,
    val memberCount: Int = 0,
    val groupExtension: String?,
)
