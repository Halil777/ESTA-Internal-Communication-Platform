package com.esta.connect.presentation.screens.history

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.esta.connect.domain.model.CallRecord
import com.esta.connect.domain.repository.CallRepository
import com.esta.connect.domain.usecase.call.CallHistoryFilter
import com.esta.connect.domain.usecase.call.GetCallHistoryUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class HistoryViewModel @Inject constructor(
    private val getCallHistoryUseCase: GetCallHistoryUseCase,
    private val callRepository: CallRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow(HistoryUiState())
    val uiState: StateFlow<HistoryUiState> = _uiState.asStateFlow()

    init {
        loadHistory()
        viewModelScope.launch { callRepository.markMissedCallsSeen() }
        viewModelScope.launch { callRepository.syncCallHistory() }
    }

    private fun loadHistory(filter: CallHistoryFilter = CallHistoryFilter.ALL) {
        viewModelScope.launch {
            getCallHistoryUseCase(filter).collectLatest { records ->
                _uiState.update { it.copy(records = records) }
            }
        }
    }

    fun setFilter(filter: CallHistoryFilter) {
        _uiState.update { it.copy(filter = filter) }
        loadHistory(filter)
    }
}

data class HistoryUiState(
    val records: List<CallRecord> = emptyList(),
    val filter: CallHistoryFilter = CallHistoryFilter.ALL,
)
