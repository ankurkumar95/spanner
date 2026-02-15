# Jules Agent A — Segments + Assignments + Offerings

> **Run in PARALLEL** with Agents B, C, D, E (after Agent 0 is merged to main).  
> **Branch name:** `feature/segments-assignments`  
> **Base branch:** `main` (with Agent 0 merged)

---

## Context

The project skeleton, all 15 database tables, auth middleware, RBAC decorator, and audit service already exist on main. You are adding the Segments module, Offerings management, and Assignment module — backend API + frontend pages.

**DO NOT** modify: database models, migrations, auth middleware, main.py router registration (add your router includes at the end), Docker files. Only ADD new files in routers/, services/, schemas/, pages/, components/.

---

## Stitch Design References

Reference these UI mockup files when building frontend components. Match the visual style, layout, colors, and component structure:

| Screen | Design File | Screenshot |
|--------|------------|------------|
| Segments Overview (List) | `designs/html/14-segments-overview.html` | `designs/screenshots/14-segments-overview.png` |
| Create New Segment Form | `designs/html/04-create-segment-form.html` | `designs/screenshots/04-create-segment-form.png` |

Open the HTML files in a browser to see the exact design. Replicate the visual style for SegmentList.tsx, SegmentForm.tsx, and SegmentDetailPanel.tsx.

---

## Backend — Files to Create

### `app/schemas/segment.py`
Pydantic schemas for:
- SegmentCreate: name(str, required), description(str, optional), offering_ids(list[UUID], optional), new_offerings(list[OfferingCreate], optional)
- SegmentUpdate: name, description, offering_ids, new_offerings (all optional)
- SegmentResponse: id, name, description, status, offerings(list[OfferingResponse]), created_by, created_at, updated_at
- OfferingCreate: name(str), description(str, optional)
- OfferingResponse: id, name, description, status

### `app/schemas/assignment.py`
- AssignmentCreate: entity_type(str), entity_id(UUID), assigned_to(UUID)
- AssignmentResponse: id, entity_type, entity_id, assigned_to(UserBrief), assigned_by(UserBrief), is_active, created_at

### `app/services/segment_service.py`
Business logic:
- **create_segment:** Create segment + handle offerings (link existing by ID, create new if name doesn't exist). Validate name unique. Audit log.
- **update_segment:** Update fields + re-link offerings. Audit log.
- **archive_segment:** Set status=archived. Audit log. Do NOT delete related companies/contacts.
- **activate_segment:** Set status=active. Audit log.
- **list_segments:** Filter by status (default: active), search by name, cursor pagination.
- **get_segment:** With offerings, assigned users count.

### `app/services/assignment_service.py`
- **create_assignment:** Validate entity exists, assignee has correct role (researcher/approver for segments/companies, SDR for contacts). Check unique constraint. Audit log.
- **list_assignments:** Filter by entity_type, entity_id, assigned_to.
- **delete_assignment:** Set is_active=false. Audit log.

### `app/routers/segments.py`
```
GET    /api/segments                — list (all authenticated users, segments:read)
POST   /api/segments                — create (segments:create)
GET    /api/segments/:id            — detail (segments:read)
PATCH  /api/segments/:id            — update (segments:create)
POST   /api/segments/:id/archive    — archive (segments:archive)
POST   /api/segments/:id/activate   — activate (segments:archive)
```

### `app/routers/assignments.py`
```
POST   /api/assignments             — create (assignments:create)
GET    /api/assignments             — list (authenticated)
DELETE /api/assignments/:id         — remove (assignments:create)
```

### Register routers in `app/main.py`
Add at the end of the router includes:
```python
from app.routers import segments, assignments
app.include_router(segments.router, prefix="/api")
app.include_router(assignments.router, prefix="/api")
```

---

## Frontend — Files to Create

### `src/pages/segments/SegmentList.tsx`
- Table view: Segment Name, Offerings (as tag chips), Status (badge), Created By, Created At
- Filter by status: Active (default) / Archived (toggle)
- Search bar
- "Create Segment" button (visible only if user has segments:create permission)
- Click row → open SegmentDetailPanel

### `src/pages/segments/SegmentForm.tsx`
- Form: Segment Name (required), Description (textarea), Offerings (auto-complete tag input — search existing, type to add new)
- Used for both Create and Edit
- On submit: POST or PATCH /api/segments

### `src/components/SegmentDetailPanel.tsx`
- Jira-style side panel (slides from right, ~45% width)
- Sections:
  - **Fields:** Name, Description (editable inline), Status badge
  - **Offerings:** Tag chips
  - **Assigned Researchers:** List with names
  - **Assigned SDRs:** List with names
  - **Actions:** Edit, Archive/Activate, Assign Researcher (opens modal), Assign SDR (opens modal)
  - **Activity Timeline:** Audit log entries for this segment
- Call `GET /api/audit-logs/entity/segment/:id` for timeline

### `src/components/AssignmentModal.tsx`
- Modal with: user multi-select dropdown
- Filtered by role parameter (researcher or sdr)
- On submit: POST /api/assignments for each selected user
- Reusable — will be used by Company and Contact modules too

### `src/api/segments.ts`
API client functions: listSegments, createSegment, getSegment, updateSegment, archiveSegment, activateSegment

### `src/api/assignments.ts`
API client functions: createAssignment, listAssignments, deleteAssignment

### Add routes to `src/App.tsx`
```
/segments → SegmentList
/segments/new → SegmentForm
/segments/:id/edit → SegmentForm
```

---

## Business Rules
1. Segment name must be unique (409 Conflict if duplicate)
2. Offerings are shared globally — if an offering with the same name exists, link it instead of creating duplicate
3. Archiving hides from default list but does NOT delete companies/contacts under it
4. Offerings are managed ONLY through segment create/edit — no standalone offerings endpoint
5. Assignment: one entity → multiple users allowed. Same user cannot be assigned twice (unique constraint).
6. Audit log every create, update, archive, activate, assign, unassign action

---

## Verification
1. Can list segments (returns seeded data if any)
2. Can create a segment with new + existing offerings
3. Can archive and re-activate
4. Can assign a researcher to a segment
5. Side panel shows fields + timeline
6. RBAC: researcher cannot create segments (403), segment owner can
