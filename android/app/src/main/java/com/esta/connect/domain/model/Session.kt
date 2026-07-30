package com.esta.connect.domain.model

data class Session(
    val accessToken: String,
    val refreshToken: String,
    val userId: String,
    val extension: String,
    val deviceId: String,
)
