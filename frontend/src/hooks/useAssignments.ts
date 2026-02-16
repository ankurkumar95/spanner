import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import {
  Assignment,
  PaginatedResponse,
} from '../types';
import toast from 'react-hot-toast';

interface AssignmentsParams {
  skip?: number;
  limit?: number;
  entity_type?: string;
  assigned_to?: string;
}

interface CreateAssignmentData {
  entity_type: 'segment' | 'company' | 'contact';
  entity_id: string;
  assigned_to: string;
}

interface BulkAssignData {
  entity_type: 'segment' | 'company' | 'contact';
  entity_ids: string[];
  assigned_to: string;
}

export function useAssignments(params: AssignmentsParams = {}) {
  return useQuery({
    queryKey: ['assignments', params],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<Assignment>>('/assignments', {
        params: {
          skip: params.skip || 0,
          limit: params.limit || 20,
          entity_type: params.entity_type && params.entity_type !== 'all' ? params.entity_type : undefined,
          assigned_to: params.assigned_to && params.assigned_to !== 'all' ? params.assigned_to : undefined,
        },
      });
      return response.data;
    },
  });
}

export function useMyAssignments() {
  return useQuery({
    queryKey: ['my-assignments'],
    queryFn: async () => {
      const response = await api.get<Assignment[]>('/assignments/me');
      return response.data;
    },
  });
}

export function useCreateAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAssignmentData) => {
      const response = await api.post<Assignment>('/assignments', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['my-assignments'] });
      toast.success('Assignment created successfully');
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to create assignment';
      toast.error(message);
    },
  });
}

export function useBulkAssign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: BulkAssignData) => {
      const response = await api.post<{ created_count: number }>('/assignments/bulk', data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['my-assignments'] });
      toast.success(`${data.created_count} assignment(s) created successfully`);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to create assignments';
      toast.error(message);
    },
  });
}
