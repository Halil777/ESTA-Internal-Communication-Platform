package com.esta.connect.presentation.screens.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.esta.connect.core.datastore.SessionDataStore
import com.esta.connect.core.sip.LinphoneSipManager
import com.esta.connect.domain.repository.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ProfileViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val sessionDataStore: SessionDataStore,
    private val sipManager: LinphoneSipManager,
) : ViewModel() {

    private val _uiState = MutableStateFlow(ProfileUiState())
    val uiState: StateFlow<ProfileUiState> = _uiState.asStateFlow()

    init {
        loadProfile()
    }

    private fun loadProfile() {
        viewModelScope.launch {
            val extension = sessionDataStore.extension.firstOrNull() ?: ""
            val userId = sessionDataStore.userId.firstOrNull() ?: ""
            _uiState.update { it.copy(extension = extension, userId = userId) }
        }
    }

    fun logout(onLogout: () -> Unit) {
        viewModelScope.launch {
            sipManager.unregister()
            authRepository.logout()
            onLogout()
        }
    }
}

data class ProfileUiState(
    val extension: String = "",
    val userId: String = "",
)
