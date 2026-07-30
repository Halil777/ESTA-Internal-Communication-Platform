package com.esta.connect.data.repository

import com.esta.connect.core.datastore.SessionDataStore
import com.esta.connect.core.network.NetworkResult
import com.esta.connect.core.network.api.EstaApiService
import com.esta.connect.core.network.safeApiCall
import com.esta.connect.data.mapper.toDomain
import com.esta.connect.data.remote.dto.ActivateDeviceRequest
import com.esta.connect.data.remote.dto.LoginRequest
import com.esta.connect.data.remote.dto.RefreshTokenRequest
import com.esta.connect.domain.model.Session
import com.esta.connect.domain.model.SipAccount
import com.esta.connect.domain.repository.AuthRepository
import com.esta.connect.domain.repository.DeviceInfo
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.map
import javax.inject.Inject

class AuthRepositoryImpl @Inject constructor(
    private val apiService: EstaApiService,
    private val sessionDataStore: SessionDataStore,
) : AuthRepository {

    override suspend fun login(username: String, password: String): NetworkResult<Session> =
        safeApiCall {
            val response = apiService.login(LoginRequest(username, password))
            val session = response.toSession()
            sessionDataStore.saveSession(
                session.accessToken, session.refreshToken,
                session.userId, session.extension, session.deviceId,
            )
            session
        }

    override suspend fun activateDevice(
        activationCode: String,
        deviceInfo: DeviceInfo,
    ): NetworkResult<Session> = safeApiCall {
        val response = apiService.activateDevice(
            ActivateDeviceRequest(
                activationCode = activationCode,
                deviceId = deviceInfo.deviceId,
                brand = deviceInfo.brand,
                model = deviceInfo.model,
                androidVersion = deviceInfo.androidVersion,
                appVersion = deviceInfo.appVersion,
                pushToken = deviceInfo.pushToken,
            )
        )
        val session = response.toSession()
        sessionDataStore.saveSession(
            session.accessToken, session.refreshToken,
            session.userId, session.extension, session.deviceId,
        )
        session
    }

    override suspend fun refreshToken(refreshToken: String): NetworkResult<Session> =
        safeApiCall {
            val response = apiService.refreshToken(RefreshTokenRequest(refreshToken))
            val session = response.toSession()
            sessionDataStore.saveSession(
                session.accessToken, session.refreshToken,
                session.userId, session.extension, session.deviceId,
            )
            session
        }

    override suspend fun logout() {
        runCatching { apiService.logout() }
        sessionDataStore.clearSession()
    }

    override suspend fun getSipProvisioning(): NetworkResult<SipAccount> =
        safeApiCall { apiService.getSipProvisioning().toDomain() }

    override fun getSession(): Flow<Session?> =
        combine(
            sessionDataStore.accessToken,
            sessionDataStore.refreshToken,
            sessionDataStore.userId,
            sessionDataStore.extension,
            sessionDataStore.deviceId,
        ) { accessToken, refreshToken, userId, extension, deviceId ->
            if (accessToken != null && userId != null && extension != null && deviceId != null) {
                Session(
                    accessToken = accessToken,
                    refreshToken = refreshToken ?: "",
                    userId = userId,
                    extension = extension,
                    deviceId = deviceId,
                )
            } else null
        }

    override suspend fun saveSession(session: Session) {
        sessionDataStore.saveSession(
            session.accessToken, session.refreshToken,
            session.userId, session.extension, session.deviceId,
        )
    }

    override suspend fun clearSession() = sessionDataStore.clearSession()

    private fun com.esta.connect.data.remote.dto.LoginResponse.toSession() = Session(
        accessToken = accessToken,
        refreshToken = refreshToken,
        userId = userId,
        extension = extension,
        deviceId = deviceId,
    )
}
