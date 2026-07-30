package com.esta.connect.domain.repository

import com.esta.connect.core.network.NetworkResult
import com.esta.connect.domain.model.Contact
import com.esta.connect.domain.model.Department
import kotlinx.coroutines.flow.Flow

interface ContactsRepository {
    fun getContacts(): Flow<List<Contact>>
    suspend fun syncContacts(): NetworkResult<Unit>
    suspend fun searchContacts(query: String): List<Contact>
    fun getContactByExtension(extension: String): Flow<Contact?>
    fun getFavoriteContacts(): Flow<List<Contact>>
    suspend fun toggleFavorite(contactId: String, isFavorite: Boolean)
    suspend fun getDepartments(): NetworkResult<List<Department>>
    fun getContactsByDepartment(departmentId: String): Flow<List<Contact>>
}
