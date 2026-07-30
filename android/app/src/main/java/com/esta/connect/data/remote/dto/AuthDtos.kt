package com.esta.connect.data.remote.dto

import com.google.gson.annotations.SerializedName

data class LoginRequest(
    val username: String,
    val password: String,
)

data class ActivateDeviceRequest(
    val activationCode: String,
    val deviceId: String,
    val brand: String,
    val model: String,
    val androidVersion: String,
    val appVersion: String,
    val pushToken: String?,
)

data class RefreshTokenRequest(
    val refreshToken: String,
)

data class LoginResponse(
    val accessToken: String,
    val refreshToken: String,
    val userId: String,
    val extension: String,
    val deviceId: String,
)

data class SipProvisioningDto(
    val username: String,
    val password: String,
    val domain: String,
    val extension: String,
    val transport: String,
    val port: Int,
    val stunServer: String?,
)
