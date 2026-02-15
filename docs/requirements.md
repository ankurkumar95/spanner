# Spanner — Requirements Specification

**Document Version:** 3.1  
**Last Updated:** 2026-02-14  
**Status:** Draft — Incorporates Round 1–4 feedback. Ready for implementation planning.

---

## 1. Executive Summary

Spanner is a centralized sales and marketing planning application built on the **Account-Based Marketing (ABM)** model. **Segments** (Ideal Customer Profiles) are the core data entity. The system supports: segment creation → company research → company approval → contact research → contact approval → SDR outreach → marketing collateral delivery.

**Expected Data Volumes:** 10–20 segments, 100–1,000 companies, 1–20 contacts per company.

---

## 2. Technical Architecture

### 2.1 Technology Stack
- **Backend:** Python-based FastAPI (API-first)
- **Database:** PostgreSQL (separate Docker container)
- **Frontend:** React (UI and API are separate applications)
- **Infrastructure:** All components in Docker containers

### 2.2 File Upload Modules

| Upload Module | Purpose | File Types |
|---------------|---------|------------|
| **Company CSV Upload** | Bulk-upload companies | `.csv` only (Section 7A) |
| **Contact CSV Upload** | Bulk-upload contacts for approved companies | `.csv` only (Section 7B) |

**Technical Considerations:**
- Multipart/form-data endpoints; max 10MB per file
- Temporary staging for validation; persist only after validation
- Partial import (valid rows imported, invalid → Error Correction Module)
- `.csv` only; auth per module
- Audit: uploader (logged-in user), timestamp, file name, size, outcome, row count
- Batch tracking: unique batch ID per upload

### 2.3 Deliverables (Pre-Implementation)
- Markdown docs for project overview, architecture, modules
- Mermaid diagrams: system architecture, database ERD, process flows, CSV validation pipeline
- Technical architecture document with API design

---

## 3. User Types & Access Control

| User Role | Description | Key Responsibilities |
|-----------|-------------|---------------------|
| **Admin / Super User** | System administrator | Create/manage users, assign roles, configure module access |
| **Segment Owner** | Top management / sales process owner | Create segments, define offerings, manage assignments |
| **Researcher** | Junior research role | Find companies, find contacts, upload CSV data |
| **Approver** | Senior researcher | Own research + approve companies/contacts + assign work |
| **SDR** | Sales Development Representative | Approve contacts, set up meetings/calls |
| **Marketing** | Marketing team | Create collateral links, personalized content |

**Approver Role:** Experienced researcher. Hierarchy: Approver (senior) → Researcher (junior).

### 3.1 Access Control Model (Drupal-Inspired)
- **RBAC:** Each user has one or more roles
- **Module-level access:** Visibility and actions controlled by role grants
- **Grant-based approval:** Who can approve is configurable per role
- **Common list views:** All users see the same list screens (companies, contacts, segments). **Role determines available actions** (approve, reject, assign), not visibility. Filters available on all views.

**Tenancy:** Single-tenant (one organization).

---

## 4. Authentication & User Management

### 4.1 Authentication
- Sign up — **admin-only**; not open to public
- Login (standard + Microsoft/Office 365 — future phase)
- Forgot password / password reset
- Secure password hashing (bcrypt); token-based auth for API

### 4.2 User Management Module (Full)
- **List users** — search, filter by role, status
- **Create user** — admin assigns name, email, role(s)
- **Edit user** — change roles, update details
- **Deactivate user** — soft disable (preserve audit trail)
- **Role assignment** — one user can have multiple roles

---

## 5. Segments Module

### 5.1 Segment Entity

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Segment Name | string | Yes | Unique |
| Description | text | No | Free-form |
| Offerings | multi-select (tag/auto-complete) | Yes | From global Offerings master (many-to-many) |
| Status | enum | Yes | Active / Archived (default: Active) |
| Created By | user ref | Auto | |
| Created At | timestamp | Auto | |
| Updated At | timestamp | Auto | |

**Archiving:** Archived segments hidden by default (toggle to show). Companies/contacts under archived segments remain accessible via filters/search; no new companies can be added.

### 5.2 Offerings (Global Master List)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Name | string | Yes | Unique |
| Description | text | No | |
| Status | enum | Yes | Active / Inactive (default: Active) |

- **Many-to-many:** `segment_offerings` mapping table
- **Auto-complete:** Show existing offerings; allow adding new
- **Managed only through segment editing** — no standalone offerings screen
- **No duplicates:** Shared records across segments

### 5.3 Segment List View
- **Visibility:** All user types
- **Content:** Active segments (toggle to show archived)
- **Features:** Search, filter, sort, infinite scroll

### 5.4 Assignment Module (Flexible, Drupal-Inspired)

| Assignment Type | What | Who can assign | Assigned to |
|-----------------|------|----------------|-------------|
| Segment → Researcher | Segment | Segment Owner, Approver | Researcher, Approver |
| Segment → SDR | Segment | Segment Owner | SDR |
| Company → Researcher | Approved company | Approver | Researcher |
| Contact → SDR | Approved contact | Approver, grant-based | SDR |

- At entity creation or from list views
- One entity → multiple users
- Who can assign is controlled by role grants

### 5.5 Researcher Workbench
- **My Segments** — segments assigned to the researcher
- **Per segment** — approved companies for contact research
- **Actions** — create contact (form) or upload CSV per company
- **My Uploads** — companies and contacts uploaded by the researcher, filterable by status

---

## 6. Company Module

### 6.1 Company Entity

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Company Name | string | Yes | |
| Company Website | string | No | Valid URL; used in dedup key |
| Company Phone | string | No | |
| Company Description | text | No | |
| Company Linkedin Url | string | No | Valid URL |
| Company Industry | string | No | |
| Company Sub-Industry | string | No | |
| Company Address: Street | string | No | |
| Company Address: City | string | No | |
| Company Address: State/Province | string | No | |
| Company Address: Country/Region | string | No | |
| Company Address: ZIP/Postal Code | string | No | |
| Founded Year | integer | No | 1800–current year |
| Company Revenue Range | string | No | |
| Company Employee Size Range | string | No | |
| Segment | segment ref | Yes | **One company → one segment.** See 6.4. |
| Status | enum | Yes | See 6.2 |
| Rejection Reason | text | Conditional | Required when status = Rejected |
| Created By | user ref | Auto | |
| Created At | timestamp | Auto | |
| Updated At | timestamp | Auto | |

### 6.2 Company Statuses

```
Pending → Approved
       → Rejected (with reason; stays for reference; NO re-submission)
```

- **Approval:** Individual only (no bulk). Grant-based.
- **Rejection:** Mandatory reason. No re-submission. Stays visible.

### 6.3 How Companies Enter the System
- **Form:** One company at a time
- **CSV Upload:** Bulk via Company CSV (Section 7A)

### 6.4 Company → Segment (One-to-One)

**Each company record belongs to exactly one segment.** If the same real-world company is targeted by two segments, **create two separate company records** — one per segment. Each has its own approval status.

This means:
- "Acme Corp" in Segment A = one record (can be Approved)
- "Acme Corp" in Segment B = separate record (can be Pending or Rejected independently)
- **Dedup key:** Company Name + Company Website **within the same segment**. Cross-segment duplicates are intentional and should NOT be flagged.

### 6.5 Company List View
- **Visibility:** All users see the same list. Role determines actions.
- **Columns:** Company Name, Segment, Status, Industry, Created By, Created At
- **Filters:** by segment, by status, by researcher, by date range, by active/duplicate
- **Search:** in-view search across company fields
- **Pagination:** Infinite scroll
- **Export:** CSV export per user's data access
- **Default filter:** Hide duplicates (`is_duplicate`) and deactivated records. Toggle to show.

### 6.6 Company Detail View
- **Summary popup** — quick view on click (key fields + status + actions)
- **Side panel (Jira-style)** — full fields, status history, activity timeline, related contacts, actions (approve, reject, assign)
- **Basic edit** — editable fields on the detail view if needed

---

## 7A. Company CSV Upload — Schema & Validation

### 7A.1 Purpose
Bulk-upload companies. Each row creates a company in one segment with status "Pending."

### 7A.2 Company CSV Schema

Case-insensitive headers. Extra columns ignored.

| # | Column Name | Required | Data Type | Validation Rules |
|---|-------------|----------|-----------|------------------|
| 1 | Company Name | Yes | string | Non-empty, max 500 chars |
| 2 | Company Website | No | string | Valid URL if provided |
| 3 | Company Phone | No | string | Max 50 chars |
| 4 | Company Description | No | text | Max 5000 chars |
| 5 | Company Linkedin Url | No | string | Valid URL if provided |
| 6 | Company Industry | No | string | Max 200 chars |
| 7 | Company Sub-Industry | No | string | Max 200 chars |
| 8 | Company Address 1: Street 1 | No | string | Max 500 chars |
| 9 | Company Address 1: City | No | string | Max 200 chars |
| 10 | Company Address 1: State/Province | No | string | Max 200 chars |
| 11 | Company Address 1: Country/Region | No | string | Max 200 chars |
| 12 | Company Address 1: ZIP/Postal Code | No | string | Max 50 chars |
| 13 | Founded Year | No | integer | 1800–current year |
| 14 | Company Revenue Range | No | string | Max 200 chars |
| 15 | Company Employee Size Range | No | string | Max 200 chars |
| 16 | Segment Name | Yes | string | Must match an existing active segment |

**On import:** Each row creates a new company record with status = Pending, linked to the specified segment. Uploader = logged-in user. Duplicate rows within same file are both imported (dedup job catches later).

---

## 7B. Contact CSV Upload — Schema & Validation

### 7B.1 Purpose
Bulk-upload contacts for **approved companies**.

### 7B.2 Contact CSV Schema

Case-insensitive headers. Extra columns ignored.

| # | Column Name | Required | Data Type | Validation Rules |
|---|-------------|----------|-----------|------------------|
| 1 | First Name | Yes | string | Non-empty, max 200 chars |
| 2 | Last Name | Yes | string | Non-empty, max 200 chars |
| 3 | Mobile Phone | No | string | Valid phone if provided |
| 4 | Job Title | No | string | Max 500 chars |
| 5 | Company Name | Yes | string | Must match an **approved** company |
| 6 | Email | Yes | string | Valid email (RFC 5322) |
| 7 | Direct Phone Number | No | string | Max 50 chars |
| 8 | Email Address 2 | No | string | Valid email if provided |
| 9 | Email Active Status | No | string | Max 100 chars |
| 10 | Lead Source Global | No | string | Max 200 chars |
| 11 | Management Level | No | string | Max 200 chars |
| 12 | Contact Address 1: Street 1 | No | string | Max 500 chars |
| 13 | Contact Address 1: City | No | string | Max 200 chars |
| 14 | Contact Address 1: State/Province | No | string | Max 200 chars |
| 15 | Contact Address 1: Country/Region | No | string | Max 200 chars |
| 16 | Contact Address 1: ZIP/Postal Code | No | string | Max 50 chars |
| 17 | Primary Time Zone | No | string | Max 100 chars |
| 18 | Contact Linkedin Url | No | string | Valid URL if provided |
| 19 | LinkedIn Summary | No | text | Max 5000 chars |
| 20 | Data Requester Details | No | string | Max 500 chars |

**Segment:** Derived from company's segment (not in CSV).  
**Uploader:** Logged-in user (not in CSV).

### 7B.3 CSV Validation — Strict Checks (Both CSVs)

| Check | Behavior |
|-------|----------|
| Column presence | Reject if required column missing; list missing |
| Column order | Match by header name (case-insensitive) |
| Extra columns | Ignore |
| Encoding | UTF-8 only |
| File size | Max 10MB |
| Empty / header-only | Reject |
| Row-level | Validate per schema; collect all errors |
| Email / URL format | Validate; report row + column |
| Lookups | Segment Name / Company Name must match DB |
| Uploader | Logged-in user as creator |
| Batch tracking | Unique batch ID per upload |

### 7B.4 CSV Import Behavior (Both)
- **Validation-first:** All checks before any insert
- **Partial import:** Valid rows imported; invalid → Error Correction Module
- **Error report:** Downloadable (row, column, value, error)
- **Error Correction Module:** View failed rows; re-upload corrected CSV

### 7B.5 Duplicate Handling
- **Company dedup key:** Company Name + Company Website **within the same segment**. Cross-segment duplicates are intentional.
- **Contact dedup key:** Email + Company Name (recommended)
- **Scheduled job:** Configurable (default: weekly). Flags with `is_duplicate`; does not delete.
- **Within-file duplicates:** Both imported; dedup job catches later
- **List view default:** Duplicates hidden by default; toggle to show

---

## 8. Contact Module

### 8.1 Contact Entity

Fields from Contact CSV schema (7B.2), plus:

| Field | Type | Notes |
|-------|------|-------|
| Company | company ref | Must be approved company |
| Segment | segment ref | Derived from company's segment |
| Status | enum | See 8.2 |
| Assigned SDR | user ref | Null until assigned |
| Created By | user ref | Logged-in user (uploader) |
| Created At | timestamp | |

### 8.2 Contact Status Pipeline

```
Uploaded → Approved → Assigned to SDR → Meeting Scheduled
```

- **Uploaded:** Initial status
- **Approved:** Bulk approval. **No rejection for contacts.**
- **Assigned to SDR:** Contact assigned for outreach
- **Meeting Scheduled:** SDR sets up meeting

**Post-meeting outcomes:** Future (separate CRM application).

### 8.3 Contact List View
- **Visibility:** All users see the same list. Role determines actions.
- **Columns:** First Name, Last Name, Email, Company, Segment, Status, Assigned SDR, Created At
- **Filters:** by company, by segment, by status, by SDR, by date range, by active/duplicate
- **Search:** in-view search
- **Pagination:** Infinite scroll
- **Export:** CSV export per user's access
- **Default filter:** Hide duplicates and deactivated records. Toggle to show.

### 8.4 Contact Detail View
- **Summary popup** — quick view on click
- **Side panel (Jira-style)** — full fields, status history, activity timeline, company info, actions
- **Basic edit** — editable fields on detail view if needed

---

## 9. Approval Queue Module

- **Pending Companies** — status = Pending (for company approvers)
- **Uploaded Contacts** — status = Uploaded (for contact approvers)
- **Actions:** Approve / Reject (companies, individual) or Approve (contacts, bulk)
- **Filters:** by segment, by researcher, by date
- **Access:** Grant-based (Approver, SDR, configurable)

---

## 10. Marketing Collateral Module

- **Storage:** Links only (SharePoint/Share drive URLs). No file upload.
- **Scope:** Flexible — segment, offerings, or lead. Refine later.
- **Access:** Marketing role only.

---

## 11. SDR Workbench (Future)

> Detailed requirements to be defined later.

- SDR sees assigned contacts grouped by status
- Actions to change status (e.g., "Schedule Meeting")
- View collateral links for contact's segment/offerings

---

## 12. Data, Audit & UX Patterns

### 12.1 Edit / Delete
- **Basic edit:** Available on detail view (side panel). No standalone edit module.
- **Delete:** Not available in initial phase.

### 12.2 Audit Logging
- **Depth:** Who did what (actor, action, entity, timestamp)
- **Scope:** Uploads, approvals, rejections, assignments, edits, user actions
- **Activity timeline:** Per-record history on detail pages

### 12.3 Data Normalization
- Trim whitespace on all string fields
- Normalize company names (consistent casing)
- Standardize URLs (lowercase, strip trailing slashes)

### 12.4 UX Patterns — Detail Views
- **Summary popup** — click on any record shows quick summary
- **Side panel (Jira-style)** — full detail with fields, history, timeline, basic edit, actions
- **Full page** — optional for complex records

### 12.5 List View Standards (All List Views)
- **Search:** Per-view search bar on every list view
- **Filters:** Relevant filters per entity; include active/deactivated/duplicate toggles
- **Default:** Hide duplicates and deactivated records; toggle to show
- **Pagination:** Infinite scroll
- **Export:** CSV export per user's data access
- **Visibility:** All users see the same lists. Role determines available actions.

### 12.6 Known Limitations (Phase 1)
- **No in-app notifications.** Approvers, researchers, and SDRs must manually check their queues/views. Microsoft Teams notifications planned for future phase.

---

## 13. Process Flow (End-to-End)

1. **Segment creation** — Segment Owner creates segment with offerings
2. **Segment assignment** — Segment Owner assigns to researchers and SDRs
3. **Company research** — Researchers add companies (form or CSV). Status = **Pending**. One company record per segment.
4. **Company approval** — Approval Queue. **Individual only.** Reject requires reason. **No re-submission.**
5. **Approved companies visible** — Researcher Workbench + common company list (filtered)
6. **Contact research** — Upload contacts for approved companies (form or CSV). Status = **Uploaded**. Segment derived from company.
7. **Contact approval** — Approval Queue. **Bulk allowed. No rejection.**
8. **Contact assignment** — Approved contacts assigned to SDRs
9. **SDR outreach** — Status → **Meeting Scheduled**
10. **Marketing collateral** — Links per segment/offerings
11. **Post-meeting outcomes** — Future (separate CRM)

**Sequencing:** Per-company. As soon as a company is approved, contact research begins.

---

## 14. Modules Summary (Access by User Group)

| Module | Admin | Seg. Owner | Researcher | Approver | SDR | Marketing |
|--------|-------|------------|------------|----------|-----|-----------|
| User Management | ✓ | — | — | — | — | — |
| Authentication | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Segment List | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Segment CRUD | — | ✓ | — | — | — | — |
| Company List | ✓ | ✓ (read) | ✓ | ✓ | ✓ (read) | — |
| Contact List | ✓ | ✓ (read) | ✓ | ✓ | ✓ | — |
| Assignment Module | — | ✓ (segments) | — | ✓ (companies, contacts) | — | — |
| Researcher Workbench + My Uploads | — | — | ✓ | ✓ | — | — |
| Company Research (form + CSV) | — | — | ✓ | ✓ | — | — |
| Approval Queue (companies) | — | — | — | ✓ (grant*) | ✓ (grant*) | — |
| Contact Research (form + CSV) | — | — | ✓ | ✓ | — | — |
| Error Correction | — | — | ✓ | ✓ | — | — |
| Approval Queue (contacts) | — | — | — | ✓ (grant*) | ✓ (grant*) | — |
| Marketing Collateral (links) | — | — | — | — | — | ✓ |
| SDR Workbench (future) | — | — | — | — | ✓ | — |
| Dashboard (future) | ✓ | ✓ | — | — | — | — |

*Grant-based: configurable by role.*

---

## 15. Future Requirements

1. **SDR Workbench** — detailed specs TBD
2. **Post-meeting outcomes** — separate CRM
3. **Marketing trigger** — notification for personalized content
4. **Microsoft Teams notifications** — write stories now, implement later
5. **Dashboard** — KPIs, conversion funnel, productivity
6. **Microsoft/Office 365 login** — SSO

---

## 16. Open Items

1. **Contact dedup key** — recommend Email + Company Name; confirm
2. **Data normalization rules** — confirm approach
3. **Marketing collateral scope** — refine when building

---

## 17. Appendix

### 17.1 Company CSV Columns
```
Company Name, Company Website, Company Phone, Company Description,
Company Linkedin Url, Company Industry, Company Sub-Industry,
Company Address 1: Street 1, Company Address 1: City,
Company Address 1: State/Province, Company Address 1: Country/Region,
Company Address 1: ZIP/Postal Code, Founded Year,
Company Revenue Range, Company Employee Size Range, Segment Name
```

### 17.2 Contact CSV Columns
```
First Name, Last Name, Mobile Phone, Job Title, Company Name, Email,
Direct Phone Number, Email Address 2, Email Active Status,
Lead Source Global, Management Level,
Contact Address 1: Street 1, Contact Address 1: City,
Contact Address 1: State/Province, Contact Address 1: Country/Region,
Contact Address 1: ZIP/Postal Code, Primary Time Zone,
Contact Linkedin Url, LinkedIn Summary, Data Requester Details
```
