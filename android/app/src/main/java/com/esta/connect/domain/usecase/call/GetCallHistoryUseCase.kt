package com.esta.connect.domain.usecase.call

import com.esta.connect.domain.model.CallRecord
import com.esta.connect.domain.model.CallDirection
import com.esta.connect.domain.model.CallStatus
import com.esta.connect.domain.repository.CallRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject

class GetCallHistoryUseCase @Inject constructor(
    private val callRepository: CallRepository
) {
    operator fun invoke(filter: CallHistoryFilter = CallHistoryFilter.ALL): Flow<List<CallRecord>> {
        return when (filter) {
            CallHistoryFilter.ALL -> callRepository.getCallHistory()
            CallHistoryFilter.INCOMING -> callRepository.getCallHistory().map { records ->
                records.filter { it.direction == CallDirection.INCOMING }
            }
            CallHistoryFilter.OUTGOING -> callRepository.getCallHistory().map { records ->
                records.filter { it.direction == CallDirection.OUTGOING }
            }
            CallHistoryFilter.MISSED -> callRepository.getMissedCalls()
        }
    }
}

enum class CallHistoryFilter { ALL, INCOMING, OUTGOING, MISSED }
