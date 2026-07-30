package com.esta.connect.presentation.screens.call

import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.awaitEachGesture
import androidx.compose.foundation.gestures.awaitFirstDown
import androidx.compose.foundation.gestures.waitForUpOrCancellation
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CallEnd
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.esta.connect.core.sip.SipCallState
import com.esta.connect.presentation.components.AvatarCircle
import com.esta.connect.presentation.theme.CallRed

@Composable
fun PttCallScreen(
    callViewModel: CallViewModel,
    onCallEnded: () -> Unit,
) {
    val callState by callViewModel.callState.collectAsState()
    val duration by callViewModel.callDuration.collectAsState()
    var isSpeaking by remember { mutableStateOf(false) }

    LaunchedEffect(callState) {
        if (callState is SipCallState.Ended || callState is SipCallState.Idle) {
            onCallEnded()
        }
    }

    val (extension, name) = when (val s = callState) {
        is SipCallState.Outgoing  -> s.calleeExtension to s.calleeName
        is SipCallState.Connected -> s.remoteExtension  to s.remoteName
        else -> "" to null
    }

    val statusText = when (callState) {
        is SipCallState.Outgoing  -> "Calling..."
        is SipCallState.Connected -> if (isSpeaking) "Speaking..." else pttFormatDuration(duration)
        else -> ""
    }

    val isConnected = callState is SipCallState.Connected

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
        contentAlignment = Alignment.Center,
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
            modifier = Modifier.padding(32.dp),
        ) {
            Text(
                text = statusText,
                style = MaterialTheme.typography.labelLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Spacer(Modifier.height(24.dp))

            AvatarCircle(name = name ?: extension, size = 100.dp)
            Spacer(Modifier.height(16.dp))

            Text(
                text = name ?: "Extension $extension",
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold,
            )
            Text(
                text = "Ext. $extension",
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )

            Spacer(Modifier.height(48.dp))

            // Hold-to-talk button
            Box(
                modifier = Modifier
                    .size(160.dp)
                    .background(
                        color = when {
                            !isConnected -> MaterialTheme.colorScheme.surfaceVariant
                            isSpeaking   -> MaterialTheme.colorScheme.primary
                            else         -> MaterialTheme.colorScheme.secondaryContainer
                        },
                        shape = CircleShape,
                    )
                    .pointerInput(isConnected) {
                        if (!isConnected) return@pointerInput
                        awaitEachGesture {
                            awaitFirstDown(requireUnconsumed = false)
                            isSpeaking = true
                            callViewModel.pressPtt()
                            waitForUpOrCancellation()
                            isSpeaking = false
                            callViewModel.releasePtt()
                        }
                    },
                contentAlignment = Alignment.Center,
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(
                        Icons.Default.Mic,
                        contentDescription = "Hold to talk",
                        modifier = Modifier.size(52.dp),
                        tint = when {
                            !isConnected -> MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.4f)
                            isSpeaking   -> MaterialTheme.colorScheme.onPrimary
                            else         -> MaterialTheme.colorScheme.onSecondaryContainer
                        },
                    )
                    Spacer(Modifier.height(4.dp))
                    Text(
                        text = when {
                            !isConnected -> "Waiting..."
                            isSpeaking   -> "Speaking"
                            else         -> "Hold to talk"
                        },
                        style = MaterialTheme.typography.labelMedium,
                        color = when {
                            !isConnected -> MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.4f)
                            isSpeaking   -> MaterialTheme.colorScheme.onPrimary
                            else         -> MaterialTheme.colorScheme.onSecondaryContainer
                        },
                    )
                }
            }

            Spacer(Modifier.height(40.dp))

            // End call
            IconButton(
                onClick = { callViewModel.hangUp() },
                modifier = Modifier
                    .size(72.dp)
                    .background(CallRed, CircleShape),
            ) {
                Icon(
                    Icons.Default.CallEnd,
                    contentDescription = "End call",
                    tint = Color.White,
                    modifier = Modifier.size(36.dp),
                )
            }
        }
    }
}

private fun pttFormatDuration(seconds: Long): String {
    val m = (seconds % 3600) / 60
    val s = seconds % 60
    return if (seconds >= 3600) {
        "%d:%02d:%02d".format(seconds / 3600, m, s)
    } else {
        "%d:%02d".format(m, s)
    }
}
