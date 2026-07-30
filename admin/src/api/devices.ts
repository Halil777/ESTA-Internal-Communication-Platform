import { apiClient } from './client';
import type { Device } from '../types';

export const devicesApi = {
  getAll: () =>
    apiClient.get<Device[]>('/devices').then((r) => r.data),

  getByUser: (userId: string) =>
    apiClient.get<Device[]>(`/devices/user/${userId}`).then((r) => r.data),

  revoke: (id: string) =>
    apiClient.post(`/devices/${id}/revoke`).then((r) => r.data),

  revokeAll: (userId: string) =>
    apiClient.post(`/devices/user/${userId}/revoke-all`).then((r) => r.data),
};
