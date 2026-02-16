import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Notification, PaginatedResponse } from '../types';
import toast from 'react-hot-toast';

interface NotificationsParams {
  skip?: number;
  limit?: number;
  is_read?: boolean;
}

interface NotificationStats {
  unread_count: number;
}

export function useNotifications(params: NotificationsParams = {}) {
  return useQuery({
    queryKey: ['notifications', params],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<Notification>>('/notifications', {
        params: {
          skip: params.skip || 0,
          limit: params.limit || 20,
          is_read: params.is_read,
        },
      });
      return response.data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export function useNotificationStats() {
  return useQuery({
    queryKey: ['notifications', 'stats'],
    queryFn: async () => {
      const response = await api.get<NotificationStats>('/notifications/stats');
      return response.data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post<Notification>(`/notifications/${id}/read`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'stats'] });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to mark notification as read';
      toast.error(message);
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.post('/notifications/read-all');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'stats'] });
      toast.success('All notifications marked as read');
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to mark all notifications as read';
      toast.error(message);
    },
  });
}
