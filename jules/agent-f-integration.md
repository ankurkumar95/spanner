# Jules Agent F — Frontend Shell + Integration

> **Run this LAST**, after Agents A–E are all merged to main.
> **Branch name:** `feature/integration`
> **Base branch:** `main` (with Agents 0, A, B, C, D, E all merged)

---

## Context

All backend APIs, frontend pages, and components have been built by Agents A–E. This agent wires everything together: the app shell (sidebar, header, routing), the approval queue page (combining company + contact tabs), and fixes any integration issues from merging 5 parallel branches.

---

## Stitch Design References

Reference these UI mockup files when building the app shell and integration components. Match the visual style, layout, colors, and component structure:

| Screen | Design File | Screenshot |
|--------|------------|------------|
| App Shell (Sidebar + Layout) | `designs/html/15-app-shell.html` | `designs/screenshots/15-app-shell.png` |
| Approval Queue | `designs/html/19-approval-queue.html` | `designs/screenshots/19-approval-queue.png` |
| Notification Center Panel | `designs/html/10-notification-center-panel.html` | `designs/screenshots/10-notification-center-panel.png` |
| Global Command Search | `designs/html/11-global-command-search.html` | `designs/screenshots/11-global-command-search.png` |

Open the HTML files in a browser to see the exact design. The **App Shell** design is critical — it defines the sidebar navigation, header, and overall layout that wraps all pages. Match it precisely.

---

## Tasks

### 1. Frontend App Shell — `src/components/layout/AppShell.tsx`

Create the main layout wrapper used by all authenticated pages:
- **Left sidebar** — navigation links, Spanner logo at top
- **Top header** — "Spanner" app name, current user name, role badge(s), Logout button
- **Main content area** — renders the current page

**Sidebar navigation items per role:**

| Role | Sidebar Items |
|------|--------------|
| Admin | Dashboard, User Management, Segments, Companies, Contacts, Approval Queue |
| Segment Owner | Segments, Companies, Contacts |
| Researcher | Workbench, Segments, Companies, Contacts, Upload CSV |
| Approver | Workbench, Segments, Companies, Contacts, Approval Queue, Upload CSV |
| SDR | Segments, Companies, Contacts, Approval Queue |
| Marketing | Segments, Marketing Collateral |

- Read user roles from AuthContext
- Highlight active sidebar item
- Sidebar should be collapsible on smaller screens
- Style: clean, minimal, linear.app aesthetic

### `src/components/layout/Sidebar.tsx`
### `src/components/layout/Header.tsx`

### 2. Approval Queue Page — `src/pages/approval/ApprovalQueue.tsx`

Combine the CompanyApprovalTab (from Agent B) and ContactApprovalTab (from Agent C) into one page with two tabs:
- Tab 1: "Pending Companies" → renders CompanyApprovalTab
- Tab 2: "Uploaded Contacts" → renders ContactApprovalTab
- Show badge with count on each tab

### 3. Dashboard Page — `src/pages/Dashboard.tsx`

Simple landing page after login:
- Welcome message with user name
- Quick stats cards: Total Segments, Total Companies (by status), Total Contacts (by status)
- Quick links to common actions based on role

### 4. Wire All Routes — Update `src/App.tsx`

Consolidate ALL routes from all agents into one complete router:

```tsx
// Public routes (no auth)
/login → Login
/forgot-password → ForgotPassword
/reset-password → ResetPassword

// Protected routes (wrapped in AppShell)
/ → Dashboard
/users → UserManagement (Admin)
/users/new → UserForm (Admin)
/users/:id/edit → UserForm (Admin)
/segments → SegmentList
/segments/new → SegmentForm
/segments/:id/edit → SegmentForm
/companies → CompanyList
/companies/new → CompanyForm
/contacts → ContactList
/contacts/new → ContactForm
/uploads → CSVUpload
/uploads/batches/:id → UploadResult
/uploads/batches/:id/errors → ErrorCorrection
/approval-queue → ApprovalQueue
/workbench → ResearcherWorkbench
/workbench/segments/:id → SegmentDrilldown
/collaterals → CollateralList
/collaterals/new → CollateralForm
/collaterals/:id/edit → CollateralForm
```

All protected routes should:
- Be wrapped in `<ProtectedRoute>` (redirect to /login if not authenticated)
- Be wrapped in `<AppShell>` (sidebar + header)
- Redirect to / after login

### 5. Register All Backend Routers — Verify `app/main.py`

Ensure ALL routers from all agents are registered:
```python
from app.routers import (
    auth, health, segments, assignments, companies,
    contacts, uploads, users, collaterals, workbench,
    exports, audit_logs, approval_queue
)

app.include_router(auth.router, prefix="/api")
app.include_router(health.router, prefix="/api")
app.include_router(segments.router, prefix="/api")
app.include_router(assignments.router, prefix="/api")
app.include_router(companies.router, prefix="/api")
app.include_router(contacts.router, prefix="/api")
app.include_router(uploads.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(collaterals.router, prefix="/api")
app.include_router(workbench.router, prefix="/api")
app.include_router(exports.router, prefix="/api")
app.include_router(audit_logs.router, prefix="/api")
app.include_router(approval_queue.router, prefix="/api")
```

### 6. Shared Components — Ensure Consistency

Verify these shared components exist and are used consistently across all pages:

- **ListView** — reusable table with infinite scroll, used by all list pages
- **FilterBar** — consistent filter component with "Show duplicates" and "Show deactivated" toggles (default off)
- **DetailPanel** — Jira-style side panel, used by Segments, Companies, Contacts
- **SummaryPopup** — quick overlay, used by Companies and Contacts
- **ActivityTimeline** — vertical timeline, used in every DetailPanel
- **StatusBadge** — consistent colors:
  - Pending = amber
  - Approved = green
  - Rejected = red
  - Uploaded = blue
  - Assigned to SDR = indigo
  - Meeting Scheduled = purple
  - Active = green
  - Archived = gray
  - Duplicate = orange outline
- **CSVUploader** — drag-and-drop file component
- **AssignmentModal** — user selector filtered by role
- **Toast notifications** — success/error toasts for all actions

If any shared component is missing or inconsistent, create/fix it.

### 7. Seed More Sample Data

Add to the seed script (or create a data seeding endpoint/script):

**Segments:** "Enterprise Fintech APAC", "Mid-Market Healthcare US", "Startup SaaS Europe"
**Offerings:** "Cloud Migration", "Data Analytics Platform", "Managed Security", "DevOps Consulting"
**Companies:** 5+ companies across segments (mix of Pending, Approved, Rejected)
**Contacts:** 8-10 contacts across approved companies (mix of Uploaded, Approved, Assigned, Meeting Scheduled)
**Assignments:** Researchers assigned to segments, SDRs assigned to segments

### 8. Fix Merge Conflicts / Integration Issues

After merging all branches, there WILL be conflicts in:
- `app/main.py` (router registrations)
- `src/App.tsx` (route definitions)
- `package.json` / `requirements.txt` (if agents added different dependencies)

Resolve all conflicts. Make sure the app builds and runs.

---

## Verification (End-to-End)

Test the complete flow:
1. **Login** as admin → see Dashboard with Admin sidebar
2. **Create users** → verify each role gets correct sidebar
3. **Login as Segment Owner** → create segment with offerings → assign researcher
4. **Login as Researcher** → see workbench with assigned segment → create company → upload company CSV → see results
5. **Login as Approver** → see Approval Queue → approve company (individual) → reject another (with reason)
6. **Login as Researcher** → workbench shows approved companies → upload contact CSV
7. **Login as Approver** → Approval Queue contacts tab → bulk approve → assign to SDR
8. **Login as SDR** → see assigned contacts → schedule meeting
9. **Login as Marketing** → add collateral link
10. **All list views** have working filters, search, infinite scroll, CSV export
11. **Detail panels** show fields + activity timeline for every entity
12. **Status badges** use correct colors everywhere
