import { apiClient } from './client';
import type { Department } from '../types';

export interface CreateDepartmentDto {
  name: string;
  code: string;
  floor?: number;
  groupExtension?: string;
}

export const departmentsApi = {
  getAll: () =>
    apiClient.get<Department[]>('/departments').then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<Department>(`/departments/${id}`).then((r) => r.data),

  create: (dto: CreateDepartmentDto) =>
    apiClient.post<Department>('/departments', dto).then((r) => r.data),

  update: (id: string, dto: Partial<CreateDepartmentDto>) =>
    apiClient.patch<Department>(`/departments/${id}`, dto).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete(`/departments/${id}`).then((r) => r.data),
};
