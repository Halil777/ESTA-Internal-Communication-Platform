package com.esta.connect.domain.usecase.auth

import android.os.Build
import com.esta.connect.BuildConfig
import com.esta.connect.core.network.NetworkResult
import com.esta.connect.domain.model.Session
import com.esta.connect.domain.repository.AuthRepository
import com.esta.connect.domain.repository.DeviceInfo
import com.google.firebase.messaging.FirebaseMessaging
import kotlinx.coroutines.tasks.await
import java.util.UUID
import javax.inject.Inject

class ActivateDeviceUseCase @Inject constructor(
    private val authRepository: AuthRepository
) {
    suspend operator fun invoke(activationCode: String): NetworkResult<Session> {
        if (activationCode.isBlank()) {
            return NetworkResult.Error("Activation code is required")
        }

        val pushToken = runCatching {
            FirebaseMessaging.getInstance().token.await()
        }.getOrNull()

        val deviceInfo = DeviceInfo(
            deviceId = UUID.randomUUID().toString(),
            brand = Build.MANUFACTURER,
            model = Build.MODEL,
            androidVersion = Build.VERSION.RELEASE,
            appVersion = BuildConfig.VERSION_NAME,
            pushToken = pushToken,
        )

        return authRepository.activateDevice(activationCode.trim(), deviceInfo)
    }
}
