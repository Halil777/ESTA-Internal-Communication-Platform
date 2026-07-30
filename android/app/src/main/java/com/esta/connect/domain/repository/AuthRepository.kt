package com.esta.connect.domain.repository

import com.esta.connect.core.network.NetworkResult
import com.esta.connect.domain.model.Session
import com.esta.connect.domain.model.SipAccount
import kotlinx.coroutines.flow.Flow

interface AuthRepository {
    suspend fun login(username: String, password: String): NetworkResult<Session>
    suspend fun activateDevice(activationCode: String, deviceInfo: DeviceInfo): NetworkResult<Session>
    suspend fun refreshToken(refreshToken: String): NetworkResult<Session>
    suspend fun logout()
    suspend fun getSipProvisioning(): NetworkResult<SipAccount>
    fun getSession(): Flow<Session?>
    suspend fun saveSession(session: Session)
    suspend fun clearSession()
}

data class DeviceInfo(
    val deviceId: String,
    val brand: String,
    val model: String,
    val androidVersion: String,
    val appVersion: String,
    val pushToken: String?,
)
