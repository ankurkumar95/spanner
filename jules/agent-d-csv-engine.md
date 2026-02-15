# Jules Agent D — CSV Engine + Uploads + Dedup

> **Run in PARALLEL** with Agents A, B, C, E (after Agent 0 is merged to main).
> **Branch name:** `feature/csv-engine`
> **Base branch:** `main` (with Agent 0 merged)

---

## Context

The project skeleton, all 15 database tables, auth, RBAC, and audit service exist. You are adding the CSV upload and validation engine, batch tracking, error correction, the dedup scheduled job, and the upload/error frontend screens.

**DO NOT** modify: database models, migrations, auth middleware, Docker files. Only ADD new files.

---

## Stitch Design References

Reference these UI mockup files when building frontend components. Match the visual style, layout, colors, and component structure:

| Screen | Design File | Screenshot |
|--------|------------|------------|
| CSV Upload (Company) | `designs/html/18-csv-upload-company.html` | `designs/screenshots/18-csv-upload-company.png` |
| CSV Data Mapping & Validation | `designs/html/07-csv-data-mapping-validation.html` | `designs/screenshots/07-csv-data-mapping-validation.png` |

Open the HTML files in a browser to see the exact design. Replicate the visual style for CSVUpload.tsx, UploadResult.tsx, and ErrorCorrection.tsx.

---

## Backend — Files to Create

### `app/schemas/upload.py`
- UploadResponse: batch_id, file_name, total_rows, valid_rows, invalid_rows, status, errors_url
- BatchResponse: id, entity_type, file_name, file_size_bytes, total_rows, valid_rows, invalid_rows, status, uploader(UserBrief), created_at
- ErrorResponse: id, row_number, column_name, value, error_message, is_corrected
- BatchListResponse: list of BatchResponse with pagination

### `app/utils/csv_validators.py`
Define the column schemas:

**Company CSV — 16 columns (case-insensitive headers):**
```
Company Name (required, max 500)
Company Website (optional, valid URL, max 500)
Company Phone (optional, max 50)
Company Description (optional, max 5000)
Company Linkedin Url (optional, valid URL, max 500)
Company Industry (optional, max 200)
Company Sub-Industry (optional, max 200)
Company Address 1: Street 1 (optional, max 500)
Company Address 1: City (optional, max 200)
Company Address 1: State/Province (optional, max 200)
Company Address 1: Country/Region (optional, max 200)
Company Address 1: ZIP/Postal Code (optional, max 50)
Founded Year (optional, integer, 1800–current year)
Company Revenue Range (optional, max 200)
Company Employee Size Range (optional, max 200)
Segment Name (required, must match active segment in DB)
```

**Contact CSV — 20 columns (case-insensitive headers):**
```
First Name (required, max 200)
Last Name (required, max 200)
Mobile Phone (optional, max 50)
Job Title (optional, max 500)
Company Name (required, must match approved company in DB)
Email (required, valid RFC 5322 email, max 255)
Direct Phone Number (optional, max 50)
Email Address 2 (optional, valid email, max 255)
Email Active Status (optional, max 100)
Lead Source Global (optional, max 200)
Management Level (optional, max 200)
Contact Address 1: Street 1 (optional, max 500)
Contact Address 1: City (optional, max 200)
Contact Address 1: State/Province (optional, max 200)
Contact Address 1: Country/Region (optional, max 200)
Contact Address 1: ZIP/Postal Code (optional, max 50)
Primary Time Zone (optional, max 100)
Contact Linkedin Url (optional, valid URL, max 500)
LinkedIn Summary (optional, max 5000)
Data Requester Details (optional, max 500)
```

### `app/services/csv_service.py`
The core CSV processing engine:

1. **validate_file(file_path):** Check .csv extension, UTF-8 encoding, size <= 10MB, not empty/header-only. Raise 422 with specific error if any fail.

2. **validate_and_import(file_path, entity_type, uploader_id, db):**
   - Parse headers (case-insensitive matching)
   - Check required columns present. If missing, reject entire file (422 with list of missing columns).
   - Ignore extra columns.
   - For each row:
     - Validate required fields non-empty
     - Validate email format (RFC 5322 regex)
     - Validate URL format
     - Validate max lengths
     - Validate integer ranges (founded_year: 1800-current_year)
     - Lookup: Segment Name → active segment (company CSV)
     - Lookup: Company Name → approved company (contact CSV)
     - If valid → add to valid_rows
     - If invalid → add to errors (row_number, column_name, value, error_message)
   - **Partial import:** Bulk insert valid rows. Status = pending (companies) or uploaded (contacts). created_by = uploader. batch_id = this batch.
   - Store errors in upload_errors table.
   - Update batch: total_rows, valid_rows, invalid_rows, status=completed.
   - **Normalize on import:** trim strings, normalize company names, normalize URLs, normalize emails.
   - Audit log: upload action with file_name, counts.
   - Return batch summary.

3. For contacts: auto-set segment_id from the matched company's segment.

### `app/services/dedup_service.py`
- **run_dedup_job(db):**
  - Company dedup: GROUP BY LOWER(TRIM(name)), LOWER(TRIM(website)), segment_id HAVING count > 1. ROW_NUMBER by created_at ASC. Flag rn > 1 as is_duplicate=true. **Cross-segment duplicates are intentional — partition includes segment_id.**
  - Contact dedup: GROUP BY LOWER(TRIM(email)), company_id HAVING count > 1. Same logic.
  - Audit log: dedup_job action with counts.

### `app/jobs/scheduler.py`
- Setup APScheduler AsyncIOScheduler
- Add dedup job: CronTrigger(day_of_week="sun", hour=2, minute=0)
- Start scheduler on FastAPI startup event

### `app/jobs/dedup_job.py`
- Calls dedup_service.run_dedup_job

### `app/routers/uploads.py`
```
POST   /api/uploads/companies              — multipart file upload (companies:upload_csv). Max 10MB.
POST   /api/uploads/contacts               — multipart file upload (contacts:upload_csv). Max 10MB.
GET    /api/uploads/batches                 — list batches for current user (uploads:read). Pagination.
GET    /api/uploads/batches/:id             — batch detail (uploads:read)
GET    /api/uploads/batches/:id/errors      — list errors for batch (uploads:read). Pagination.
GET    /api/uploads/batches/:id/errors/download — download error report as CSV (uploads:read)
```

### Register in `app/main.py`
```python
from app.routers import uploads
app.include_router(uploads.router, prefix="/api")
# Also start scheduler in startup event
```

---

## Frontend — Files to Create

### `src/pages/uploads/CSVUpload.tsx`
- Two tabs: "Company CSV" and "Contact CSV"
- Each tab:
  - Drag-and-drop file zone (accept .csv only)
  - File info display: name, size, "max 10MB" label
  - Column requirements expandable section (list expected columns)
  - Upload button
  - During upload: progress indicator
  - After upload: show UploadResult inline

### `src/pages/uploads/UploadResult.tsx`
- Batch summary card: Batch ID, File name, Total rows, Valid rows (green count), Invalid rows (red count), Status
- If invalid > 0: "Download Error Report" button + "View Errors" link
- Link to upload another file

### `src/pages/uploads/ErrorCorrection.tsx`
- Table of failed rows for a batch: Row #, Column, Value, Error Message
- Filter by error type / column
- "Re-upload Corrected CSV" button (goes back to upload page)
- "Download Error Report" button (CSV download)

### `src/api/uploads.ts`
API functions: uploadCompanyCSV, uploadContactCSV, listBatches, getBatch, getBatchErrors, downloadErrorReport

### Add routes to `src/App.tsx`
```
/uploads → CSVUpload
/uploads/batches/:id → UploadResult
/uploads/batches/:id/errors → ErrorCorrection
```

---

## Business Rules (CRITICAL)
1. **UTF-8 only.** Reject non-UTF-8 files immediately.
2. **Max 10MB.** Reject larger files immediately.
3. **Required columns must be present.** Reject if missing (list which ones).
4. **Extra columns are ignored.** Do not error on extra columns.
5. **Case-insensitive header matching.** "company name" = "Company Name" = "COMPANY NAME".
6. **Partial import.** Valid rows go in, invalid rows stored as errors. BOTH counts returned.
7. **Validation-first.** Parse and validate ALL rows before inserting any.
8. **Segment Name lookup:** Must match an active segment. If not found → row error.
9. **Company Name lookup (contacts):** Must match an approved company. If not found → row error.
10. **Uploader = logged-in user.** Not from CSV data.
11. **Batch tracking:** Every upload gets a unique batch_id. Stored on imported records.
12. **Within-file duplicates:** Both rows are imported. Dedup job handles later.
13. **Company dedup: name + website WITHIN same segment.** Cross-segment duplicates are intentional — DO NOT flag.
14. **Contact dedup: email + company_id.**
15. **Error report:** Downloadable as CSV (row_number, column_name, value, error_message).
16. **Normalize on import:** trim, title-case company names, lowercase emails, normalize URLs.

---

## Verification
1. Upload valid company CSV → all rows imported with status=pending, batch tracked
2. Upload CSV with mix of valid/invalid → valid imported, invalid in errors
3. Upload non-UTF-8 → rejected
4. Upload > 10MB → rejected
5. Upload CSV missing required column → rejected with column name
6. Contact CSV with non-approved company → row error
7. Error report downloadable
8. Dedup job flags duplicates within segment, ignores cross-segment
