# Google Stitch Prompt — Spanner Application

> Copy the prompt below and supply it to Google Stitch along with all files from the `docs/` folder + `requirements.md`.

---

## Prompt

Design a complete, production-ready web application called **Spanner** — an internal sales and marketing CRM built on the Account-Based Marketing (ABM) model. I am attaching the full technical documentation (architecture, database design, API design, process flows, and technical design) plus a requirements specification. Use these as the source of truth for every screen, field, status, and workflow.

### Application Overview

Spanner helps sales teams manage: Segments (ideal customer profiles) → Company research → Company approval → Contact research → Contact approval → SDR outreach. It has 6 user roles (Admin, Segment Owner, Researcher, Approver, SDR, Marketing), role-based access control, CSV bulk uploads, and approval workflows.

### Design System & Style

- **Style:** Modern, clean, professional SaaS application. Think linear.app or Notion-like aesthetics — minimal, spacious, functional.
- **Layout:** Left sidebar navigation + top header with user/role info. Main content area.
- **Theme:** Light mode default. Neutral color palette with accent colors for status badges (green = approved, amber = pending, red = rejected, blue = uploaded/assigned, purple = meeting scheduled).
- **Typography:** Clean sans-serif. Clear visual hierarchy.
- **Components:** Use cards, tables with inline actions, side panels (Jira-style), filter bars, status pills/badges, toast notifications.
- **Responsive:** Desktop-first (this is an internal tool), but panels should be usable.

---

### Screens to Generate (in this order)

#### 1. Authentication (3 screens)
- **Login page** — email + password form, "Forgot password" link, clean centered layout, Spanner logo
- **Forgot password page** — email input, submit, back to login link
- **Reset password page** — new password + confirm, submit

#### 2. App Shell / Layout (1 screen)
- **Sidebar navigation** showing all modules. Sidebar items change based on the logged-in user's role:
  - Admin sees: Dashboard, User Management, Segments, Companies, Contacts, Approval Queue
  - Segment Owner sees: Segments, Companies (read), Contacts (read)
  - Researcher sees: Researcher Workbench, Segments, Companies, Contacts, CSV Upload
  - Approver sees: Researcher Workbench, Segments, Companies, Contacts, Approval Queue, CSV Upload
  - SDR sees: Segments, Companies (read), Contacts, Approval Queue
  - Marketing sees: Segments, Marketing Collateral
- **Top header** — app name "Spanner", current user name, role badge, logout

#### 3. User Management — Admin only (3 screens)
- **User list** — table with columns: Name, Email, Role(s), Status (Active/Inactive), Created At. Search bar, filter by role, filter by status. Action buttons: Create User, Deactivate.
- **Create user form** — Name, Email, Password, Role(s) multi-select. Submit creates user.
- **Edit user** — Same form pre-filled. Can change roles. Deactivate button.

#### 4. Segments Module (4 screens)
- **Segment list** — card or table view. Columns: Segment Name, Offerings (as tags), Status (Active/Archived), Created By, Created At. Search, filter by status (Active by default, toggle to show Archived). All users see this (read-only for most).
- **Create segment form** — Segment Name, Description (textarea), Offerings (auto-complete tag input — type to search existing, add new). For Segment Owner only.
- **Segment detail side panel** — Jira-style slide-in panel from right. Shows: all fields, linked offerings as tags, status, created by/at, assigned researchers, assigned SDRs. Activity timeline at bottom. Actions: Edit, Archive, Assign Researcher, Assign SDR.
- **Segment assignment modal** — Select user(s) to assign. Dropdown filtered by role (Researcher or SDR). Can assign multiple.

#### 5. Company Module (5 screens)
- **Company list** — table view. Columns: Company Name, Segment, Status (color-coded badge), Industry, Created By, Created At. Filter bar with: Segment dropdown, Status dropdown, Researcher dropdown, Date range picker, Active/Duplicate toggles (duplicates and deactivated hidden by default). Search bar. Infinite scroll. CSV Export button. All users see same list; role determines which action buttons appear.
- **Create company form** — All fields from Company entity: Company Name*, Website, Phone, Description, LinkedIn URL, Industry, Sub-Industry, Address fields (Street, City, State, Country, ZIP), Founded Year, Revenue Range, Employee Size Range, Segment* (dropdown of active segments). Required fields marked with asterisk.
- **Company detail — summary popup** — clicking a company row shows a quick popup/card overlay with: Company Name, Website, Status badge, Segment, Industry, Created By. "View Full Details" button opens side panel.
- **Company detail — side panel** — Jira-style slide-in from right. Full detail view with: all company fields (basic editable), Status with history, Rejection reason (if rejected), Related contacts list, Activity timeline (audit log), Action buttons (Approve, Reject with reason modal, Assign to Researcher). Basic inline edit on fields.
- **Company rejection modal** — text area for mandatory rejection reason. Confirm button. Warning: "This action is permanent. No re-submission allowed."

#### 6. Contact Module (4 screens)
- **Contact list** — table view. Columns: First Name, Last Name, Email, Company, Segment, Status (badge), Assigned SDR, Created At. Filter bar: Company, Segment, Status, SDR, Date range, Active/Duplicate toggles. Search. Infinite scroll. CSV Export.
- **Create contact form** — All fields from Contact entity: First Name*, Last Name*, Mobile Phone, Job Title, Company* (dropdown of approved companies), Email*, Direct Phone, Email 2, Email Active Status, Lead Source, Management Level, Address fields, Timezone, LinkedIn URL, LinkedIn Summary, Data Requester Details.
- **Contact detail — summary popup** — quick popup with: Name, Email, Company, Status, SDR. "View Full Details" button.
- **Contact detail — side panel** — Full fields (basic editable), Status pipeline visualization (Uploaded → Approved → Assigned to SDR → Meeting Scheduled — show current step highlighted), Company info section, Activity timeline, Actions: Approve, Assign to SDR (dropdown), Schedule Meeting.

#### 7. CSV Upload Module (3 screens)
- **CSV upload page** — Two tabs: "Company CSV" and "Contact CSV". Each tab has: drag-and-drop file zone (accept .csv only, max 10MB), Upload button, file requirements info (column list, format rules). Show validation progress indicator during processing.
- **Upload result screen** — After upload: Batch ID, File name, Total rows, Valid rows (green), Invalid rows (red), Status. If errors: "Download Error Report" button + "View Errors" link.
- **Error correction view** — Table of failed rows: Row #, Column, Value, Error Message, Corrected (checkbox). "Re-upload Corrected CSV" button. Filterable by error type.

#### 8. Approval Queue (2 screens)
- **Company approval queue** — Two tabs: "Pending Companies" and "Uploaded Contacts". Company tab: table of companies with status=Pending. Columns: Company Name, Segment, Researcher, Upload Date. Individual row actions: "Approve" (green button), "Reject" (red button, opens rejection modal). No bulk approve for companies. Filters: Segment, Researcher, Date range.
- **Contact approval queue** — Contact tab: table of contacts with status=Uploaded. Columns: Name, Email, Company, Segment, Researcher, Upload Date. Checkbox selection for bulk. "Approve Selected" bulk button (green). No reject for contacts. Filters: Segment, Company, Researcher, Date range.

#### 9. Researcher Workbench (2 screens)
- **Workbench dashboard** — "My Segments" section: cards/list of segments assigned to this researcher. Each card shows: Segment Name, Offerings tags, # of approved companies, # of contacts. Click to drill into segment. "My Uploads" section below: recent uploads with status summary (Pending: X, Approved: Y, Rejected: Z).
- **Segment drill-down** — Shows approved companies in this segment. Table: Company Name, Status, # Contacts. Actions per company: "Add Contact" (opens form), "Upload Contact CSV". Below or tab: contacts uploaded by this researcher for this segment, with status filters.

#### 10. Marketing Collateral (2 screens)
- **Collateral list** — table: Title, URL (clickable link), Scope (Segment/Offering/Lead), Linked To, Created By, Created At. Search, filter by scope type. Add Collateral button.
- **Add/Edit collateral form** — Title, URL (SharePoint/share drive link), Scope Type dropdown (Segment, Offering, Lead), Scope reference (dropdown based on type). Save/Cancel.

#### 11. Shared Components (show in context across screens above)
- **Filter bar** — consistent across all list views. Dropdowns, date pickers, search input, toggle switches for "Show duplicates" and "Show deactivated" (off by default).
- **Status badges** — consistent color-coding: Pending (amber), Approved (green), Rejected (red), Uploaded (blue), Assigned to SDR (indigo), Meeting Scheduled (purple), Active (green), Archived (gray), Duplicate (orange outline).
- **Detail side panel** — consistent Jira-style pattern: slides in from right, ~40-50% width, scrollable, sections for Fields/Status/Timeline/Actions.
- **Summary popup** — consistent quick-view pattern on row click before full panel.
- **Activity timeline** — vertical timeline component showing audit events: who, what action, when, details. Used in every detail panel.
- **Infinite scroll** — loading indicator at bottom of all list views.
- **Empty states** — show helpful empty states for lists with no data ("No companies yet. Upload your first CSV or add one manually.").
- **Toast notifications** — success/error toasts for actions (approve, reject, upload, create).

---

### User Flows to Show (interactive prototype if possible)

1. **Login → Dashboard → Segments → Create Segment → Assign Researcher**
2. **Researcher Workbench → Upload Company CSV → View Result → Fix Errors**
3. **Approval Queue → Review Company → Approve (or Reject with reason)**
4. **Researcher Workbench → Select Approved Company → Upload Contact CSV**
5. **Approval Queue → Bulk Approve Contacts → Assign to SDR**
6. **Company List → Click Row → Summary Popup → Open Side Panel → View Timeline**

---

### Key UX Requirements

- All list views share the same UX pattern: search bar + filter bar + table + infinite scroll + CSV export
- Detail views follow: row click → summary popup → "View Details" → side panel with full info + edit + actions + timeline
- Role determines which action buttons are visible (not which data is visible — everyone sees the same lists)
- No in-app notifications in this version — users manually check queues
- Duplicates and deactivated records are hidden by default in all lists (toggle to show)
- Company approval is individual only (no bulk). Contact approval allows bulk.
- Rejection requires a mandatory reason and is permanent (no re-submission)

---

### Data for Mockups (use realistic sample data)

**Segments:** "Enterprise Fintech APAC", "Mid-Market Healthcare US", "Startup SaaS Europe"
**Offerings:** "Cloud Migration", "Data Analytics Platform", "Managed Security", "DevOps Consulting"
**Companies:** "Acme Corp", "GlobalTech Solutions", "NovaPay Financial", "MediCare Systems", "CloudFirst Inc"
**Contacts:** "John Smith (CTO, Acme Corp)", "Sarah Johnson (VP Sales, GlobalTech)", "Mike Chen (Director, NovaPay)"
**Users:** "Admin User", "Prashant Agarwal (Segment Owner)", "Jane Researcher", "Bob Approver", "Alice SDR", "Maria Marketing"

Generate all screens with this sample data populated so the mockups feel realistic and complete.
