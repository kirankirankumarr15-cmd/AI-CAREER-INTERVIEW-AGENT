-- ============================================================================
-- Phase 5 — Enterprise Admin & TPO Management Suite
-- Migration: 20261115_phase5_admin_tpo_suite.sql
--
-- Implements:
--   • Six-role institutional RBAC with configurable server-side permissions
--   • Institution scoping (organizations → departments → batches)
--   • Readiness methodology + configurable categories
--   • Skill taxonomy and evidence aggregation support
--   • Transaction-safe, idempotent student CSV import (roster based)
--   • DPDP Act 2023 consent purposes, records and privacy requests
--   • Audit trail, report exports, integrations registry
--   • RLS policies mirroring server-side authorization
--
-- This migration is additive and safe to re-run (IF NOT EXISTS / ON CONFLICT).
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- 1. Roles
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.roles (
  id TEXT PRIMARY KEY,
  description TEXT
);

ALTER TABLE public.roles ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE public.roles ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;

INSERT INTO public.roles (id, description, display_name, sort_order) VALUES
  ('super_admin',            'CareerPilot platform super administrator',              'Super Admin',            1),
  ('institution_admin',      'College administrator with institution-wide governance','Institution Admin',      2),
  ('tpo',                    'Training & Placement Officer',                          'TPO',                    3),
  ('department_coordinator', 'Department-level placement coordinator',                'Department Coordinator',  4),
  ('faculty',                'Faculty member with read-only department access',       'Faculty',                5),
  ('student',                'Student candidate',                                     'Student',                6),
  ('admin',                  'Legacy administrator role (mapped to institution_admin)','Institution Admin (legacy)', 2)
ON CONFLICT (id) DO UPDATE SET
  description = EXCLUDED.description,
  display_name = COALESCE(public.roles.display_name, EXCLUDED.display_name),
  sort_order = COALESCE(public.roles.sort_order, EXCLUDED.sort_order);

-- ============================================================================
-- 2. Normalize organization / membership columns (Phase 0 ↔ Step A drift)
-- ============================================================================
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS code TEXT;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS short_code TEXT;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS org_type TEXT DEFAULT 'college';
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

UPDATE public.organizations SET code = short_code WHERE code IS NULL AND short_code IS NOT NULL;
UPDATE public.organizations SET short_code = code WHERE short_code IS NULL AND code IS NOT NULL;
UPDATE public.organizations SET code = 'ORG-' || SUBSTRING(id::text, 1, 8) WHERE code IS NULL;
UPDATE public.organizations SET short_code = code WHERE short_code IS NULL;

ALTER TABLE public.organization_members ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE public.organization_members ADD COLUMN IF NOT EXISTS org_id UUID;
UPDATE public.organization_members SET organization_id = org_id WHERE organization_id IS NULL;
UPDATE public.organization_members SET org_id = organization_id WHERE org_id IS NULL;
ALTER TABLE public.organization_members ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.organization_members ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- ============================================================================
-- 3. Departments
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.departments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  code            TEXT,
  hod_user_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_departments_org_name
  ON public.departments (organization_id, LOWER(name));
CREATE INDEX IF NOT EXISTS idx_departments_org ON public.departments(organization_id);

ALTER TABLE public.organization_members ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;

ALTER TABLE public.batches ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE public.batches ADD COLUMN IF NOT EXISTS org_id UUID;
ALTER TABLE public.batches ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;
ALTER TABLE public.batches ADD COLUMN IF NOT EXISTS batch_name TEXT;
ALTER TABLE public.batches ADD COLUMN IF NOT EXISTS course TEXT;
UPDATE public.batches SET organization_id = org_id WHERE organization_id IS NULL;
UPDATE public.batches SET org_id = organization_id WHERE org_id IS NULL;
UPDATE public.batches SET batch_name = name WHERE batch_name IS NULL AND name IS NOT NULL;

-- ============================================================================
-- 4. Profiles — institutional attributes
-- ============================================================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS batch_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS course TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS academic_year TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS student_id_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_verified BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS student_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS target_role TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS branch TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS graduation_year INT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS college TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cgpa NUMERIC(4,2);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'Unverified';

-- Replace any legacy/auto-generated role checks on profiles.
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%role%'
  LOOP
    EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;

UPDATE public.profiles
SET role = 'student'
WHERE role IS NULL OR role NOT IN ('student','tpo','admin','super_admin','institution_admin','department_coordinator','faculty');

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('student','tpo','admin','super_admin','institution_admin','department_coordinator','faculty'));

-- Organization members role checks (drop legacy CHECKs, keep FK to roles).
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.organization_members'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%role%'
  LOOP
    EXECUTE format('ALTER TABLE public.organization_members DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;

UPDATE public.organization_members
SET role = 'student'
WHERE role IS NULL OR role NOT IN ('student','tpo','admin','super_admin','institution_admin','department_coordinator','faculty');

ALTER TABLE public.organization_members
  DROP CONSTRAINT IF EXISTS organization_members_role_check;
ALTER TABLE public.organization_members
  ADD CONSTRAINT organization_members_role_check
  CHECK (role IN ('student','tpo','admin','super_admin','institution_admin','department_coordinator','faculty'));

CREATE INDEX IF NOT EXISTS idx_profiles_org ON public.profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_org_dept ON public.profiles(organization_id, department_id);
CREATE INDEX IF NOT EXISTS idx_profiles_org_batch ON public.profiles(organization_id, batch_name);
CREATE UNIQUE INDEX IF NOT EXISTS uq_profiles_org_student_id
  ON public.profiles(organization_id, student_id_number)
  WHERE student_id_number IS NOT NULL AND organization_id IS NOT NULL;

-- Backfill institution from existing memberships (prefer non-student role rows).
UPDATE public.profiles p
SET organization_id = m.organization_id
FROM (
  SELECT DISTINCT ON (user_id)
    user_id,
    COALESCE(organization_id, org_id) AS organization_id
  FROM public.organization_members
  WHERE COALESCE(organization_id, org_id) IS NOT NULL
  ORDER BY user_id,
    CASE WHEN role IN ('super_admin','institution_admin','admin','tpo','department_coordinator','faculty') THEN 0 ELSE 1 END
) m
WHERE p.id = m.user_id AND p.organization_id IS NULL;

-- Derive departments from recorded branches (real data, not fabricated).
INSERT INTO public.departments (organization_id, name, code)
SELECT DISTINCT
  p.organization_id,
  TRIM(p.branch),
  'DEPT-' || UPPER(SUBSTRING(MD5(p.organization_id::text || LOWER(TRIM(p.branch))), 1, 6))
FROM public.profiles p
WHERE p.organization_id IS NOT NULL
  AND p.branch IS NOT NULL
  AND TRIM(p.branch) <> ''
ON CONFLICT DO NOTHING;

UPDATE public.profiles p
SET department_id = d.id
FROM public.departments d
WHERE p.department_id IS NULL
  AND p.organization_id = d.organization_id
  AND LOWER(TRIM(p.branch)) = LOWER(d.name);

UPDATE public.profiles
SET batch_name = 'Batch ' || graduation_year
WHERE batch_name IS NULL AND graduation_year IS NOT NULL;

-- ============================================================================
-- 5. Institution settings, readiness methodology & categories
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.institution_settings (
  organization_id       UUID PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
  academic_year         TEXT NOT NULL DEFAULT '2026-2027',
  readiness_weights     JSONB NOT NULL DEFAULT '{"assessments":25,"resume":20,"interview":25,"groupDiscussion":15,"profile":15}'::jsonb,
  readiness_thresholds  JSONB NOT NULL DEFAULT '{"highly_prepared":75,"moderately_prepared":50}'::jsonb,
  minimum_cohort_size   INT NOT NULL DEFAULT 5 CHECK (minimum_cohort_size >= 1),
  readiness_min_coverage NUMERIC(5,2) NOT NULL DEFAULT 40 CHECK (readiness_min_coverage BETWEEN 0 AND 100),
  require_consent_for_drilldown BOOLEAN NOT NULL DEFAULT TRUE,
  skill_proficiency_threshold NUMERIC(5,2) NOT NULL DEFAULT 60 CHECK (skill_proficiency_threshold BETWEEN 0 AND 100),
  skill_min_evidence    INT NOT NULL DEFAULT 2 CHECK (skill_min_evidence >= 1),
  consent_notice_version TEXT NOT NULL DEFAULT '2026-11',
  data_retention_months INT NOT NULL DEFAULT 24 CHECK (data_retention_months >= 1),
  allow_staff_export    BOOLEAN NOT NULL DEFAULT TRUE,
  updated_by            UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.institution_settings (organization_id, academic_year)
SELECT id, '2026-2027' FROM public.organizations
ON CONFLICT (organization_id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.readiness_category_configs (
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  category_key    TEXT NOT NULL,
  label           TEXT NOT NULL,
  description     TEXT,
  min_score       NUMERIC(5,2),
  max_score       NUMERIC(5,2),
  min_coverage    NUMERIC(5,2) NOT NULL DEFAULT 0,
  color           TEXT NOT NULL DEFAULT '#2563EB',
  sort_order      INT NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (organization_id, category_key)
);

INSERT INTO public.readiness_category_configs
  (organization_id, category_key, label, description, min_score, max_score, min_coverage, color, sort_order)
SELECT o.id, v.category_key, v.label, v.description, v.min_score, v.max_score, v.min_coverage, v.color, v.sort_order
FROM public.organizations o
CROSS JOIN (VALUES
  ('highly_prepared',    'Highly prepared',     'Meets the institution readiness threshold across assessed pillars.', 75, 100, 40, '#2563EB', 1),
  ('moderately_prepared','Moderately prepared',  'Building readiness; targeted practice recommended.',                 50, 74.99, 40, '#0EA5E9', 2),
  ('needs_improvement',  'Needs improvement',   'Below the institutional readiness threshold; priority support needed.', 0, 49.99, 40, '#F59E0B', 3),
  ('insufficient_data',  'Not enough assessment data', 'Insufficient assessed pillars to produce a reliable readiness score.', NULL, NULL, 0, '#94A3B8', 4)
) AS v(category_key, label, description, min_score, max_score, min_coverage, color, sort_order)
ON CONFLICT (organization_id, category_key) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.role_permissions (
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role            TEXT NOT NULL,
  permission      TEXT NOT NULL,
  allowed         BOOLEAN NOT NULL,
  updated_by      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (organization_id, role, permission)
);

-- ============================================================================
-- 6. Staff invitations
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.staff_invitations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  full_name       TEXT,
  role            TEXT NOT NULL CHECK (role IN ('institution_admin','tpo','department_coordinator','faculty')),
  department_id   UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  token           UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','revoked','expired')),
  invited_by      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  expires_at      TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staff_invitations_org ON public.staff_invitations(organization_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS uq_staff_invitations_pending_email
  ON public.staff_invitations(organization_id, LOWER(email))
  WHERE status = 'pending';

-- ============================================================================
-- 7. Student roster & CSV import ledger
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.student_roster (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  department_id     UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  student_id_number TEXT,
  full_name         TEXT NOT NULL,
  email             TEXT NOT NULL,
  phone             TEXT,
  batch_name        TEXT,
  graduation_year   INT CHECK (graduation_year BETWEEN 2000 AND 2100),
  course            TEXT,
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','linked','invited','disabled')),
  linked_user_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  import_job_id     UUID,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_student_roster_org_email
  ON public.student_roster(organization_id, LOWER(email));
CREATE UNIQUE INDEX IF NOT EXISTS uq_student_roster_org_student_id
  ON public.student_roster(organization_id, student_id_number)
  WHERE student_id_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_student_roster_org ON public.student_roster(organization_id);
CREATE INDEX IF NOT EXISTS idx_student_roster_dept ON public.student_roster(organization_id, department_id);

CREATE TABLE IF NOT EXISTS public.student_import_jobs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  actor_user_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  filename          TEXT NOT NULL,
  total_rows        INT NOT NULL DEFAULT 0,
  valid_rows        INT NOT NULL DEFAULT 0,
  imported_rows     INT NOT NULL DEFAULT 0,
  linked_rows       INT NOT NULL DEFAULT 0,
  skipped_rows      INT NOT NULL DEFAULT 0,
  failed_rows       INT NOT NULL DEFAULT 0,
  status            TEXT NOT NULL DEFAULT 'previewed' CHECK (status IN ('previewed','processing','completed','failed','rolled_back')),
  idempotency_key   TEXT NOT NULL,
  error_summary     JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata          JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at      TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_student_import_jobs_idempotency
  ON public.student_import_jobs(organization_id, idempotency_key);
CREATE INDEX IF NOT EXISTS idx_student_import_jobs_org ON public.student_import_jobs(organization_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.student_import_errors (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id      UUID NOT NULL REFERENCES public.student_import_jobs(id) ON DELETE CASCADE,
  row_number  INT NOT NULL,
  email       TEXT,
  error_code  TEXT NOT NULL,
  message     TEXT NOT NULL,
  raw_row     JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_import_errors_job ON public.student_import_errors(job_id);

-- ============================================================================
-- 8. Audit trail
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  actor_user_id   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_role      TEXT,
  action          TEXT NOT NULL,
  target_type     TEXT,
  target_id       TEXT,
  target_user_id  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address      TEXT,
  user_agent      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_org_time ON public.admin_audit_log(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_actor ON public.admin_audit_log(actor_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_action ON public.admin_audit_log(organization_id, action);

-- ============================================================================
-- 9. Skill taxonomy
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.skill_catalog (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  category        TEXT NOT NULL CHECK (category IN ('technical','professional')),
  aliases         TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  description     TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order      INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_skill_catalog_scope_name
  ON public.skill_catalog(COALESCE(organization_id::text, 'global'), LOWER(name));

INSERT INTO public.skill_catalog (organization_id, name, category, aliases, sort_order)
SELECT NULL, v.name, v.category, v.aliases, v.sort_order
FROM (VALUES
  ('C',                    'technical', ARRAY['c language','c programming']::TEXT[], 1),
  ('C++',                  'technical', ARRAY['cpp','c plus plus']::TEXT[], 2),
  ('Java',                 'technical', ARRAY['core java','java programming']::TEXT[], 3),
  ('Python',               'technical', ARRAY['python3','py']::TEXT[], 4),
  ('JavaScript',           'technical', ARRAY['js','es6']::TEXT[], 5),
  ('HTML',                 'technical', ARRAY['html5']::TEXT[], 6),
  ('CSS',                  'technical', ARRAY['css3','styling']::TEXT[], 7),
  ('React',                'technical', ARRAY['reactjs','react.js']::TEXT[], 8),
  ('Node.js',              'technical', ARRAY['nodejs','node']::TEXT[], 9),
  ('SQL',                  'technical', ARRAY['queries','query language']::TEXT[], 10),
  ('DBMS',                 'technical', ARRAY['database management','databases','normalization']::TEXT[], 11),
  ('Operating Systems',    'technical', ARRAY['os','process scheduling','deadlocks']::TEXT[], 12),
  ('Computer Networks',    'technical', ARRAY['networks','networking','tcp/ip']::TEXT[], 13),
  ('Data Structures',      'technical', ARRAY['ds','data structure']::TEXT[], 14),
  ('Algorithms',           'technical', ARRAY['dsa','algorithm design']::TEXT[], 15),
  ('Cloud Computing',      'technical', ARRAY['cloud','aws','azure','gcp']::TEXT[], 16),
  ('AI/ML',                'technical', ARRAY['machine learning','artificial intelligence','ml','ai']::TEXT[], 17),
  ('Communication',        'professional', ARRAY['verbal communication','speaking','clarity']::TEXT[], 101),
  ('Problem Solving',      'professional', ARRAY['analytical thinking','reasoning']::TEXT[], 102),
  ('Teamwork',             'professional', ARRAY['collaboration','team work']::TEXT[], 103),
  ('Presentation',         'professional', ARRAY['presenting','public speaking']::TEXT[], 104),
  ('Interview Skills',     'professional', ARRAY['interviewing','interview readiness']::TEXT[], 105),
  ('Logical Reasoning',    'professional', ARRAY['aptitude','logical ability','reasoning ability']::TEXT[], 106)
) AS v(name, category, aliases, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.skill_catalog s
  WHERE s.organization_id IS NULL AND LOWER(s.name) = LOWER(v.name)
);

-- ============================================================================
-- 10. DPDP consent & privacy requests
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.consent_purposes (
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  code            TEXT NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT NOT NULL,
  legal_basis     TEXT NOT NULL DEFAULT 'consent',
  is_required     BOOLEAN NOT NULL DEFAULT FALSE,
  retention_days  INT,
  version         TEXT NOT NULL DEFAULT '2026-11',
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (organization_id, code)
);

INSERT INTO public.consent_purposes
  (organization_id, code, title, description, legal_basis, is_required, retention_days, version)
SELECT o.id, v.code, v.title, v.description, v.legal_basis, v.is_required, v.retention_days, '2026-11'
FROM public.organizations o
CROSS JOIN (VALUES
  ('institutional_analytics', 'Institutional placement analytics',
   'Aggregate and cohort-level readiness analytics used by the placement office to plan training. Individual drilldown is restricted and audited.', 'consent', FALSE, 730),
  ('placement_services', 'Placement services',
   'Processing academic and career data to provide placement preparation, drives, assessments and employer coordination.', 'consent', TRUE, 730),
  ('employer_sharing', 'Employer profile sharing',
   'Sharing your verified profile and readiness summary with employers for specific placement opportunities.', 'consent', FALSE, 365),
  ('ai_processing', 'AI-assisted coaching',
   'Using AI services to evaluate practice interviews, resumes and assessments. Responses are not used to train third-party models.', 'consent', TRUE, 365)
) AS v(code, title, description, legal_basis, is_required, retention_days)
ON CONFLICT (organization_id, code) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.consent_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  purpose_code    TEXT NOT NULL,
  version         TEXT NOT NULL,
  status          TEXT NOT NULL CHECK (status IN ('granted','withdrawn')),
  source          TEXT NOT NULL DEFAULT 'student_portal' CHECK (source IN ('student_portal','offline_form','imported_consent','admin_record')),
  evidence        TEXT,
  granted_at      TIMESTAMPTZ,
  withdrawn_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consent_records_user
  ON public.consent_records(organization_id, user_id, purpose_code, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_consent_records_org
  ON public.consent_records(organization_id, purpose_code, status);

CREATE TABLE IF NOT EXISTS public.privacy_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  request_type    TEXT NOT NULL CHECK (request_type IN ('access','correction','erasure','portability')),
  details         TEXT,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','rejected')),
  resolution_note TEXT,
  assigned_to     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  due_at          TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_privacy_requests_org ON public.privacy_requests(organization_id, status, due_at);

-- ============================================================================
-- 11. Reports, exports and integrations
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.report_exports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  actor_user_id   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  report_type     TEXT NOT NULL,
  filters         JSONB NOT NULL DEFAULT '{}'::jsonb,
  row_count       INT NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed','failed')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_report_exports_org ON public.report_exports(organization_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.integrations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  provider        TEXT NOT NULL,
  display_name    TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'not_configured' CHECK (status IN ('connected','not_configured','disabled','error')),
  config          JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_synced_at  TIMESTAMPTZ,
  updated_by      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, provider)
);

INSERT INTO public.integrations (organization_id, provider, display_name, status)
SELECT o.id, v.provider, v.display_name, 'not_configured'
FROM public.organizations o
CROSS JOIN (VALUES
  ('smtp','Email / SMTP'),
  ('whatsapp','WhatsApp Cloud API'),
  ('webhook','Outbound webhooks'),
  ('lms','LMS / ERP connector')
) AS v(provider, display_name)
ON CONFLICT (organization_id, provider) DO NOTHING;

-- ============================================================================
-- 12. Authorization helper functions
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role
  FROM public.organization_members
  WHERE user_id = p_user_id
  ORDER BY CASE WHEN role IN ('super_admin','institution_admin','admin','tpo','department_coordinator','faculty') THEN 0 ELSE 1 END
  LIMIT 1;

  IF v_role IS NOT NULL THEN
    RETURN CASE WHEN v_role = 'admin' THEN 'institution_admin' ELSE v_role END;
  END IF;

  SELECT role INTO v_role FROM public.profiles WHERE id = p_user_id;
  RETURN CASE WHEN v_role = 'admin' THEN 'institution_admin' ELSE COALESCE(v_role, 'student') END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

CREATE OR REPLACE FUNCTION public.current_admin_org_id()
RETURNS UUID AS $$
DECLARE v_org UUID;
BEGIN
  SELECT COALESCE(organization_id, org_id) INTO v_org
  FROM public.organization_members
  WHERE user_id = auth.uid()
  ORDER BY CASE WHEN role IN ('super_admin','institution_admin','admin','tpo','department_coordinator','faculty') THEN 0 ELSE 1 END
  LIMIT 1;

  IF v_org IS NULL THEN
    SELECT organization_id INTO v_org FROM public.profiles WHERE id = auth.uid();
  END IF;
  RETURN v_org;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

CREATE OR REPLACE FUNCTION public.current_admin_department_id()
RETURNS UUID AS $$
DECLARE v_dept UUID;
BEGIN
  SELECT department_id INTO v_dept
  FROM public.organization_members
  WHERE user_id = auth.uid()
  ORDER BY CASE WHEN role IN ('department_coordinator','faculty') THEN 0 ELSE 1 END
  LIMIT 1;

  IF v_dept IS NULL THEN
    SELECT department_id INTO v_dept FROM public.profiles WHERE id = auth.uid();
  END IF;
  RETURN v_dept;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

CREATE OR REPLACE FUNCTION public.has_admin_permission(p_permission TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
  v_org UUID;
  v_allowed BOOLEAN;
BEGIN
  IF auth.uid() IS NULL THEN RETURN FALSE; END IF;
  v_role := public.get_user_role(auth.uid());
  v_org := public.current_admin_org_id();

  IF v_role = 'super_admin' THEN RETURN TRUE; END IF;
  IF v_role NOT IN ('institution_admin','tpo','department_coordinator','faculty') THEN RETURN FALSE; END IF;

  IF v_org IS NOT NULL THEN
    SELECT allowed INTO v_allowed
    FROM public.role_permissions
    WHERE organization_id = v_org AND role = v_role AND permission = p_permission;
    IF FOUND THEN RETURN v_allowed; END IF;
  END IF;

  RETURN CASE p_permission
    WHEN 'platform.manage'             THEN FALSE
    WHEN 'institution.settings.read'   THEN v_role IN ('institution_admin','tpo')
    WHEN 'institution.settings.write'  THEN v_role = 'institution_admin'
    WHEN 'students.read'               THEN TRUE
    WHEN 'students.write'              THEN v_role IN ('institution_admin','tpo','department_coordinator')
    WHEN 'analytics.read'              THEN TRUE
    WHEN 'skillgaps.read'              THEN TRUE
    WHEN 'import.execute'              THEN v_role IN ('institution_admin','tpo','department_coordinator')
    WHEN 'consent.read'                THEN v_role IN ('institution_admin','tpo')
    WHEN 'consent.write'               THEN v_role = 'institution_admin'
    WHEN 'assessments.manage'          THEN v_role IN ('institution_admin','tpo','department_coordinator')
    WHEN 'audit.read'                  THEN v_role IN ('institution_admin','tpo')
    WHEN 'users.read'                  THEN v_role IN ('institution_admin','tpo')
    WHEN 'users.manage'                THEN v_role = 'institution_admin'
    WHEN 'roles.manage'                THEN v_role = 'institution_admin'
    WHEN 'reports.export'              THEN v_role IN ('institution_admin','tpo','department_coordinator')
    WHEN 'integrations.manage'         THEN v_role = 'institution_admin'
    ELSE FALSE
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

CREATE OR REPLACE FUNCTION public.can_view_student(p_student_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
  v_org UUID;
  v_dept UUID;
  v_student_org UUID;
  v_student_dept UUID;
BEGIN
  IF auth.uid() IS NULL OR p_student_id IS NULL THEN RETURN FALSE; END IF;
  IF p_student_id = auth.uid() THEN RETURN TRUE; END IF;

  v_role := public.get_user_role(auth.uid());
  IF v_role NOT IN ('super_admin','institution_admin','tpo','department_coordinator','faculty') THEN
    RETURN FALSE;
  END IF;
  IF NOT public.has_admin_permission('students.read') THEN RETURN FALSE; END IF;

  v_org := public.current_admin_org_id();
  v_dept := public.current_admin_department_id();

  SELECT
    COALESCE(p.organization_id, m.organization_id),
    COALESCE(p.department_id, m.department_id)
  INTO v_student_org, v_student_dept
  FROM public.profiles p
  LEFT JOIN LATERAL (
    SELECT COALESCE(organization_id, org_id) AS organization_id, department_id
    FROM public.organization_members
    WHERE user_id = p.id
    LIMIT 1
  ) m ON TRUE
  WHERE p.id = p_student_id;

  IF v_student_org IS NULL THEN RETURN FALSE; END IF;
  IF v_role <> 'super_admin' AND v_student_org <> v_org THEN RETURN FALSE; END IF;
  IF v_role IN ('department_coordinator','faculty') AND v_dept IS NOT NULL AND v_student_dept IS DISTINCT FROM v_dept THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

CREATE OR REPLACE FUNCTION public.is_staff(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.get_user_role(p_user_id) IN
    ('super_admin','institution_admin','admin','tpo','department_coordinator','faculty');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

CREATE OR REPLACE FUNCTION public.is_admin(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.get_user_role(p_user_id) IN ('super_admin','institution_admin','admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- Auto-provision settings/categories/integrations for new institutions.
CREATE OR REPLACE FUNCTION public.seed_institution_defaults()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.institution_settings (organization_id) VALUES (NEW.id)
  ON CONFLICT (organization_id) DO NOTHING;

  INSERT INTO public.readiness_category_configs
    (organization_id, category_key, label, description, min_score, max_score, min_coverage, color, sort_order)
  VALUES
    (NEW.id,'highly_prepared','Highly prepared','Meets the institution readiness threshold across assessed pillars.',75,100,40,'#2563EB',1),
    (NEW.id,'moderately_prepared','Moderately prepared','Building readiness; targeted practice recommended.',50,74.99,40,'#0EA5E9',2),
    (NEW.id,'needs_improvement','Needs improvement','Below the institutional readiness threshold; priority support needed.',0,49.99,40,'#F59E0B',3),
    (NEW.id,'insufficient_data','Not enough assessment data','Insufficient assessed pillars to produce a reliable readiness score.',NULL,NULL,0,'#94A3B8',4)
  ON CONFLICT (organization_id, category_key) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_seed_institution_defaults ON public.organizations;
CREATE TRIGGER trg_seed_institution_defaults
AFTER INSERT ON public.organizations
FOR EACH ROW EXECUTE FUNCTION public.seed_institution_defaults();

-- ============================================================================
-- 13. Transaction-safe student import RPC
-- ============================================================================
CREATE OR REPLACE FUNCTION public.admin_commit_student_import(
  p_organization_id UUID,
  p_job_id UUID,
  p_rows JSONB,
  p_default_department_id UUID DEFAULT NULL,
  p_link_existing BOOLEAN DEFAULT TRUE
)
RETURNS JSONB AS $$
DECLARE
  v_actor UUID := auth.uid();
  v_role TEXT;
  v_actor_org UUID;
  v_actor_dept UUID;
  v_row JSONB;
  v_row_number INT;
  v_email TEXT;
  v_full_name TEXT;
  v_phone TEXT;
  v_student_number TEXT;
  v_dept UUID;
  v_batch TEXT;
  v_grad_year INT;
  v_course TEXT;
  v_profile RECORD;
  v_existing_roster UUID;
  v_inserted INT := 0;
  v_linked INT := 0;
  v_skipped INT := 0;
  v_failed INT := 0;
  v_errors JSONB := '[]'::jsonb;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF p_organization_id IS NULL OR p_job_id IS NULL OR p_rows IS NULL OR jsonb_typeof(p_rows) <> 'array' THEN
    RAISE EXCEPTION 'Invalid import payload';
  END IF;

  v_role := public.get_user_role(v_actor);
  v_actor_org := public.current_admin_org_id();
  v_actor_dept := public.current_admin_department_id();

  IF v_role NOT IN ('super_admin','institution_admin','tpo','department_coordinator') THEN
    RAISE EXCEPTION 'Insufficient privileges for student import';
  END IF;
  IF NOT public.has_admin_permission('import.execute') THEN
    RAISE EXCEPTION 'Import permission not granted';
  END IF;
  IF v_role <> 'super_admin' AND v_actor_org IS DISTINCT FROM p_organization_id THEN
    RAISE EXCEPTION 'Cross-institution import is not permitted';
  END IF;

  FOR v_row IN SELECT value FROM jsonb_array_elements(p_rows) WITH ORDINALITY AS t(value, ord)
  LOOP
    BEGIN
      v_row_number := COALESCE(NULLIF(v_row->>'rowNumber','')::INT, 1);
      v_email := LOWER(TRIM(COALESCE(v_row->>'email','')));
      v_full_name := TRIM(COALESCE(v_row->>'full_name',''));
      v_phone := NULLIF(TRIM(COALESCE(v_row->>'phone','')), '');
      v_student_number := NULLIF(TRIM(COALESCE(v_row->>'student_id_number','')), '');
      v_batch := NULLIF(TRIM(COALESCE(v_row->>'batch_name','')), '');
      v_course := NULLIF(TRIM(COALESCE(v_row->>'course','')), '');
      v_grad_year := CASE WHEN COALESCE(v_row->>'graduation_year','') ~ '^\d{4}$'
                          THEN (v_row->>'graduation_year')::INT ELSE NULL END;

      IF v_email !~* '^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$' THEN
        RAISE EXCEPTION 'Invalid email address';
      END IF;
      IF v_full_name = '' THEN
        RAISE EXCEPTION 'Full name is required';
      END IF;

      IF v_role IN ('department_coordinator','faculty') AND v_actor_dept IS NOT NULL THEN
        v_dept := v_actor_dept;
      ELSE
        v_dept := CASE WHEN COALESCE(v_row->>'department_id','') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
                       THEN (v_row->>'department_id')::UUID ELSE p_default_department_id END;
      END IF;

      IF v_dept IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM public.departments WHERE id = v_dept AND organization_id = p_organization_id
      ) THEN
        RAISE EXCEPTION 'Department does not belong to this institution';
      END IF;

      -- Never overwrite another institution's student record.
      SELECT id, organization_id, department_id, batch_name, course, graduation_year, student_id_number
      INTO v_profile
      FROM public.profiles
      WHERE LOWER(email) = v_email
      LIMIT 1;

      IF v_profile.id IS NOT NULL THEN
        IF v_profile.organization_id IS NOT NULL AND v_profile.organization_id <> p_organization_id THEN
          v_skipped := v_skipped + 1;
          v_errors := v_errors || jsonb_build_object(
            'rowNumber', v_row_number, 'email', v_email,
            'code', 'OTHER_INSTITUTION', 'message', 'This email belongs to another institution and was not modified.'
          );
          CONTINUE;
        END IF;

        IF NOT p_link_existing THEN
          v_skipped := v_skipped + 1;
          v_errors := v_errors || jsonb_build_object(
            'rowNumber', v_row_number, 'email', v_email,
            'code', 'ACCOUNT_EXISTS', 'message', 'An account already exists for this email.'
          );
          CONTINUE;
        END IF;

        -- Fill only empty fields. Existing profile values are never overwritten.
        UPDATE public.profiles
        SET organization_id  = COALESCE(organization_id, p_organization_id),
            department_id    = COALESCE(department_id, v_dept),
            batch_name       = COALESCE(batch_name, v_batch),
            course           = COALESCE(course, v_course),
            graduation_year  = COALESCE(graduation_year, v_grad_year),
            student_id_number= COALESCE(student_id_number, v_student_number),
            updated_at       = NOW()
        WHERE id = v_profile.id;

        INSERT INTO public.organization_members
          (organization_id, org_id, user_id, role, department_id, updated_at)
        VALUES
          (p_organization_id, p_organization_id, v_profile.id, 'student', v_dept, NOW())
        ON CONFLICT DO NOTHING;

        v_linked := v_linked + 1;
        CONTINUE;
      END IF;

      SELECT id INTO v_existing_roster
      FROM public.student_roster
      WHERE organization_id = p_organization_id
        AND (LOWER(email) = v_email OR (v_student_number IS NOT NULL AND student_id_number = v_student_number))
      LIMIT 1;

      IF v_existing_roster IS NOT NULL THEN
        v_skipped := v_skipped + 1;
        v_errors := v_errors || jsonb_build_object(
          'rowNumber', v_row_number, 'email', v_email,
          'code', 'DUPLICATE', 'message', 'A roster record with this email or student ID already exists.'
        );
        CONTINUE;
      END IF;

      INSERT INTO public.student_roster
        (organization_id, department_id, student_id_number, full_name, email, phone,
         batch_name, graduation_year, course, status, import_job_id)
      VALUES
        (p_organization_id, v_dept, v_student_number, v_full_name, v_email, v_phone,
         v_batch, v_grad_year, v_course, 'pending', p_job_id);

      v_inserted := v_inserted + 1;

    EXCEPTION WHEN OTHERS THEN
      v_failed := v_failed + 1;
      v_errors := v_errors || jsonb_build_object(
        'rowNumber', v_row_number, 'email', v_email,
        'code', 'ROW_ERROR', 'message', SQLERRM
      );
    END;
  END LOOP;

  UPDATE public.student_import_jobs
  SET imported_rows = imported_rows + v_inserted,
      linked_rows   = linked_rows + v_linked,
      skipped_rows  = skipped_rows + v_skipped,
      failed_rows   = failed_rows + v_failed,
      error_summary = error_summary || v_errors,
      updated_at    = NOW()
  WHERE id = p_job_id AND organization_id = p_organization_id;

  RETURN jsonb_build_object(
    'inserted', v_inserted,
    'linked', v_linked,
    'skipped', v_skipped,
    'failed', v_failed,
    'errors', v_errors
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- ============================================================================
-- 14. RLS — Phase 5 tables
-- ============================================================================
ALTER TABLE public.departments               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institution_settings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.readiness_category_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_invitations         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_roster            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_import_jobs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_import_errors     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_catalog             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_purposes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_records           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.privacy_requests          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_exports            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations              ENABLE ROW LEVEL SECURITY;

-- Departments: institution members may read; settings writers may manage.
DROP POLICY IF EXISTS "Departments readable by institution members" ON public.departments;
CREATE POLICY "Departments readable by institution members"
  ON public.departments FOR SELECT TO authenticated
  USING (organization_id = public.current_admin_org_id() OR public.get_user_role(auth.uid()) = 'super_admin');

DROP POLICY IF EXISTS "Departments managed by settings writers" ON public.departments;
CREATE POLICY "Departments managed by settings writers"
  ON public.departments FOR ALL TO authenticated
  USING (organization_id = public.current_admin_org_id() AND public.has_admin_permission('institution.settings.write'))
  WITH CHECK (organization_id = public.current_admin_org_id() AND public.has_admin_permission('institution.settings.write'));

-- Institution settings
DROP POLICY IF EXISTS "Institution settings readable by staff" ON public.institution_settings;
CREATE POLICY "Institution settings readable by staff"
  ON public.institution_settings FOR SELECT TO authenticated
  USING (organization_id = public.current_admin_org_id() AND public.has_admin_permission('institution.settings.read'));

DROP POLICY IF EXISTS "Institution settings writable by admins" ON public.institution_settings;
CREATE POLICY "Institution settings writable by admins"
  ON public.institution_settings FOR ALL TO authenticated
  USING (organization_id = public.current_admin_org_id() AND public.has_admin_permission('institution.settings.write'))
  WITH CHECK (organization_id = public.current_admin_org_id() AND public.has_admin_permission('institution.settings.write'));

-- Readiness categories
DROP POLICY IF EXISTS "Readiness categories readable by staff" ON public.readiness_category_configs;
CREATE POLICY "Readiness categories readable by staff"
  ON public.readiness_category_configs FOR SELECT TO authenticated
  USING (organization_id = public.current_admin_org_id() AND public.has_admin_permission('analytics.read'));

DROP POLICY IF EXISTS "Readiness categories writable by admins" ON public.readiness_category_configs;
CREATE POLICY "Readiness categories writable by admins"
  ON public.readiness_category_configs FOR ALL TO authenticated
  USING (organization_id = public.current_admin_org_id() AND public.has_admin_permission('institution.settings.write'))
  WITH CHECK (organization_id = public.current_admin_org_id() AND public.has_admin_permission('institution.settings.write'));

-- Role permissions
DROP POLICY IF EXISTS "Role permissions readable by admins" ON public.role_permissions;
CREATE POLICY "Role permissions readable by admins"
  ON public.role_permissions FOR SELECT TO authenticated
  USING (organization_id = public.current_admin_org_id() AND public.get_user_role(auth.uid()) IN ('super_admin','institution_admin'));

DROP POLICY IF EXISTS "Role permissions writable by admins" ON public.role_permissions;
CREATE POLICY "Role permissions writable by admins"
  ON public.role_permissions FOR ALL TO authenticated
  USING (organization_id = public.current_admin_org_id() AND public.has_admin_permission('roles.manage'))
  WITH CHECK (organization_id = public.current_admin_org_id() AND public.has_admin_permission('roles.manage'));

-- Staff invitations
DROP POLICY IF EXISTS "Invitations managed by authorized staff" ON public.staff_invitations;
CREATE POLICY "Invitations managed by authorized staff"
  ON public.staff_invitations FOR ALL TO authenticated
  USING (organization_id = public.current_admin_org_id() AND public.has_admin_permission('users.manage'))
  WITH CHECK (organization_id = public.current_admin_org_id() AND public.has_admin_permission('users.manage'));

-- Student roster
DROP POLICY IF EXISTS "Roster readable by staff" ON public.student_roster;
CREATE POLICY "Roster readable by staff"
  ON public.student_roster FOR SELECT TO authenticated
  USING (
    organization_id = public.current_admin_org_id()
    AND public.has_admin_permission('students.read')
    AND (public.current_admin_department_id() IS NULL
         OR department_id IS NULL
         OR department_id = public.current_admin_department_id()
         OR public.get_user_role(auth.uid()) IN ('super_admin','institution_admin','tpo'))
  );

DROP POLICY IF EXISTS "Roster writable by import users" ON public.student_roster;
CREATE POLICY "Roster writable by import users"
  ON public.student_roster FOR ALL TO authenticated
  USING (organization_id = public.current_admin_org_id() AND public.has_admin_permission('import.execute'))
  WITH CHECK (organization_id = public.current_admin_org_id() AND public.has_admin_permission('import.execute'));

-- Import jobs / errors
DROP POLICY IF EXISTS "Import jobs readable by importers" ON public.student_import_jobs;
CREATE POLICY "Import jobs readable by importers"
  ON public.student_import_jobs FOR SELECT TO authenticated
  USING (organization_id = public.current_admin_org_id() AND public.has_admin_permission('import.execute'));

DROP POLICY IF EXISTS "Import jobs writable by importers" ON public.student_import_jobs;
CREATE POLICY "Import jobs writable by importers"
  ON public.student_import_jobs FOR ALL TO authenticated
  USING (organization_id = public.current_admin_org_id() AND public.has_admin_permission('import.execute'))
  WITH CHECK (organization_id = public.current_admin_org_id() AND public.has_admin_permission('import.execute'));

DROP POLICY IF EXISTS "Import errors readable by importers" ON public.student_import_errors;
CREATE POLICY "Import errors readable by importers"
  ON public.student_import_errors FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.student_import_jobs j
    WHERE j.id = student_import_errors.job_id
      AND j.organization_id = public.current_admin_org_id()
      AND public.has_admin_permission('import.execute')
  ));

DROP POLICY IF EXISTS "Import errors writable by importers" ON public.student_import_errors;
CREATE POLICY "Import errors writable by importers"
  ON public.student_import_errors FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.student_import_jobs j
    WHERE j.id = student_import_errors.job_id
      AND j.organization_id = public.current_admin_org_id()
      AND public.has_admin_permission('import.execute')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.student_import_jobs j
    WHERE j.id = student_import_errors.job_id
      AND j.organization_id = public.current_admin_org_id()
      AND public.has_admin_permission('import.execute')
  ));

-- Audit log: staff may append; only audit readers may read.
DROP POLICY IF EXISTS "Audit log append by staff" ON public.admin_audit_log;
CREATE POLICY "Audit log append by staff"
  ON public.admin_audit_log FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.current_admin_org_id() OR public.get_user_role(auth.uid()) = 'super_admin');

DROP POLICY IF EXISTS "Audit log readable by auditors" ON public.admin_audit_log;
CREATE POLICY "Audit log readable by auditors"
  ON public.admin_audit_log FOR SELECT TO authenticated
  USING (public.has_admin_permission('audit.read')
    AND (organization_id = public.current_admin_org_id() OR public.get_user_role(auth.uid()) = 'super_admin'));

-- Skill catalog: global rows + institution rows; managers may edit institution rows.
DROP POLICY IF EXISTS "Skill catalog readable by authenticated" ON public.skill_catalog;
CREATE POLICY "Skill catalog readable by authenticated"
  ON public.skill_catalog FOR SELECT TO authenticated
  USING (organization_id IS NULL OR organization_id = public.current_admin_org_id());

DROP POLICY IF EXISTS "Skill catalog managed by settings writers" ON public.skill_catalog;
CREATE POLICY "Skill catalog managed by settings writers"
  ON public.skill_catalog FOR ALL TO authenticated
  USING (organization_id = public.current_admin_org_id() AND public.has_admin_permission('institution.settings.write'))
  WITH CHECK (organization_id = public.current_admin_org_id() AND public.has_admin_permission('institution.settings.write'));

-- Consent purposes
DROP POLICY IF EXISTS "Consent purposes readable by org members" ON public.consent_purposes;
CREATE POLICY "Consent purposes readable by org members"
  ON public.consent_purposes FOR SELECT TO authenticated
  USING (organization_id = public.current_admin_org_id() OR organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Consent purposes managed by consent writers" ON public.consent_purposes;
CREATE POLICY "Consent purposes managed by consent writers"
  ON public.consent_purposes FOR ALL TO authenticated
  USING (organization_id = public.current_admin_org_id() AND public.has_admin_permission('consent.write'))
  WITH CHECK (organization_id = public.current_admin_org_id() AND public.has_admin_permission('consent.write'));

-- Consent records: own records + authorized staff
DROP POLICY IF EXISTS "Consent records readable by owner" ON public.consent_records;
CREATE POLICY "Consent records readable by owner"
  ON public.consent_records FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Consent records written by owner" ON public.consent_records;
CREATE POLICY "Consent records written by owner"
  ON public.consent_records FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Consent records readable by consent staff" ON public.consent_records;
CREATE POLICY "Consent records readable by consent staff"
  ON public.consent_records FOR SELECT TO authenticated
  USING (organization_id = public.current_admin_org_id() AND public.has_admin_permission('consent.read'));

DROP POLICY IF EXISTS "Consent records managed by consent writers" ON public.consent_records;
CREATE POLICY "Consent records managed by consent writers"
  ON public.consent_records FOR ALL TO authenticated
  USING (organization_id = public.current_admin_org_id() AND public.has_admin_permission('consent.write'))
  WITH CHECK (organization_id = public.current_admin_org_id() AND public.has_admin_permission('consent.write'));

-- Privacy requests
DROP POLICY IF EXISTS "Privacy requests readable by owner" ON public.privacy_requests;
CREATE POLICY "Privacy requests readable by owner"
  ON public.privacy_requests FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Privacy requests created by owner" ON public.privacy_requests;
CREATE POLICY "Privacy requests created by owner"
  ON public.privacy_requests FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Privacy requests managed by consent staff" ON public.privacy_requests;
CREATE POLICY "Privacy requests managed by consent staff"
  ON public.privacy_requests FOR ALL TO authenticated
  USING (organization_id = public.current_admin_org_id() AND public.has_admin_permission('consent.read'))
  WITH CHECK (organization_id = public.current_admin_org_id() AND public.has_admin_permission('consent.read'));

-- Reports
DROP POLICY IF EXISTS "Exports readable by auditors" ON public.report_exports;
CREATE POLICY "Exports readable by auditors"
  ON public.report_exports FOR SELECT TO authenticated
  USING (organization_id = public.current_admin_org_id()
    AND (public.has_admin_permission('reports.export') OR public.has_admin_permission('audit.read')));

DROP POLICY IF EXISTS "Exports recorded by exporters" ON public.report_exports;
CREATE POLICY "Exports recorded by exporters"
  ON public.report_exports FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.current_admin_org_id() AND public.has_admin_permission('reports.export'));

-- Integrations
DROP POLICY IF EXISTS "Integrations readable by settings readers" ON public.integrations;
CREATE POLICY "Integrations readable by settings readers"
  ON public.integrations FOR SELECT TO authenticated
  USING (organization_id = public.current_admin_org_id() AND public.has_admin_permission('institution.settings.read'));

DROP POLICY IF EXISTS "Integrations managed by admins" ON public.integrations;
CREATE POLICY "Integrations managed by admins"
  ON public.integrations FOR ALL TO authenticated
  USING (organization_id = public.current_admin_org_id() AND public.has_admin_permission('integrations.manage'))
  WITH CHECK (organization_id = public.current_admin_org_id() AND public.has_admin_permission('integrations.manage'));

-- ============================================================================
-- 15. RLS — staff read access to existing student tables (defense in depth)
-- ============================================================================
DROP POLICY IF EXISTS "Institution staff can view scoped student profiles" ON public.profiles;
CREATE POLICY "Institution staff can view scoped student profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.can_view_student(id));

DO $$
DECLARE
  t RECORD;
BEGIN
  FOR t IN
    SELECT * FROM (VALUES
      ('skills','user_id'),
      ('projects','user_id'),
      ('education','user_id'),
      ('experiences','user_id'),
      ('certifications','user_id'),
      ('user_progress','user_id'),
      ('assessment_attempts','user_id'),
      ('assessment_answers','user_id'),
      ('attempt_answers','user_id'),
      ('proctor_events','user_id'),
      ('readiness_snapshots','user_id'),
      ('interview_sessions','user_id'),
      ('gd_sessions','user_id'),
      ('resume_scores','user_id'),
      ('resumes','user_id'),
      ('resume_versions','user_id'),
      ('ats_analyses','user_id'),
      ('learning_roadmaps','user_id'),
      ('roadmap_plans','user_id'),
      ('roadmap_tasks','user_id')
    ) AS v(tbl, user_col)
  LOOP
    IF to_regclass('public.' || t.tbl) IS NOT NULL THEN
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Institution staff can view scoped records', t.tbl);
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.can_view_student(%I))',
        'Institution staff can view scoped records', t.tbl, t.user_col
      );
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- 16. Backfill membership for existing students (never duplicates)
-- ============================================================================
INSERT INTO public.organization_members (organization_id, org_id, user_id, role, department_id)
SELECT p.organization_id, p.organization_id, p.id,
       CASE WHEN p.role = 'admin' THEN 'institution_admin' ELSE COALESCE(p.role, 'student') END,
       p.department_id
FROM public.profiles p
WHERE p.organization_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.organization_members m
    WHERE m.user_id = p.id
      AND COALESCE(m.organization_id, m.org_id) = p.organization_id
  )
ON CONFLICT DO NOTHING;
