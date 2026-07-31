package com.esta.connect.core.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.esta.connect.core.service.SipServiceStarter
import timber.log.Timber

class NetworkChangeReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        Timber.d("Network changed — refreshing SIP service")
        SipServiceStarter.start(context)
    }
}
