-- Core Profile and Portfolio Tables

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  location TEXT,
  college TEXT,
  branch TEXT,
  graduation_year INTEGER,
  cgpa DECIMAL(3, 2),
  github_url TEXT,
  linkedin_url TEXT,
  portfolio_url TEXT,
  target_role TEXT,
  target_companies TEXT[],
  preferred_locations TEXT[],
  readiness_score INTEGER DEFAULT 0,
  verification_status TEXT DEFAULT 'Unverified',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS education (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  institution TEXT NOT NULL,
  degree TEXT NOT NULL,
  field_of_study TEXT NOT NULL,
  start_year INTEGER,
  end_year INTEGER,
  cgpa DECIMAL(3, 2),
  verification_status TEXT DEFAULT 'Unverified',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  proficiency TEXT NOT NULL,
  verification_status TEXT DEFAULT 'Unverified',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  tech_stack TEXT[],
  architecture_summary TEXT,
  student_contribution TEXT,
  github_url TEXT,
  live_url TEXT,
  key_challenges TEXT[],
  verification_status TEXT DEFAULT 'Unverified',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  location TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  is_current BOOLEAN DEFAULT false,
  description TEXT,
  achievements TEXT[],
  verification_status TEXT DEFAULT 'Unverified',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  issuer TEXT NOT NULL,
  issue_date DATE NOT NULL,
  credential_url TEXT,
  verification_status TEXT DEFAULT 'Unverified',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Progress & Tracking Table
CREATE TABLE IF NOT EXISTS user_progress (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  technical_knowledge INTEGER DEFAULT 0,
  communication_score INTEGER DEFAULT 0,
  confidence_score INTEGER DEFAULT 0,
  dsa_score INTEGER DEFAULT 0,
  dbms_score INTEGER DEFAULT 0,
  os_score INTEGER DEFAULT 0,
  oop_score INTEGER DEFAULT 0,
  projects_score INTEGER DEFAULT 0,
  resume_score INTEGER DEFAULT 0,
  weak_areas TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS Policies (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE education ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Allow users to only access their own data
CREATE POLICY "Users can manage their own profile" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users can manage their own education" ON education FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own skills" ON skills FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own projects" ON projects FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own experiences" ON experiences FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own certifications" ON certifications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own progress" ON user_progress FOR ALL USING (auth.uid() = user_id);
