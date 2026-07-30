package com.esta.connect.data.repository

import com.esta.connect.core.database.dao.ContactDao
import com.esta.connect.core.network.NetworkResult
import com.esta.connect.core.network.api.EstaApiService
import com.esta.connect.core.network.safeApiCall
import com.esta.connect.data.mapper.toDomain
import com.esta.connect.data.mapper.toEntity
import com.esta.connect.domain.model.Contact
import com.esta.connect.domain.model.Department
import com.esta.connect.domain.repository.ContactsRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject

class ContactsRepositoryImpl @Inject constructor(
    private val contactDao: ContactDao,
    private val apiService: EstaApiService,
) : ContactsRepository {

    override fun getContacts(): Flow<List<Contact>> =
        contactDao.getAllContacts().map { list -> list.map { it.toDomain() } }

    override suspend fun syncContacts(): NetworkResult<Unit> = safeApiCall {
        val contacts = apiService.getContacts()
        // Preserve favorite state
        val favorites = contactDao.getFavorites()
        contactDao.upsertAll(contacts.map { it.toEntity() })
    }

    override suspend fun searchContacts(query: String): List<Contact> =
        contactDao.search(query).map { it.toDomain() }

    override fun getContactByExtension(extension: String): Flow<Contact?> =
        contactDao.getByExtension(extension).map { it?.toDomain() }

    override fun getFavoriteContacts(): Flow<List<Contact>> =
        contactDao.getFavorites().map { list -> list.map { it.toDomain() } }

    override suspend fun toggleFavorite(contactId: String, isFavorite: Boolean) {
        contactDao.setFavorite(contactId, isFavorite)
    }

    override suspend fun getDepartments(): NetworkResult<List<Department>> = safeApiCall {
        apiService.getDepartments().map { it.toDomain() }
    }

    override fun getContactsByDepartment(departmentId: String): Flow<List<Contact>> =
        contactDao.getByDepartment(departmentId).map { list -> list.map { it.toDomain() } }
}
