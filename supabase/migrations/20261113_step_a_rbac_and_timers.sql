-- ==============================================================================
-- PRISM — Placement Readiness Intelligence & Skill Measurement
-- Step A: Minimal RBAC, Organization Members, Server-Authoritative Timers & RLS
-- ==============================================================================

-- 1. Organizations & Roles
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Seed default college organization
INSERT INTO public.organizations (name, code)
VALUES ('PES Institute of Technology and Management', 'PESITM')
ON CONFLICT (code) DO NOTHING;

-- Roles table
CREATE TABLE IF NOT EXISTS public.roles (
  id TEXT PRIMARY KEY,
  description TEXT NOT NULL
);

INSERT INTO public.roles (id, description) VALUES
  ('student', 'Student candidate accessing placement preparation modules'),
  ('tpo', 'Training & Placement Officer / Faculty coordinator with batch access'),
  ('admin', 'Institutional administrator with complete system governance')
ON CONFLICT (id) DO NOTHING;

-- 2. Organization Members (Authoritative Server-Assigned RBAC)
CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL REFERENCES public.roles(id) DEFAULT 'student',
  invited_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CONSTRAINT unique_org_user UNIQUE (organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_members_user ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_role ON public.organization_members(role);

-- 3. Upgrade profiles table role check
ALTER TABLE public.profiles 
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check CHECK (role IN ('student', 'tpo', 'admin'));

-- 4. Server-Authoritative Timers for Interview Sessions
ALTER TABLE public.interview_sessions
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  ADD COLUMN IF NOT EXISTS deadline_at TIMESTAMPTZ DEFAULT (TIMEZONE('utc'::text, NOW()) + INTERVAL '15 minutes') NOT NULL,
  ADD COLUMN IF NOT EXISTS duration_seconds INT DEFAULT 900 NOT NULL;

CREATE INDEX IF NOT EXISTS idx_interview_deadline ON public.interview_sessions(deadline_at);

-- 5. Helper Functions for RBAC
CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- 1. Check organization_members first (primary institutional RBAC)
  SELECT role INTO v_role
  FROM public.organization_members
  WHERE user_id = p_user_id
  LIMIT 1;

  IF v_role IS NOT NULL THEN
    RETURN v_role;
  END IF;

  -- 2. Check profiles table as secondary source
  SELECT role INTO v_role
  FROM public.profiles
  WHERE id = p_user_id;

  RETURN COALESCE(v_role, 'student');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_staff(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.get_user_role(p_user_id) IN ('tpo', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.get_user_role(p_user_id) = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Row Level Security for Organizations & Members
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Roles: Read-only for all authenticated users
CREATE POLICY "Roles are viewable by authenticated users"
  ON public.roles FOR SELECT
  TO authenticated
  USING (true);

-- Organizations: Viewable by members, editable only by admins
CREATE POLICY "Organizations are viewable by authenticated users"
  ON public.organizations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Organizations editable only by admin"
  ON public.organizations FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Organization Members RLS:
-- Users can see their own membership; staff/admins can see their institution's members
CREATE POLICY "Users can view own org membership"
  ON public.organization_members FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR public.is_staff(auth.uid())
  );

-- Only admins/staff can assign or modify organization members
CREATE POLICY "Only admins can insert or update org members"
  ON public.organization_members FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

