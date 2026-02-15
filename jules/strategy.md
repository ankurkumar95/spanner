# Spanner — Jules Parallel Agent Strategy

## Repository Structure

The repository is flattened at the root. Key directories:

| Directory | Purpose |
|-----------|---------|
| `docs/` | Requirements, technical design, API design, database schema, etc. |
| `prompts/` | General prompts, meeting notes, refinement drafts |
| `jules/` | Agent prompt files (`agent-0-foundation.md`, `agent-a-segments.md`, etc.) and this strategy |
| `designs/` | Stitch UI mockup designs (HTML files); see `designs/INDEX.md` |

## Execution Plan

```
                    ┌─────────────────┐
                    │   Agent 0       │
                    │   Foundation    │
                    │   (runs alone)  │
                    └────────┬────────┘
                             │ merge to main
          ┌──────────┬───────┼────────┬──────────┐
          ▼          ▼       ▼        ▼          ▼
   ┌────────────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────────┐
   │  Agent A   │ │Agent │ │Agent │ │Agent │ │ Agent E  │
   │  Segments  │ │  B   │ │  C   │ │  D   │ │ Users +  │
   │  Assign-   │ │Compa-│ │Conta-│ │ CSV  │ │Marketing │
   │  ments     │ │nies  │ │cts   │ │Engine│ │Workbench │
   │  Offerings │ │Appro-│ │Appro-│ │Dedup │ │ Exports  │
   └─────┬──────┘ │val   │ │val   │ │Upload│ └────┬─────┘
         │        └──┬───┘ └──┬───┘ └──┬───┘      │
         │           │        │        │           │
         └─────┬─────┴────┬───┴────┬───┘───────────┘
               │          │        │
               ▼  merge all to main
         ┌─────────────────┐
         │    Agent F      │
         │   Integration   │
         │   (runs alone)  │
         └─────────────────┘
```

## Agent Summary

| Agent | Branch | What it Builds | Runs When |
|-------|--------|---------------|-----------|
| **Agent 0** | `foundation` | Docker, DB (15 tables), Auth, RBAC, Audit, Seed data, Login page | **FIRST** (alone) |
| **Agent A** | `feature/segments-assignments` | Segments CRUD, Offerings, Assignments, Segment list/detail/form | **PARALLEL** (after Agent 0) |
| **Agent B** | `feature/companies` | Companies CRUD, Approve/Reject, Company list/detail/form, Company approval tab | **PARALLEL** (after Agent 0) |
| **Agent C** | `feature/contacts` | Contacts CRUD, Bulk approve, SDR assign, Contact list/detail/form, Contact approval tab | **PARALLEL** (after Agent 0) |
| **Agent D** | `feature/csv-engine` | CSV validation engine, Upload endpoints, Error correction, Dedup job, Upload UI | **PARALLEL** (after Agent 0) |
| **Agent E** | `feature/users-marketing-workbench` | User management, Collateral, Workbench, Exports, Audit log endpoints | **PARALLEL** (after Agent 0) |
| **Agent F** | `feature/integration` | App shell (sidebar/header), Route wiring, Approval Queue page, Dashboard, Merge fixes | **LAST** (after A-E merged) |

## Step-by-Step Execution

### Step 1: Run Agent 0 (Foundation)
1. Create a new repo for Spanner
2. Give Jules the `jules/agent-0-foundation.md` prompt
3. Wait for completion
4. **Verify:** `docker compose up` works, can login via API, all tables exist
5. Merge `foundation` branch to `main`

### Step 2: Run Agents A, B, C, D, E in Parallel
1. Launch 5 Jules agents simultaneously, each with their prompt from `jules/` (e.g. `agent-a-segments.md`, `agent-b-companies.md`, etc.)
2. Each agent works on its own branch based off `main`
3. Wait for all 5 to complete
4. **Verify each independently** (run on each branch):
   - Agent A: Can CRUD segments, assign users
   - Agent B: Can CRUD companies, approve/reject
   - Agent C: Can CRUD contacts, bulk approve, assign SDR
   - Agent D: Can upload CSV, see errors, dedup works
   - Agent E: Can manage users, add collateral, see workbench
5. Merge all 5 branches to `main` (resolve conflicts in main.py and App.tsx)

### Step 3: Run Agent F (Integration)
1. Give Jules the `jules/agent-f-integration.md` prompt on the merged `main`
2. This agent wires everything together and fixes merge issues
3. Wait for completion
4. **Verify end-to-end:** Full login → segment → company → approval → contact → SDR flow

## Why This Split Works

- **No model conflicts:** All 15 tables are created by Agent 0. Other agents only ADD routers/services/schemas/pages.
- **Minimal merge conflicts:** Each agent works in separate directories (routers/companies.py, services/company_service.py, pages/companies/). The only files touched by multiple agents are `main.py` (router registration) and `App.tsx` (routes) — both are trivially resolvable.
- **Each agent is self-contained:** Every prompt includes all the schemas, endpoints, business rules, and frontend specs needed. No agent needs to read another agent's code.
- **5 agents in parallel:** Maximum parallelism while keeping each agent focused enough to get details right.

## Files Changed per Agent (no overlap)

| File / Directory | 0 | A | B | C | D | E | F |
|-----------------|---|---|---|---|---|---|---|
| docker-compose.yml | x | | | | | | |
| alembic/ | x | | | | | | |
| models/ | x | | | | | | |
| middleware/ | x | | | | | | |
| utils/ | x | | | | | | |
| schemas/auth.py | x | | | | | | |
| schemas/segment.py, assignment.py | | x | | | | | |
| schemas/company.py | | | x | | | | |
| schemas/contact.py | | | | x | | | |
| schemas/upload.py | | | | | x | | |
| schemas/user.py, collateral.py, audit.py | | | | | | x | |
| routers/auth.py, health.py | x | | | | | | |
| routers/segments.py, assignments.py | | x | | | | | |
| routers/companies.py | | | x | | | | |
| routers/contacts.py | | | | x | | | |
| routers/uploads.py | | | | | x | | |
| routers/users.py, collaterals.py, workbench.py, exports.py, audit_logs.py | | | | | | x | |
| routers/approval_queue.py | | | x | x | | | M |
| services/ (per module) | x | x | x | x | x | x | |
| jobs/ | x | | | | x | | |
| pages/Login.tsx | x | | | | | | |
| pages/segments/ | | x | | | | | |
| pages/companies/ | | | x | | | | |
| pages/contacts/ | | | | x | | | |
| pages/uploads/ | | | | | x | | |
| pages/users/, collaterals/, workbench/ | | | | | | x | |
| pages/approval/, Dashboard.tsx | | | x | x | | | M |
| components/layout/ | | | | | | | x |
| components/Segment*.tsx | | x | | | | | |
| components/Company*.tsx | | | x | | | | |
| components/Contact*.tsx | | | | x | | | |
| components/AssignmentModal.tsx | | x | | | | | |
| app/main.py (router imports) | x | + | + | + | + | + | M |
| App.tsx (routes) | x | + | + | + | + | + | M |

x = creates, + = appends, M = merges/consolidates

## Stitch Design References

UI mockup designs generated by Google Stitch are stored in `designs/`. Each Jules agent should reference the corresponding design file when building frontend components.

| Agent | Design Files to Reference |
|-------|--------------------------|
| **Agent 0** | `designs/html/01-login-screen.html`, `designs/html/02-forgot-password.html`, `designs/html/03-reset-password.html` |
| **Agent A** | `designs/html/14-segments-overview.html`, `designs/html/04-create-segment-form.html` |
| **Agent B** | `designs/html/16-company-list.html`, `designs/html/05-add-company-form.html`, `designs/html/13-company-detail.html` |
| **Agent C** | `designs/html/17-contact-directory.html`, `designs/html/06-add-contact-form.html` |
| **Agent D** | `designs/html/18-csv-upload-company.html`, `designs/html/07-csv-data-mapping-validation.html` |
| **Agent E** | `designs/html/12-user-management.html`, `designs/html/08-create-invite-user-modal.html`, `designs/html/09-user-profile-settings.html`, `designs/html/20-researcher-workbench.html` |
| **Agent F** | `designs/html/15-app-shell.html`, `designs/html/19-approval-queue.html`, `designs/html/10-notification-center-panel.html`, `designs/html/11-global-command-search.html` |

See `designs/INDEX.md` for the complete screen inventory.

## Estimated Effort

| Agent | Complexity | Estimated time |
|-------|-----------|---------------|
| Agent 0 | High (setup) | 30-45 min |
| Agent A | Medium | 15-25 min |
| Agent B | Medium-High | 20-30 min |
| Agent C | Medium-High | 20-30 min |
| Agent D | High (CSV logic) | 25-35 min |
| Agent E | Medium | 20-30 min |
| Agent F | Medium | 15-25 min |

**Total serial time:** ~2.5-3.5 hours  
**Total with parallelism:** ~1-1.5 hours (Agent 0 + max(A-E) + Agent F)
