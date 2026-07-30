package com.esta.connect.presentation.screens.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.esta.connect.core.network.websocket.WebSocketManager
import com.esta.connect.core.network.websocket.WsEvent
import com.esta.connect.core.database.dao.ContactDao
import com.esta.connect.domain.model.Contact
import com.esta.connect.domain.model.UserStatus
import com.esta.connect.domain.repository.AuthRepository
import com.esta.connect.domain.repository.CallRepository
import com.esta.connect.domain.repository.ContactsRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class HomeViewModel @Inject constructor(
    private val contactsRepository: ContactsRepository,
    private val callRepository: CallRepository,
    private val authRepository: AuthRepository,
    private val webSocketManager: WebSocketManager,
    private val contactDao: ContactDao,
) : ViewModel() {

    private val _uiState = MutableStateFlow(HomeUiState())
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    val missedCallCount = callRepository.getUnseenMissedCallCount()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0)

    init {
        loadFavorites()
        observeWebSocket()
        webSocketManager.connect()
    }

    private fun loadFavorites() {
        viewModelScope.launch {
            contactsRepository.getFavoriteContacts().collectLatest { favorites ->
                _uiState.update { it.copy(favorites = favorites) }
            }
        }
    }

    private fun observeWebSocket() {
        viewModelScope.launch {
            webSocketManager.events.collect { event ->
                when (event.type) {
                    WsEvent.USER_ONLINE -> event.userId?.let {
                        contactDao.updateStatus(it, "ONLINE")
                    }
                    WsEvent.USER_OFFLINE -> event.userId?.let {
                        contactDao.updateStatus(it, "OFFLINE")
                    }
                    WsEvent.USER_BUSY -> event.userId?.let {
                        contactDao.updateStatus(it, "BUSY")
                    }
                }
            }
        }
    }

    override fun onCleared() {
        webSocketManager.disconnect()
        super.onCleared()
    }
}

data class HomeUiState(
    val favorites: List<Contact> = emptyList(),
)
