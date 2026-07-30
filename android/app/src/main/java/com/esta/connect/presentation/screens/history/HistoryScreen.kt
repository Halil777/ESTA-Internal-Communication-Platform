package com.esta.connect.presentation.screens.history

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Call
import androidx.compose.material.icons.filled.CallMade
import androidx.compose.material.icons.filled.CallMissed
import androidx.compose.material.icons.filled.CallReceived
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.esta.connect.domain.model.CallDirection
import com.esta.connect.domain.model.CallRecord
import com.esta.connect.domain.model.CallStatus
import com.esta.connect.domain.model.displayName
import com.esta.connect.domain.usecase.call.CallHistoryFilter
import com.esta.connect.presentation.theme.CallGreen
import com.esta.connect.presentation.theme.CallRed
import com.esta.connect.presentation.theme.StatusOffline
import java.time.ZoneId
import java.time.format.DateTimeFormatter

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HistoryScreen(
    onCallBack: (extension: String) -> Unit,
    viewModel: HistoryViewModel = hiltViewModel(),
) {
    val uiState by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = { TopAppBar(title = { Text("Call History") }) }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding),
        ) {
            LazyRow(
                contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                items(CallHistoryFilter.entries) { filter ->
                    FilterChip(
                        selected = uiState.filter == filter,
                        onClick = { viewModel.setFilter(filter) },
                        label = { Text(filter.label) },
                    )
                }
            }

            if (uiState.records.isEmpty()) {
                Column(
                    modifier = Modifier.fillMaxSize(),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center,
                ) {
                    Text(
                        "No calls yet",
                        style = MaterialTheme.typography.bodyLarge,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            } else {
                LazyColumn(
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    items(uiState.records, key = { it.id }) { record ->
                        CallHistoryItem(
                            record = record,
                            onCallBack = { onCallBack(record.remoteExtension) },
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun CallHistoryItem(
    record: CallRecord,
    onCallBack: () -> Unit,
) {
    val (icon, tint) = when {
        record.status == CallStatus.MISSED -> Icons.Default.CallMissed to CallRed
        record.direction == CallDirection.INCOMING -> Icons.Default.CallReceived to CallGreen
        else -> Icons.Default.CallMade to MaterialTheme.colorScheme.primary
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(0.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f),
        ),
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Icon(icon, contentDescription = null, tint = tint, modifier = Modifier.size(24.dp))
            Spacer(Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = record.displayName,
                    style = MaterialTheme.typography.titleSmall,
                )
                Text(
                    text = "Ext. ${record.remoteExtension} · ${record.formattedTime}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                if (record.durationSeconds > 0) {
                    Text(
                        text = record.formattedDuration,
                        style = MaterialTheme.typography.bodySmall,
                        color = StatusOffline,
                    )
                }
            }
            IconButton(onClick = onCallBack) {
                Icon(
                    Icons.Default.Call,
                    contentDescription = "Call back",
                    tint = MaterialTheme.colorScheme.primary,
                )
            }
        }
    }
}

private val timeFormatter = DateTimeFormatter.ofPattern("HH:mm · dd MMM")

private val CallRecord.formattedTime: String
    get() = startedAt.atZone(ZoneId.systemDefault()).format(timeFormatter)

private val CallRecord.formattedDuration: String
    get() {
        val m = durationSeconds / 60
        val s = durationSeconds % 60
        return if (m > 0) "${m}m ${s}s" else "${s}s"
    }

private val CallHistoryFilter.label: String get() = when (this) {
    CallHistoryFilter.ALL -> "All"
    CallHistoryFilter.INCOMING -> "Incoming"
    CallHistoryFilter.OUTGOING -> "Outgoing"
    CallHistoryFilter.MISSED -> "Missed"
}
