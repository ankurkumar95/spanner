import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import {
  User,
  PaginatedResponse,
} from '../types';
import toast from 'react-hot-toast';

interface UsersParams {
  skip?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
}

interface CreateUserData {
  email: string;
  name: string;
  password: string;
  roles: string[];
}

interface UpdateUserData {
  name?: string;
  email?: string;
  roles?: string[];
  status?: 'active' | 'deactivated';
}

interface UserListResponse {
  users: User[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export function useUsers(params: UsersParams = {}) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: async () => {
      const page = Math.floor((params.skip || 0) / (params.limit || 20)) + 1;
      const response = await api.get<UserListResponse>('/users', {
        params: {
          page,
          per_page: params.limit || 20,
          search: params.search || undefined,
          role: params.role && params.role !== 'all' ? params.role : undefined,
          status: params.status && params.status !== 'all' ? params.status : undefined,
        },
      });
      return {
        items: response.data.users,
        total: response.data.total,
        skip: params.skip || 0,
        limit: params.limit || 20,
      } as PaginatedResponse<User>;
    },
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ['user', id],
    queryFn: async () => {
      const response = await api.get<User>(`/users/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateUserData) => {
      const response = await api.post<User>('/users', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User created successfully');
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to create user';
      toast.error(message);
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateUserData }) => {
      const response = await api.patch<User>(`/users/${id}`, data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', data.id] });
      toast.success('User updated successfully');
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to update user';
      toast.error(message);
    },
  });
}

export function useUpdateUserRoles() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, roles }: { id: string; roles: string[] }) => {
      const response = await api.put<User>(`/users/${id}/roles`, { roles });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', data.id] });
      toast.success('User roles updated successfully');
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to update user roles';
      toast.error(message);
    },
  });
}

export function useDeactivateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post(`/users/${id}/deactivate`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deactivated');
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to deactivate user';
      toast.error(message);
    },
  });
}

export function useActivateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post(`/users/${id}/activate`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User activated');
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to activate user';
      toast.error(message);
    },
  });
}
