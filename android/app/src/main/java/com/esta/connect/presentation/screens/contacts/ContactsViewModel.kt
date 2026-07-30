package com.esta.connect.presentation.screens.contacts

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.esta.connect.domain.model.Contact
import com.esta.connect.domain.model.Department
import com.esta.connect.domain.repository.ContactsRepository
import com.esta.connect.domain.usecase.contacts.ContactFilter
import com.esta.connect.domain.usecase.contacts.GetContactsUseCase
import com.esta.connect.domain.usecase.contacts.SearchContactsUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.FlowPreview
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.flow.debounce
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

@OptIn(FlowPreview::class)
@HiltViewModel
class ContactsViewModel @Inject constructor(
    private val getContactsUseCase: GetContactsUseCase,
    private val searchContactsUseCase: SearchContactsUseCase,
    private val contactsRepository: ContactsRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow(ContactsUiState())
    val uiState: StateFlow<ContactsUiState> = _uiState.asStateFlow()

    private val _searchQuery = MutableStateFlow("")

    init {
        loadContacts()
        observeSearch()
        syncContacts()
    }

    private fun loadContacts() {
        viewModelScope.launch {
            getContactsUseCase(_uiState.value.filter).collectLatest { contacts ->
                _uiState.update { it.copy(contacts = contacts) }
            }
        }
    }

    private fun observeSearch() {
        viewModelScope.launch {
            _searchQuery
                .debounce(300)
                .distinctUntilChanged()
                .collectLatest { query ->
                    if (query.isBlank()) {
                        _uiState.update { it.copy(searchResults = null) }
                    } else {
                        val results = searchContactsUseCase(query)
                        _uiState.update { it.copy(searchResults = results) }
                    }
                }
        }
    }

    private fun syncContacts() {
        viewModelScope.launch {
            contactsRepository.syncContacts()
        }
    }

    fun onSearchQueryChange(query: String) {
        _searchQuery.value = query
        _uiState.update { it.copy(searchQuery = query) }
    }

    fun setFilter(filter: ContactFilter) {
        _uiState.update { it.copy(filter = filter) }
        loadContacts()
    }

    fun toggleFavorite(contact: Contact) {
        viewModelScope.launch {
            contactsRepository.toggleFavorite(contact.id, !contact.isFavorite)
        }
    }
}

data class ContactsUiState(
    val contacts: List<Contact> = emptyList(),
    val searchResults: List<Contact>? = null,
    val searchQuery: String = "",
    val filter: ContactFilter = ContactFilter.ALL,
    val departments: List<Department> = emptyList(),
)

val ContactsUiState.displayedContacts: List<Contact>
    get() = searchResults ?: contacts
