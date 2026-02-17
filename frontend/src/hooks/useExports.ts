import { api } from '../lib/api';
import toast from 'react-hot-toast';

export function useExportCompanies() {
  return async (params?: { segment_id?: string; status?: string }) => {
    try {
      const response = await api.get('/exports/companies', {
        params,
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'companies.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Companies exported');
    } catch {
      toast.error('Failed to export companies');
    }
  };
}

export function useExportContacts() {
  return async (params?: { segment_id?: string; company_id?: string; status?: string }) => {
    try {
      const response = await api.get('/exports/contacts', {
        params,
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'contacts.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Contacts exported');
    } catch {
      toast.error('Failed to export contacts');
    }
  };
}

export function useExportSegments() {
  return async () => {
    try {
      const response = await api.get('/exports/segments', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'segments.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Segments exported');
    } catch {
      toast.error('Failed to export segments');
    }
  };
}
