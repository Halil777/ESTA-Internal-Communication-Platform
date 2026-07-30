package com.esta.connect.presentation.screens.home

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Circle
import androidx.compose.material3.Badge
import androidx.compose.material3.BadgedBox
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.esta.connect.core.sip.SipRegistrationState
import com.esta.connect.presentation.components.ContactCard
import com.esta.connect.presentation.screens.call.CallViewModel
import com.esta.connect.presentation.theme.StatusOffline
import com.esta.connect.presentation.theme.StatusOnline

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    callViewModel: CallViewModel,
    onContactClick: (extension: String) -> Unit,
    viewModel: HomeViewModel = hiltViewModel(),
) {
    val uiState by viewModel.uiState.collectAsState()
    val missedCount by viewModel.missedCallCount.collectAsState()
    val registrationState by callViewModel.registrationState.collectAsState()

    val registeredColor = when (registrationState) {
        is SipRegistrationState.Registered -> StatusOnline
        else -> StatusOffline
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Esta Connect") },
                actions = {
                    // SIP registration indicator
                    IconButton(onClick = {}) {
                        Icon(
                            Icons.Default.Circle,
                            contentDescription = "SIP status",
                            tint = registeredColor,
                        )
                    }
                }
            )
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            // Missed calls badge hint
            if (missedCount > 0) {
                item {
                    Column(modifier = Modifier.fillMaxWidth()) {
                        Text(
                            text = "$missedCount missed call${if (missedCount > 1) "s" else ""}",
                            style = MaterialTheme.typography.labelMedium,
                            color = MaterialTheme.colorScheme.error,
                        )
                    }
                }
            }

            // Favorites section
            if (uiState.favorites.isNotEmpty()) {
                item {
                    Text(
                        text = "Favorites",
                        style = MaterialTheme.typography.titleMedium,
                    )
                }
                items(uiState.favorites, key = { it.id }) { contact ->
                    ContactCard(
                        contact = contact,
                        onCallClick = {
                            contact.extension?.let { onContactClick(it) }
                        },
                    )
                }
            }

            item { Spacer(Modifier.height(8.dp)) }
        }
    }
}
