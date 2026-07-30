package com.esta.connect.domain.usecase.auth

import com.esta.connect.core.network.NetworkResult
import com.esta.connect.domain.model.Session
import com.esta.connect.domain.repository.AuthRepository
import javax.inject.Inject

class LoginUseCase @Inject constructor(
    private val authRepository: AuthRepository
) {
    suspend operator fun invoke(username: String, password: String): NetworkResult<Session> {
        if (username.isBlank() || password.isBlank()) {
            return NetworkResult.Error("Username and password are required")
        }
        return authRepository.login(username.trim(), password)
    }
}
