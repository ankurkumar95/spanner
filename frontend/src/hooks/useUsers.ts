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

export function useUsers(params: UsersParams = {}) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<User>>('/users', {
        params: {
          skip: params.skip || 0,
          limit: params.limit || 20,
          search: params.search || undefined,
          role: params.role && params.role !== 'all' ? params.role : undefined,
          status: params.status && params.status !== 'all' ? params.status : undefined,
        },
      });
      return response.data;
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
