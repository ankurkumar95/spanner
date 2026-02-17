export interface User {
  id: string;
  email: string;
  name: string;
  status: 'active' | 'deactivated';
  roles: string[];
  created_at: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface ApiError {
  detail: string;
  status_code?: number;
}

// Segments
export interface Segment {
  id: string;
  name: string;
  description: string | null;
  status: 'active' | 'archived';
  created_by: string;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
  offerings: OfferingBrief[];
}

export interface SegmentWithStats extends Segment {
  company_count: number;
  contact_count: number;
  pending_company_count: number;
}

export interface OfferingBrief {
  id: string;
  name: string;
  status: 'active' | 'inactive';
}

export interface Offering extends OfferingBrief {
  description: string | null;
  created_at: string;
  updated_at: string;
}

// Companies
export interface Company {
  id: string;
  company_name: string;
  company_website: string | null;
  company_phone: string | null;
  company_description: string | null;
  company_linkedin_url: string | null;
  company_industry: string | null;
  company_sub_industry: string | null;
  street: string | null;
  city: string | null;
  state_province: string | null;
  country_region: string | null;
  zip_postal_code: string | null;
  founded_year: number | null;
  revenue_range: string | null;
  employee_size_range: string | null;
  segment_id: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  is_duplicate: boolean;
  batch_id: string | null;
  created_by: string;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompanyWithContacts extends Company {
  contact_count: number;
}

// Contacts
export interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  mobile_phone: string | null;
  job_title: string | null;
  direct_phone_number: string | null;
  contact_linkedin_url: string | null;
  company_id: string;
  segment_id: string;
  status: 'uploaded' | 'approved' | 'assigned_to_sdr' | 'meeting_scheduled';
  assigned_sdr_id: string | null;
  is_duplicate: boolean;
  created_by: string;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
}

// Upload Batch
export interface UploadBatch {
  id: string;
  upload_type: 'company' | 'contact';
  file_name: string;
  file_size_bytes: number;
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  status: 'processing' | 'completed' | 'failed';
  error_report_url: string | null;
  uploaded_by: string;
  created_at: string;
}

export interface UploadError {
  row: number;
  field: string;
  message: string;
}

// Assignment
export interface Assignment {
  id: string;
  entity_type: 'segment' | 'company' | 'contact';
  entity_id: string;
  assigned_to: string;
  assigned_by: string;
  created_at: string;
}

// Notification
export interface Notification {
  id: string;
  type: 'assignment' | 'approval_required' | 'status_change' | 'upload_completed' | 'system';
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  actor_id: string | null;
  entity_type: string | null;
  entity_id: string | null;
  created_at: string;
}

// Audit Log
export interface AuditLog {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  details: Record<string, unknown> | null;
  created_at: string;
}

// Marketing Collateral
export interface MarketingCollateral {
  id: string;
  title: string;
  url: string;
  description: string | null;
  scope_type: 'segment' | 'offering' | 'lead';
  scope_id: string;
  segment_id: string | null;
  offering_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Paginated response
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  skip: number;
  limit: number;
}
