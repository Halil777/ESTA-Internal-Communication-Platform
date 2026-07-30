package com.esta.connect.presentation.screens.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.esta.connect.core.network.NetworkResult
import com.esta.connect.domain.usecase.auth.ActivateDeviceUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class QrScanViewModel @Inject constructor(
    private val activateDeviceUseCase: ActivateDeviceUseCase,
) : ViewModel() {

    private val _uiState = MutableStateFlow(QrScanUiState())
    val uiState: StateFlow<QrScanUiState> = _uiState.asStateFlow()

    private var activated = false

    fun activate(code: String, onSuccess: () -> Unit) {
        if (activated || _uiState.value.isLoading) return
        activated = true

        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            when (val result = activateDeviceUseCase(code)) {
                is NetworkResult.Success -> {
                    _uiState.update { it.copy(isLoading = false) }
                    onSuccess()
                }
                is NetworkResult.Error -> {
                    activated = false
                    _uiState.update { it.copy(isLoading = false, error = result.message) }
                }
                else -> {}
            }
        }
    }
}

data class QrScanUiState(
    val isLoading: Boolean = false,
    val error: String? = null,
)
