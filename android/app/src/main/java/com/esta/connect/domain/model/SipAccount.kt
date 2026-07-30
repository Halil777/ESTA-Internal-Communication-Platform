package com.esta.connect.domain.model

data class SipAccount(
    val username: String,
    val password: String,
    val domain: String,
    val extension: String,
    val transport: SipTransport = SipTransport.TLS,
    val port: Int = 5061,
    val stunServer: String? = null,
    val outboundProxy: String? = null,
)

enum class SipTransport { UDP, TCP, TLS }
