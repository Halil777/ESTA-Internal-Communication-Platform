package com.esta.connect.presentation.screens.call

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.esta.connect.BuildConfig
import com.esta.connect.core.datastore.SessionDataStore
import com.esta.connect.core.network.NetworkResult
import com.esta.connect.core.sip.LinphoneSipManager
import com.esta.connect.core.sip.SipCallState
import com.esta.connect.core.sip.SipRegistrationState
import com.esta.connect.domain.model.CallDirection
import com.esta.connect.domain.model.CallRecord
import com.esta.connect.domain.model.CallStatus
import com.esta.connect.domain.repository.AuthRepository
import com.esta.connect.domain.repository.CallRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.time.Instant
import java.util.UUID
import javax.inject.Inject

@HiltViewModel
class CallViewModel @Inject constructor(
    private val sipManager: LinphoneSipManager,
    private val callRepository: CallRepository,
    private val authRepository: AuthRepository,
    private val sessionDataStore: SessionDataStore,
) : ViewModel() {

    val callState: StateFlow<SipCallState> = sipManager.callState
    val registrationState: StateFlow<SipRegistrationState> = sipManager.registrationState
    val isLoggedIn = sessionDataStore.isLoggedIn.stateIn(viewModelScope, SharingStarted.Eagerly, false)

    private val _isPttMode = MutableStateFlow(false)
    val isPttMode: StateFlow<Boolean> = _isPttMode.asStateFlow()

    private val _isMuted = MutableStateFlow(false)
    val isMuted: StateFlow<Boolean> = _isMuted.asStateFlow()

    private val _isSpeaker = MutableStateFlow(false)
    val isSpeaker: StateFlow<Boolean> = _isSpeaker.asStateFlow()

    private val _callDuration = MutableStateFlow(0L)
    val callDuration: StateFlow<Long> = _callDuration.asStateFlow()

    private var durationJob: Job? = null
    private var callStartTime: Instant? = null
    private var pendingCallRecord: CallRecord? = null

    init {
        observeCallState()
    }

    private fun observeCallState() {
        viewModelScope.launch {
            callState.collect { state ->
                when (state) {
                    is SipCallState.Incoming -> {
                        pendingCallRecord = CallRecord(
                            id = UUID.randomUUID().toString(),
                            callUuid = state.callId,
                            direction = CallDirection.INCOMING,
                            status = CallStatus.MISSED,
                            remoteContact = null,
                            remoteExtension = state.callerExtension,
                            remoteName = state.callerName,
                            startedAt = Instant.now(),
                            answeredAt = null,
                            endedAt = null,
                            durationSeconds = 0,
                            failureReason = null,
                        )
                    }
                    is SipCallState.Outgoing -> {
                        pendingCallRecord = CallRecord(
                            id = UUID.randomUUID().toString(),
                            callUuid = state.callId,
                            direction = CallDirection.OUTGOING,
                            status = CallStatus.MISSED,
                            remoteContact = null,
                            remoteExtension = state.calleeExtension,
                            remoteName = state.calleeName,
                            startedAt = Instant.now(),
                            answeredAt = null,
                            endedAt = null,
                            durationSeconds = 0,
                            failureReason = null,
                        )
                    }
                    is SipCallState.Connected -> {
                        if (callStartTime == null) {
                            callStartTime = Instant.now()
                            startDurationTimer()
                        }
                        val record = pendingCallRecord
                        pendingCallRecord = record?.copy(
                            answeredAt = record.answeredAt ?: Instant.now(),
                            status = CallStatus.COMPLETED,
                        )
                        // PTT mode: start with mic muted, user holds button to speak
                        if (_isPttMode.value) sipManager.hold()
                    }
                    is SipCallState.Ended -> {
                        stopDurationTimer()
                        saveFinalCallRecord(state.reason)
                        _isMuted.value = false
                        _isSpeaker.value = false
                        _callDuration.value = 0L
                        _isPttMode.value = false
                    }
                    is SipCallState.Error -> {
                        stopDurationTimer()
                        saveFinalCallRecord(state.message)
                    }
                    else -> {}
                }
            }
        }
    }

    fun makeCall(extension: String) {
        viewModelScope.launch {
            sipManager.makeCall(extension, BuildConfig.SIP_DOMAIN)
        }
    }

    fun makePttCall(extension: String) {
        _isPttMode.value = true
        viewModelScope.launch {
            sipManager.makeCall(extension, BuildConfig.SIP_DOMAIN)
        }
    }

    fun pressPtt() { sipManager.unhold() }
    fun releasePtt() { sipManager.hold() }

    fun answerCall() {
        sipManager.answerCall()
    }

    fun declineCall() {
        viewModelScope.launch {
            pendingCallRecord?.let { record ->
                callRepository.saveCallRecord(
                    record.copy(
                        status = CallStatus.REJECTED,
                        endedAt = Instant.now(),
                    )
                )
            }
            pendingCallRecord = null
            sipManager.declineCall()
        }
    }

    fun hangUp() {
        sipManager.hangUp()
    }

    fun toggleMute() {
        _isMuted.value = sipManager.toggleMute()
    }

    fun toggleSpeaker() {
        _isSpeaker.value = sipManager.toggleSpeaker()
    }

    private fun startDurationTimer() {
        durationJob?.cancel()
        durationJob = viewModelScope.launch {
            while (true) {
                delay(1000)
                _callDuration.update { it + 1 }
            }
        }
    }

    private fun stopDurationTimer() {
        durationJob?.cancel()
        durationJob = null
    }

    private fun saveFinalCallRecord(failureReason: String?) {
        viewModelScope.launch {
            pendingCallRecord?.let { record ->
                val endedAt = Instant.now()
                val duration = callStartTime?.let {
                    endedAt.epochSecond - it.epochSecond
                } ?: 0L
                callRepository.saveCallRecord(
                    record.copy(
                        endedAt = endedAt,
                        durationSeconds = duration,
                        failureReason = if (record.status == CallStatus.COMPLETED) null else failureReason,
                    )
                )
            }
            pendingCallRecord = null
            callStartTime = null
        }
    }
}
