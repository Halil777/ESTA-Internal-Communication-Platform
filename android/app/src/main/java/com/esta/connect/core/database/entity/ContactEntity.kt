package com.esta.connect.core.database.entity

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(tableName = "contacts")
data class ContactEntity(
    @PrimaryKey val id: String,
    val firstName: String,
    val lastName: String,
    val extension: String?,
    val departmentId: String?,
    val departmentName: String?,
    val cabinet: String?,
    val status: String,
    val avatarUrl: String?,
    val isFavorite: Boolean = false,
    val updatedAt: Long = System.currentTimeMillis(),
)
