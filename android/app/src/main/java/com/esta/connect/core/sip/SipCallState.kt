package com.esta.connect.core.sip

sealed class SipCallState {
    data object Idle : SipCallState()
    data class Incoming(
        val callId: String,
        val callerExtension: String,
        val callerName: String?,
    ) : SipCallState()
    data class Outgoing(
        val callId: String,
        val calleeExtension: String,
        val calleeName: String?,
    ) : SipCallState()
    data class Connected(
        val callId: String,
        val remoteExtension: String,
        val remoteName: String?,
        val durationSeconds: Long = 0L,
    ) : SipCallState()
    data class Ended(
        val callId: String,
        val reason: String?,
    ) : SipCallState()
    data class Error(val message: String) : SipCallState()
}

sealed class SipRegistrationState {
    data object Unregistered : SipRegistrationState()
    data object Registering : SipRegistrationState()
    data object Registered : SipRegistrationState()
    data class Failed(val reason: String) : SipRegistrationState()
}
