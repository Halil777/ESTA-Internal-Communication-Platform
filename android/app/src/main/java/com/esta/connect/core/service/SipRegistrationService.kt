package com.esta.connect.core.service

import android.app.Notification
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
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
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.first
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
    private var registrationJob: Job? = null
    private var connectivityManager: ConnectivityManager? = null
    private var networkCallback: ConnectivityManager.NetworkCallback? = null

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        startForeground(NOTIFICATION_ID, buildNotification())
        sipManager.initialize()
        registerNetworkCallback()
        observeLoginState()
        Timber.d("SipRegistrationService started")
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_STOP_REGISTRATION) {
            stopRegistration()
            stopSelf()
            return START_NOT_STICKY
        }

        syncRegistration("service start")
        return START_STICKY
    }

    private fun observeLoginState() {
        scope.launch {
            sessionDataStore.isLoggedIn
                .distinctUntilChanged()
                .collect { loggedIn ->
                    if (loggedIn) {
                        syncRegistration("login state")
                    } else {
                        stopRegistration()
                    }
                }
        }
    }

    private fun syncRegistration(reason: String) {
        registrationJob?.cancel()
        registrationJob = scope.launch {
            if (!sessionDataStore.isLoggedIn.first()) {
                stopRegistration()
                return@launch
            }

            val reachable = hasUsableLocalNetwork()
            sipManager.networkReachable(reachable)
            if (!reachable) {
                Timber.d("SIP registration delayed: no usable local network [$reason]")
                return@launch
            }

            webSocketManager.connect()
            Timber.d("WebSocket connect requested [$reason]")

            when (val result = authRepository.getSipProvisioning()) {
                is NetworkResult.Success -> {
                    sipManager.register(result.data)
                    Timber.d("SIP registration requested [$reason]")
                }
                is NetworkResult.Error -> {
                    Timber.w("SIP provisioning failed [$reason]: ${result.message}")
                }
                NetworkResult.Loading -> Unit
            }
        }
    }

    private fun stopRegistration() {
        registrationJob?.cancel()
        registrationJob = null
        sipManager.unregister()
        webSocketManager.disconnect()
        Timber.d("SIP/WebSocket disconnected")
    }

    private fun registerNetworkCallback() {
        val manager = getSystemService(CONNECTIVITY_SERVICE) as ConnectivityManager
        connectivityManager = manager

        networkCallback = object : ConnectivityManager.NetworkCallback() {
            override fun onAvailable(network: Network) {
                sipManager.networkReachable(true)
                syncRegistration("network available")
            }

            override fun onCapabilitiesChanged(
                network: Network,
                networkCapabilities: NetworkCapabilities,
            ) {
                val reachable = hasUsableLocalNetwork()
                sipManager.networkReachable(reachable)
                if (reachable) syncRegistration("network capabilities changed")
            }

            override fun onLost(network: Network) {
                val reachable = hasUsableLocalNetwork()
                sipManager.networkReachable(reachable)
                if (!reachable) Timber.d("SIP network unavailable")
            }
        }

        runCatching {
            manager.registerDefaultNetworkCallback(networkCallback!!)
        }.onFailure {
            Timber.w(it, "Failed to register network callback")
        }
    }

    private fun hasUsableLocalNetwork(): Boolean {
        val manager = connectivityManager
            ?: getSystemService(CONNECTIVITY_SERVICE) as ConnectivityManager
        return manager.allNetworks.any { network ->
            val capabilities = manager.getNetworkCapabilities(network) ?: return@any false
            capabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) ||
                capabilities.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET) ||
                capabilities.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) ||
                capabilities.hasTransport(NetworkCapabilities.TRANSPORT_VPN)
        }
    }

    override fun onTaskRemoved(rootIntent: Intent?) {
        super.onTaskRemoved(rootIntent)
        scope.launch {
            if (sessionDataStore.isLoggedIn.first()) {
                SipServiceStarter.start(this@SipRegistrationService)
            }
        }
    }

    override fun onDestroy() {
        networkCallback?.let { callback ->
            runCatching { connectivityManager?.unregisterNetworkCallback(callback) }
        }
        networkCallback = null
        connectivityManager = null
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
        const val ACTION_STOP_REGISTRATION = "esta.action.STOP_SIP_REGISTRATION"
        private const val NOTIFICATION_ID = 1001
    }
}
