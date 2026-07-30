import { apiClient } from './client';
import type { User } from '../types';
import type { UserRole } from '../types';

export interface CreateUserDto {
  firstName: string;
  lastName: string;
  username: string;
  employeeId: string;
  password: string;
  email?: string;
  role?: UserRole;
  departmentId?: string;
  cabinet?: string;
  extensionNumber?: string;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  username?: string;
  employeeId?: string;
  password?: string;
  email?: string;
  role?: UserRole;
  departmentId?: string;
  cabinet?: string;
  extensionNumber?: string;
  isActive?: boolean;
}

export const usersApi = {
  getAll: () =>
    apiClient.get<User[]>('/users').then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<User>(`/users/${id}`).then((r) => r.data),

  create: (dto: CreateUserDto) =>
    apiClient.post<User>('/users', dto).then((r) => r.data),

  update: (id: string, dto: UpdateUserDto) =>
    apiClient.patch<User>(`/users/${id}`, dto).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete(`/users/${id}`).then((r) => r.data),

  deactivate: (id: string) =>
    apiClient.post(`/users/${id}/deactivate`).then((r) => r.data),

  activate: (id: string) =>
    apiClient.post(`/users/${id}/activate`).then((r) => r.data),

  generateActivationCode: (id: string) =>
    apiClient.get<{ activationCode: string }>(`/users/${id}/activation-code`).then((r) => r.data),

  resetPassword: (id: string, newPassword: string) =>
    apiClient.post(`/users/${id}/reset-password`, { newPassword }).then((r) => r.data),
};
