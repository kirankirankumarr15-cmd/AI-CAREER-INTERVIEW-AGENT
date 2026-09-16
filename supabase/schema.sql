-- CareerPilot AI Complete Database Schema

-- Users / Profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  location TEXT,
  avatar_url TEXT,
  target_role TEXT DEFAULT 'Software Developer',
  target_companies TEXT[] DEFAULT ARRAY[]::TEXT[],
  preferred_locations TEXT[] DEFAULT ARRAY[]::TEXT[],
  readiness_score INT DEFAULT 65,
  verification_status TEXT DEFAULT 'Needs Review' CHECK (verification_status IN ('Verified', 'Unverified', 'Needs Review')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Education
CREATE TABLE IF NOT EXISTS education (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  institution TEXT NOT NULL,
  degree TEXT NOT NULL,
  field_of_study TEXT NOT NULL,
  start_year INT,
  end_year INT,
  cgpa NUMERIC(4,2),
  verification_status TEXT DEFAULT 'Unverified' CHECK (verification_status IN ('Verified', 'Unverified', 'Needs Review')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Skills
CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'Technical', -- Technical, Framework, Tool, Soft
  proficiency TEXT DEFAULT 'Intermediate', -- Beginner, Intermediate, Advanced, Expert
  verification_status TEXT DEFAULT 'Unverified' CHECK (verification_status IN ('Verified', 'Unverified', 'Needs Review')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Projects
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  tech_stack TEXT[] DEFAULT ARRAY[]::TEXT[],
  architecture_summary TEXT,
  student_contribution TEXT,
  github_url TEXT,
  live_url TEXT,
  key_challenges TEXT[] DEFAULT ARRAY[]::TEXT[],
  verification_status TEXT DEFAULT 'Unverified' CHECK (verification_status IN ('Verified', 'Unverified', 'Needs Review')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Experiences / Internships
CREATE TABLE IF NOT EXISTS experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  location TEXT,
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN DEFAULT FALSE,
  description TEXT,
  achievements TEXT[] DEFAULT ARRAY[]::TEXT[],
  verification_status TEXT DEFAULT 'Unverified' CHECK (verification_status IN ('Verified', 'Unverified', 'Needs Review')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Certifications
CREATE TABLE IF NOT EXISTS certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  issuer TEXT NOT NULL,
  issue_date DATE,
  credential_url TEXT,
  verification_status TEXT DEFAULT 'Unverified' CHECK (verification_status IN ('Verified', 'Unverified', 'Needs Review')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Documents & OCR
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  doc_type TEXT DEFAULT 'Resume', -- Resume, Marks Card, Degree, Certificate, Internship, Project Report
  extracted_data JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Processing', 'Extracted', 'Confirmed', 'Rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Job Descriptions & Matching
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company TEXT NOT NULL,
  role_title TEXT NOT NULL,
  description TEXT NOT NULL,
  required_skills TEXT[] DEFAULT ARRAY[]::TEXT[],
  preferred_skills TEXT[] DEFAULT ARRAY[]::TEXT[],
  experience_level TEXT DEFAULT 'Entry Level',
  location TEXT DEFAULT 'Remote / On-site',
  eligibility_criteria TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

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

-- Resumes
CREATE TABLE IF NOT EXISTS resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  target_role TEXT NOT NULL,
  title TEXT NOT NULL,
  content JSONB NOT NULL, -- Structured JSON resume object
  ats_score INT DEFAULT 85,
  ats_feedback JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Applications Tracker
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  status TEXT DEFAULT 'Saved' CHECK (status IN ('Saved', 'Ready to Apply', 'Applied', 'Assessment', 'Interview', 'Shortlisted', 'Offer', 'Rejected')),
  applied_date DATE,
  interview_date DATE,
  job_description TEXT,
  generated_answers JSONB DEFAULT '{}'::jsonb,
  student_approved BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Interview Sessions & Feedback
CREATE TABLE IF NOT EXISTS interview_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  target_role TEXT NOT NULL,
  interview_type TEXT DEFAULT 'Technical', -- Technical, HR, Behavioral, DSA, Project, Full, Company Simulation
  difficulty TEXT DEFAULT 'Intermediate', -- Beginner, Intermediate, Advanced
  interviewer_mode TEXT DEFAULT 'Professional', -- Friendly, Professional, Strict, Pressure
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

CREATE TABLE IF NOT EXISTS interview_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES interview_sessions(id) ON DELETE CASCADE NOT NULL,
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
  speaking_speed TEXT, -- Too Slow, Optimal, Too Fast
  feedback_good TEXT,
  feedback_improvement TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Learning Roadmaps & Progress
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

CREATE TABLE IF NOT EXISTS user_progress (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  questions_solved INT DEFAULT 0,
  interviews_completed INT DEFAULT 0,
  daily_streak INT DEFAULT 1,
  last_active_date DATE DEFAULT CURRENT_DATE,
  technical_overall INT DEFAULT 70,
  communication_overall INT DEFAULT 75,
  confidence_overall INT DEFAULT 70,
  resume_ats_score INT DEFAULT 85,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
