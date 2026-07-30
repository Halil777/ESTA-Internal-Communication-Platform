package com.esta.connect.core.network.api

import com.esta.connect.data.remote.dto.ActivateDeviceRequest
import com.esta.connect.data.remote.dto.CallRecordDto
import com.esta.connect.data.remote.dto.ContactDto
import com.esta.connect.data.remote.dto.DepartmentDto
import com.esta.connect.data.remote.dto.LoginRequest
import com.esta.connect.data.remote.dto.LoginResponse
import com.esta.connect.data.remote.dto.RefreshTokenRequest
import com.esta.connect.data.remote.dto.SipProvisioningDto
import com.esta.connect.data.remote.dto.UserDto
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

interface EstaApiService {

    // Auth
    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): LoginResponse

    @POST("auth/activate-device")
    suspend fun activateDevice(@Body request: ActivateDeviceRequest): LoginResponse

    @POST("auth/refresh")
    suspend fun refreshToken(@Body request: RefreshTokenRequest): LoginResponse

    @POST("auth/logout")
    suspend fun logout()

    // SIP Provisioning
    @GET("auth/sip-provisioning")
    suspend fun getSipProvisioning(): SipProvisioningDto

    // Users / Me
    @GET("auth/me")
    suspend fun getMe(): UserDto

    // Contacts (all employees)
    @GET("contacts")
    suspend fun getContacts(): List<ContactDto>

    @GET("contacts/search")
    suspend fun searchContacts(@Query("q") query: String): List<ContactDto>

    @GET("contacts/{extension}")
    suspend fun getContactByExtension(@Path("extension") extension: String): ContactDto

    // Departments
    @GET("departments")
    suspend fun getDepartments(): List<DepartmentDto>

    @GET("departments/{id}/users")
    suspend fun getDepartmentUsers(@Path("id") departmentId: String): List<ContactDto>

    // Call history
    @GET("calls/history")
    suspend fun getCallHistory(@Query("limit") limit: Int = 100): List<CallRecordDto>

    @GET("calls/missed")
    suspend fun getMissedCalls(): List<CallRecordDto>

    // Update FCM token
    @POST("auth/devices/push-token")
    suspend fun updatePushToken(@Body body: Map<String, String>)
}
