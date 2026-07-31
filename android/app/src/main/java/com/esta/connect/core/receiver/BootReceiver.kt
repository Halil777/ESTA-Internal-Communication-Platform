package com.esta.connect.core.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.esta.connect.core.service.SipServiceStarter
import timber.log.Timber

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED ||
            intent.action == "android.intent.action.QUICKBOOT_POWERON"
        ) {
            Timber.d("Device booted — starting SIP service")
            SipServiceStarter.start(context)
        }
    }
}
