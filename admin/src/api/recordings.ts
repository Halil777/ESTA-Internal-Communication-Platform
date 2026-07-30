import { apiClient } from './client';
import type { Recording } from '../types';

export const recordingsApi = {
  getAll: (params?: {
    limit?: number;
    extension?: string;
    from?: string;
    to?: string;
  }) =>
    apiClient.get<Recording[]>('/recordings', { params }).then((r) => r.data),

  getStats: () =>
    apiClient
      .get<{ total: number; sizeBytes: number }>('/recordings/stats')
      .then((r) => r.data),
};
