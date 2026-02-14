# Google Stitch — Validation & Gap-Fix Prompt

> Paste this prompt into Stitch AFTER it has generated the initial screens.  
> Attach the same docs folder + requirements.md again for reference.

---

## Prompt

You previously generated screens for the **Spanner** application. I need you to **audit your output against the attached requirements** and fix every gap. Many screens appear to be missing or incomplete.

Below is the **complete checklist of every screen and component** that must exist. Go through each item one by one. For each item, answer: does it exist in your output? If NO, generate it now. If YES but incomplete, fix it.

---

### AUDIT CHECKLIST — 31 Screens + 7 Shared Components

Check off and generate anything missing:

#### Module 1: Authentication (3 screens required)

- [ ] **1.1 Login page** — centered form with email, password, "Forgot password" link, Spanner logo
- [ ] **1.2 Forgot password page** — email input, submit, back to login
- [ ] **1.3 Reset password page** — new password, confirm password, submit

#### Module 2: App Shell (1 screen required, 6 sidebar variations)

- [ ] **2.1 App shell layout** — left sidebar + top header + main content area
- [ ] **2.2 Sidebar — Admin variant** — Dashboard, User Management, Segments, Companies, Contacts, Approval Queue
- [ ] **2.3 Sidebar — Segment Owner variant** — Segments, Companies (read), Contacts (read)
- [ ] **2.4 Sidebar — Researcher variant** — Researcher Workbench, Segments, Companies, Contacts, CSV Upload
- [ ] **2.5 Sidebar — Approver variant** — Researcher Workbench, Segments, Companies, Contacts, Approval Queue, CSV Upload
- [ ] **2.6 Sidebar — SDR variant** — Segments, Companies (read), Contacts, Approval Queue
- [ ] **2.7 Sidebar — Marketing variant** — Segments, Marketing Collateral

#### Module 3: User Management (3 screens required — Admin only)

- [ ] **3.1 User list page** — table: Name, Email, Role(s), Status (Active/Inactive), Created At. Has search bar, role filter, status filter, "Create User" button
- [ ] **3.2 Create user form** — fields: Name, Email, Password, Role(s) multi-select
- [ ] **3.3 Edit user form** — same as create but pre-filled, plus Deactivate button

#### Module 4: Segments (4 screens required)

- [ ] **4.1 Segment list page** — table/cards: Segment Name, Offerings (tags), Status (Active/Archived), Created By, Created At. Filter by status (Active default), search, sort. All users see this.
- [ ] **4.2 Create/Edit segment form** — fields: Segment Name, Description (textarea), Offerings (auto-complete tag input with add-new). Segment Owner only.
- [ ] **4.3 Segment detail side panel** — Jira-style slide-in from right. Shows: all fields, offerings tags, status, created by/at, assigned researchers list, assigned SDRs list, activity timeline. Actions: Edit, Archive/Activate, Assign Researcher, Assign SDR.
- [ ] **4.4 Segment assignment modal** — user multi-select dropdown filtered by role (Researcher or SDR)

#### Module 5: Companies (5 screens required)

- [ ] **5.1 Company list page** — table: Company Name, Segment, Status (color badge), Industry, Created By, Created At. Filter bar: segment, status, researcher, date range, active/duplicate toggles. Search. Infinite scroll. CSV Export button.
- [ ] **5.2 Create company form** — all 16 fields: Company Name*, Website, Phone, Description, LinkedIn URL, Industry, Sub-Industry, Street, City, State, Country, ZIP, Founded Year, Revenue Range, Employee Size Range, Segment* (dropdown)
- [ ] **5.3 Company summary popup** — click-on-row overlay: Company Name, Website, Status badge, Segment, Industry, Created By. "View Full Details" button.
- [ ] **5.4 Company detail side panel** — Jira-style: all fields (inline editable), status with change history, rejection reason (if rejected), related contacts list, activity timeline, action buttons (Approve, Reject, Assign to Researcher)
- [ ] **5.5 Company rejection modal** — textarea for mandatory reason, warning "permanent, no re-submission", Confirm/Cancel buttons

#### Module 6: Contacts (4 screens required)

- [ ] **6.1 Contact list page** — table: First Name, Last Name, Email, Company, Segment, Status (badge), Assigned SDR, Created At. Filter bar: company, segment, status, SDR, date range, active/duplicate toggles. Search. Infinite scroll. CSV Export.
- [ ] **6.2 Create contact form** — all 20 fields: First Name*, Last Name*, Mobile Phone, Job Title, Company* (dropdown — approved only), Email*, Direct Phone, Email 2, Email Active Status, Lead Source, Management Level, Street, City, State, Country, ZIP, Timezone, LinkedIn URL, LinkedIn Summary, Data Requester Details
- [ ] **6.3 Contact summary popup** — click-on-row overlay: Name, Email, Company, Segment, Status badge, Assigned SDR. "View Full Details" button.
- [ ] **6.4 Contact detail side panel** — Jira-style: all fields (inline editable), **status pipeline visualization** (horizontal stepper: Uploaded → Approved → Assigned to SDR → Meeting Scheduled, current step highlighted), company info section, activity timeline, actions: Approve, Assign to SDR (dropdown), Schedule Meeting

#### Module 7: CSV Upload (3 screens required)

- [ ] **7.1 CSV upload page** — two tabs: "Company CSV" / "Contact CSV". Each tab: drag-and-drop file zone (.csv only, max 10MB), upload button, column requirements listed, validation progress indicator
- [ ] **7.2 Upload result screen** — batch summary: Batch ID, file name, total/valid/invalid row counts (color-coded), status, "Download Error Report" button, "View Errors" link
- [ ] **7.3 Error correction view** — table: Row #, Column, Value, Error Message, Corrected checkbox. "Re-upload Corrected CSV" button. Filter by error type.

#### Module 8: Approval Queue (2 screens required)

- [ ] **8.1 Company approval queue** — tab "Pending Companies": table (Company Name, Segment, Researcher, Upload Date). Per-row: Approve button (green), Reject button (red, opens modal). **NO bulk approve for companies.** Filters: segment, researcher, date range.
- [ ] **8.2 Contact approval queue** — tab "Uploaded Contacts": table (Name, Email, Company, Segment, Researcher, Upload Date). **Checkbox selection + "Approve Selected" bulk button.** No reject. Filters: segment, company, researcher, date range.

#### Module 9: Researcher Workbench (2 screens required)

- [ ] **9.1 Workbench dashboard** — "My Segments" section: cards (Segment Name, Offerings tags, # approved companies, # contacts). "My Uploads" section: recent uploads with status counts (Pending X, Approved Y, Rejected Z).
- [ ] **9.2 Segment drill-down** — table of approved companies in this segment (Company Name, Status, # Contacts). Per-company actions: "Add Contact" (form), "Upload Contact CSV". Below: contacts uploaded by researcher for this segment, filterable by status.

#### Module 10: Marketing Collateral (2 screens required)

- [ ] **10.1 Collateral list page** — table: Title, URL (clickable), Scope (Segment/Offering/Lead), Linked To, Created By, Created At. Search, scope filter, "Add Collateral" button.
- [ ] **10.2 Add/Edit collateral form** — Title, URL, Scope Type dropdown, Scope reference dropdown (dynamic based on type). Save/Cancel.

#### Shared Components (7 — must appear consistently across all screens above)

- [ ] **SC-1 Filter bar** — consistent on ALL list views (5.1, 6.1, 3.1, 4.1, 8.1, 8.2, 10.1). Includes: dropdowns, date pickers, search input, "Show duplicates" toggle (off by default), "Show deactivated" toggle (off by default).
- [ ] **SC-2 Status badges** — color-coded pills on ALL screens showing status. Colors: Pending=amber, Approved=green, Rejected=red, Uploaded=blue, Assigned to SDR=indigo, Meeting Scheduled=purple, Active=green, Archived=gray, Duplicate=orange outline.
- [ ] **SC-3 Detail side panel** — Jira-style, used for Segments (4.3), Companies (5.4), Contacts (6.4). Slides from right, ~40-50% width, scrollable, sections: Fields, Status, Timeline, Actions.
- [ ] **SC-4 Summary popup** — used for Companies (5.3), Contacts (6.3). Quick overlay on row click, before opening full side panel.
- [ ] **SC-5 Activity timeline** — vertical timeline in EVERY detail panel (4.3, 5.4, 6.4). Shows: actor name, action, timestamp, details.
- [ ] **SC-6 Empty states** — shown in list views when no data. Helpful text + action button (e.g., "No companies yet. Upload your first CSV or add one manually.").
- [ ] **SC-7 Toast notifications** — success/error toasts after actions (approve, reject, upload complete, create, assign).

---

### VALIDATION RULES — Check these across your output

1. **Field completeness:** Company form must have exactly 16 fields. Contact form must have exactly 20 fields. If any are missing, add them.
2. **Status colors:** Every status badge must use the correct color from SC-2 above.
3. **Filter bar consistency:** Every list page (company, contact, segment, user, approval queue, collateral) must have a filter bar with relevant filters.
4. **Side panel pattern:** Company, Contact, and Segment detail views MUST use the Jira-style side panel (not a separate page).
5. **Summary popup:** Company and Contact lists MUST show a summary popup on row click BEFORE the side panel.
6. **Contact status pipeline:** Contact detail panel (6.4) MUST show a horizontal stepper/pipeline visualization (Uploaded → Approved → Assigned to SDR → Meeting Scheduled).
7. **Company rejection:** Must have a separate modal (5.5) with mandatory reason textarea and permanent warning.
8. **Bulk vs individual approval:** Company approval = individual only (no checkboxes). Contact approval = bulk (checkboxes + "Approve Selected").
9. **CSV upload tabs:** Upload page (7.1) must have two distinct tabs for Company CSV and Contact CSV.
10. **Researcher Workbench:** Must have two distinct views — dashboard (9.1) and segment drill-down (9.2).
11. **Infinite scroll:** All list views must show a loading indicator pattern (no pagination buttons).
12. **CSV Export button:** Must be visible on Company list (5.1) and Contact list (6.1).
13. **Sidebar navigation:** Must show correct menu items for each role. Show at least 2 role variants.
14. **Sample data:** All screens must be populated with realistic data, not placeholder "Lorem ipsum".

---

### OUTPUT FORMAT

For each checklist item:
1. State whether it EXISTS, is INCOMPLETE, or is MISSING
2. If INCOMPLETE or MISSING, generate/fix it now
3. After fixing everything, give me a final count: X/31 screens complete, Y/7 shared components complete

Generate all missing screens now.
