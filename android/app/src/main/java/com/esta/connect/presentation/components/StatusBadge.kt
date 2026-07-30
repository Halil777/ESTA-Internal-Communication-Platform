package com.esta.connect.presentation.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.esta.connect.domain.model.UserStatus
import com.esta.connect.presentation.theme.StatusAway
import com.esta.connect.presentation.theme.StatusBusy
import com.esta.connect.presentation.theme.StatusDnd
import com.esta.connect.presentation.theme.StatusInCall
import com.esta.connect.presentation.theme.StatusOffline
import com.esta.connect.presentation.theme.StatusOnline

@Composable
fun StatusDot(
    status: UserStatus,
    size: Dp = 10.dp,
    modifier: Modifier = Modifier,
) {
    Box(
        modifier = modifier
            .size(size)
            .background(status.color, CircleShape)
            .border(1.5.dp, MaterialTheme.colorScheme.surface, CircleShape)
    )
}

@Composable
fun StatusChip(
    status: UserStatus,
    modifier: Modifier = Modifier,
) {
    Box(
        modifier = modifier
            .background(status.color.copy(alpha = 0.12f), RoundedCornerShape(8.dp))
            .padding(horizontal = 8.dp, vertical = 2.dp),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text = status.label,
            style = MaterialTheme.typography.labelSmall,
            color = status.color,
        )
    }
}

val UserStatus.color: Color get() = when (this) {
    UserStatus.ONLINE -> StatusOnline
    UserStatus.BUSY -> StatusBusy
    UserStatus.IN_CALL -> StatusInCall
    UserStatus.DO_NOT_DISTURB -> StatusDnd
    UserStatus.AWAY -> StatusAway
    UserStatus.MEETING -> StatusDnd
    UserStatus.OFFLINE -> StatusOffline
}

val UserStatus.label: String get() = when (this) {
    UserStatus.ONLINE -> "Online"
    UserStatus.BUSY -> "Busy"
    UserStatus.IN_CALL -> "In Call"
    UserStatus.DO_NOT_DISTURB -> "DND"
    UserStatus.AWAY -> "Away"
    UserStatus.MEETING -> "Meeting"
    UserStatus.OFFLINE -> "Offline"
}
