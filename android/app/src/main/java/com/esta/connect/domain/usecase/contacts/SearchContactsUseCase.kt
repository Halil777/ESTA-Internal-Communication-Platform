package com.esta.connect.domain.usecase.contacts

import com.esta.connect.domain.model.Contact
import com.esta.connect.domain.repository.ContactsRepository
import javax.inject.Inject

class SearchContactsUseCase @Inject constructor(
    private val contactsRepository: ContactsRepository
) {
    suspend operator fun invoke(query: String): List<Contact> {
        if (query.isBlank()) return emptyList()
        return contactsRepository.searchContacts(query.trim())
    }
}
