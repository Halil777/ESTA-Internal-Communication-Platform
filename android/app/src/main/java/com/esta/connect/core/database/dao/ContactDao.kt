package com.esta.connect.core.database.dao

import androidx.room.Dao
import androidx.room.Query
import androidx.room.Upsert
import com.esta.connect.core.database.entity.ContactEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface ContactDao {

    @Upsert
    suspend fun upsertAll(contacts: List<ContactEntity>)

    @Upsert
    suspend fun upsert(contact: ContactEntity)

    @Query("SELECT * FROM contacts ORDER BY firstName ASC, lastName ASC")
    fun getAllContacts(): Flow<List<ContactEntity>>

    @Query("SELECT * FROM contacts WHERE isFavorite = 1 ORDER BY firstName ASC")
    fun getFavorites(): Flow<List<ContactEntity>>

    @Query("SELECT * FROM contacts WHERE extension = :extension LIMIT 1")
    fun getByExtension(extension: String): Flow<ContactEntity?>

    @Query("SELECT * FROM contacts WHERE departmentId = :departmentId ORDER BY firstName ASC")
    fun getByDepartment(departmentId: String): Flow<List<ContactEntity>>

    @Query("""
        SELECT * FROM contacts
        WHERE firstName LIKE '%' || :query || '%'
           OR lastName LIKE '%' || :query || '%'
           OR extension LIKE '%' || :query || '%'
           OR departmentName LIKE '%' || :query || '%'
        ORDER BY firstName ASC
        LIMIT 50
    """)
    suspend fun search(query: String): List<ContactEntity>

    @Query("UPDATE contacts SET isFavorite = :isFavorite WHERE id = :contactId")
    suspend fun setFavorite(contactId: String, isFavorite: Boolean)

    @Query("UPDATE contacts SET status = :status WHERE id = :contactId")
    suspend fun updateStatus(contactId: String, status: String)

    @Query("DELETE FROM contacts")
    suspend fun deleteAll()
}
