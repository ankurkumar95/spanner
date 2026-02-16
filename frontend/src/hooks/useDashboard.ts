import { useQueries, useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import {
  SegmentWithStats,
  CompanyWithContacts,
  Contact,
  PaginatedResponse,
} from '../types';

interface DashboardStats {
  totalSegments: number;
  totalCompanies: number;
  totalContacts: number;
  pendingCompanies: number;
  pendingContacts: number;
  assignedContacts: number;
  meetingScheduled: number;
  contactsByStatus: {
    uploaded: number;
    approved: number;
    assigned_to_sdr: number;
    meeting_scheduled: number;
  };
  isLoading: boolean;
  error: Error | null;
}

interface RecentActivity {
  id: string;
  type: 'company' | 'contact';
  name: string;
  status: string;
  created_at: string;
}

export function useDashboardStats(): DashboardStats {
  const results = useQueries({
    queries: [
      {
        queryKey: ['dashboard', 'segments-all'],
        queryFn: async () => {
          const response = await api.get<PaginatedResponse<SegmentWithStats>>('/segments', {
            params: { limit: 100, skip: 0 },
          });
          return response.data;
        },
      },
      {
        queryKey: ['dashboard', 'companies-all'],
        queryFn: async () => {
          const response = await api.get<PaginatedResponse<CompanyWithContacts>>('/companies', {
            params: { limit: 1, skip: 0 },
          });
          return response.data;
        },
      },
      {
        queryKey: ['dashboard', 'companies-pending'],
        queryFn: async () => {
          const response = await api.get<PaginatedResponse<CompanyWithContacts>>('/companies', {
            params: { limit: 1, skip: 0, status: 'pending' },
          });
          return response.data;
        },
      },
      {
        queryKey: ['dashboard', 'contacts-all'],
        queryFn: async () => {
          const response = await api.get<PaginatedResponse<Contact>>('/contacts', {
            params: { limit: 1, skip: 0 },
          });
          return response.data;
        },
      },
      {
        queryKey: ['dashboard', 'contacts-uploaded'],
        queryFn: async () => {
          const response = await api.get<PaginatedResponse<Contact>>('/contacts', {
            params: { limit: 1, skip: 0, status: 'uploaded' },
          });
          return response.data;
        },
      },
      {
        queryKey: ['dashboard', 'contacts-approved'],
        queryFn: async () => {
          const response = await api.get<PaginatedResponse<Contact>>('/contacts', {
            params: { limit: 1, skip: 0, status: 'approved' },
          });
          return response.data;
        },
      },
      {
        queryKey: ['dashboard', 'contacts-assigned'],
        queryFn: async () => {
          const response = await api.get<PaginatedResponse<Contact>>('/contacts', {
            params: { limit: 1, skip: 0, status: 'assigned_to_sdr' },
          });
          return response.data;
        },
      },
      {
        queryKey: ['dashboard', 'contacts-meeting'],
        queryFn: async () => {
          const response = await api.get<PaginatedResponse<Contact>>('/contacts', {
            params: { limit: 1, skip: 0, status: 'meeting_scheduled' },
          });
          return response.data;
        },
      },
    ],
  });

  const [
    segmentsQuery,
    companiesQuery,
    companiesPendingQuery,
    contactsQuery,
    contactsUploadedQuery,
    contactsApprovedQuery,
    contactsAssignedQuery,
    contactsMeetingQuery,
  ] = results;

  const isLoading = results.some((result) => result.isLoading);
  const error = results.find((result) => result.error)?.error as Error | null;

  return {
    totalSegments: segmentsQuery.data?.total || 0,
    totalCompanies: companiesQuery.data?.total || 0,
    totalContacts: contactsQuery.data?.total || 0,
    pendingCompanies: companiesPendingQuery.data?.total || 0,
    pendingContacts: contactsUploadedQuery.data?.total || 0,
    assignedContacts: contactsAssignedQuery.data?.total || 0,
    meetingScheduled: contactsMeetingQuery.data?.total || 0,
    contactsByStatus: {
      uploaded: contactsUploadedQuery.data?.total || 0,
      approved: contactsApprovedQuery.data?.total || 0,
      assigned_to_sdr: contactsAssignedQuery.data?.total || 0,
      meeting_scheduled: contactsMeetingQuery.data?.total || 0,
    },
    isLoading,
    error,
  };
}

export function useRecentActivity() {
  return useQuery({
    queryKey: ['dashboard', 'recent-activity'],
    queryFn: async () => {
      // Fetch recent companies and contacts
      const [companiesRes, contactsRes] = await Promise.all([
        api.get<PaginatedResponse<CompanyWithContacts>>('/companies', {
          params: { limit: 5, skip: 0 },
        }),
        api.get<PaginatedResponse<Contact>>('/contacts', {
          params: { limit: 5, skip: 0 },
        }),
      ]);

      const activities: RecentActivity[] = [];

      // Add companies
      companiesRes.data.items.forEach((company) => {
        activities.push({
          id: company.id,
          type: 'company',
          name: company.company_name,
          status: company.status,
          created_at: company.created_at,
        });
      });

      // Add contacts
      contactsRes.data.items.forEach((contact) => {
        activities.push({
          id: contact.id,
          type: 'contact',
          name: `${contact.first_name} ${contact.last_name}`,
          status: contact.status,
          created_at: contact.created_at,
        });
      });

      // Sort by created_at descending and take top 10
      return activities
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10);
    },
  });
}
