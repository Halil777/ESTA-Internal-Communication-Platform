package com.esta.connect.core.service

import android.content.Context
import android.content.Intent
import android.os.Build
import timber.log.Timber

object SipServiceStarter {
    fun start(context: Context) {
        val appContext = context.applicationContext
        val intent = Intent(appContext, SipRegistrationService::class.java)
        runCatching {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                appContext.startForegroundService(intent)
            } else {
                appContext.startService(intent)
            }
        }.onFailure {
            Timber.w(it, "Failed to start SIP registration service")
        }
    }

    fun stop(context: Context) {
        val appContext = context.applicationContext
        val intent = Intent(appContext, SipRegistrationService::class.java)
            .setAction(SipRegistrationService.ACTION_STOP_REGISTRATION)
        runCatching {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                appContext.startForegroundService(intent)
            } else {
                appContext.startService(intent)
            }
        }.onFailure {
            Timber.w(it, "Failed to stop SIP registration service")
        }
    }
}
