import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import {
  Segment,
  SegmentWithStats,
  PaginatedResponse,
} from '../types';
import toast from 'react-hot-toast';

interface SegmentsParams {
  skip?: number;
  limit?: number;
  search?: string;
  status?: string;
}

interface CreateSegmentData {
  name: string;
  description?: string;
  offering_ids?: string[];
}

interface UpdateSegmentData {
  name?: string;
  description?: string;
  offering_ids?: string[];
}

export function useSegments(params: SegmentsParams = {}) {
  return useQuery({
    queryKey: ['segments', params],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<SegmentWithStats>>('/segments', {
        params: {
          skip: params.skip || 0,
          limit: params.limit || 20,
          search: params.search || undefined,
          status: params.status && params.status !== 'all' ? params.status : undefined,
        },
      });
      return response.data;
    },
  });
}

export function useSegment(id: string) {
  return useQuery({
    queryKey: ['segment', id],
    queryFn: async () => {
      const response = await api.get<Segment>(`/segments/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateSegment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateSegmentData) => {
      const response = await api.post<Segment>('/segments', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['segments'] });
      toast.success('Segment created successfully');
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to create segment';
      toast.error(message);
    },
  });
}

export function useUpdateSegment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateSegmentData }) => {
      const response = await api.patch<Segment>(`/segments/${id}`, data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['segments'] });
      queryClient.invalidateQueries({ queryKey: ['segment', data.id] });
      toast.success('Segment updated successfully');
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to update segment';
      toast.error(message);
    },
  });
}

export function useArchiveSegment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post<Segment>(`/segments/${id}/archive`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['segments'] });
      toast.success('Segment archived successfully');
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to archive segment';
      toast.error(message);
    },
  });
}
