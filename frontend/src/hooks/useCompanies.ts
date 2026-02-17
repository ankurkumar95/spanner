import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import {
  Company,
  CompanyWithContacts,
  PaginatedResponse,
} from '../types';
import toast from 'react-hot-toast';

interface CompaniesParams {
  skip?: number;
  limit?: number;
  search?: string;
  segment_id?: string;
  status?: string;
  is_duplicate?: boolean;
}

interface CreateCompanyData {
  company_name: string;
  segment_id: string;
  company_website?: string;
  company_phone?: string;
  company_description?: string;
  company_linkedin_url?: string;
  company_industry?: string;
  company_sub_industry?: string;
  street?: string;
  city?: string;
  state_province?: string;
  country_region?: string;
  zip_postal_code?: string;
  founded_year?: number;
  revenue_range?: string;
  employee_size_range?: string;
}

interface UpdateCompanyData extends Partial<CreateCompanyData> {}

export function useCompanies(params: CompaniesParams = {}) {
  return useQuery({
    queryKey: ['companies', params],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<CompanyWithContacts>>('/companies/', {
        params: {
          skip: params.skip || 0,
          limit: params.limit || 20,
          search: params.search || undefined,
          segment_id: params.segment_id && params.segment_id !== 'all' ? params.segment_id : undefined,
          status: params.status && params.status !== 'all' ? params.status : undefined,
          is_duplicate: params.is_duplicate,
        },
      });
      return response.data;
    },
  });
}

export function useCompany(id: string) {
  return useQuery({
    queryKey: ['company', id],
    queryFn: async () => {
      const response = await api.get<CompanyWithContacts>(`/companies/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCompanyData) => {
      const response = await api.post<Company>('/companies/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Company created successfully');
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to create company';
      toast.error(message);
    },
  });
}

export function useUpdateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateCompanyData }) => {
      const response = await api.patch<Company>(`/companies/${id}`, data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['company', data.id] });
      toast.success('Company updated successfully');
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to update company';
      toast.error(message);
    },
  });
}

export function useMarkCompanyDuplicate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_duplicate }: { id: string; is_duplicate: boolean }) => {
      const response = await api.post<Company>(`/companies/${id}/duplicate`, null, {
        params: { is_duplicate },
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['company', data.id] });
      toast.success(data.is_duplicate ? 'Marked as duplicate' : 'Unmarked as duplicate');
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to update duplicate status';
      toast.error(message);
    },
  });
}

export function useApproveCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post<Company>(`/companies/${id}/approve`, { status: 'approved' });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['company', data.id] });
      toast.success('Company approved successfully');
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to approve company';
      toast.error(message);
    },
  });
}

export function useRejectCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const response = await api.post<Company>(`/companies/${id}/approve`, { status: 'rejected', rejection_reason: reason });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Company rejected successfully');
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to reject company';
      toast.error(message);
    },
  });
}
