package com.esta.connect.core.datastore

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "esta_session")

@Singleton
class SessionDataStore @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private val dataStore = context.dataStore

    val accessToken: Flow<String?> = dataStore.data.map { it[Keys.ACCESS_TOKEN] }
    val refreshToken: Flow<String?> = dataStore.data.map { it[Keys.REFRESH_TOKEN] }
    val userId: Flow<String?> = dataStore.data.map { it[Keys.USER_ID] }
    val extension: Flow<String?> = dataStore.data.map { it[Keys.EXTENSION] }
    val deviceId: Flow<String?> = dataStore.data.map { it[Keys.DEVICE_ID] }

    val isLoggedIn: Flow<Boolean> = dataStore.data.map {
        it[Keys.ACCESS_TOKEN] != null
    }

    suspend fun saveSession(
        accessToken: String,
        refreshToken: String,
        userId: String,
        extension: String,
        deviceId: String,
    ) {
        dataStore.edit { prefs ->
            prefs[Keys.ACCESS_TOKEN] = accessToken
            prefs[Keys.REFRESH_TOKEN] = refreshToken
            prefs[Keys.USER_ID] = userId
            prefs[Keys.EXTENSION] = extension
            prefs[Keys.DEVICE_ID] = deviceId
        }
    }

    suspend fun updateAccessToken(token: String) {
        dataStore.edit { prefs ->
            prefs[Keys.ACCESS_TOKEN] = token
        }
    }

    suspend fun clearSession() {
        dataStore.edit { it.clear() }
    }

    private object Keys {
        val ACCESS_TOKEN = stringPreferencesKey("access_token")
        val REFRESH_TOKEN = stringPreferencesKey("refresh_token")
        val USER_ID = stringPreferencesKey("user_id")
        val EXTENSION = stringPreferencesKey("extension")
        val DEVICE_ID = stringPreferencesKey("device_id")
    }
}
