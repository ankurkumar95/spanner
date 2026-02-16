# Phase 3: CSV Upload Pipelines & Duplicate Detection

## Implementation Summary

This phase implements CSV upload functionality for companies and contacts, along with automatic duplicate detection.

## Files Created

### 1. `/backend/app/services/upload_service.py`
Upload service with the following functions:

**Batch Management:**
- `create_batch()` - Create upload batch record
- `get_batch()` - Retrieve batch by ID
- `list_batches()` - List batches with pagination and filters
- `count_batches()` - Count batches matching filters

**CSV Processing:**
- `process_company_csv()` - Parse and validate company CSV uploads
  - Validates against CompanyCreate schema
  - Ignores extra CSV columns not in schema
  - Creates companies with status=pending, batch_id set
  - Returns batch with error details for invalid rows
  - Automatically runs duplicate detection after upload

- `process_contact_csv()` - Parse and validate contact CSV uploads
  - Validates against ContactCreate schema
  - Supports two modes:
    - Fixed company_id: all contacts assigned to one company
    - Segment-based: matches company_name from CSV to existing companies
  - Creates contacts with status=uploaded, batch_id set
  - Automatically runs duplicate detection after upload

**Duplicate Detection:**
- `detect_company_duplicates()` - Case-insensitive match on company_name + company_website within a segment
  - Marks all duplicates except first (by created_at) as is_duplicate=True
  - Returns count of duplicates marked

- `detect_contact_duplicates()` - Case-insensitive match on email within a company
  - Marks all duplicates except first (by created_at) as is_duplicate=True
  - Returns count of duplicates marked

### 2. `/backend/app/routers/uploads.py`
Upload endpoints:

**POST /uploads/companies**
- Multipart form: file + segment_id
- Auth: researcher or admin role required
- Returns UploadBatchResponse with statistics
- 10MB file size limit
- Validates CSV format and columns

**POST /uploads/contacts**
- Multipart form: file + (company_id OR segment_id)
- Auth: researcher or admin role required
- Returns UploadBatchResponse with statistics
- If segment_id provided, CSV must include company_name column
- 10MB file size limit

**GET /uploads/**
- List all upload batches (paginated)
- Query params: skip, limit, upload_type, status
- Auth: any active user
- Returns items array + total count

**GET /uploads/{batch_id}**
- Get single batch details
- Auth: any active user
- Returns UploadBatchResponse

**GET /uploads/{batch_id}/errors**
- Get error report for a batch
- Auth: any active user
- Note: Error persistence not implemented (placeholder endpoint)

### 3. Updated Files
- `/backend/app/routers/__init__.py` - Added uploads router
- `/backend/app/services/__init__.py` - Exported upload_service

## Key Design Decisions

1. **Lightweight CSV Parsing**: Uses Python's built-in `csv` module with `io.StringIO`, not pandas - keeps dependencies minimal

2. **Schema-Driven Validation**: Uses existing Pydantic schemas (CompanyCreate, ContactCreate) for validation, ensuring consistency with manual creation flows

3. **Ignore Extra Columns**: Per user directive, only validates columns that match schema fields - extra CSV columns are silently ignored

4. **Batch Tracking**: Every upload creates an UploadBatch record with statistics (total_rows, valid_rows, invalid_rows) and status tracking

5. **Duplicate Detection**: Runs automatically after successful upload:
   - Companies: case-insensitive match on (name + website) within segment
   - Contacts: case-insensitive match on email within company
   - First record (by created_at) is kept as original, rest marked as duplicates

6. **Transaction Safety**: Uses flush()+refresh() pattern, not commit() - follows existing service layer pattern where get_db dependency handles transaction management

7. **Error Handling**: Row-level validation errors are collected and returned in batch response. Error persistence is noted as a future enhancement.

## Assumptions

1. **Database**: PostgreSQL with existing schema for companies, contacts, upload_batches
2. **File Storage**: CSV files not persisted - only processed in-memory
3. **Error Persistence**: Error details returned immediately but not stored for later retrieval (production enhancement needed)
4. **Segment/Company Validation**: Assumes segment_id and company_id references are valid (FK constraints will catch issues)
5. **Auth**: Uses existing auth dependency injection (get_current_active_user, require_roles)

## Potential Issues

1. **Memory Usage**: Large CSV files (approaching 10MB) are fully loaded into memory. For production at scale, consider streaming parsing.

2. **Error Report Storage**: The `/uploads/{batch_id}/errors` endpoint is a placeholder - error details are generated during upload but not persisted. For production:
   - Store errors in separate `upload_errors` table
   - Or store as JSON in object storage (S3/GCS)
   - Update error_report_url to point to actual storage

3. **Duplicate Detection Performance**: Current implementation loads all companies/contacts for a segment/company into memory. For very large segments (>10k companies), consider:
   - SQL-based duplicate detection using window functions
   - Batch processing with pagination

4. **UniqueConstraint Violations**: If CSV contains duplicates within itself, the first will be inserted and subsequent rows will fail on DB unique constraints. Current implementation will catch these as general exceptions and mark rows as invalid.

5. **Concurrent Uploads**: Multiple uploads to the same segment may race during duplicate detection. For high-concurrency scenarios, consider:
   - Row-level locking during duplicate detection
   - Deferred duplicate detection via background job queue

6. **Email Validation**: ContactCreate schema uses EmailStr which validates format. Invalid emails will be rejected, but no verification of deliverability is performed.

## Follow-Up Steps

1. **Environment Setup**: Ensure PostgreSQL connection configured in `.env`

2. **Database Migrations**: UploadBatch, Company, and Contact models should already have migrations from previous phases

3. **Testing**:
   - Create sample company CSV with valid/invalid rows
   - Create sample contact CSV with company_name column
   - Test duplicate detection with duplicate entries
   - Verify role-based access (researcher/admin can upload, SDR cannot)

4. **Production Enhancements**:
   - Implement error persistence in database or object storage
   - Add background job processing for large CSVs (Celery)
   - Add progress tracking for long-running uploads
   - Implement CSV template download endpoints
   - Add data validation rules (e.g., phone number formats, URL formats)
   - Implement bulk approve/reject for uploaded companies
   - Add metrics/logging for upload success rates

5. **Monitoring**:
   - Track upload success/failure rates
   - Alert on high invalid_rows percentage
   - Monitor file processing time

## API Usage Examples

### Upload Companies
```bash
curl -X POST "http://localhost:8000/api/v1/uploads/companies" \
  -H "Authorization: Bearer <token>" \
  -F "file=@companies.csv" \
  -F "segment_id=550e8400-e29b-41d4-a716-446655440000"
```

### Upload Contacts (with company_id)
```bash
curl -X POST "http://localhost:8000/api/v1/uploads/contacts" \
  -H "Authorization: Bearer <token>" \
  -F "file=@contacts.csv" \
  -F "company_id=660e8400-e29b-41d4-a716-446655440000"
```

### Upload Contacts (with segment_id, requires company_name in CSV)
```bash
curl -X POST "http://localhost:8000/api/v1/uploads/contacts" \
  -H "Authorization: Bearer <token>" \
  -F "file=@contacts.csv" \
  -F "segment_id=550e8400-e29b-41d4-a716-446655440000"
```

### List Uploads
```bash
curl "http://localhost:8000/api/v1/uploads/?upload_type=company&status=completed" \
  -H "Authorization: Bearer <token>"
```

## CSV Format Examples

### companies.csv
```csv
company_name,company_website,company_industry,city,state_province,country_region,employee_size_range
Acme Corp,https://acme.com,Technology,San Francisco,CA,USA,100-500
TechStart Inc,https://techstart.io,SaaS,Austin,TX,USA,10-50
```

### contacts.csv (with company_name for matching)
```csv
first_name,last_name,email,company_name,job_title,mobile_phone
John,Doe,john.doe@acme.com,Acme Corp,CTO,555-1234
Jane,Smith,jane.smith@techstart.io,TechStart Inc,CEO,555-5678
```

### contacts.csv (for fixed company_id)
```csv
first_name,last_name,email,job_title,mobile_phone
John,Doe,john.doe@company.com,CTO,555-1234
Jane,Smith,jane.smith@company.com,VP Engineering,555-5678
```
