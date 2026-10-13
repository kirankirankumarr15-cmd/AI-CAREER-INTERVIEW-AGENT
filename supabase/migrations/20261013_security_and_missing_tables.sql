-- Migration: 20261013_security_and_missing_tables
-- Purpose: Create missing core tables, harden RLS on roadmap tables, and make storage private

-- 1. Create jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company TEXT NOT NULL,
  role_title TEXT NOT NULL,
  description TEXT NOT NULL,
  required_skills TEXT[] DEFAULT ARRAY[]::TEXT[],
  preferred_skills TEXT[] DEFAULT ARRAY[]::TEXT[],
  experience_level TEXT DEFAULT 'Entry Level',
  location TEXT DEFAULT 'Remote / On-site',
  salary_range TEXT,
  eligibility_criteria TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Create job_matches table
CREATE TABLE IF NOT EXISTS job_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  match_score INT NOT NULL,
  strong_matches TEXT[] DEFAULT ARRAY[]::TEXT[],
  partial_matches TEXT[] DEFAULT ARRAY[]::TEXT[],
  missing_skills TEXT[] DEFAULT ARRAY[]::TEXT[],
  recommendations TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Create resumes table
CREATE TABLE IF NOT EXISTS resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  target_role TEXT NOT NULL,
  title TEXT NOT NULL,
  content JSONB NOT NULL,
  ats_score INT DEFAULT 85,
  ats_feedback JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Create applications table
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  status TEXT DEFAULT 'Saved' CHECK (status IN ('Saved', 'Ready to Apply', 'Applied', 'Assessment', 'Interview', 'Shortlisted', 'Offer', 'Rejected')),
  salary TEXT,
  applied_date DATE,
  interview_date DATE,
  job_description TEXT,
  generated_answers JSONB DEFAULT '{}'::jsonb,
  student_approved BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. Create interview_sessions table
CREATE TABLE IF NOT EXISTS interview_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  target_role TEXT NOT NULL,
  interview_type TEXT DEFAULT 'Technical',
  difficulty TEXT DEFAULT 'Intermediate',
  interviewer_mode TEXT DEFAULT 'Professional',
  company_name TEXT,
  overall_score INT,
  technical_score INT,
  communication_score INT,
  confidence_score INT,
  problem_solving_score INT,
  project_score INT,
  hr_score INT,
  strong_areas TEXT[] DEFAULT ARRAY[]::TEXT[],
  weak_areas TEXT[] DEFAULT ARRAY[]::TEXT[],
  recommendations TEXT[] DEFAULT ARRAY[]::TEXT[],
  status TEXT DEFAULT 'In Progress' CHECK (status IN ('In Progress', 'Completed', 'Abandoned')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. Create interview_questions table
CREATE TABLE IF NOT EXISTS interview_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES interview_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  question_number INT NOT NULL,
  question_text TEXT NOT NULL,
  category TEXT DEFAULT 'Technical',
  expected_key_points TEXT[] DEFAULT ARRAY[]::TEXT[],
  student_answer TEXT,
  answer_score INT,
  technical_accuracy INT,
  relevance INT,
  structure_score INT,
  communication_score INT,
  filler_words_detected TEXT[] DEFAULT ARRAY[]::TEXT[],
  estimated_confidence INT,
  speaking_speed TEXT,
  feedback_good TEXT,
  feedback_improvement TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 7. Create learning_roadmaps table
CREATE TABLE IF NOT EXISTS learning_roadmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  topic TEXT NOT NULL,
  category TEXT DEFAULT 'Technical',
  status TEXT DEFAULT 'To Learn' CHECK (status IN ('To Learn', 'In Progress', 'Mastered')),
  estimated_minutes INT DEFAULT 30,
  resources JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on all newly created tables
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_roadmaps ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_job_matches_user ON job_matches(user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_user ON resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_user_status ON applications(user_id, status);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_user ON interview_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_interview_questions_session ON interview_questions(session_id);
CREATE INDEX IF NOT EXISTS idx_learning_roadmaps_user_status ON learning_roadmaps(user_id, status);

-- RLS Policies for new tables
DROP POLICY IF EXISTS "Public read jobs" ON jobs;
CREATE POLICY "Public read jobs" ON jobs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage their job matches" ON job_matches;
CREATE POLICY "Users can manage their job matches" ON job_matches FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their resumes" ON resumes;
CREATE POLICY "Users can manage their resumes" ON resumes FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their applications" ON applications;
CREATE POLICY "Users can manage their applications" ON applications FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their interview sessions" ON interview_sessions;
CREATE POLICY "Users can manage their interview sessions" ON interview_sessions FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their interview questions" ON interview_questions;
CREATE POLICY "Users can manage their interview questions" ON interview_questions FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their learning roadmaps" ON learning_roadmaps;
CREATE POLICY "Users can manage their learning roadmaps" ON learning_roadmaps FOR ALL USING (auth.uid() = user_id);

-- Harden RLS on existing roadmap tables (replacing leaky qual: true)
DROP POLICY IF EXISTS "Users can manage their own roadmaps" ON roadmaps;
CREATE POLICY "Users can manage their own roadmaps" ON roadmaps FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their roadmap phases" ON roadmap_phases;
CREATE POLICY "Users can manage their roadmap phases" ON roadmap_phases FOR ALL USING (
  EXISTS (SELECT 1 FROM roadmaps WHERE roadmaps.id = roadmap_phases.roadmap_id AND roadmaps.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can manage their roadmap tasks" ON roadmap_tasks;
CREATE POLICY "Users can manage their roadmap tasks" ON roadmap_tasks FOR ALL USING (auth.uid() = user_id);

-- Harden Storage Bucket: Private bucket and owner-only signed access
UPDATE storage.buckets SET public = false WHERE id = 'resumes';

DROP POLICY IF EXISTS "Public can read resumes" ON storage.objects;
DROP POLICY IF EXISTS "Users can read their own resumes" ON storage.objects;

CREATE POLICY "Users can read their own resumes"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);
