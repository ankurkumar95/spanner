# Spanner — Refined Prompts

> Prompts distilled from meeting notes. Use these when implementing features.  
> Requirements: `requirements.md` v3.1

---

### PR-1: Technical Architecture & Documentation
**When:** Before implementation starts

```
Create the project documentation:
1. Markdown files for project overview, architecture, modules
2. Mermaid diagrams: (a) system architecture (FastAPI + React + PostgreSQL in Docker),
   (b) database ERD — company→segment is ONE-TO-ONE (one company record per segment;
   duplicate company records across segments are intentional), segment↔offerings many-to-many,
   contact→company→segment chain, (c) end-to-end process flow, (d) CSV validation pipelines
3. Technical architecture: Docker compose, API design, file upload endpoints
4. All components in Docker containers
```

---

### PR-2: Authentication & User Management
**When:** Phase 1 — Foundation

```
AUTH:
1. Sign up — admin-only; NOT open to public
2. Login (token-based); Microsoft/Office 365 login (future phase)
3. Forgot password / password reset; bcrypt hashing

USER MANAGEMENT (full module):
4. List users — search, filter by role/status
5. Create user — admin assigns name, email, role(s)
6. Edit user — change roles, update details
7. Deactivate user — soft disable, preserve audit trail
8. Roles: Admin, Segment Owner, Researcher, Approver, SDR, Marketing
9. RBAC + grant-based module access (Drupal-inspired)
```

---

### PR-3: Segments Module — CRUD + Offerings
**When:** Phase 2 — Core entity

```
SEGMENT ENTITY: name (unique), description, offerings (many-to-many), status (Active/Archived),
created_by, created_at, updated_at.
- Archiving: hidden from active views; companies under it remain accessible; no new companies allowed.

OFFERINGS (global master):
- Entity: name (unique), description, status (Active/Inactive)
- Many-to-many: segment_offerings mapping table
- Autocomplete: show existing; allow adding new
- Managed ONLY through segment editing — NO standalone offerings management screen
- No duplicates: Shared records across segments

SEGMENT LIST: read-only for all; active by default (toggle archived); search/sort.
SEGMENT CRUD: Segment Owner only.
```

---

### PR-4: Assignment Module
**When:** Phase 2 — After segments

```
ASSIGNMENT TYPES:
- Segment → Researcher/Approver (by Segment Owner, Approver)
- Segment → SDR (by Segment Owner)
- Company → Researcher (by Approver)
- Contact → SDR (by Approver, grant-based)

RULES:
- Assign at entity creation or from list views
- One entity → multiple assignees
- Grant-based: who can assign is configurable by admin
- No standalone assignment screen — actions available on list/detail views
```

---

### PR-5: Company Module — Entity, CRUD, Detail View
**When:** Phase 3 — Data entry

```
COMPANY ENTITY: name, website, phone, description, linkedin, industry, sub-industry,
address fields, founded year, revenue range, employee size range, segment (ONE ref),
status (Pending/Approved/Rejected), rejection reason, created_by, created_at, updated_at.

KEY DATA MODEL DECISION:
- Each company belongs to exactly ONE segment (not many-to-many)
- Same real-world company in two segments = two separate company records
- Each record has independent approval status
- Dedup key: Company Name + Website WITHIN SAME SEGMENT
- Cross-segment duplicates are INTENTIONAL and not flagged

STATUSES: Pending → Approved / Rejected (with mandatory reason, no re-submission)
ENTRY: Form (single) or CSV (bulk)
DETAIL VIEW: Summary popup + Jira-style side panel (fields, history, timeline, contacts, actions)
BASIC EDIT: Editable fields on detail view (no standalone edit module)
```

---

### PR-6: Company CSV Upload & Validation
**When:** Phase 3 — After company entity

```
SCHEMA: 16 columns. Case-insensitive headers; ignore extra. Segment Name required (must match active).
VALIDATION (strict):
- UTF-8 only; max 10MB; reject if empty / header-only
- Column presence check; row-level validation per schema
- Email/URL format; lookup: Segment Name → active segment
- Partial import: valid rows in, invalid → Error Correction Module
- Error report: downloadable (row, column, value, error)
- Batch tracking: unique batch ID per upload
- Uploader = logged-in user

ON IMPORT: Each row creates new company (status=Pending) in specified segment.
Within-file duplicates are both imported; dedup job catches later.
```

---

### PR-7: Company Approval Queue
**When:** Phase 3 — After company upload

```
QUEUE: List all companies with status = Pending
ACTIONS: Approve (individual only) / Reject (mandatory reason)
REJECTION: No re-submission. Record stays for reference.
FILTERS: by segment, by researcher, by date range
ACCESS: Grant-based (Approver, SDR as configured)
```

---

### PR-8: Contact Module — Entity, Detail View
**When:** Phase 4 — After companies approved

```
CONTACT ENTITY: CSV fields + company ref + segment (derived from company) + status +
assigned SDR + created_by + created_at.

STATUSES: Uploaded → Approved → Assigned to SDR → Meeting Scheduled
- No rejection for contacts
- Bulk approval allowed

DETAIL VIEW: Summary popup + Jira-style side panel
BASIC EDIT: Editable fields on detail view if needed
```

---

### PR-9: Contact CSV Upload & Validation
**When:** Phase 4 — After contact entity

```
SCHEMA: 20 columns. Company Name required (must match approved company).
Segment: derived from company (not in CSV). Uploader: logged-in user.

VALIDATION: Same strict checks as company CSV (encoding, size, columns, rows, lookups).
Partial import; Error Correction Module; batch tracking.

DEDUP KEY (recommended): Email + Company Name
```

---

### PR-10: Duplicate Detection
**When:** Phase 4 — After both upload modules

```
SCHEDULED JOB: Configurable frequency (default: weekly)
COMPANY DEDUP KEY: Company Name + Website WITHIN SAME SEGMENT
- Cross-segment duplicates are intentional — DO NOT flag
CONTACT DEDUP KEY: Email + Company Name (recommended)
ACTION: Flag is_duplicate = true; do NOT delete
LIST VIEW: Duplicates hidden by default; toggle filter to show
NO active merge/review workflow in phase 1 — just filter out
```

---

### PR-11: List Views — Common Pattern (All Entities)
**When:** Phase 3–4 — Build as a reusable component

```
ALL LIST VIEWS share the same pattern:
- VISIBILITY: All users see the same list. Role determines available actions.
- SEARCH: Per-view search bar
- FILTERS: Entity-relevant filters + active/deactivated/duplicate toggles
- DEFAULT: Hide duplicates and deactivated records
- PAGINATION: Infinite scroll
- EXPORT: CSV export per user's data access

COMPANY LIST: columns (name, segment, status, industry, created_by, date),
  filters (segment, status, researcher, date, active/duplicate)
CONTACT LIST: columns (name, email, company, segment, status, SDR, date),
  filters (company, segment, status, SDR, date, active/duplicate)
SEGMENT LIST: columns (name, offerings, status, created_by, date),
  filters (status: active/archived)
```

---

### PR-12: Researcher Workbench
**When:** Phase 4 — After company + contact modules

```
DASHBOARD:
- My Segments (assigned segments)
- Per segment: approved companies for contact research
- My Uploads (companies + contacts by status)

ACTIONS:
- Create contact (form) per approved company
- Upload contact CSV per approved company
- View status of uploaded data
```

---

### PR-13: Marketing Collateral Module
**When:** Phase 5 — After core flow complete

```
LINKS ONLY: SharePoint / Share drive URLs. No file upload.
SCOPE: Flexible — per segment, offerings, or lead (refine later)
ACCESS: Marketing role only
```

---

### PR-14: Error Correction Module
**When:** Phase 3–4 — Built alongside CSV uploads

```
PURPOSE: Handle rows that FAILED CSV validation (never imported)
- NOT for editing successfully imported records
VIEW: List of failed rows per batch
ACTIONS: View errors, download error report, re-upload corrected CSV
ACCESS: Researcher, Approver
```

---

### PR-15: Audit, Data Normalization & UX
**When:** Ongoing — Build into every module

```
AUDIT:
- Who did what (actor, action, entity, timestamp)
- Scope: uploads, approvals, rejections, assignments, edits, user actions
- Activity timeline per record on detail views

DATA NORMALIZATION:
- Trim whitespace on all string fields
- Normalize company names (consistent casing)
- Standardize URLs (lowercase, strip trailing slashes)

UX PATTERNS:
- Detail views: summary popup → side panel (Jira-style) → optional full page
- List views: search, filters (with active/deactivated/duplicate toggles), infinite scroll, CSV export
- All lists show same data to all users; role determines actions

PHASE 1 LIMITATION:
- No in-app notifications. Users manually check queues/views.
```
