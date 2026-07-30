package com.esta.connect.core.network.websocket

import com.esta.connect.BuildConfig
import com.esta.connect.core.datastore.SessionDataStore
import com.google.gson.Gson
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.launch
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import timber.log.Timber
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class WebSocketManager @Inject constructor(
    private val okHttpClient: OkHttpClient,
    private val sessionDataStore: SessionDataStore,
    private val gson: Gson,
) {
    private var webSocket: WebSocket? = null
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private var reconnectAttempts = 0
    private val maxReconnectDelay = 30_000L
    private var isConnecting = false

    private val _events = MutableSharedFlow<WsEvent>(extraBufferCapacity = 64)
    val events: SharedFlow<WsEvent> = _events.asSharedFlow()

    private val _isConnected = MutableStateFlow(false)
    val isConnected: StateFlow<Boolean> = _isConnected.asStateFlow()

    fun connect() {
        if (isConnecting || webSocket != null) return
        isConnecting = true

        scope.launch {
            val token = sessionDataStore.accessToken.firstOrNull() ?: run {
                isConnecting = false
                return@launch
            }
            val request = Request.Builder()
                .url("${BuildConfig.WS_URL}?token=$token")
                .build()

            webSocket = okHttpClient.newWebSocket(request, object : WebSocketListener() {
                override fun onOpen(ws: WebSocket, response: Response) {
                    isConnecting = false
                    reconnectAttempts = 0
                    _isConnected.value = true
                    Timber.d("WebSocket connected")
                }

                override fun onMessage(ws: WebSocket, text: String) {
                    runCatching {
                        val event = gson.fromJson(text, WsEvent::class.java)
                        scope.launch { _events.emit(event) }
                    }.onFailure { Timber.w(it, "Failed to parse WS message: $text") }
                }

                override fun onClosed(ws: WebSocket, code: Int, reason: String) {
                    isConnecting = false
                    _isConnected.value = false
                    webSocket = null
                    Timber.d("WebSocket closed: $reason")
                    scheduleReconnect()
                }

                override fun onFailure(ws: WebSocket, t: Throwable, response: Response?) {
                    isConnecting = false
                    _isConnected.value = false
                    webSocket = null
                    Timber.w(t, "WebSocket failure")
                    scheduleReconnect()
                }
            })
        }
    }

    /** Send a typed message to the server. */
    fun send(type: String, vararg pairs: Pair<String, Any?>) {
        val map = mutableMapOf<String, Any?>("type" to type)
        for ((k, v) in pairs) {
            if (v != null) map[k] = v
        }
        val json = gson.toJson(map)
        val ws = webSocket
        if (ws == null) {
            Timber.w("WS send skipped — not connected: $json")
            return
        }
        ws.send(json)
        Timber.d("WS → $json")
    }

    fun disconnect() {
        webSocket?.close(1000, "User logout")
        webSocket = null
        isConnecting = false
        reconnectAttempts = 0
        _isConnected.value = false
    }

    private fun scheduleReconnect() {
        scope.launch {
            val delayMs = minOf(1000L * (1L shl reconnectAttempts), maxReconnectDelay)
            reconnectAttempts++
            Timber.d("WebSocket reconnecting in ${delayMs}ms (attempt $reconnectAttempts)")
            delay(delayMs)
            connect()
        }
    }
}

data class WsEvent(
    val type: String,
    // Presence
    val userId: String? = null,
    // Call signaling
    val callId: String? = null,
    val fromExtension: String? = null,
    val fromName: String? = null,
    val toExtension: String? = null,
    val sdp: String? = null,
    val candidate: Map<String, Any>? = null,
    val reason: String? = null,
    // Legacy fields
    val extension: String? = null,
    val payload: Map<String, Any>? = null,
) {
    companion object {
        // Presence
        const val USER_ONLINE = "user.online"
        const val USER_OFFLINE = "user.offline"
        const val USER_BUSY = "user.busy"
        // Call signaling (server → client)
        const val CALL_INCOMING = "call.incoming"
        const val CALL_RINGING = "call.ringing"
        const val CALL_ACCEPTED = "call.accepted"
        const val CALL_REJECTED = "call.rejected"
        const val CALL_OFFER = "call.offer"
        const val CALL_ANSWER = "call.answer"
        const val CALL_ICE = "call.ice"
        const val CALL_HANGUP = "call.hangup"
        const val CALL_FAILED = "call.failed"
        const val CALL_ENDED = "call.ended"
        // System
        const val DEVICE_REVOKED = "device.revoked"
        const val EXTENSION_UPDATED = "extension.updated"
    }
}
