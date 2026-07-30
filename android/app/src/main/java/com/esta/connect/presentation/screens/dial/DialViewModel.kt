package com.esta.connect.presentation.screens.dial

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.esta.connect.domain.model.Contact
import com.esta.connect.domain.repository.ContactsRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class DialViewModel @Inject constructor(
    private val contactsRepository: ContactsRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow(DialUiState())
    val uiState: StateFlow<DialUiState> = _uiState.asStateFlow()

    fun onKeyPress(digit: String) {
        val newNumber = _uiState.value.number + digit
        _uiState.update { it.copy(number = newNumber) }
        lookupExtension(newNumber)
    }

    fun onBackspace() {
        val current = _uiState.value.number
        if (current.isNotEmpty()) {
            val newNumber = current.dropLast(1)
            _uiState.update { it.copy(number = newNumber, matchedContact = null) }
            if (newNumber.length >= 2) lookupExtension(newNumber)
        }
    }

    fun clearNumber() {
        _uiState.update { it.copy(number = "", matchedContact = null) }
    }

    private fun lookupExtension(extension: String) {
        viewModelScope.launch {
            val contact = contactsRepository.getContactByExtension(extension).firstOrNull()
            _uiState.update { it.copy(matchedContact = contact) }
        }
    }
}

data class DialUiState(
    val number: String = "",
    val matchedContact: Contact? = null,
)
