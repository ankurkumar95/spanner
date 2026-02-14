# Spanner

A lightweight Customer Relationship Management project.

## Project Structure

```
Spanner/
├── README.md              # Project overview
├── requirements.md        # Requirements specification (v3.1)
├── prompts.md             # Raw meeting notes
├── prompts-refined.md     # Structured implementation prompts (15 prompts)
├── open-questions.md      # Open questions / PO review (4 rounds complete)
└── docs/
    ├── architecture.md    # System architecture, container & component diagrams
    ├── database-design.md # ERD, table schemas, indexes, constraints
    ├── process-flows.md   # Business flows, CSV pipeline, approval workflows
    ├── api-design.md      # REST API endpoints (54 endpoints, 13 modules)
    └── technical-design.md# Project structure, Docker Compose, RBAC, CSV engine, dedup
```

## Documentation Guide

| Document | What it covers |
|----------|---------------|
| `requirements.md` | Full product requirements — entities, rules, access control, CSV schemas |
| `prompts-refined.md` | 15 implementation prompts (PR-1 to PR-15) to guide development |
| `docs/architecture.md` | Tech stack, Docker topology, security architecture, data flow |
| `docs/database-design.md` | Full ERD (Mermaid), 15 tables, indexes, constraints, relationships |
| `docs/process-flows.md` | 10 Mermaid diagrams — business flow, CSV pipeline, approval, state machines |
| `docs/api-design.md` | 54 REST endpoints across 13 modules with request/response examples |
| `docs/technical-design.md` | Backend/frontend project structure, Docker Compose, RBAC, CSV engine, dedup job, audit, normalization |

## Getting Started

1. Review `requirements.md` for the full product spec
2. Review `docs/` for architecture and technical design
3. Use `prompts-refined.md` as implementation guides (PR-1 through PR-15)
4. Log new meeting discussions in `prompts.md`
