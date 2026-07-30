package com.esta.connect

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import com.esta.connect.core.sip.LinphoneSipManager
import dagger.hilt.android.HiltAndroidApp
import timber.log.Timber
import javax.inject.Inject

@HiltAndroidApp
class EstaConnectApp : Application() {

    @Inject
    lateinit var sipManager: LinphoneSipManager

    override fun onCreate() {
        super.onCreate()

        setupTimber()
        createNotificationChannels()
        sipManager.initialize()
    }

    private fun setupTimber() {
        if (BuildConfig.DEBUG) {
            Timber.plant(Timber.DebugTree())
        }
    }

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val notificationManager =
                getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

            // Incoming calls channel — HIGH importance for heads-up notification
            NotificationChannel(
                getString(R.string.notification_channel_call_id),
                getString(R.string.notification_channel_call_name),
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Incoming Esta Connect calls"
                enableVibration(true)
                enableLights(true)
                setBypassDnd(true)
                lockscreenVisibility = android.app.Notification.VISIBILITY_PUBLIC
            }.also { notificationManager.createNotificationChannel(it) }

            // Background service channel — LOW importance (silent)
            NotificationChannel(
                getString(R.string.notification_channel_service_id),
                getString(R.string.notification_channel_service_name),
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Esta Connect background service"
                setShowBadge(false)
            }.also { notificationManager.createNotificationChannel(it) }
        }
    }
}
