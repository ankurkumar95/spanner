import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useDebounce } from './useDebounce';
import toast from 'react-hot-toast';

export interface Offering {
  id: string;
  name: string;
  status: string;
  description?: string | null;
  created_at: string;
  updated_at: string;
}

interface CreateOfferingData {
  name: string;
  description?: string;
}

export function useSearchOfferings(search: string) {
  const debouncedSearch = useDebounce(search, 300);

  return useQuery({
    queryKey: ['offerings', 'search', debouncedSearch],
    queryFn: async () => {
      const response = await api.get<Offering[]>('/offerings/', {
        params: {
          search: debouncedSearch || undefined,
          limit: 20,
          status: 'active',
        },
      });
      return response.data;
    },
    enabled: true,
  });
}

export function useCreateOffering() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateOfferingData) => {
      const response = await api.post<Offering>('/offerings/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offerings'] });
      toast.success('Offering created successfully');
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to create offering';
      toast.error(message);
    },
  });
}
