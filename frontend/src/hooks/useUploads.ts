import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import {
  UploadBatch,
  UploadError,
  PaginatedResponse,
} from '../types';
import toast from 'react-hot-toast';

interface UploadBatchesParams {
  skip?: number;
  limit?: number;
  upload_type?: 'company' | 'contact';
  status?: string;
}

export function useUploadBatches(params: UploadBatchesParams = {}) {
  return useQuery({
    queryKey: ['upload-batches', params],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<UploadBatch>>('/uploads/', {
        params: {
          skip: params.skip || 0,
          limit: params.limit || 20,
          upload_type: params.upload_type || undefined,
          status: params.status && params.status !== 'all' ? params.status : undefined,
        },
      });
      return response.data;
    },
  });
}

export function useUploadBatch(id: string) {
  return useQuery({
    queryKey: ['upload-batch', id],
    queryFn: async () => {
      const response = await api.get<UploadBatch>(`/uploads/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useUploadCompanies() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await api.post<UploadBatch>('/uploads/companies', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upload-batches'] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Company upload started successfully');
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to upload companies';
      toast.error(message);
    },
  });
}

export function useUploadContacts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await api.post<UploadBatch>('/uploads/contacts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upload-batches'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Contact upload started successfully');
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to upload contacts';
      toast.error(message);
    },
  });
}

export function useUploadErrors(batchId: string) {
  return useQuery({
    queryKey: ['upload-errors', batchId],
    queryFn: async () => {
      const response = await api.get<UploadError[]>(`/uploads/${batchId}/errors`);
      return response.data;
    },
    enabled: !!batchId,
  });
}
