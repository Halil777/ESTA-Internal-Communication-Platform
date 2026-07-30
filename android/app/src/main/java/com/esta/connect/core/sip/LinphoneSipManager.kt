package com.esta.connect.core.sip

import android.content.Context
import android.content.Intent
import android.media.AudioManager
import android.os.Build
import android.os.PowerManager
import com.esta.connect.BuildConfig
import com.esta.connect.core.service.CallForegroundService
import com.esta.connect.domain.model.SipAccount
import com.esta.connect.domain.model.SipTransport
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import org.linphone.core.Account
import org.linphone.core.Call
import org.linphone.core.Core
import org.linphone.core.CoreListenerStub
import org.linphone.core.Factory
import org.linphone.core.MediaEncryption
import org.linphone.core.Reason
import org.linphone.core.RegistrationState
import org.linphone.core.TransportType
import timber.log.Timber
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class LinphoneSipManager @Inject constructor(
    @ApplicationContext private val context: Context,
) {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)

    private var core: Core? = null
    private var account: Account? = null
    private var sipAccount: SipAccount? = null
    private var currentCall: Call? = null
    private var currentCallId: String? = null
    private var currentRemoteExtension: String? = null
    private var currentRemoteName: String? = null
    private var wakeLock: PowerManager.WakeLock? = null

    private val _callState = MutableStateFlow<SipCallState>(SipCallState.Idle)
    val callState: StateFlow<SipCallState> = _callState.asStateFlow()

    private val _registrationState =
        MutableStateFlow<SipRegistrationState>(SipRegistrationState.Unregistered)
    val registrationState: StateFlow<SipRegistrationState> = _registrationState.asStateFlow()

    private val listener = object : CoreListenerStub() {
        override fun onAccountRegistrationStateChanged(
            core: Core,
            account: Account,
            state: RegistrationState,
            message: String,
        ) {
            Timber.d("SIP registration: $state $message")
            _registrationState.value = when (state) {
                RegistrationState.Progress,
                RegistrationState.Refreshing -> SipRegistrationState.Registering
                RegistrationState.Ok -> SipRegistrationState.Registered
                RegistrationState.Failed -> SipRegistrationState.Failed(message.ifBlank { "SIP registration failed" })
                RegistrationState.Cleared,
                RegistrationState.None -> SipRegistrationState.Unregistered
            }
        }

        override fun onCallStateChanged(
            core: Core,
            call: Call,
            state: Call.State,
            message: String,
        ) {
            Timber.d("SIP call state: $state $message")
            handleCallState(call, state, message)
        }
    }

    fun initialize() {
        if (core != null) return

        val factory = Factory.instance()
        factory.setDebugMode(BuildConfig.DEBUG, "EstaConnect")

        core = factory.createCore(null, null, context).apply {
            addListener(listener)
            setNetworkReachable(true)
            start()
        }

        Timber.d("Linphone SIP manager initialized")
    }

    fun register(sipAccount: SipAccount) {
        scope.launch {
            val core = ensureCore() ?: return@launch
            val factory = Factory.instance()
            val transport = sipAccount.transport.toLinphoneTransport()

            runCatching {
                core.clearAccounts()
                core.clearAllAuthInfo()

                val identity = factory.createAddress("sip:${sipAccount.username}@${sipAccount.domain}")
                    ?: error("Invalid SIP identity")
                identity.setTransport(transport)

                val server = factory.createAddress("sip:${sipAccount.domain}")
                    ?: error("Invalid SIP server")
                server.setPort(sipAccount.port)
                server.setTransport(transport)

                val authInfo = factory.createAuthInfo(
                    sipAccount.username,
                    sipAccount.username,
                    sipAccount.password,
                    null,
                    null,
                    sipAccount.domain,
                )

                val params = core.createAccountParams().apply {
                    setIdentityAddress(identity)
                    setServerAddress(server)
                    setRegisterEnabled(true)
                    setOutboundProxyEnabled(sipAccount.outboundProxy != null)
                    setPushNotificationAllowed(false)
                    setExpires(300)
                }

                val newAccount = core.createAccount(params)
                core.addAuthInfo(authInfo)
                core.addAccount(newAccount)
                core.defaultAccount = newAccount

                account = newAccount
                this@LinphoneSipManager.sipAccount = sipAccount
                _registrationState.value = SipRegistrationState.Registering
                Timber.d("SIP register requested for ${sipAccount.username}@${sipAccount.domain}:${sipAccount.port}")
            }.onFailure {
                Timber.w(it, "SIP register failed")
                _registrationState.value = SipRegistrationState.Failed(it.message ?: "SIP register failed")
            }
        }
    }

    fun unregister() {
        scope.launch {
            runCatching {
                core?.terminateAllCalls()
                core?.clearAccounts()
                core?.clearAllAuthInfo()
            }
            account = null
            sipAccount = null
            cleanupCall()
            _registrationState.value = SipRegistrationState.Unregistered
        }
    }

    fun makeCall(extension: String, domain: String = "") {
        scope.launch {
            if (_callState.value !is SipCallState.Idle) {
                Timber.w("makeCall ignored: already in call")
                return@launch
            }

            val core = ensureCore() ?: return@launch
            val targetDomain = sipAccount?.domain ?: domain.ifBlank { BuildConfig.SIP_DOMAIN }
            val port = sipAccount?.port ?: 5060
            val transport = (sipAccount?.transport ?: SipTransport.UDP).toLinphoneTransport()
            val callId = UUID.randomUUID().toString()

            val address = Factory.instance().createAddress("sip:$extension@$targetDomain")
                ?: run {
                    _callState.value = SipCallState.Error("Invalid extension")
                    return@launch
                }
            address.setPort(port)
            address.setTransport(transport)

            val params = core.createCallParams(null)?.apply {
                setAudioEnabled(true)
                setVideoEnabled(false)
                setMediaEncryption(MediaEncryption.None)
            }

            currentCallId = callId
            currentRemoteExtension = extension
            currentRemoteName = extension
            acquireWakeLock()
            configureAudioForCall()
            _callState.value = SipCallState.Outgoing(
                callId = callId,
                calleeExtension = extension,
                calleeName = extension,
            )

            currentCall = if (params != null) {
                core.inviteAddressWithParams(address, params)
            } else {
                core.inviteAddress(address)
            }

            if (currentCall == null) {
                endCall("Failed to start SIP call")
            } else {
                Timber.d("SIP outgoing call to $extension [$callId]")
            }
        }
    }

    fun answerCall() {
        scope.launch {
            val call = currentCall ?: core?.currentCall ?: return@launch
            startActiveCallNotification()
            configureAudioForCall()
            val params = core?.createCallParams(call)?.apply {
                setAudioEnabled(true)
                setVideoEnabled(false)
                setMediaEncryption(MediaEncryption.None)
            }
            if (params != null) call.acceptWithParams(params) else call.accept()
        }
    }

    fun declineCall() {
        scope.launch {
            stopCallNotification()
            currentCall?.decline(Reason.Declined)
            cleanupCall()
            _callState.value = SipCallState.Idle
        }
    }

    fun hangUp() {
        scope.launch {
            currentCall?.terminate() ?: core?.terminateAllCalls()
            endCall("Hung up")
        }
    }

    fun toggleMute(): Boolean {
        val core = core ?: return false
        val nowEnabled = !core.isMicEnabled
        core.isMicEnabled = nowEnabled
        return !nowEnabled
    }

    fun isMuted(): Boolean = !(core?.isMicEnabled ?: true)

    fun toggleSpeaker(): Boolean {
        val am = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
        val newState = !am.isSpeakerphoneOn
        am.isSpeakerphoneOn = newState
        return newState
    }

    fun isSpeakerActive(): Boolean =
        (context.getSystemService(Context.AUDIO_SERVICE) as AudioManager).isSpeakerphoneOn

    fun hold() {
        core?.isMicEnabled = false
    }

    fun unhold() {
        core?.isMicEnabled = true
    }

    fun networkReachable(reachable: Boolean) {
        core?.setNetworkReachable(reachable)
    }

    fun destroy() {
        runCatching {
            core?.terminateAllCalls()
            core?.removeListener(listener)
            core?.stopAsync()
        }
        cleanupCall()
        core = null
    }

    private fun ensureCore(): Core? {
        if (core == null) initialize()
        return core
    }

    private fun handleCallState(call: Call, state: Call.State, message: String) {
        when (state) {
            Call.State.IncomingReceived,
            Call.State.PushIncomingReceived -> onIncomingCall(call)

            Call.State.OutgoingInit,
            Call.State.OutgoingProgress,
            Call.State.OutgoingRinging,
            Call.State.OutgoingEarlyMedia -> {
                currentCall = call
            }

            Call.State.Connected,
            Call.State.StreamsRunning -> onCallConnected(call)

            Call.State.Error -> endCall(message.ifBlank { call.errorInfo.phrase ?: "SIP call failed" })

            Call.State.End,
            Call.State.Released -> {
                if (_callState.value !is SipCallState.Idle && _callState.value !is SipCallState.Ended) {
                    endCall(message.ifBlank { "Call ended" })
                }
            }

            else -> {}
        }
    }

    private fun onIncomingCall(call: Call) {
        val remote = call.remoteAddress
        val extension = remote.username.orEmpty()
        val name = remote.displayName?.takeIf { it.isNotBlank() } ?: extension
        val callId = UUID.randomUUID().toString()

        currentCall = call
        currentCallId = callId
        currentRemoteExtension = extension
        currentRemoteName = name

        acquireWakeLock()
        startIncomingCallNotification(name, extension)
        _callState.value = SipCallState.Incoming(
            callId = callId,
            callerExtension = extension,
            callerName = name,
        )
    }

    private fun onCallConnected(call: Call) {
        currentCall = call
        val callId = currentCallId ?: UUID.randomUUID().toString().also { currentCallId = it }
        val extension = currentRemoteExtension ?: call.remoteAddress.username.orEmpty()
        val name = currentRemoteName ?: call.remoteAddress.displayName?.takeIf { it.isNotBlank() } ?: extension

        startActiveCallNotification()
        configureAudioForCall()
        _callState.value = SipCallState.Connected(
            callId = callId,
            remoteExtension = extension,
            remoteName = name,
        )
    }

    private fun endCall(reason: String) {
        val callId = currentCallId ?: UUID.randomUUID().toString()
        cleanupCall()
        _callState.value = SipCallState.Ended(callId = callId, reason = reason)
        scope.launch {
            delay(2000)
            if (_callState.value is SipCallState.Ended) {
                _callState.value = SipCallState.Idle
            }
        }
    }

    private fun cleanupCall() {
        stopCallNotification()
        currentCall = null
        currentCallId = null
        currentRemoteExtension = null
        currentRemoteName = null
        core?.isMicEnabled = true
        releaseWakeLock()
        restoreAudio()
    }

    @Suppress("DEPRECATION")
    private fun configureAudioForCall() {
        val am = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
        am.requestAudioFocus(null, AudioManager.STREAM_VOICE_CALL, AudioManager.AUDIOFOCUS_GAIN_TRANSIENT)
        am.mode = AudioManager.MODE_IN_COMMUNICATION
        am.isSpeakerphoneOn = false
    }

    @Suppress("DEPRECATION")
    private fun restoreAudio() {
        val am = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
        am.abandonAudioFocus(null)
        am.mode = AudioManager.MODE_NORMAL
        am.isSpeakerphoneOn = false
    }

    private fun acquireWakeLock() {
        if (wakeLock != null) return
        val pm = context.getSystemService(Context.POWER_SERVICE) as PowerManager
        wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "EstaConnect::SipCallWakeLock")
            .apply { acquire(10 * 60 * 1000L) }
    }

    private fun releaseWakeLock() {
        wakeLock?.takeIf { it.isHeld }?.release()
        wakeLock = null
    }

    private fun startIncomingCallNotification(name: String, extension: String) {
        val intent = Intent(context, CallForegroundService::class.java).apply {
            action = CallForegroundService.ACTION_START_CALL
            putExtra(CallForegroundService.EXTRA_CALLER_NAME, name)
            putExtra(CallForegroundService.EXTRA_CALLER_EXT, extension)
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(intent)
        } else {
            context.startService(intent)
        }
    }

    private fun startActiveCallNotification() {
        val intent = Intent(context, CallForegroundService::class.java).apply {
            action = CallForegroundService.ACTION_ACTIVE_CALL
            putExtra(CallForegroundService.EXTRA_CALLER_NAME, currentRemoteName ?: currentRemoteExtension ?: "")
            putExtra(CallForegroundService.EXTRA_CALLER_EXT, currentRemoteExtension ?: "")
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(intent)
        } else {
            context.startService(intent)
        }
    }

    private fun stopCallNotification() {
        context.stopService(Intent(context, CallForegroundService::class.java))
    }

    private fun SipTransport.toLinphoneTransport(): TransportType = when (this) {
        SipTransport.TLS -> TransportType.Tls
        SipTransport.TCP -> TransportType.Tcp
        SipTransport.UDP -> TransportType.Udp
    }
}
