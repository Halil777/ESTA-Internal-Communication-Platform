package com.esta.connect.core.di

import com.esta.connect.data.repository.AuthRepositoryImpl
import com.esta.connect.data.repository.CallRepositoryImpl
import com.esta.connect.data.repository.ContactsRepositoryImpl
import com.esta.connect.domain.repository.AuthRepository
import com.esta.connect.domain.repository.CallRepository
import com.esta.connect.domain.repository.ContactsRepository
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryModule {

    @Binds
    @Singleton
    abstract fun bindAuthRepository(impl: AuthRepositoryImpl): AuthRepository

    @Binds
    @Singleton
    abstract fun bindContactsRepository(impl: ContactsRepositoryImpl): ContactsRepository

    @Binds
    @Singleton
    abstract fun bindCallRepository(impl: CallRepositoryImpl): CallRepository
}
