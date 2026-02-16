# Jules Agent E — Users + Marketing + Workbench + Exports

> **Run in PARALLEL** with Agents A, B, C, D (after Agent 0 is merged to main).  
> **Branch name:** `feature/users-marketing-workbench`  
> **Base branch:** `main` (with Agent 0 merged)

---

## Context

The project skeleton, all 15 database tables, auth, RBAC, and audit service exist. You are adding: User Management (admin), Marketing Collateral, Researcher Workbench, CSV Export endpoints, and Audit Log endpoints.

**DO NOT** modify: database models, migrations, auth middleware, Docker files. Only ADD new files.

---

## Stitch Design References

Reference these UI mockup files when building frontend components. Match the visual style, layout, colors, and component structure:

| Screen | Design File | Screenshot |
|--------|------------|------------|
| User Management | `designs/html/12-user-management.html` | `designs/screenshots/12-user-management.png` |
| Create/Invite User Modal | `designs/html/08-create-invite-user-modal.html` | `designs/screenshots/08-create-invite-user-modal.png` |
| User Profile & Settings | `designs/html/09-user-profile-settings.html` | `designs/screenshots/09-user-profile-settings.png` |
| Researcher Workbench | `designs/html/20-researcher-workbench.html` | `designs/screenshots/20-researcher-workbench.png` |

Open the HTML files in a browser to see the exact design. Replicate the visual style for UserManagement.tsx, UserForm.tsx, ResearcherWorkbench.tsx, SegmentDrilldown.tsx, and CollateralList.tsx.

---

## Backend — Files to Create

### `app/schemas/user.py`
- UserCreate: email(str required), name(str required), password(str required), role_ids(list[int] required)
- UserUpdate: name(str), role_ids(list[int]) — all optional
- UserResponse: id, email, name, is_active, roles(list[RoleBrief]), created_at, updated_at
- UserBrief: id, name, email
- RoleBrief: id, name

### `app/schemas/collateral.py`
- CollateralCreate: title(str required), url(str required), scope_type(str required, one of: segment/offering/lead), scope_id(UUID required)
- CollateralUpdate: title, url, scope_type, scope_id — all optional
- CollateralResponse: id, title, url, scope_type, scope_id, created_by, created_at, updated_at

### `app/schemas/audit.py`
- AuditLogResponse: id, actor(UserBrief), action, entity_type, entity_id, details, created_at

### `app/services/user_service.py`
- **create_user:** Hash password, create user, assign roles. Audit log. Only admin can do this.
- **update_user:** Update name, reassign roles. Audit log.
- **deactivate_user:** Set is_active=false. Audit log.
- **activate_user:** Set is_active=true. Audit log.
- **list_users:** Filter by role, status (active/inactive), search (name, email). Cursor pagination.

### `app/services/collateral_service.py`
- CRUD for marketing collaterals. Validate URL format. Audit log.

### `app/services/export_service.py`
- **export_companies(filters):** Query companies with same filters as list, output as CSV stream.
- **export_contacts(filters):** Same for contacts.
- Response: Content-Type: text/csv, Content-Disposition: attachment.

### `app/routers/users.py`
```
GET    /api/users                 — list (users:manage)
POST   /api/users                 — create (users:manage)
GET    /api/users/:id             — detail (users:manage)
PATCH  /api/users/:id             — update (users:manage)
POST   /api/users/:id/deactivate  — deactivate (users:manage)
POST   /api/users/:id/activate    — activate (users:manage)
```

### `app/routers/collaterals.py`
```
GET    /api/collaterals            — list (collaterals:manage)
POST   /api/collaterals            — create (collaterals:manage)
GET    /api/collaterals/:id        — detail (collaterals:manage)
PATCH  /api/collaterals/:id        — update (collaterals:manage)
DELETE /api/collaterals/:id        — delete (collaterals:manage)
```

### `app/routers/workbench.py`
```
GET    /api/workbench/segments                  — segments assigned to current user (authenticated)
GET    /api/workbench/segments/:id/companies    — approved companies in assigned segment (authenticated)
GET    /api/workbench/my-uploads                — uploads by current user (uploads:read). Filter: entity_type, status.
```

### `app/routers/exports.py`
```
GET    /api/exports/companies     — CSV download (exports:companies). Same filters as company list.
GET    /api/exports/contacts      — CSV download (exports:contacts). Same filters as contact list.
```

### `app/routers/audit_logs.py`
```
GET    /api/audit-logs                      — global list (audit:read_global, admin only). Pagination.
GET    /api/audit-logs/entity/:type/:id     — activity timeline for one record (any authenticated user)
```

### Register in `app/main.py`
```python
from app.routers import users, collaterals, workbench, exports, audit_logs
app.include_router(users.router, prefix="/api")
app.include_router(collaterals.router, prefix="/api")
app.include_router(workbench.router, prefix="/api")
app.include_router(exports.router, prefix="/api")
app.include_router(audit_logs.router, prefix="/api")
```

---

## Frontend — Files to Create

### `src/pages/users/UserManagement.tsx`
- Table: Name, Email, Role(s) (as badges), Status (Active/Inactive badge), Created At
- Search bar, filter by role dropdown, filter by status
- "Create User" button
- Click row → edit inline or open form

### `src/pages/users/UserForm.tsx`
- Fields: Name*, Email*, Password* (create only), Roles* (multi-select dropdown)
- Edit mode: pre-filled, no password field, Deactivate button
- On submit: POST (create) or PATCH (update)

### `src/pages/collaterals/CollateralList.tsx`
- Table: Title, URL (clickable link), Scope (badge: Segment/Offering/Lead), Linked To, Created By, Created At
- Search, filter by scope type
- "Add Collateral" button

### `src/pages/collaterals/CollateralForm.tsx`
- Fields: Title*, URL*, Scope Type* (dropdown: Segment/Offering/Lead), Scope Reference* (dynamic dropdown based on scope type — segments list, offerings list, or contact/company list)
- Save / Cancel

### `src/pages/workbench/ResearcherWorkbench.tsx`
- **My Segments** section: cards showing Segment Name, Offerings (tags), # approved companies, # contacts
- Click card → drill down
- **My Uploads** section: recent upload batches with status summary (Pending: X, Approved: Y, Rejected: Z)

### `src/pages/workbench/SegmentDrilldown.tsx`
- Segment name header
- Table of approved companies in this segment: Company Name, Status, # Contacts
- Per-company actions: "Add Contact" (link to contact form with company pre-selected), "Upload Contact CSV" (link to upload page)
- Below: contacts uploaded by this researcher for this segment, filterable by status

### `src/api/users.ts`
API functions: listUsers, createUser, getUser, updateUser, deactivateUser, activateUser

### `src/api/collaterals.ts`
API functions: listCollaterals, createCollateral, getCollateral, updateCollateral, deleteCollateral

### `src/api/workbench.ts`
API functions: getMySegments, getSegmentCompanies, getMyUploads

### `src/api/exports.ts`
API functions: exportCompaniesCSV, exportContactsCSV (trigger file download)

### `src/api/auditLogs.ts`
API functions: getAuditLogs, getEntityTimeline

### Add routes to `src/App.tsx`
```
/users → UserManagement
/users/new → UserForm
/users/:id/edit → UserForm
/collaterals → CollateralList
/collaterals/new → CollateralForm
/collaterals/:id/edit → CollateralForm
/workbench → ResearcherWorkbench
/workbench/segments/:id → SegmentDrilldown
```

---

## Business Rules
1. **User creation is admin-only.** No public registration.
2. **Deactivate is soft.** Set is_active=false. User cannot login but audit trail preserved.
3. **One user can have multiple roles.**
4. **Marketing collateral: links only.** No file upload. Just URLs (SharePoint, share drive).
5. **Workbench shows only assigned segments** for the current user (via assignments table).
6. **My Uploads shows only current user's uploads** (created_by filter).
7. **CSV export** respects the same filters as list views.
8. **Activity timeline** returns audit_logs for a specific entity, ordered by created_at desc.
9. **Audit everything:** user create/update/deactivate, collateral CRUD, export actions.

---

## Verification
1. Admin can create, list, edit, deactivate users
2. Non-admin gets 403 on user endpoints
3. Marketing user can CRUD collaterals
4. Researcher sees only their assigned segments in workbench
5. My Uploads shows only own uploads
6. CSV export downloads a file
7. Activity timeline returns correct audit entries for a record
