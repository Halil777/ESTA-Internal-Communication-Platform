package com.esta.connect.core.service

import android.app.Notification
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.esta.connect.MainActivity
import com.esta.connect.R
import com.esta.connect.core.sip.LinphoneSipManager
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

@AndroidEntryPoint
class CallForegroundService : Service() {

    @Inject lateinit var sipManager: LinphoneSipManager

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START_CALL -> {
                val callerName = intent.getStringExtra(EXTRA_CALLER_NAME) ?: "Unknown"
                val callerExt = intent.getStringExtra(EXTRA_CALLER_EXT) ?: ""
                startForeground(NOTIFICATION_ID, buildCallNotification(callerName, callerExt))
            }
            ACTION_ACTIVE_CALL -> {
                val remoteName = intent.getStringExtra(EXTRA_CALLER_NAME) ?: "Unknown"
                val remoteExt = intent.getStringExtra(EXTRA_CALLER_EXT) ?: ""
                startForeground(NOTIFICATION_ID, buildActiveCallNotification(remoteName, remoteExt))
            }
            ACTION_ANSWER -> {
                sipManager.answerCall()
            }
            ACTION_DECLINE -> {
                sipManager.declineCall()
                stopSelf()
            }
            ACTION_HANG_UP -> {
                sipManager.hangUp()
                stopSelf()
            }
            ACTION_STOP -> stopSelf()
        }
        return START_NOT_STICKY
    }

    override fun onDestroy() {
        super.onDestroy()
        stopForeground(STOP_FOREGROUND_REMOVE)
    }

    private fun buildCallNotification(callerName: String, callerExt: String): Notification {
        val fullScreenIntent = PendingIntent.getActivity(
            this, 0,
            Intent(this, MainActivity::class.java).apply {
                action = MainActivity.ACTION_INCOMING_CALL
                putExtra(MainActivity.EXTRA_CALLER_NAME, callerName)
                putExtra(MainActivity.EXTRA_CALLER_EXTENSION, callerExt)
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            },
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )

        val answerIntent = PendingIntent.getService(
            this, 1,
            Intent(this, CallForegroundService::class.java).setAction(ACTION_ANSWER),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )

        val declineIntent = PendingIntent.getService(
            this, 2,
            Intent(this, CallForegroundService::class.java).setAction(ACTION_DECLINE),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )

        return NotificationCompat.Builder(this, getString(R.string.notification_channel_call_id))
            .setContentTitle(getString(R.string.incoming_call))
            .setContentText("$callerName · Ext. $callerExt")
            .setSmallIcon(android.R.drawable.ic_menu_call)
            .setFullScreenIntent(fullScreenIntent, true)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setOngoing(true)
            .setAutoCancel(false)
            .addAction(android.R.drawable.ic_menu_call, "Answer", answerIntent)
            .addAction(android.R.drawable.ic_delete, "Decline", declineIntent)
            .build()
    }

    private fun buildActiveCallNotification(remoteName: String, remoteExt: String): Notification {
        val contentIntent = PendingIntent.getActivity(
            this, 3,
            Intent(this, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            },
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )

        val hangupIntent = PendingIntent.getService(
            this, 4,
            Intent(this, CallForegroundService::class.java).setAction(ACTION_HANG_UP),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )

        return NotificationCompat.Builder(this, getString(R.string.notification_channel_call_id))
            .setContentTitle(getString(R.string.app_name))
            .setContentText("In call with $remoteName · Ext. $remoteExt")
            .setSmallIcon(android.R.drawable.ic_menu_call)
            .setContentIntent(contentIntent)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setOngoing(true)
            .setAutoCancel(false)
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Hang up", hangupIntent)
            .build()
    }

    companion object {
        const val NOTIFICATION_ID = 1002
        const val ACTION_START_CALL = "esta.action.START_CALL"
        const val ACTION_ACTIVE_CALL = "esta.action.ACTIVE_CALL"
        const val ACTION_ANSWER = "esta.action.ANSWER"
        const val ACTION_DECLINE = "esta.action.DECLINE"
        const val ACTION_HANG_UP = "esta.action.HANG_UP"
        const val ACTION_STOP = "esta.action.STOP"
        const val EXTRA_CALLER_NAME = "caller_name"
        const val EXTRA_CALLER_EXT = "caller_ext"
    }
}
