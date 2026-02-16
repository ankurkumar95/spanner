import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import {
  Contact,
  PaginatedResponse,
} from '../types';
import toast from 'react-hot-toast';

interface ContactsParams {
  skip?: number;
  limit?: number;
  search?: string;
  company_id?: string;
  segment_id?: string;
  status?: string;
  assigned_sdr_id?: string;
}

interface CreateContactData {
  first_name: string;
  last_name: string;
  email: string;
  company_id: string;
  segment_id: string;
  mobile_phone?: string;
  job_title?: string;
  direct_phone_number?: string;
}

interface UpdateContactData extends Partial<CreateContactData> {
  status?: 'uploaded' | 'approved' | 'assigned_to_sdr' | 'meeting_scheduled';
}

interface AssignContactData {
  sdr_id: string;
}

export function useContacts(params: ContactsParams = {}) {
  return useQuery({
    queryKey: ['contacts', params],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<Contact>>('/contacts', {
        params: {
          skip: params.skip || 0,
          limit: params.limit || 20,
          search: params.search || undefined,
          company_id: params.company_id && params.company_id !== 'all' ? params.company_id : undefined,
          segment_id: params.segment_id && params.segment_id !== 'all' ? params.segment_id : undefined,
          status: params.status && params.status !== 'all' ? params.status : undefined,
          assigned_sdr_id: params.assigned_sdr_id && params.assigned_sdr_id !== 'all' ? params.assigned_sdr_id : undefined,
        },
      });
      return response.data;
    },
  });
}

export function useContact(id: string) {
  return useQuery({
    queryKey: ['contact', id],
    queryFn: async () => {
      const response = await api.get<Contact>(`/contacts/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateContactData) => {
      const response = await api.post<Contact>('/contacts', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Contact created successfully');
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to create contact';
      toast.error(message);
    },
  });
}

export function useUpdateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateContactData }) => {
      const response = await api.patch<Contact>(`/contacts/${id}`, data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contact', data.id] });
      toast.success('Contact updated successfully');
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to update contact';
      toast.error(message);
    },
  });
}

export function useApproveContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post<Contact>(`/contacts/${id}/approve`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Contact approved successfully');
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to approve contact';
      toast.error(message);
    },
  });
}

export function useAssignContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: AssignContactData }) => {
      const response = await api.post<Contact>(`/contacts/${id}/assign`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Contact assigned successfully');
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to assign contact';
      toast.error(message);
    },
  });
}
