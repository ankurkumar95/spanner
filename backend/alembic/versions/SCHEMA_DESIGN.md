# Spanner CRM - Database Schema Design Documentation

## Overview

This document explains the PostgreSQL schema design for Spanner CRM, a centralized sales and marketing planning application built on the Account-Based Marketing (ABM) model.

**Expected Scale:**
- 10-20 segments
- 100-1,000 companies
- 1-20 contacts per company
- Single-tenant architecture

## Design Principles

### 1. Primary Key Strategy

- **UUID for main entities**: `users`, `segments`, `offerings`, `companies`, `contacts`, `assignments`, `upload_batches`, `audit_logs`, `notifications`, `marketing_collateral`, `user_preferences`
  - Uses `gen_random_uuid()` for generation
  - Prevents enumeration attacks
  - Enables distributed ID generation if needed
  - Better for external API exposure

- **BIGINT GENERATED ALWAYS AS IDENTITY for junction/lookup tables**: `user_roles`, `segment_offerings`, `role_grants`
  - More efficient for high-volume joins
  - Smaller index size
  - These tables are internal-only

### 2. Timestamp Strategy

All timestamps use `TIMESTAMPTZ NOT NULL DEFAULT now()`:
- Timezone-aware (critical for global operations)
- Consistent `created_at` and `updated_at` pattern
- Auto-updated via trigger function `update_updated_at_column()`

### 3. String Column Strategy

Uses `TEXT` instead of `VARCHAR(n)`:
- PostgreSQL stores both identically
- No performance difference
- More flexible (no arbitrary length limits that cause migration pain)
- Use `CHECK` constraints for business-required length limits

### 4. Foreign Key Indexing

**Critical**: PostgreSQL does NOT automatically create indexes on foreign key columns.

All FK columns have explicit indexes created:
```sql
CREATE INDEX idx_companies_segment_id ON companies(segment_id);
CREATE INDEX idx_contacts_company_id ON contacts(company_id);
-- etc.
```

### 5. Enum Types

Used `CREATE TYPE ... AS ENUM` for stable, well-defined status values:
- Type safety at database level
- Better query performance vs TEXT with CHECK constraints
- Clear domain modeling
- Examples: `user_role`, `company_status`, `contact_status`

### 6. Data Integrity

- `NOT NULL` constraints on all semantically required fields
- `DEFAULT` values where appropriate (status fields, timestamps, booleans)
- `CHECK` constraints for:
  - Length limits
  - Email format validation (regex)
  - Year ranges (founded_year: 1800 to current year)
  - Business rules (rejection_reason required when status = 'rejected')
  - Enum-like values (sidebar_theme IN ('light', 'dark', 'auto'))

### 7. Cascade Behavior

Careful `ON DELETE` action selection:

- **CASCADE**: Used for truly dependent data
  - `user_roles.user_id` → when user deleted, remove their roles
  - `segment_offerings` → when segment deleted, remove the relationship
  - `notifications.user_id` → when user deleted, remove their notifications

- **RESTRICT**: Used for referenced data that shouldn't be deleted
  - `companies.segment_id` → can't delete segment with companies
  - `contacts.company_id` → can't delete company with contacts
  - `companies.created_by` → can't delete user who created companies

- **SET NULL**: Used for optional references
  - `contacts.assigned_sdr_id` → if SDR deleted, unassign contacts
  - `audit_logs.actor_id` → preserve audit trail even if user deleted

## Core Entities

### Users & RBAC

```
users (UUID PK)
  ├── Multi-role support via user_roles junction table
  ├── Soft deletion via status (active/deactivated)
  └── Password stored as bcrypt hash

user_roles (BIGINT IDENTITY PK)
  ├── Many-to-many: one user can have multiple roles
  └── UNIQUE constraint on (user_id, role)

role_grants (BIGINT IDENTITY PK)
  ├── Configurable permission system (Drupal-inspired)
  ├── Each role has multiple action grants
  └── Can enable/disable specific actions per role
```

**Roles**: admin, segment_owner, researcher, approver, sdr, marketing

**Key Design Decision**: Role grants are configurable rather than hardcoded in application logic. This allows runtime permission changes without code deployment.

### Segments & Offerings

```
segments (UUID PK)
  ├── Central organizing unit in ABM model
  ├── Can be active or archived
  └── Creator tracked via created_by FK

offerings (UUID PK)
  ├── Global master list (not scoped to segments)
  ├── Many-to-many with segments via segment_offerings
  └── Used for auto-complete in segment management

segment_offerings (Composite PK)
  └── Junction table with (segment_id, offering_id) as PK
```

**Key Design Decision**: Offerings are global, not segment-specific. Same offering can be tagged to multiple segments. This avoids duplicate offering names and enables reporting across segments.

### Companies

```
companies (UUID PK)
  ├── Scoped to exactly one segment
  ├── Status workflow: pending → approved OR pending → rejected
  ├── Rejection reason required when status = 'rejected'
  ├── Dedup key: UNIQUE(company_name, company_website, segment_id)
  └── Batch tracking via batch_id (for CSV uploads)
```

**Critical Business Rules**:

1. **Segment Scoping**: Same real-world company in two segments = two separate records (intentional)
2. **Dedup Within Segment Only**: `UNIQUE(company_name, company_website, segment_id)` ensures no duplicates within a segment, but allows cross-segment duplicates
3. **Approval Flow**: Individual only (no bulk approve). Rejected companies cannot be re-submitted.
4. **Duplicate Detection**: Scheduled job sets `is_duplicate = true` flag but never deletes

**Field Design**:
- All company address fields (street, city, state_province, country_region, zip_postal_code)
- Company metadata: founded_year (with range check), revenue_range, employee_size_range
- LinkedIn URL validation via constraint
- Description max 5000 chars

### Contacts

```
contacts (UUID PK)
  ├── Must link to approved company (FK to companies)
  ├── Segment derived from company.segment_id (denormalized for query performance)
  ├── Status pipeline: uploaded → approved → assigned_to_sdr → meeting_scheduled
  ├── Dedup key: UNIQUE(email, company_id)
  └── Assigned SDR tracked via assigned_sdr_id FK
```

**Critical Business Rules**:

1. **Must Link to Approved Company**: Enforced at application layer (contacts can only be created for companies with status = 'approved')
2. **Derived Segment**: `segment_id` is copied from company's segment for query performance (avoids JOIN in list views)
3. **Dedup Within Company**: Same email cannot exist twice for same company
4. **Bulk Approval Allowed**: Unlike companies, contacts support bulk approval
5. **No Rejection**: Contacts don't have a rejected status

**Field Design**:
- All contact address fields (separate from company address)
- Multiple emails: `email` (primary, required) and `email_address_2` (optional)
- Multiple phones: `mobile_phone`, `direct_phone_number`
- LinkedIn data: `contact_linkedin_url`, `linkedin_summary` (max 5000 chars)
- Research metadata: `data_requester_details`, `lead_source_global`, `management_level`

### Assignments (Polymorphic)

```
assignments (UUID PK)
  ├── entity_type: 'segment' | 'company' | 'contact'
  ├── entity_id: UUID (polymorphic FK - not enforced at DB level)
  ├── assigned_to: FK to users
  ├── assigned_by: FK to users (audit trail)
  └── UNIQUE(entity_type, entity_id, assigned_to)
```

**Key Design Decision**: Polymorphic relationships using discriminator column (`entity_type`) + `entity_id`. This avoids creating three separate assignment tables.

**Trade-offs**:
- ✅ Single table for all assignment queries
- ✅ Simpler API (one endpoint for all assignments)
- ❌ Cannot enforce FK constraint at database level (must validate in application)
- ❌ Index on (entity_type, entity_id) less efficient than dedicated FK

For this use case (10-20 segments, 100-1,000 companies, 1-20k contacts), the simplified query pattern outweighs the FK enforcement loss.

### Upload Batches

```
upload_batches (UUID PK)
  ├── upload_type: 'company' | 'contact'
  ├── File metadata: file_name, file_size_bytes
  ├── Row counts: total_rows, valid_rows, invalid_rows
  ├── Status: processing → completed | failed
  ├── error_report_url: path to downloadable error CSV
  └── CHECK constraint: total_rows = valid_rows + invalid_rows
```

**Key Design Decision**: Batch tracking enables error correction workflow. Users can see which rows failed, download error report, fix data, and re-upload.

**Validation Pipeline**:
1. File-level validation (type, size, encoding, headers)
2. Row-level validation (required fields, formats, lookups)
3. Partial import: valid rows imported, invalid rows → error report
4. Each upload tracked with unique batch_id

### Audit Logs

```
audit_logs (UUID PK)
  ├── actor_id: FK to users (nullable - survives user deletion)
  ├── action: 'create', 'update', 'approve', 'reject', 'assign', 'upload', etc.
  ├── entity_type: 'segment', 'company', 'contact', etc.
  ├── entity_id: UUID
  ├── details: JSONB (old/new values, metadata)
  └── created_at: TIMESTAMPTZ
```

**Key Design Decision**: JSONB for `details` column provides schema flexibility. Can store different metadata per action type without ALTER TABLE.

**Usage**:
- Activity timeline on detail views (sidebar panel)
- Compliance audit trail
- Debugging data issues
- User activity monitoring

**Example JSONB structure**:
```json
{
  "old_values": {"status": "pending", "company_name": "Acme Corp"},
  "new_values": {"status": "approved", "company_name": "ACME Corporation"},
  "ip_address": "192.168.1.1",
  "user_agent": "Mozilla/5.0...",
  "changes": ["status", "company_name"]
}
```

### Notifications

```
notifications (UUID PK)
  ├── user_id: FK to users (who receives the notification)
  ├── type: notification_type enum
  ├── title, message: notification content
  ├── link: optional URL to related entity
  ├── is_read: boolean flag
  ├── actor_id: FK to users (who triggered the notification)
  └── entity references: entity_type, entity_id
```

**Notification Types**:
- `assignment`: "You have been assigned to XYZ"
- `approval_required`: "Company XYZ requires approval"
- `status_change`: "Company XYZ has been approved"
- `upload_completed`: "Your CSV upload has completed"
- `system`: "Scheduled duplicate detection completed"

**Performance Optimization**:
- Partial index on `(user_id, is_read) WHERE is_read = false` for "unread notifications" query
- This index is much smaller than full index on all notifications

### User Preferences

```
user_preferences (UUID PK)
  ├── user_id: UNIQUE FK to users (one-to-one)
  ├── sidebar_theme: 'light' | 'dark' | 'auto'
  ├── notification_preferences: JSONB
  └── Future: can add UI layout preferences, filters, etc.
```

**Example notification_preferences JSONB**:
```json
{
  "email": true,
  "in_app": true,
  "assignment": true,
  "approval_required": true,
  "status_change": false
}
```

### Marketing Collateral

```
marketing_collateral (UUID PK)
  ├── title, url, description
  ├── scope_type: 'segment' | 'offering' | 'lead'
  ├── scope_id: UUID (polymorphic FK)
  ├── segment_id: FK to segments (denormalized for scoping)
  ├── offering_id: FK to offerings (optional)
  └── created_by: FK to users
```

**Key Design Decision**: Collateral can be scoped to:
- Entire segment: `scope_type='segment', scope_id=segment.id`
- Specific offering: `scope_type='offering', scope_id=offering.id, offering_id=offering.id`
- Specific lead/contact: `scope_type='lead', scope_id=contact.id`

The `segment_id` denormalization enables efficient "all collateral for my segments" queries.

## Index Strategy

### Composite Indexes

Created composite indexes for common query patterns:

```sql
-- Companies filtered by segment and status (common in list views)
CREATE INDEX idx_companies_segment_status ON companies(segment_id, status);

-- Contacts filtered by segment and status
CREATE INDEX idx_contacts_segment_status ON contacts(segment_id, status);

-- Unread notifications for a user (partial index)
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read)
WHERE is_read = false;
```

### Sort Indexes

All created_at columns indexed with DESC order for "recent first" queries:

```sql
CREATE INDEX idx_companies_created_at ON companies(created_at DESC);
CREATE INDEX idx_contacts_created_at ON contacts(created_at DESC);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
```

### Foreign Key Indexes

**All FK columns have explicit indexes** (PostgreSQL doesn't auto-create these):

```sql
CREATE INDEX idx_companies_segment_id ON companies(segment_id);
CREATE INDEX idx_companies_created_by ON companies(created_by);
CREATE INDEX idx_contacts_company_id ON contacts(company_id);
CREATE INDEX idx_contacts_segment_id ON contacts(segment_id);
CREATE INDEX idx_contacts_assigned_sdr_id ON contacts(assigned_sdr_id);
-- ... etc
```

This is critical for:
- Fast JOIN performance
- Efficient FK constraint checking on DELETE
- Query planning optimization

### Filter Indexes

Indexes on commonly filtered columns:

```sql
-- Status columns (used in every list view)
CREATE INDEX idx_companies_status ON companies(status);
CREATE INDEX idx_contacts_status ON contacts(status);
CREATE INDEX idx_segments_status ON segments(status);

-- Duplicate flag (toggle in UI to show/hide duplicates)
CREATE INDEX idx_companies_is_duplicate ON companies(is_duplicate);
CREATE INDEX idx_contacts_is_duplicate ON contacts(is_duplicate);

-- Email search
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_contacts_email ON contacts(email);
```

## Seed Data

### Default Admin User

```sql
INSERT INTO users (id, email, name, password_hash, status) VALUES
    ('00000000-0000-0000-0000-000000000001',
     'admin@spanner.local',
     'System Administrator',
     '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYK8H8xM7fK',  -- Password: admin123
     'active');
```

**Security Note**: This default password should be changed immediately after first login in production.

### Default Role Grants

Each role has specific action grants seeded:

**Admin**: Full access to all actions
**Segment Owner**: Manage segments, companies, contacts, assignments, uploads
**Researcher**: Create/edit companies and contacts, upload data
**Approver**: Researcher permissions + approval rights + assignment rights
**SDR**: View contacts/companies, edit contacts, schedule meetings, view collateral
**Marketing**: View-only + manage collateral

See the SQL file for full grant list.

## Migration Strategy

### Alembic Integration

The migration is split into two files:

1. **001_initial_schema.sql**: Pure SQL (easier to review, test in psql, reuse)
2. **001_initial_schema.py**: Alembic migration wrapper that executes the SQL

**Benefits**:
- SQL file can be used standalone for testing/development
- Clear separation of schema definition and migration orchestration
- Easier code review (SQL is more readable than Python SA DDL)

### Downgrade Strategy

The downgrade explicitly drops all objects in reverse dependency order:
1. Tables (respecting FK dependencies)
2. Trigger function
3. Enum types

**Note**: Extensions (uuid-ossp, pgcrypto) are NOT dropped as they may be shared with other schemas.

## Data Normalization Rules

Applied at application service layer before INSERT/UPDATE:

1. **Trim whitespace**: All string fields
2. **Normalize company names**: Consistent casing (title case recommended)
3. **Standardize URLs**: Lowercase, strip trailing slashes, remove www prefix
4. **Email normalization**: Lowercase
5. **Phone number normalization**: Strip non-numeric characters, consistent format

These rules are critical for deduplication accuracy.

## Duplicate Detection Strategy

### Within-Segment Dedup (Companies)

```sql
UNIQUE(company_name, company_website, segment_id)
```

Prevents duplicate insertion at database level. If same company exists in different segments, that's intentional.

### Cross-Row Dedup (Scheduled Job)

Scheduled job (default: weekly) runs fuzzy matching and sets `is_duplicate = true`:

```sql
-- Example query for duplicate detection
WITH duplicates AS (
  SELECT
    id,
    company_name,
    company_website,
    segment_id,
    ROW_NUMBER() OVER (
      PARTITION BY lower(trim(company_name)), lower(trim(company_website)), segment_id
      ORDER BY created_at ASC
    ) as rn
  FROM companies
  WHERE status != 'rejected'
)
UPDATE companies
SET is_duplicate = true
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);
```

**Key Points**:
- Only first record (by created_at) in duplicate set is kept as primary
- Duplicate detection NEVER deletes records (data preservation)
- UI has toggle to show/hide duplicates
- Approvers can manually review and handle duplicates

## Security Considerations

### Password Storage

```sql
password_hash TEXT NOT NULL
```

Passwords hashed with bcrypt (cost factor 12). Never store plaintext.

### SQL Injection Prevention

All string fields have:
- Proper escaping via parameterized queries (enforced at ORM level)
- Length limits via CHECK constraints
- Format validation via regex CHECK constraints (emails, URLs)

### Email Format Validation

```sql
CONSTRAINT email_format CHECK (
  email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
)
```

Regex prevents malformed emails at database level (defense in depth).

### Enumeration Attack Prevention

Using UUID primary keys instead of sequential integers prevents:
- Guessing valid IDs
- Inferring record count
- Scraping all records sequentially

## Performance Considerations

### Expected Query Patterns

Based on use case, optimized for:

1. **List views with filters**:
   - Segments filtered by status
   - Companies filtered by segment + status + researcher + date range
   - Contacts filtered by company + segment + status + SDR + date range

2. **Approval queues**:
   - Companies WHERE status = 'pending' + segment + created_at DESC
   - Contacts WHERE status = 'uploaded' + segment + created_at DESC

3. **Workbench queries**:
   - My assigned segments/companies/contacts
   - My uploads (batches)

4. **Detail views with timeline**:
   - Company + all contacts + audit logs
   - Contact + audit logs

### Pagination

All list views use cursor-based pagination:

```sql
SELECT * FROM companies
WHERE created_at < :cursor AND segment_id = :segment_id
ORDER BY created_at DESC
LIMIT 50;
```

The `created_at DESC` indexes support this efficiently.

### Denormalization Trade-offs

**contacts.segment_id**: Derived from company.segment_id

❌ Violates 3NF (redundant data)
✅ Avoids JOIN in contacts list view
✅ Much faster filtering by segment
✅ Low risk (segment rarely changes, trigger could maintain consistency if needed)

For the expected scale (1-20k contacts), the query performance gain justifies the denormalization.

## Future Schema Extensions

The schema is designed to accommodate future features:

### 1. Multi-Tenancy (Not Required Now)

If multi-tenant becomes needed:
- Add `organization_id UUID` to all root entities
- Add `UNIQUE` constraints on (organization_id, name) for segments/offerings
- Add `organization_id` to all composite indexes
- Row-level security policies to enforce data isolation

### 2. Email Campaign Tracking

Potential future tables:
```sql
campaigns (id, segment_id, name, status, scheduled_at, ...)
campaign_contacts (campaign_id, contact_id, sent_at, opened_at, clicked_at, ...)
```

Can link to existing segments/contacts without schema changes.

### 3. Meeting Outcomes

Potential future tables:
```sql
meetings (id, contact_id, scheduled_at, status, outcome, notes, ...)
follow_ups (id, meeting_id, due_date, assigned_to, completed, ...)
```

Can extend contact status pipeline beyond 'meeting_scheduled'.

### 4. Document Storage

Currently only URL storage (SharePoint/share drive links). Future:
```sql
documents (id, entity_type, entity_id, file_path, file_type, uploaded_by, ...)
```

Polymorphic entity attachment system.

## Testing Recommendations

### Schema Tests

1. **Constraint Tests**: Verify all CHECK constraints reject invalid data
2. **FK Cascade Tests**: Verify ON DELETE behavior works as expected
3. **Trigger Tests**: Verify updated_at auto-updates on UPDATE
4. **Unique Constraint Tests**: Verify dedup keys work correctly
5. **Enum Tests**: Verify invalid enum values are rejected

### Data Migration Tests

1. **Seed Data Tests**: Verify default admin user and role grants created
2. **Rollback Tests**: Verify downgrade cleans up completely
3. **Idempotency Tests**: Verify migration can run multiple times safely

### Performance Tests

1. **Index Usage Tests**: Run EXPLAIN ANALYZE on common queries, verify index usage
2. **Large Dataset Tests**: Load 1,000 companies + 20,000 contacts, test query performance
3. **Concurrent Write Tests**: Verify no deadlocks on high-concurrency writes

## Summary

This schema provides a production-ready foundation for Spanner CRM with:

✅ Type safety (enums, constraints, FK integrity)
✅ Performance optimization (comprehensive indexing, denormalization where justified)
✅ Audit trail (complete activity logging)
✅ Data integrity (deduplication, validation at DB level)
✅ Flexible permissions (role grants system)
✅ Future extensibility (JSONB for preferences/details, polymorphic relationships)
✅ Security (bcrypt hashing, UUID keys, format validation)

The design balances normalization principles with real-world query performance needs for the expected scale (10-20 segments, 100-1,000 companies, 1-20k contacts).
