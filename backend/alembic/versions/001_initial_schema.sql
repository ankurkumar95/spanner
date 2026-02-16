-- Spanner CRM - Initial Database Schema
-- PostgreSQL 14+
-- Uses UUID v4 for primary keys, TIMESTAMPTZ for all timestamps
-- All FK columns have explicit indexes (PostgreSQL does NOT auto-index FKs)

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

CREATE TYPE user_role AS ENUM (
    'admin',
    'segment_owner',
    'researcher',
    'approver',
    'sdr',
    'marketing'
);

CREATE TYPE user_status AS ENUM (
    'active',
    'deactivated'
);

CREATE TYPE segment_status AS ENUM (
    'active',
    'archived'
);

CREATE TYPE offering_status AS ENUM (
    'active',
    'inactive'
);

CREATE TYPE company_status AS ENUM (
    'pending',
    'approved',
    'rejected'
);

CREATE TYPE contact_status AS ENUM (
    'uploaded',
    'approved',
    'assigned_to_sdr',
    'meeting_scheduled'
);

CREATE TYPE batch_status AS ENUM (
    'processing',
    'completed',
    'failed'
);

CREATE TYPE upload_type AS ENUM (
    'company',
    'contact'
);

CREATE TYPE entity_type AS ENUM (
    'segment',
    'company',
    'contact'
);

CREATE TYPE notification_type AS ENUM (
    'assignment',
    'approval_required',
    'status_change',
    'upload_completed',
    'system'
);

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    status user_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT email_length CHECK (char_length(email) <= 255),
    CONSTRAINT name_not_empty CHECK (char_length(trim(name)) > 0),
    CONSTRAINT name_length CHECK (char_length(name) <= 255)
);

-- User roles junction table (multi-role support)
CREATE TABLE user_roles (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role user_role NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT unique_user_role UNIQUE (user_id, role)
);

-- Role-based permission grants
CREATE TABLE role_grants (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    role user_role NOT NULL,
    action TEXT NOT NULL,
    granted BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT unique_role_action UNIQUE (role, action),
    CONSTRAINT action_not_empty CHECK (char_length(trim(action)) > 0)
);

-- Segments table
CREATE TABLE segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    status segment_status NOT NULL DEFAULT 'active',
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT name_not_empty CHECK (char_length(trim(name)) > 0),
    CONSTRAINT name_length CHECK (char_length(name) <= 255),
    CONSTRAINT description_length CHECK (char_length(description) <= 5000)
);

-- Offerings table (global master list)
CREATE TABLE offerings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    status offering_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT name_not_empty CHECK (char_length(trim(name)) > 0),
    CONSTRAINT name_length CHECK (char_length(name) <= 255),
    CONSTRAINT description_length CHECK (char_length(description) <= 5000)
);

-- Segment-Offerings many-to-many junction
CREATE TABLE segment_offerings (
    segment_id UUID NOT NULL REFERENCES segments(id) ON DELETE CASCADE,
    offering_id UUID NOT NULL REFERENCES offerings(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    PRIMARY KEY (segment_id, offering_id)
);

-- Companies table
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT NOT NULL,
    company_website TEXT,
    company_phone TEXT,
    company_description TEXT,
    company_linkedin_url TEXT,
    company_industry TEXT,
    company_sub_industry TEXT,

    -- Company address fields
    street TEXT,
    city TEXT,
    state_province TEXT,
    country_region TEXT,
    zip_postal_code TEXT,

    -- Company metadata
    founded_year INTEGER,
    revenue_range TEXT,
    employee_size_range TEXT,

    -- Relationships and status
    segment_id UUID NOT NULL REFERENCES segments(id) ON DELETE RESTRICT,
    status company_status NOT NULL DEFAULT 'pending',
    rejection_reason TEXT,
    is_duplicate BOOLEAN NOT NULL DEFAULT false,
    batch_id UUID,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Constraints
    CONSTRAINT company_name_not_empty CHECK (char_length(trim(company_name)) > 0),
    CONSTRAINT company_name_length CHECK (char_length(company_name) <= 500),
    CONSTRAINT company_phone_length CHECK (char_length(company_phone) <= 50),
    CONSTRAINT company_description_length CHECK (char_length(company_description) <= 5000),
    CONSTRAINT company_industry_length CHECK (char_length(company_industry) <= 200),
    CONSTRAINT company_sub_industry_length CHECK (char_length(company_sub_industry) <= 200),
    CONSTRAINT street_length CHECK (char_length(street) <= 500),
    CONSTRAINT city_length CHECK (char_length(city) <= 200),
    CONSTRAINT state_province_length CHECK (char_length(state_province) <= 200),
    CONSTRAINT country_region_length CHECK (char_length(country_region) <= 200),
    CONSTRAINT zip_postal_code_length CHECK (char_length(zip_postal_code) <= 50),
    CONSTRAINT founded_year_range CHECK (founded_year IS NULL OR (founded_year >= 1800 AND founded_year <= EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER)),
    CONSTRAINT revenue_range_length CHECK (char_length(revenue_range) <= 200),
    CONSTRAINT employee_size_range_length CHECK (char_length(employee_size_range) <= 200),
    CONSTRAINT rejection_reason_required CHECK (
        (status = 'rejected' AND char_length(trim(rejection_reason)) > 0) OR
        (status != 'rejected' AND rejection_reason IS NULL)
    ),
    CONSTRAINT rejection_reason_length CHECK (char_length(rejection_reason) <= 5000),

    -- Dedup key: company_name + company_website within same segment
    CONSTRAINT unique_company_per_segment UNIQUE (company_name, company_website, segment_id)
);

-- Contacts table
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Contact identity
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    mobile_phone TEXT,
    job_title TEXT,
    direct_phone_number TEXT,
    email_address_2 TEXT,
    email_active_status TEXT,

    -- Contact metadata
    lead_source_global TEXT,
    management_level TEXT,

    -- Contact address fields
    street TEXT,
    city TEXT,
    state_province TEXT,
    country_region TEXT,
    zip_postal_code TEXT,
    primary_time_zone TEXT,

    -- LinkedIn and research data
    contact_linkedin_url TEXT,
    linkedin_summary TEXT,
    data_requester_details TEXT,

    -- Relationships and status
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
    segment_id UUID NOT NULL REFERENCES segments(id) ON DELETE RESTRICT,
    status contact_status NOT NULL DEFAULT 'uploaded',
    assigned_sdr_id UUID REFERENCES users(id) ON DELETE SET NULL,
    is_duplicate BOOLEAN NOT NULL DEFAULT false,
    batch_id UUID,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Constraints
    CONSTRAINT first_name_not_empty CHECK (char_length(trim(first_name)) > 0),
    CONSTRAINT last_name_not_empty CHECK (char_length(trim(last_name)) > 0),
    CONSTRAINT first_name_length CHECK (char_length(first_name) <= 200),
    CONSTRAINT last_name_length CHECK (char_length(last_name) <= 200),
    CONSTRAINT email_not_empty CHECK (char_length(trim(email)) > 0),
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT mobile_phone_length CHECK (char_length(mobile_phone) <= 50),
    CONSTRAINT job_title_length CHECK (char_length(job_title) <= 500),
    CONSTRAINT direct_phone_number_length CHECK (char_length(direct_phone_number) <= 50),
    CONSTRAINT email_address_2_format CHECK (
        email_address_2 IS NULL OR
        email_address_2 ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    ),
    CONSTRAINT email_active_status_length CHECK (char_length(email_active_status) <= 100),
    CONSTRAINT lead_source_global_length CHECK (char_length(lead_source_global) <= 200),
    CONSTRAINT management_level_length CHECK (char_length(management_level) <= 200),
    CONSTRAINT contact_street_length CHECK (char_length(street) <= 500),
    CONSTRAINT contact_city_length CHECK (char_length(city) <= 200),
    CONSTRAINT contact_state_province_length CHECK (char_length(state_province) <= 200),
    CONSTRAINT contact_country_region_length CHECK (char_length(country_region) <= 200),
    CONSTRAINT contact_zip_postal_code_length CHECK (char_length(zip_postal_code) <= 50),
    CONSTRAINT primary_time_zone_length CHECK (char_length(primary_time_zone) <= 100),
    CONSTRAINT linkedin_summary_length CHECK (char_length(linkedin_summary) <= 5000),
    CONSTRAINT data_requester_details_length CHECK (char_length(data_requester_details) <= 500),

    -- Dedup key: email + company_id
    CONSTRAINT unique_contact_per_company UNIQUE (email, company_id)
);

-- Assignments table (polymorphic entity assignments)
CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type entity_type NOT NULL,
    entity_id UUID NOT NULL,
    assigned_to UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Prevent duplicate assignments
    CONSTRAINT unique_assignment UNIQUE (entity_type, entity_id, assigned_to)
);

-- Upload batches table
CREATE TABLE upload_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    upload_type upload_type NOT NULL,
    file_name TEXT NOT NULL,
    file_size_bytes INTEGER NOT NULL,
    total_rows INTEGER NOT NULL DEFAULT 0,
    valid_rows INTEGER NOT NULL DEFAULT 0,
    invalid_rows INTEGER NOT NULL DEFAULT 0,
    status batch_status NOT NULL DEFAULT 'processing',
    error_report_url TEXT,
    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT file_name_not_empty CHECK (char_length(trim(file_name)) > 0),
    CONSTRAINT file_size_positive CHECK (file_size_bytes > 0),
    CONSTRAINT total_rows_non_negative CHECK (total_rows >= 0),
    CONSTRAINT valid_rows_non_negative CHECK (valid_rows >= 0),
    CONSTRAINT invalid_rows_non_negative CHECK (invalid_rows >= 0),
    CONSTRAINT rows_sum_matches CHECK (total_rows = valid_rows + invalid_rows)
);

-- Audit logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT action_not_empty CHECK (char_length(trim(action)) > 0),
    CONSTRAINT entity_type_not_empty CHECK (char_length(trim(entity_type)) > 0)
);

-- User preferences table
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    sidebar_theme TEXT NOT NULL DEFAULT 'light',
    notification_preferences JSONB NOT NULL DEFAULT '{"email": true, "in_app": true}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT sidebar_theme_valid CHECK (sidebar_theme IN ('light', 'dark', 'auto'))
);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    entity_type TEXT,
    entity_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT title_not_empty CHECK (char_length(trim(title)) > 0),
    CONSTRAINT title_length CHECK (char_length(title) <= 255),
    CONSTRAINT message_not_empty CHECK (char_length(trim(message)) > 0),
    CONSTRAINT message_length CHECK (char_length(message) <= 1000)
);

-- Marketing collateral table
CREATE TABLE marketing_collateral (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    description TEXT,
    scope_type TEXT NOT NULL,
    scope_id UUID NOT NULL,
    segment_id UUID REFERENCES segments(id) ON DELETE CASCADE,
    offering_id UUID REFERENCES offerings(id) ON DELETE SET NULL,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT title_not_empty CHECK (char_length(trim(title)) > 0),
    CONSTRAINT title_length CHECK (char_length(title) <= 255),
    CONSTRAINT url_not_empty CHECK (char_length(trim(url)) > 0),
    CONSTRAINT url_length CHECK (char_length(url) <= 2048),
    CONSTRAINT description_length CHECK (char_length(description) <= 1000),
    CONSTRAINT scope_type_valid CHECK (scope_type IN ('segment', 'offering', 'lead'))
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- User roles indexes
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);

-- Role grants indexes
CREATE INDEX idx_role_grants_role ON role_grants(role);
CREATE INDEX idx_role_grants_action ON role_grants(action);

-- Segments indexes
CREATE INDEX idx_segments_status ON segments(status);
CREATE INDEX idx_segments_created_by ON segments(created_by);
CREATE INDEX idx_segments_created_at ON segments(created_at DESC);

-- Offerings indexes
CREATE INDEX idx_offerings_status ON offerings(status);
CREATE INDEX idx_offerings_name ON offerings(name);

-- Segment offerings indexes
CREATE INDEX idx_segment_offerings_segment_id ON segment_offerings(segment_id);
CREATE INDEX idx_segment_offerings_offering_id ON segment_offerings(offering_id);

-- Companies indexes
CREATE INDEX idx_companies_segment_id ON companies(segment_id);
CREATE INDEX idx_companies_status ON companies(status);
CREATE INDEX idx_companies_created_by ON companies(created_by);
CREATE INDEX idx_companies_batch_id ON companies(batch_id);
CREATE INDEX idx_companies_is_duplicate ON companies(is_duplicate);
CREATE INDEX idx_companies_created_at ON companies(created_at DESC);
CREATE INDEX idx_companies_company_name ON companies(company_name);
CREATE INDEX idx_companies_segment_status ON companies(segment_id, status);

-- Contacts indexes
CREATE INDEX idx_contacts_company_id ON contacts(company_id);
CREATE INDEX idx_contacts_segment_id ON contacts(segment_id);
CREATE INDEX idx_contacts_status ON contacts(status);
CREATE INDEX idx_contacts_assigned_sdr_id ON contacts(assigned_sdr_id);
CREATE INDEX idx_contacts_created_by ON contacts(created_by);
CREATE INDEX idx_contacts_batch_id ON contacts(batch_id);
CREATE INDEX idx_contacts_is_duplicate ON contacts(is_duplicate);
CREATE INDEX idx_contacts_created_at ON contacts(created_at DESC);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_segment_status ON contacts(segment_id, status);

-- Assignments indexes
CREATE INDEX idx_assignments_entity_type_id ON assignments(entity_type, entity_id);
CREATE INDEX idx_assignments_assigned_to ON assignments(assigned_to);
CREATE INDEX idx_assignments_assigned_by ON assignments(assigned_by);
CREATE INDEX idx_assignments_created_at ON assignments(created_at DESC);

-- Upload batches indexes
CREATE INDEX idx_upload_batches_uploaded_by ON upload_batches(uploaded_by);
CREATE INDEX idx_upload_batches_status ON upload_batches(status);
CREATE INDEX idx_upload_batches_upload_type ON upload_batches(upload_type);
CREATE INDEX idx_upload_batches_created_at ON upload_batches(created_at DESC);

-- Audit logs indexes
CREATE INDEX idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_entity_type_id ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- User preferences indexes
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- Marketing collateral indexes
CREATE INDEX idx_marketing_collateral_segment_id ON marketing_collateral(segment_id);
CREATE INDEX idx_marketing_collateral_offering_id ON marketing_collateral(offering_id);
CREATE INDEX idx_marketing_collateral_scope ON marketing_collateral(scope_type, scope_id);
CREATE INDEX idx_marketing_collateral_created_by ON marketing_collateral(created_by);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables with updated_at column
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_role_grants_updated_at
    BEFORE UPDATE ON role_grants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_segments_updated_at
    BEFORE UPDATE ON segments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_offerings_updated_at
    BEFORE UPDATE ON offerings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON companies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at
    BEFORE UPDATE ON contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marketing_collateral_updated_at
    BEFORE UPDATE ON marketing_collateral
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Create default admin user
-- Password: admin123 (bcrypt hash with cost 12)
INSERT INTO users (id, email, name, password_hash, status) VALUES
    ('00000000-0000-0000-0000-000000000001', 'admin@spanner.local', 'System Administrator', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYK8H8xM7fK', 'active');

-- Assign admin role to default admin user
INSERT INTO user_roles (user_id, role) VALUES
    ('00000000-0000-0000-0000-000000000001', 'admin');

-- Create default user preferences for admin
INSERT INTO user_preferences (user_id, sidebar_theme) VALUES
    ('00000000-0000-0000-0000-000000000001', 'light');

-- Default role grants
-- Admin role grants (full access)
INSERT INTO role_grants (role, action, granted) VALUES
    ('admin', 'manage_users', true),
    ('admin', 'manage_segments', true),
    ('admin', 'manage_offerings', true),
    ('admin', 'manage_companies', true),
    ('admin', 'manage_contacts', true),
    ('admin', 'approve_company', true),
    ('admin', 'approve_contact', true),
    ('admin', 'assign_entity', true),
    ('admin', 'upload_data', true),
    ('admin', 'export_data', true),
    ('admin', 'view_audit_logs', true),
    ('admin', 'manage_collateral', true);

-- Segment Owner role grants
INSERT INTO role_grants (role, action, granted) VALUES
    ('segment_owner', 'manage_segments', true),
    ('segment_owner', 'manage_companies', true),
    ('segment_owner', 'manage_contacts', true),
    ('segment_owner', 'assign_entity', true),
    ('segment_owner', 'upload_data', true),
    ('segment_owner', 'export_data', true),
    ('segment_owner', 'manage_collateral', true);

-- Researcher role grants
INSERT INTO role_grants (role, action, granted) VALUES
    ('researcher', 'view_segments', true),
    ('researcher', 'create_company', true),
    ('researcher', 'edit_company', true),
    ('researcher', 'create_contact', true),
    ('researcher', 'edit_contact', true),
    ('researcher', 'upload_data', true),
    ('researcher', 'export_data', true);

-- Approver role grants (researcher + approval rights)
INSERT INTO role_grants (role, action, granted) VALUES
    ('approver', 'view_segments', true),
    ('approver', 'create_company', true),
    ('approver', 'edit_company', true),
    ('approver', 'create_contact', true),
    ('approver', 'edit_contact', true),
    ('approver', 'approve_company', true),
    ('approver', 'approve_contact', true),
    ('approver', 'assign_entity', true),
    ('approver', 'upload_data', true),
    ('approver', 'export_data', true);

-- SDR role grants
INSERT INTO role_grants (role, action, granted) VALUES
    ('sdr', 'view_contacts', true),
    ('sdr', 'view_companies', true),
    ('sdr', 'edit_contact', true),
    ('sdr', 'schedule_meeting', true),
    ('sdr', 'export_data', true),
    ('sdr', 'view_collateral', true);

-- Marketing role grants
INSERT INTO role_grants (role, action, granted) VALUES
    ('marketing', 'view_contacts', true),
    ('marketing', 'view_companies', true),
    ('marketing', 'view_segments', true),
    ('marketing', 'manage_collateral', true),
    ('marketing', 'export_data', true);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE users IS 'System users with multi-role support';
COMMENT ON TABLE user_roles IS 'Junction table for user-to-role assignments (many-to-many)';
COMMENT ON TABLE role_grants IS 'Configurable permission grants per role (Drupal-inspired RBAC)';
COMMENT ON TABLE segments IS 'Sales/marketing segments (ABM model)';
COMMENT ON TABLE offerings IS 'Global master list of product/service offerings';
COMMENT ON TABLE segment_offerings IS 'Many-to-many relationship between segments and offerings';
COMMENT ON TABLE companies IS 'Company entities scoped to segments. Dedup key: (company_name, company_website, segment_id)';
COMMENT ON TABLE contacts IS 'Contact entities linked to approved companies. Dedup key: (email, company_id)';
COMMENT ON TABLE assignments IS 'Polymorphic entity assignments (segment/company/contact → user)';
COMMENT ON TABLE upload_batches IS 'CSV upload batch tracking with error reporting';
COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail for all mutations';
COMMENT ON TABLE user_preferences IS 'User-specific UI preferences and settings';
COMMENT ON TABLE notifications IS 'In-app notification system';
COMMENT ON TABLE marketing_collateral IS 'Marketing material links scoped to segments/offerings/leads';

COMMENT ON CONSTRAINT unique_company_per_segment ON companies IS 'Dedup constraint: Same company name+website can exist in different segments';
COMMENT ON CONSTRAINT unique_contact_per_company ON contacts IS 'Dedup constraint: Same email cannot exist twice for the same company';
COMMENT ON CONSTRAINT rejection_reason_required ON companies IS 'Business rule: Rejected companies must have a rejection reason';
