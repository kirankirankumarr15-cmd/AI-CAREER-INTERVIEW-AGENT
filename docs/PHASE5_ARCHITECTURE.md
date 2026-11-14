# Phase 5 — Admin & TPO Management Suite

## Architecture Inspection (pre-implementation)

### Existing platform
- **Framework:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Zustand, Recharts.
- **Backend:** Next.js route handlers (`app/api/**`), Supabase Postgres + Auth + RLS, `pg` for privileged migration/account scripts.
- **Auth:** Supabase session cookies (`@supabase/ssr`), middleware protection for student routes, server-authoritative role resolution in `lib/auth/rbac.ts`.
- **Institutional base already present:** `organizations`, `organization_members`, `roles`, `batches`, `batch_members`, `consent_grants`, `drives`, `tpo_audit_log` (Phase 0 / Step A).
- **Student data already present:** `profiles`, `education`, `skills`, `projects`, `experiences`, `certifications`, `documents`, `resume_versions`, `ats_analyses`, `resume_scores`, `interview_sessions`, `gd_sessions`, `assessment_*`, `proctor_events`, `readiness_snapshots`, `roadmap_*`, `user_progress`, `learning_roadmaps`, `applications`.
- **Phase 4 assets reused:** timed assessment attempts and proctor events, 5-pillar readiness calculator, readiness snapshots, roadmap tasks, CSV import hardening pattern (formula-injection safe export).
- **Known schema drift to handle:** Phase 0 created `organization_members.org_id`; Step A expects `organization_members.organization_id`. The Phase 5 migration normalizes both columns without data loss and supports both names.
- **Known role drift:** legacy roles are `student | tpo | admin`. Phase 5 introduces `super_admin | institution_admin | tpo | department_coordinator | faculty | student`, mapping legacy `admin` to `institution_admin`.
- **Design tokens:** white/slate cards, royal-blue accent (#2563EB), rounded-xl/2xl, Inter font, accessible status colors (blue, emerald, amber, rose, violet).

### Phase 5 implementation layout
```
app/admin/                          institutional portal (server-gated layout)
  dashboard/                        KPI overview, sections, action center
  analytics/readiness/              distribution, comparisons, drilldown
  analytics/skill-gaps/             heatmap, evidence, drilldown, export
  students/import/                  5-stage CSV wizard
  students/                         student directory
  users/ roles/ permissions/        RBAC administration
  privacy/                           DPDP consent & requests
  reports/                           CSV report exports
  audit/                             audit trail
  settings/                          institution, readiness, departments, integrations

app/api/admin/**                    permission-checked APIs, org-scoped
lib/admin/                          types, permission matrix, context, analytics, CSV
supabase/migrations/20261115_*      Phase 5 schema, RLS, import RPC, seeds
```

### Security principles
1. Every admin API resolves the caller from the Supabase session — never from client headers or localStorage.
2. Every query is scoped by the caller's `organization_id`; department coordinators/faculty are additionally scoped by `department_id`.
3. Permissions are evaluated server-side from the configurable `role_permissions` table with code defaults. Hidden UI is never treated as authorization.
4. RLS mirrors the server rules for defense in depth.
5. Aggregates enforce a minimum cohort size and distinguish *not assessed* from *needs improvement*.
6. CSV imports are server-validated, idempotent, transaction-safe per batch, and never overwrite existing profile fields.
7. Sensitive reads/writes (drilldown, role changes, imports, exports, consent changes) are audited.
