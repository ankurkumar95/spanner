# Spanner

**A centralized sales & marketing CRM built on the Account-Based Marketing (ABM) model.**

Spanner helps IT sales teams manage the full pipeline: **Segment creation → Company research → Company approval → Contact research → Contact approval → SDR outreach → Marketing collateral delivery.**

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.12 + FastAPI |
| Frontend | React 18 |
| Database | PostgreSQL 16 |
| Infrastructure | Docker Compose (Nginx + Backend + Frontend + DB) |
| Auth | JWT (bcrypt password hashing, RBAC) |

## User Roles

Admin, Segment Owner, Researcher, Approver, SDR, Marketing

## Repository Structure

```
spanner/
├── README.md                ← You are here
├── .gitignore
│
├── docs/                    ← Technical documentation
│   ├── requirements.md      # Full product spec (v3.1) — entities, rules, access control, CSV schemas
│   ├── architecture.md      # System architecture, Docker topology, security, data flow (Mermaid)
│   ├── database-design.md   # Full ERD, 15 tables, indexes, constraints, relationships
│   ├── process-flows.md     # 10 Mermaid diagrams — business flow, CSV pipeline, approval, state machines
│   ├── api-design.md        # 54 REST endpoints across 13 modules
│   └── technical-design.md  # Backend/frontend project structure, Docker Compose, RBAC, CSV engine, dedup
│
├── designs/                 ← UI mockups (Google Stitch)
│   ├── INDEX.md             # Screen inventory & mapping
│   ├── html/                # 20 interactive HTML screen mockups
│   └── screenshots/         # 20 PNG preview images
│
├── prompts/                 ← Planning artifacts & meeting notes
│   ├── meeting-notes.md     # Raw meeting discussion log
│   ├── refined-prompts.md   # 15 structured implementation prompts (PR-1 to PR-15)
│   ├── open-questions.md    # PO Q&A (4 rounds complete)
│   ├── stitch-prompt.md     # Google Stitch UI generation prompt
│   ├── stitch-validation-prompt.md  # Stitch audit/gap-fix prompt
│   └── google-dev-prompt.md # Full-stack single-agent build prompt
│
├── jules/                   ← Google Jules parallel agent prompts
│   ├── strategy.md          # Execution plan & 7-agent overview
│   ├── agent-0-foundation.md    # Phase 1: Docker, DB, Auth, RBAC (run first)
│   ├── agent-a-segments.md      # Phase 2: Segments + Assignments (parallel)
│   ├── agent-b-companies.md     # Phase 2: Companies + Approval (parallel)
│   ├── agent-c-contacts.md      # Phase 2: Contacts + SDR (parallel)
│   ├── agent-d-csv-engine.md    # Phase 2: CSV + Uploads + Dedup (parallel)
│   ├── agent-e-users-marketing-workbench.md  # Phase 2: Users + Marketing + Workbench (parallel)
│   └── agent-f-integration.md   # Phase 3: App shell + wiring (run last)
│
├── backend/                 ← FastAPI app (created by Jules Agent 0)
├── frontend/                ← React SPA (created by Jules Agent 0)
├── nginx/                   ← Reverse proxy config (created by Jules Agent 0)
└── docker-compose.yml       ← Container orchestration (created by Jules Agent 0)
```

## Quick Start

### 1. Review the product spec
Start with `docs/requirements.md` for the full product specification.

### 2. Review architecture & design
Browse `docs/` for system architecture, database ERD, API design, and process flows.

### 3. Browse UI mockups
Open any file in `designs/html/` in your browser to see the Stitch-generated screen designs. See `designs/INDEX.md` for the full screen inventory.

### 4. Build with Jules
Follow `jules/strategy.md` for the parallel agent execution plan:
1. Run **Agent 0** (Foundation) first — sets up Docker, DB, Auth, RBAC
2. Run **Agents A–E** in parallel — builds all modules
3. Run **Agent F** (Integration) last — wires everything together

Estimated build time with parallelism: **~1–1.5 hours**.

## Documentation Guide

| Document | What it covers |
|----------|---------------|
| `docs/requirements.md` | Full product requirements — entities, rules, access control, CSV schemas |
| `docs/architecture.md` | Tech stack, Docker topology, security architecture, data flow |
| `docs/database-design.md` | Full ERD (Mermaid), 15 tables, indexes, constraints, relationships |
| `docs/process-flows.md` | 10 Mermaid diagrams — business flow, CSV pipeline, approval, state machines |
| `docs/api-design.md` | 54 REST endpoints across 13 modules with request/response examples |
| `docs/technical-design.md` | Backend/frontend project structure, Docker Compose, RBAC, CSV engine, dedup job |
| `designs/INDEX.md` | 20 Stitch UI mockup screens — inventory, mapping, module grouping |
| `jules/strategy.md` | 7-agent parallel build strategy — phases, dependencies, file ownership |

## Key Design Decisions

- **Segments** are the core entity — all other data orbits around them
- **One company record per segment** — same real-world company in two segments = two records
- **Dedup within segment only** — cross-segment duplicates are intentional
- **Company approval: individual only** — no bulk approve, rejection is permanent
- **Contact approval: bulk allowed** — no rejection for contacts
- **All list views** show the same data to all users; **role determines available actions**
- **CSV uploads** use validation-first partial import with error correction
