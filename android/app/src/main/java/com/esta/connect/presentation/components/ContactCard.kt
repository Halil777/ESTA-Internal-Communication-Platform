package com.esta.connect.presentation.components

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Call
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.esta.connect.domain.model.Contact
import com.esta.connect.domain.model.fullName

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ContactCard(
    contact: Contact,
    onCallClick: () -> Unit,
    onPttClick: (() -> Unit)? = null,
    onClick: () -> Unit = {},
    modifier: Modifier = Modifier,
) {
    Card(
        onClick = onClick,
        modifier = modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f)
        ),
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            // Avatar with status dot
            Box {
                AvatarCircle(
                    name = contact.fullName,
                    size = 48.dp,
                    avatarUrl = contact.avatarUrl,
                )
                StatusDot(
                    status = contact.status,
                    size = 12.dp,
                    modifier = Modifier.align(Alignment.BottomEnd),
                )
            }

            Spacer(Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = contact.fullName,
                    style = MaterialTheme.typography.titleSmall,
                )
                Text(
                    text = buildString {
                        contact.extension?.let { append("Ext. $it") } ?: append("No extension")
                        contact.department?.let { append(" · ${it.name}") }
                    },
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }

            if (onPttClick != null) {
                IconButton(
                    onClick = { if (contact.extension != null) onPttClick() },
                    enabled = contact.extension != null,
                    modifier = Modifier.size(40.dp),
                ) {
                    Icon(
                        Icons.Default.Mic,
                        contentDescription = "PTT ${contact.fullName}",
                        tint = if (contact.extension != null)
                            MaterialTheme.colorScheme.secondary
                        else
                            MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.4f),
                    )
                }
            }
            IconButton(
                onClick = onCallClick,
                enabled = contact.extension != null,
                modifier = Modifier.size(40.dp),
            ) {
                Icon(
                    Icons.Default.Call,
                    contentDescription = "Call ${contact.fullName}",
                    tint = if (contact.extension != null)
                        MaterialTheme.colorScheme.primary
                    else
                        MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.4f),
                )
            }
        }
    }
}
