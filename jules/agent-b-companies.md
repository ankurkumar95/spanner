# Jules Agent B — Companies + Company Approval

> **Run in PARALLEL** with Agents A, C, D, E (after Agent 0 is merged to main).  
> **Branch name:** `feature/companies`  
> **Base branch:** `main` (with Agent 0 merged)

---

## Context

The project skeleton, all 15 database tables, auth middleware, RBAC, and audit service already exist. You are adding the Company module — CRUD, approval/rejection, list/detail views, and the company tab of the Approval Queue.

**DO NOT** modify: database models, migrations, auth middleware, Docker files. Only ADD new files.

---

## Stitch Design References

Reference these UI mockup files when building frontend components. Match the visual style, layout, colors, and component structure:

| Screen | Design File | Screenshot |
|--------|------------|------------|
| Company List | `designs/html/16-company-list.html` | `designs/screenshots/16-company-list.png` |
| Add New Company Form | `designs/html/05-add-company-form.html` | `designs/screenshots/05-add-company-form.png` |
| Company Detail (Side Panel) | `designs/html/13-company-detail.html` | `designs/screenshots/13-company-detail.png` |

Open the HTML files in a browser to see the exact design. Replicate the visual style for CompanyList.tsx, CompanyForm.tsx, CompanySummaryPopup.tsx, CompanyDetailPanel.tsx, and CompanyApprovalTab.tsx.

---

## Backend — Files to Create

### `app/schemas/company.py`
- CompanyCreate: name(str required), website(str), phone(str), description(str), linkedin_url(str), industry(str), sub_industry(str), address_street(str), address_city(str), address_state(str), address_country(str), address_zip(str), founded_year(int), revenue_range(str), employee_size_range(str), segment_id(UUID required)
- CompanyUpdate: all fields optional except segment_id
- CompanyResponse: all fields + id, status, rejection_reason, is_duplicate, is_active, created_by, created_at, updated_at, segment(SegmentBrief)
- CompanyBrief: id, name, segment_name, status
- RejectRequest: rejection_reason(str, required, min_length=1)

### `app/services/company_service.py`
- **create_company:** Validate segment exists and is active. Normalize: trim all strings, normalize company name (title case), normalize URLs. Set status=pending, created_by=current_user. Audit log.
- **update_company:** Basic field edit. Normalize. Audit log with old/new values.
- **approve_company:** Validate status==pending. Set status=approved. Audit log.
- **reject_company:** Validate status==pending. Require rejection_reason (non-empty). Set status=rejected, store reason. Audit log with reason. **This is permanent — no re-submission.**
- **list_companies:** Filters: segment_id, status, created_by, is_duplicate(default false), is_active(default true), search (name, industry), date range. Cursor pagination. Sort by created_at desc.
- **get_company:** With related contacts count.

### `app/routers/companies.py`
```
GET    /api/companies               — list (companies:read)
POST   /api/companies               — create (companies:create)
GET    /api/companies/:id           — detail (companies:read)
PATCH  /api/companies/:id           — edit (companies:edit)
POST   /api/companies/:id/approve   — approve (companies:approve). INDIVIDUAL ONLY.
POST   /api/companies/:id/reject    — reject (companies:reject). Body: { rejection_reason }. PERMANENT.
```

### `app/routers/approval_queue.py` (company part)
```
GET    /api/approval-queue/companies — shortcut for companies?status=pending. (companies:approve)
```

### Register routers in `app/main.py`
```python
from app.routers import companies, approval_queue
app.include_router(companies.router, prefix="/api")
app.include_router(approval_queue.router, prefix="/api")
```

---

## Frontend — Files to Create

### `src/pages/companies/CompanyList.tsx`
- Table: Company Name, Segment, Status (color badge), Industry, Created By, Created At
- Filter bar: Segment dropdown, Status dropdown, Researcher dropdown, Date range, "Show duplicates" toggle (off), "Show deactivated" toggle (off)
- Search bar (searches name, industry)
- Infinite scroll (cursor-based)
- CSV Export button (calls export endpoint — just wire the button, actual export in Agent E)
- "Add Company" button (if companies:create permission)
- Click row → CompanySummaryPopup

### `src/pages/companies/CompanyForm.tsx`
- All 16 fields: Company Name*, Website, Phone, Description, LinkedIn URL, Industry, Sub-Industry, Street, City, State, Country, ZIP, Founded Year, Revenue Range, Employee Size Range, Segment* (dropdown of active segments)
- Required fields marked with asterisk
- On submit: POST /api/companies, redirect to list

### `src/components/CompanySummaryPopup.tsx`
- Quick overlay on row click
- Shows: Company Name, Website (link), Status badge, Segment, Industry, Created By
- "View Full Details" button → opens CompanyDetailPanel

### `src/components/CompanyDetailPanel.tsx`
- Jira-style side panel (right, ~45% width, scrollable)
- Sections:
  - **Fields:** All company fields. Basic inline edit (click to edit, save on blur).
  - **Status:** Current status badge + rejection reason if rejected
  - **Related Contacts:** Count + mini-list of contacts for this company
  - **Actions:** Approve button (green, if status=pending and user has companies:approve), Reject button (red, opens RejectionModal), Assign to Researcher button (opens AssignmentModal from Agent A)
  - **Activity Timeline:** Audit events for this company
- If status=rejected, show rejection reason prominently with warning styling

### `src/components/CompanyRejectionModal.tsx`
- Modal with: textarea for rejection reason (required, cannot be empty)
- Warning text: "This action is permanent. The company cannot be re-submitted."
- Confirm + Cancel buttons
- On confirm: POST /api/companies/:id/reject

### `src/pages/approval/CompanyApprovalTab.tsx`
- Table of companies with status=pending
- Columns: Company Name, Segment, Researcher (created_by name), Upload Date
- Per-row actions: Approve (green button), Reject (red button → RejectionModal)
- **NO bulk approve.** Individual only. No checkboxes.
- Filters: Segment, Researcher, Date range

### `src/api/companies.ts`
API functions: listCompanies, createCompany, getCompany, updateCompany, approveCompany, rejectCompany, getApprovalQueueCompanies

### Add routes to `src/App.tsx`
```
/companies → CompanyList
/companies/new → CompanyForm
```

---

## Business Rules (CRITICAL)
1. **One company → one segment.** segment_id is required, single FK.
2. **Approval is individual only.** No bulk approve endpoint or UI for companies.
3. **Rejection requires mandatory reason.** Empty reason = 400 error.
4. **Rejection is permanent.** Cannot change status back from rejected. No re-submission.
5. **Rejected records stay visible.** They appear in list (status=rejected) and detail view shows reason.
6. **Default filters hide duplicates and deactivated.** is_duplicate=false, is_active=true by default.
7. **All users see the same company list.** Role determines action buttons, not data visibility (except Marketing who has no companies:read).
8. **Normalize on create/update:** trim strings, title-case company name, normalize URLs.
9. **Audit log** every create, edit, approve, reject.

---

## Status Badge Colors
- Pending → amber
- Approved → green
- Rejected → red

---

## Verification
1. Can create a company linked to a segment
2. Can list companies with filters
3. Can approve a pending company (individual)
4. Can reject with reason (permanent, reason stored)
5. Rejected company cannot be re-approved
6. Summary popup → detail panel → timeline works
7. RBAC: researcher can create but not approve, approver can do both
