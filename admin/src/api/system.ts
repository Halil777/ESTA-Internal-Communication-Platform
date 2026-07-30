import { apiClient } from './client';

export interface DashboardStats {
  users: { total: number; active: number; online: number; offline: number };
  extensions: { total: number; inUse: number; available: number };
  devices: { total: number; sipRegistered: number; registered: number };
  calls: {
    total: number;
    missed: number;
    missedToday: number;
    completed: number;
    today: number;
    averageDurationSeconds: number;
    totalDuration: number;
  };
  pbx: {
    connected: boolean;
    status: string;
    activeCalls: number;
    amiHost: string;
    amiPort: number;
    sipDomain: string;
    sipPort: number;
    sipTransport: string;
  };
  server: {
    platform: string;
    cpuCores: number;
    cpuUsage: number;
    memoryTotal: number;
    memoryFree: number;
    memoryUsedPct: number;
    memUsage: number;
    uptime: number;
    nodeVersion: string;
  };
  recordings: {
    total: number;
    sizeBytes: number;
    storagePath: string;
  };
}

export const systemApi = {
  getDashboard: () =>
    apiClient.get<DashboardStats>('/system/dashboard').then((r) => r.data),

  getHealth: () =>
    apiClient.get<{ status: string; database: boolean; redis: boolean; pbx: boolean }>('/system/health').then((r) => r.data),

  getPbxStatus: () =>
    apiClient.get<{
      connected: boolean;
      status: string;
      amiHost: string;
      amiPort: number;
      sipDomain: string;
      sipPort: number;
      sipTransport: string;
    }>('/system/pbx-status').then((r) => r.data),
};
