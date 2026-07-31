package com.esta.connect

import android.Manifest
import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import android.os.Build
import com.esta.connect.core.service.SipServiceStarter
import com.esta.connect.presentation.navigation.EstaNavGraph
import com.esta.connect.presentation.theme.EstaConnectTheme
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { /* permissions handled reactively in UI */ }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        requestRequiredPermissions()
        startSipService()

        setContent {
            EstaConnectTheme {
                EstaNavGraph(
                    incomingCallIntent = intent.takeIf {
                        it.action == ACTION_INCOMING_CALL
                    }
                )
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
    }

    private fun requestRequiredPermissions() {
        val permissions = mutableListOf(
            Manifest.permission.RECORD_AUDIO,
        ).apply {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                add(Manifest.permission.POST_NOTIFICATIONS)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                add(Manifest.permission.BLUETOOTH_CONNECT)
            }
        }
        permissionLauncher.launch(permissions.toTypedArray())
    }

    private fun startSipService() {
        SipServiceStarter.start(this)
    }

    companion object {
        const val ACTION_INCOMING_CALL = "com.esta.connect.INCOMING_CALL"
        const val EXTRA_CALLER_EXTENSION = "caller_extension"
        const val EXTRA_CALLER_NAME = "caller_name"
        const val EXTRA_CALL_ID = "call_id"
    }
}
