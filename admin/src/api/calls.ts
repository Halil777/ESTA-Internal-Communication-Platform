import { apiClient } from './client';
import type { CallRecord, LiveChannel } from '../types';

export const callsApi = {
  getAdminHistory: (params?: {
    limit?: number;
    direction?: string;
    status?: string;
    extension?: string;
    from?: string;
    to?: string;
  }) =>
    apiClient.get<CallRecord[]>('/calls/admin', { params }).then((r) => r.data),

  getLive: () =>
    apiClient.get<LiveChannel[]>('/calls/live').then((r) => r.data),

  getStats: () =>
    apiClient.get<{
      total: number;
      today: number;
      missed: number;
      missedToday: number;
      completed: number;
      averageDurationSeconds: number;
    }>('/calls/stats').then((r) => r.data),
};
