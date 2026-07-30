import { apiClient } from './client';
import type { Extension } from '../types';

export const extensionsApi = {
  getAll: () =>
    apiClient.get<Extension[]>('/extensions').then((r) => r.data),

  reserve: (extensionNumber: string) =>
    apiClient.post<Extension>('/extensions/reserve', { extensionNumber }).then((r) => r.data),

  assign: (extensionNumber: string, userId: string) =>
    apiClient.post<Extension>('/extensions/assign', { extensionNumber, userId }).then((r) => r.data),

  updatePolicy: (
    extensionNumber: string,
    payload: Partial<Pick<Extension, 'displayName' | 'allowIncomingCalls' | 'allowOutgoingCalls' | 'allowInternal' | 'allowExternal' | 'recordCalls' | 'allowedCodecs'>>
  ) =>
    apiClient.patch<Extension>(`/extensions/${extensionNumber}`, payload).then((r) => r.data),

  release: (extensionNumber: string) =>
    apiClient.post(`/extensions/${extensionNumber}/release`).then((r) => r.data),

  disable: (extensionNumber: string) =>
    apiClient.post(`/extensions/${extensionNumber}/disable`).then((r) => r.data),

  enable: (extensionNumber: string) =>
    apiClient.post(`/extensions/${extensionNumber}/enable`).then((r) => r.data),

  setForwarding: (extensionNumber: string, forwardTo?: string) =>
    apiClient.patch(`/extensions/${extensionNumber}/forward`, { forwardTo }).then((r) => r.data),

  resetSecret: (extensionNumber: string) =>
    apiClient.post<{
      extension: string;
      username: string;
      password: string;
      domain: string;
      transport: string;
      port: number;
    }>(`/extensions/${extensionNumber}/reset-secret`).then((r) => r.data),

  getStatus: (extensionNumber: string) =>
    apiClient.get<{
      extensionNumber: string;
      enabled: boolean;
      status: string;
      userId?: string;
      sipUsername?: string;
      registered: boolean;
      contactCount: number;
    }>(`/extensions/${extensionNumber}/status`).then((r) => r.data),
};
