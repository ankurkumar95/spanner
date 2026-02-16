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

interface ContactListResponse {
  contacts: Contact[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
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
      // Segments API returns a plain array (not paginated)
      {
        queryKey: ['dashboard', 'segments-all'],
        queryFn: async () => {
          const response = await api.get<SegmentWithStats[]>('/segments/', {
            params: { limit: 100, skip: 0 },
          });
          return response.data;
        },
      },
      // Companies API returns { items, total, skip, limit }
      {
        queryKey: ['dashboard', 'companies-all'],
        queryFn: async () => {
          const response = await api.get<PaginatedResponse<CompanyWithContacts>>('/companies/', {
            params: { limit: 1, skip: 0 },
          });
          return response.data;
        },
      },
      {
        queryKey: ['dashboard', 'companies-pending'],
        queryFn: async () => {
          const response = await api.get<PaginatedResponse<CompanyWithContacts>>('/companies/', {
            params: { limit: 1, skip: 0, status: 'pending' },
          });
          return response.data;
        },
      },
      // Contacts API returns { contacts, total, page, per_page, total_pages }
      // Uses page/per_page params and status_filter (not status)
      {
        queryKey: ['dashboard', 'contacts-all'],
        queryFn: async () => {
          const response = await api.get<ContactListResponse>('/contacts', {
            params: { page: 1, per_page: 1 },
          });
          return response.data;
        },
      },
      {
        queryKey: ['dashboard', 'contacts-uploaded'],
        queryFn: async () => {
          const response = await api.get<ContactListResponse>('/contacts', {
            params: { page: 1, per_page: 1, status_filter: 'uploaded' },
          });
          return response.data;
        },
      },
      {
        queryKey: ['dashboard', 'contacts-approved'],
        queryFn: async () => {
          const response = await api.get<ContactListResponse>('/contacts', {
            params: { page: 1, per_page: 1, status_filter: 'approved' },
          });
          return response.data;
        },
      },
      {
        queryKey: ['dashboard', 'contacts-assigned'],
        queryFn: async () => {
          const response = await api.get<ContactListResponse>('/contacts', {
            params: { page: 1, per_page: 1, status_filter: 'assigned_to_sdr' },
          });
          return response.data;
        },
      },
      {
        queryKey: ['dashboard', 'contacts-meeting'],
        queryFn: async () => {
          const response = await api.get<ContactListResponse>('/contacts', {
            params: { page: 1, per_page: 1, status_filter: 'meeting_scheduled' },
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

  // Segments: plain array - use .length
  const totalSegments = Array.isArray(segmentsQuery.data) ? segmentsQuery.data.length : 0;
  // Companies: { items, total, skip, limit }
  const totalCompanies = companiesQuery.data?.total ?? 0;
  const pendingCompanies = companiesPendingQuery.data?.total ?? 0;
  // Contacts: { contacts, total, page, per_page, total_pages }
  const totalContacts = contactsQuery.data?.total ?? 0;

  return {
    totalSegments,
    totalCompanies,
    totalContacts,
    pendingCompanies,
    pendingContacts: contactsUploadedQuery.data?.total ?? 0,
    assignedContacts: contactsAssignedQuery.data?.total ?? 0,
    meetingScheduled: contactsMeetingQuery.data?.total ?? 0,
    contactsByStatus: {
      uploaded: contactsUploadedQuery.data?.total ?? 0,
      approved: contactsApprovedQuery.data?.total ?? 0,
      assigned_to_sdr: contactsAssignedQuery.data?.total ?? 0,
      meeting_scheduled: contactsMeetingQuery.data?.total ?? 0,
    },
    isLoading,
    error,
  };
}

export function useRecentActivity() {
  return useQuery({
    queryKey: ['dashboard', 'recent-activity'],
    queryFn: async () => {
      const [companiesRes, contactsRes] = await Promise.all([
        api.get<PaginatedResponse<CompanyWithContacts>>('/companies/', {
          params: { limit: 5, skip: 0 },
        }),
        api.get<ContactListResponse>('/contacts', {
          params: { page: 1, per_page: 5 },
        }),
      ]);

      const activities: RecentActivity[] = [];

      // Companies: items array
      companiesRes.data.items.forEach((company) => {
        activities.push({
          id: company.id,
          type: 'company',
          name: company.company_name,
          status: company.status,
          created_at: company.created_at,
        });
      });

      // Contacts: contacts array
      contactsRes.data.contacts.forEach((contact) => {
        activities.push({
          id: contact.id,
          type: 'contact',
          name: `${contact.first_name} ${contact.last_name}`,
          status: contact.status,
          created_at: contact.created_at,
        });
      });

      return activities
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10);
    },
  });
}
