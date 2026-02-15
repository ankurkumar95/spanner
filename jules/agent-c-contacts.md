# Jules Agent C — Contacts + Contact Approval

> **Run in PARALLEL** with Agents A, B, D, E (after Agent 0 is merged to main).
> **Branch name:** `feature/contacts`
> **Base branch:** `main` (with Agent 0 merged)

---

## Context

The project skeleton, all 15 database tables, auth, RBAC, and audit service exist. You are adding the Contact module — CRUD, bulk approval, SDR assignment, meeting scheduling, and the contact tab of the Approval Queue.

**DO NOT** modify: database models, migrations, auth middleware, Docker files. Only ADD new files.

---

## Stitch Design References

Reference these UI mockup files when building frontend components. Match the visual style, layout, colors, and component structure:

| Screen | Design File | Screenshot |
|--------|------------|------------|
| Contact Directory (List) | `designs/html/17-contact-directory.html` | `designs/screenshots/17-contact-directory.png` |
| Add New Contact Form | `designs/html/06-add-contact-form.html` | `designs/screenshots/06-add-contact-form.png` |

Open the HTML files in a browser to see the exact design. Replicate the visual style for ContactList.tsx, ContactForm.tsx, ContactSummaryPopup.tsx, ContactDetailPanel.tsx, and ContactApprovalTab.tsx.

---

## Backend — Files to Create

### `app/schemas/contact.py`
- ContactCreate: first_name(str required), last_name(str required), mobile_phone(str), job_title(str), company_id(UUID required), email(str required), direct_phone(str), email_2(str), email_active_status(str), lead_source(str), management_level(str), address_street(str), address_city(str), address_state(str), address_country(str), address_zip(str), primary_timezone(str), linkedin_url(str), linkedin_summary(str), data_requester_details(str)
- ContactUpdate: all fields optional
- ContactResponse: all fields + id, segment_id, segment_name, company_name, status, assigned_sdr(UserBrief), is_duplicate, is_active, created_by, created_at, updated_at
- BulkApproveRequest: contact_ids(list[UUID], required, min 1)
- AssignSDRRequest: sdr_id(UUID, required)

### `app/services/contact_service.py`
- **create_contact:** Validate company exists AND status=approved. Auto-set segment_id from company.segment_id. Normalize: trim, normalize email (lowercase), normalize URLs. Set status=uploaded. Audit log.
- **update_contact:** Basic field edit. Normalize. Audit log.
- **bulk_approve:** Accept list of contact_ids. Validate all status=uploaded. Set all to status=approved. Audit log (one entry with count + IDs).
- **assign_sdr:** Validate contact status=approved. Validate assignee has SDR role. Set assigned_sdr_id, status=assigned_to_sdr. Audit log.
- **schedule_meeting:** Validate status=assigned_to_sdr. Set status=meeting_scheduled. Audit log.
- **list_contacts:** Filters: company_id, segment_id, status, assigned_sdr_id, created_by, is_duplicate(default false), is_active(default true), search (name, email), date range. Cursor pagination.
- **get_contact:** With company info.

### `app/routers/contacts.py`
```
GET    /api/contacts                    — list (contacts:read)
POST   /api/contacts                    — create (contacts:create)
GET    /api/contacts/:id                — detail (contacts:read)
PATCH  /api/contacts/:id                — edit (contacts:edit)
POST   /api/contacts/approve            — BULK approve (contacts:approve). Body: { contact_ids: [] }
POST   /api/contacts/:id/assign         — assign to SDR (contacts:assign). Body: { sdr_id }
POST   /api/contacts/:id/schedule-meeting — schedule meeting (contacts:schedule_meeting)
```

### Update `app/routers/approval_queue.py` (if exists, else create)
```
GET    /api/approval-queue/contacts  — shortcut for contacts?status=uploaded. (contacts:approve)
```

### Register routers in `app/main.py`
```python
from app.routers import contacts
app.include_router(contacts.router, prefix="/api")
# approval_queue may already be registered by Agent B — add contacts endpoint to it
```

---

## Frontend — Files to Create

### `src/pages/contacts/ContactList.tsx`
- Table: First Name, Last Name, Email, Company, Segment, Status (color badge), Assigned SDR, Created At
- Filter bar: Company dropdown, Segment dropdown, Status dropdown, SDR dropdown, Date range, "Show duplicates" toggle (off), "Show deactivated" toggle (off)
- Search bar (searches name, email)
- Infinite scroll
- CSV Export button
- "Add Contact" button (if contacts:create)
- Click row → ContactSummaryPopup

### `src/pages/contacts/ContactForm.tsx`
- All 20 fields: First Name*, Last Name*, Mobile Phone, Job Title, Company* (dropdown — **only approved companies**), Email*, Direct Phone, Email 2, Email Active Status, Lead Source, Management Level, Street, City, State, Country, ZIP, Timezone, LinkedIn URL, LinkedIn Summary, Data Requester Details
- Company dropdown must only show companies with status=approved
- On submit: POST /api/contacts

### `src/components/ContactSummaryPopup.tsx`
- Quick overlay: Name, Email, Company, Segment, Status badge, Assigned SDR
- "View Full Details" button → ContactDetailPanel

### `src/components/ContactDetailPanel.tsx`
- Jira-style side panel
- Sections:
  - **Fields:** All contact fields (basic inline edit)
  - **Status Pipeline:** Horizontal stepper visualization: Uploaded → Approved → Assigned to SDR → Meeting Scheduled. Current step highlighted. This is a KEY UX element.
  - **Company Info:** Company name (link), segment, company status
  - **Actions:** Approve (if uploaded, contacts:approve), Assign to SDR (dropdown of SDR users, if approved, contacts:assign), Schedule Meeting (if assigned, contacts:schedule_meeting)
  - **Activity Timeline:** Audit events

### `src/pages/approval/ContactApprovalTab.tsx`
- Table of contacts with status=uploaded
- Columns: First Name, Last Name, Email, Company, Segment, Researcher, Upload Date
- **Checkbox selection** for bulk. "Approve Selected" button (green).
- **No reject.** No rejection for contacts.
- Filters: Segment, Company, Researcher, Date range
- On approve: POST /api/contacts/approve with selected IDs

### `src/api/contacts.ts`
API functions: listContacts, createContact, getContact, updateContact, bulkApproveContacts, assignSDR, scheduleMeeting, getApprovalQueueContacts

### Add routes to `src/App.tsx`
```
/contacts → ContactList
/contacts/new → ContactForm
```

---

## Business Rules (CRITICAL)
1. **Contact segment is auto-derived from company.** On create, set contact.segment_id = company.segment_id. Not provided by user.
2. **Company must be approved.** Cannot create contacts for pending/rejected companies. Return 400.
3. **Bulk approval allowed.** Multiple contacts approved in one request. No rejection for contacts.
4. **Status pipeline is linear:** Uploaded → Approved → Assigned to SDR → Meeting Scheduled. Cannot skip steps. Cannot go backwards.
5. **SDR assignment:** Only approved contacts can be assigned. Assignee must have SDR role.
6. **Schedule meeting:** Only assigned contacts (status=assigned_to_sdr) can move to meeting_scheduled.
7. **Default filters hide duplicates and deactivated.**
8. **All users see same list.** Role determines actions.
9. **Normalize:** trim, lowercase email, normalize URLs.
10. **Audit log** every create, edit, approve (with count), assign, schedule.

---

## Status Badge Colors
- Uploaded → blue
- Approved → green
- Assigned to SDR → indigo
- Meeting Scheduled → purple

---

## Verification
1. Can create contact for an approved company (segment auto-set)
2. Cannot create contact for pending/rejected company (400)
3. Can bulk approve multiple contacts
4. Can assign to SDR, then schedule meeting (linear pipeline)
5. Cannot skip steps (e.g., assign before approve → 400)
6. Status stepper shows correct current step
7. Approval queue shows checkboxes + bulk approve button
