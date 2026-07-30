package com.esta.connect.core.fcm

import android.content.Intent
import android.os.Build
import com.esta.connect.core.network.api.EstaApiService
import com.esta.connect.core.service.CallForegroundService
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import timber.log.Timber
import javax.inject.Inject

@AndroidEntryPoint
class EstaFirebaseMessagingService : FirebaseMessagingService() {

    @Inject lateinit var apiService: EstaApiService

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun onNewToken(token: String) {
        Timber.d("FCM token refreshed")
        scope.launch {
            runCatching {
                apiService.updatePushToken(mapOf("pushToken" to token))
            }.onFailure { Timber.w(it, "Failed to update FCM token") }
        }
    }

    override fun onMessageReceived(message: RemoteMessage) {
        val data = message.data
        Timber.d("FCM message received: $data")

        when (data["type"]) {
            "incoming_call" -> handleIncomingCallPush(data)
            "call_cancelled" -> stopCallService()
        }
    }

    private fun handleIncomingCallPush(data: Map<String, String>) {
        val callerName = data["callerName"] ?: "Unknown"
        val callerExt = data["callerExtension"] ?: ""

        val serviceIntent = Intent(this, CallForegroundService::class.java).apply {
            action = CallForegroundService.ACTION_START_CALL
            putExtra(CallForegroundService.EXTRA_CALLER_NAME, callerName)
            putExtra(CallForegroundService.EXTRA_CALLER_EXT, callerExt)
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(serviceIntent)
        } else {
            startService(serviceIntent)
        }
    }

    private fun stopCallService() {
        startService(Intent(this, CallForegroundService::class.java).apply {
            action = CallForegroundService.ACTION_STOP
        })
    }
}
