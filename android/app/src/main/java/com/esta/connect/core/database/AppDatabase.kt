package com.esta.connect.core.database

import androidx.room.Database
import androidx.room.RoomDatabase
import com.esta.connect.core.database.dao.CallRecordDao
import com.esta.connect.core.database.dao.ContactDao
import com.esta.connect.core.database.entity.CallRecordEntity
import com.esta.connect.core.database.entity.ContactEntity

@Database(
    entities = [
        ContactEntity::class,
        CallRecordEntity::class,
    ],
    version = 2,
    exportSchema = true,
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun contactDao(): ContactDao
    abstract fun callRecordDao(): CallRecordDao
}
