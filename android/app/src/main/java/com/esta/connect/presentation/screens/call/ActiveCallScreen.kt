package com.esta.connect.presentation.screens.call

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CallEnd
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.MicOff
import androidx.compose.material.icons.filled.VolumeOff
import androidx.compose.material.icons.filled.VolumeUp
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.esta.connect.core.sip.SipCallState
import com.esta.connect.presentation.components.AvatarCircle
import com.esta.connect.presentation.theme.CallRed

@Composable
fun ActiveCallScreen(
    callViewModel: CallViewModel,
    onCallEnded: () -> Unit,
) {
    val callState by callViewModel.callState.collectAsState()
    val isMuted by callViewModel.isMuted.collectAsState()
    val isSpeaker by callViewModel.isSpeaker.collectAsState()
    val duration by callViewModel.callDuration.collectAsState()

    LaunchedEffect(callState) {
        if (callState is SipCallState.Ended || callState is SipCallState.Idle) {
            onCallEnded()
        }
    }

    val (extension, name) = when (val state = callState) {
        is SipCallState.Outgoing -> state.calleeExtension to state.calleeName
        is SipCallState.Connected -> state.remoteExtension to state.remoteName
        else -> "" to null
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = listOf(
                        MaterialTheme.colorScheme.primaryContainer,
                        MaterialTheme.colorScheme.background,
                    )
                )
            ),
        contentAlignment = Alignment.Center,
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.padding(32.dp),
        ) {
            val statusText = when (callState) {
                is SipCallState.Outgoing -> "Calling..."
                is SipCallState.Connected -> formatDuration(duration)
                else -> ""
            }
            Text(
                text = statusText,
                style = MaterialTheme.typography.labelLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Spacer(Modifier.height(24.dp))

            AvatarCircle(
                name = name ?: extension,
                size = 120.dp,
            )

            Spacer(Modifier.height(20.dp))

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

            // Controls row
            Row(
                horizontalArrangement = Arrangement.spacedBy(32.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                // Mute
                CallControlButton(
                    onClick = { callViewModel.toggleMute() },
                    icon = if (isMuted) Icons.Default.MicOff else Icons.Default.Mic,
                    label = if (isMuted) "Unmute" else "Mute",
                    active = isMuted,
                )

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

                // Speaker
                CallControlButton(
                    onClick = { callViewModel.toggleSpeaker() },
                    icon = if (isSpeaker) Icons.Default.VolumeUp else Icons.Default.VolumeOff,
                    label = "Speaker",
                    active = isSpeaker,
                )
            }
        }
    }
}

@Composable
private fun CallControlButton(
    onClick: () -> Unit,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    label: String,
    active: Boolean,
) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        IconButton(
            onClick = onClick,
            modifier = Modifier
                .size(56.dp)
                .background(
                    color = if (active) MaterialTheme.colorScheme.primary
                    else MaterialTheme.colorScheme.surfaceVariant,
                    shape = CircleShape,
                ),
        ) {
            Icon(
                icon,
                contentDescription = label,
                tint = if (active) MaterialTheme.colorScheme.onPrimary
                else MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
        Spacer(Modifier.height(4.dp))
        Text(
            label,
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}

private fun formatDuration(seconds: Long): String {
    val h = seconds / 3600
    val m = (seconds % 3600) / 60
    val s = seconds % 60
    return if (h > 0) "%d:%02d:%02d".format(h, m, s)
    else "%d:%02d".format(m, s)
}
