package com.esta.connect.core.network

sealed class NetworkResult<out T> {
    data class Success<T>(val data: T) : NetworkResult<T>()
    data class Error(val message: String, val code: Int? = null) : NetworkResult<Nothing>()
    data object Loading : NetworkResult<Nothing>()

    val isSuccess get() = this is Success
    val isError get() = this is Error

    fun getOrNull(): T? = (this as? Success)?.data

    inline fun onSuccess(action: (T) -> Unit): NetworkResult<T> {
        if (this is Success) action(data)
        return this
    }

    inline fun onError(action: (String, Int?) -> Unit): NetworkResult<T> {
        if (this is Error) action(message, code)
        return this
    }
}

inline fun <T> safeApiCall(block: () -> T): NetworkResult<T> = try {
    NetworkResult.Success(block())
} catch (e: retrofit2.HttpException) {
    val code = e.code()
    val message = when (code) {
        400 -> "Bad request"
        401 -> "Unauthorized — please login again"
        403 -> "Access denied"
        404 -> "Not found"
        409 -> "Conflict — resource already exists"
        422 -> "Validation error"
        500, 502, 503 -> "Server error — please try again"
        else -> e.message ?: "Unknown HTTP error"
    }
    NetworkResult.Error(message, code)
} catch (e: java.net.SocketTimeoutException) {
    NetworkResult.Error("Connection timeout — check your Wi-Fi")
} catch (e: java.net.UnknownHostException) {
    NetworkResult.Error("Cannot reach server — check your network")
} catch (e: Exception) {
    NetworkResult.Error(e.message ?: "Unexpected error")
}
