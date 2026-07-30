package com.esta.connect.domain.usecase.contacts

import com.esta.connect.domain.model.Contact
import com.esta.connect.domain.model.UserStatus
import com.esta.connect.domain.repository.ContactsRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject

class GetContactsUseCase @Inject constructor(
    private val contactsRepository: ContactsRepository
) {
    operator fun invoke(filter: ContactFilter = ContactFilter.ALL): Flow<List<Contact>> {
        return when (filter) {
            ContactFilter.ALL -> contactsRepository.getContacts()
            ContactFilter.ONLINE -> contactsRepository.getContacts().map { contacts ->
                contacts.filter { it.status == UserStatus.ONLINE }
            }
            ContactFilter.FAVORITES -> contactsRepository.getFavoriteContacts()
        }
    }
}

enum class ContactFilter { ALL, ONLINE, FAVORITES }
