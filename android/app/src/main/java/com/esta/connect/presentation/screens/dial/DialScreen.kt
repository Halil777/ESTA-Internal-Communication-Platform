package com.esta.connect.presentation.screens.dial

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Backspace
import androidx.compose.material.icons.filled.Call
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.esta.connect.domain.model.fullName
import com.esta.connect.presentation.theme.CallGreen

private val dialPadKeys = listOf(
    listOf("1", "2", "3"),
    listOf("4", "5", "6"),
    listOf("7", "8", "9"),
    listOf("*", "0", "#"),
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DialScreen(
    onCall: (extension: String) -> Unit,
    viewModel: DialViewModel = hiltViewModel(),
) {
    val uiState by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = { TopAppBar(title = { Text("Dial Pad") }) }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 32.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Spacer(Modifier.height(16.dp))

            // Number display
            Text(
                text = uiState.number.ifBlank { " " },
                fontSize = 42.sp,
                fontWeight = FontWeight.Light,
                letterSpacing = 4.sp,
            )

            // Matched contact
            if (uiState.matchedContact != null) {
                Text(
                    text = uiState.matchedContact!!.fullName,
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.primary,
                )
                uiState.matchedContact!!.department?.let {
                    Text(
                        text = it.name,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }

            Spacer(Modifier.height(24.dp))

            // Dial pad
            dialPadKeys.forEach { row ->
                Row(
                    horizontalArrangement = Arrangement.spacedBy(24.dp, Alignment.CenterHorizontally),
                    modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                ) {
                    row.forEach { key ->
                        DialKey(
                            key = key,
                            onClick = { viewModel.onKeyPress(key) },
                        )
                    }
                }
            }

            Spacer(Modifier.height(24.dp))

            // Call + backspace row
            Row(
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.fillMaxWidth(),
            ) {
                Spacer(Modifier.weight(1f))

                // Call button
                Surface(
                    onClick = {
                        if (uiState.number.isNotBlank()) onCall(uiState.number)
                    },
                    shape = CircleShape,
                    color = if (uiState.number.isNotBlank()) CallGreen
                    else MaterialTheme.colorScheme.surfaceVariant,
                    modifier = Modifier.size(72.dp),
                ) {
                    Icon(
                        Icons.Default.Call,
                        contentDescription = "Call",
                        tint = if (uiState.number.isNotBlank())
                            androidx.compose.ui.graphics.Color.White
                        else MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(20.dp),
                    )
                }

                Spacer(Modifier.weight(1f))

                // Backspace
                if (uiState.number.isNotBlank()) {
                    IconButton(
                        onClick = { viewModel.onBackspace() },
                        modifier = Modifier.size(48.dp),
                    ) {
                        Icon(
                            Icons.Default.Backspace,
                            contentDescription = "Backspace",
                            tint = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                } else {
                    Spacer(Modifier.size(48.dp))
                }
            }
        }
    }
}

@Composable
private fun DialKey(key: String, onClick: () -> Unit) {
    FilledTonalButton(
        onClick = onClick,
        shape = CircleShape,
        modifier = Modifier.size(72.dp),
    ) {
        Text(
            text = key,
            fontSize = 22.sp,
            fontWeight = FontWeight.Normal,
        )
    }
}
