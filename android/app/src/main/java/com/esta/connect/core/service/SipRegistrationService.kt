package com.esta.connect.core.service

import android.app.Notification
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.esta.connect.MainActivity
import com.esta.connect.R
import com.esta.connect.core.datastore.SessionDataStore
import com.esta.connect.core.network.NetworkResult
import com.esta.connect.core.network.websocket.WebSocketManager
import com.esta.connect.core.sip.LinphoneSipManager
import com.esta.connect.domain.repository.AuthRepository
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.launch
import timber.log.Timber
import javax.inject.Inject

@AndroidEntryPoint
class SipRegistrationService : Service() {

    @Inject lateinit var sipManager: LinphoneSipManager
    @Inject lateinit var webSocketManager: WebSocketManager
    @Inject lateinit var sessionDataStore: SessionDataStore
    @Inject lateinit var authRepository: AuthRepository

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        startForeground(NOTIFICATION_ID, buildNotification())
        observeLoginState()
        Timber.d("SipRegistrationService started")
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        return START_STICKY
    }

    private fun observeLoginState() {
        scope.launch {
            sessionDataStore.isLoggedIn
                .distinctUntilChanged()
                .collect { loggedIn ->
                    if (loggedIn) {
                        webSocketManager.connect()
                        Timber.d("WebSocket connect requested")
                        when (val result = authRepository.getSipProvisioning()) {
                            is NetworkResult.Success -> {
                                sipManager.register(result.data)
                                Timber.d("SIP registration requested")
                            }
                            is NetworkResult.Error -> {
                                Timber.w("SIP provisioning failed: ${result.message}")
                            }
                            NetworkResult.Loading -> Unit
                        }
                    } else {
                        sipManager.unregister()
                        webSocketManager.disconnect()
                        Timber.d("SIP/WebSocket disconnected on logout")
                    }
                }
        }
    }

    override fun onDestroy() {
        scope.cancel()
        super.onDestroy()
        Timber.d("SipRegistrationService destroyed")
    }

    private fun buildNotification(): Notification {
        val pendingIntent = PendingIntent.getActivity(
            this, 0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE,
        )
        return NotificationCompat.Builder(this, getString(R.string.notification_channel_service_id))
            .setContentTitle(getString(R.string.app_name))
            .setContentText(getString(R.string.call_service_running))
            .setSmallIcon(android.R.drawable.ic_menu_call)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    companion object {
        private const val NOTIFICATION_ID = 1001
    }
}
