-- ==============================================================================
-- PRISM — Placement Readiness Intelligence & Skill Measurement
-- Phase 1: Core Database Schema, Profiles, Roles, and Row Level Security (RLS)
-- ==============================================================================

-- 1. Create Profiles Table (Stores Students & Placement Cell Admins)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  college TEXT DEFAULT 'PESITM Shivamogga',
  branch TEXT DEFAULT 'Computer Science & Engineering',
  year INT DEFAULT 4 CHECK (year BETWEEN 1 AND 5),
  cgpa NUMERIC(4,2) DEFAULT 0.0,
  phone TEXT,
  location TEXT,
  avatar_url TEXT,
  skills TEXT[] DEFAULT ARRAY[]::TEXT[],
  target_roles TEXT[] DEFAULT ARRAY['Software Developer']::TEXT[],
  target_companies TEXT[] DEFAULT ARRAY[]::TEXT[],
  profile_completion_percentage INT DEFAULT 20 CHECK (profile_completion_percentage BETWEEN 0 AND 100),
  readiness_score INT DEFAULT 0 CHECK (readiness_score BETWEEN 0 AND 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Supporting PRISM Tables (Prepared for Subsequent Modules)

-- Career Audit (Module 2)
CREATE TABLE IF NOT EXISTS public.career_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_role TEXT NOT NULL,
  sector_alignment JSONB DEFAULT '{}'::jsonb,
  skill_gaps JSONB DEFAULT '[]'::jsonb,
  expected_salary_range JSONB DEFAULT '{}'::jsonb,
  competitiveness_summary TEXT,
  radar_scores JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Resumes & Resume Builder (Module 3 & 5)
CREATE TABLE IF NOT EXISTS public.resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Primary Resume',
  template TEXT DEFAULT 'modern' CHECK (template IN ('modern', 'classic', 'minimal')),
  personal_info JSONB DEFAULT '{}'::jsonb,
  education JSONB DEFAULT '[]'::jsonb,
  projects JSONB DEFAULT '[]'::jsonb,
  experience JSONB DEFAULT '[]'::jsonb,
  skills JSONB DEFAULT '[]'::jsonb,
  certifications JSONB DEFAULT '[]'::jsonb,
  achievements JSONB DEFAULT '[]'::jsonb,
  ats_score INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ResumeScore ATS 34-Checkpoint Evaluations (Module 4)
CREATE TABLE IF NOT EXISTS public.resume_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  resume_id UUID REFERENCES public.resumes(id) ON DELETE SET NULL,
  total_score INT NOT NULL CHECK (total_score BETWEEN 0 AND 100),
  checkpoints JSONB NOT NULL DEFAULT '[]'::jsonb, -- 34 checkpoints with pass/fail/fix suggestions
  formatting_score INT DEFAULT 0,
  keywords_score INT DEFAULT 0,
  bullet_quality_score INT DEFAULT 0,
  completeness_score INT DEFAULT 0,
  readability_score INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- InterviewAI Sessions (Module 6)
CREATE TABLE IF NOT EXISTS public.interview_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  interview_type TEXT NOT NULL CHECK (interview_type IN ('HR', 'Technical', 'Resume-based')),
  target_role TEXT NOT NULL,
  communication_score INT DEFAULT 0,
  technical_accuracy_score INT DEFAULT 0,
  structure_score INT DEFAULT 0,
  confidence_score INT DEFAULT 0,
  overall_score INT DEFAULT 0,
  feedback_summary TEXT,
  session_history JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Group Discussion Sessions (Module 7)
CREATE TABLE IF NOT EXISTS public.gd_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  content_score INT DEFAULT 0,
  clarity_score INT DEFAULT 0,
  initiative_score INT DEFAULT 0,
  listening_score INT DEFAULT 0,
  overall_score INT DEFAULT 0,
  turns JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Question Bank (Module 8 - Assessments)
CREATE TABLE IF NOT EXISTS public.question_bank (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN ('Aptitude', 'Logical', 'Verbal', 'Coding')),
  topic TEXT NOT NULL,
  company_tag TEXT,
  question TEXT NOT NULL,
  options JSONB NOT NULL, -- Array of strings
  correct_option INT NOT NULL,
  explanation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Assessment Submissions (Module 8)
CREATE TABLE IF NOT EXISTS public.assessment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  total_questions INT NOT NULL,
  correct_count INT NOT NULL,
  score_percentage NUMERIC(5,2) NOT NULL,
  tab_switch_count INT DEFAULT 0,
  answers JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Readiness Index (Module 9)
CREATE TABLE IF NOT EXISTS public.readiness_indices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  overall_index NUMERIC(5,2) NOT NULL CHECK (overall_index BETWEEN 0 AND 100),
  assessment_weight INT DEFAULT 25,
  resume_weight INT DEFAULT 20,
  interview_weight INT DEFAULT 25,
  gd_weight INT DEFAULT 15,
  profile_weight INT DEFAULT 15,
  skill_breakdown JSONB DEFAULT '{}'::jsonb,
  priority_improvements TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 90-Day Roadmap (Module 10)
CREATE TABLE IF NOT EXISTS public.roadmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_role TEXT NOT NULL,
  current_readiness INT DEFAULT 0,
  weekly_goals JSONB DEFAULT '[]'::jsonb, -- 12 weeks with daily tasks, resources & checkboxes
  completed_tasks TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==============================================================================
-- 3. Row Level Security (RLS) Policies
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gd_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.readiness_indices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmaps ENABLE ROW LEVEL SECURITY;

-- Helper Function: Check if user is an Admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles Policies
DROP POLICY IF EXISTS "Users can view their own profile or admins view all" ON public.profiles;
CREATE POLICY "Users can view their own profile or admins view all"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can insert student profiles" ON public.profiles;
CREATE POLICY "Admins can insert student profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id OR public.is_admin(auth.uid()));

-- Student Ownership Policies across modules (Read/Write own data)
CREATE POLICY "Students view own career audit" ON public.career_audits FOR ALL
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Students manage own resumes" ON public.resumes FOR ALL
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Students view own resume scores" ON public.resume_scores FOR ALL
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Students view own interview sessions" ON public.interview_sessions FOR ALL
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Students view own gd sessions" ON public.gd_sessions FOR ALL
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Anyone authenticated can view questions" ON public.question_bank FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Admins manage questions" ON public.question_bank FOR ALL
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Students view own assessments" ON public.assessment_submissions FOR ALL
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Students view own readiness index" ON public.readiness_indices FOR ALL
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Students view own roadmap" ON public.roadmaps FOR ALL
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

