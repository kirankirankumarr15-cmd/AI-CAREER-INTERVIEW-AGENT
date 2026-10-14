-- Migration: ATS Score Checker & ATS-Friendly Resume Builder
-- Tables: resume_versions, resume_files, jd_cache, ats_analyses

-- 1. resume_versions table
CREATE TABLE IF NOT EXISTS resume_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  template TEXT NOT NULL DEFAULT 'standard_single_column',
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  source TEXT NOT NULL DEFAULT 'builder' CHECK (source IN ('builder', 'upload', 'tailored')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. resume_files table for generated & uploaded files (PDF, DOCX, TXT)
CREATE TABLE IF NOT EXISTS resume_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID REFERENCES resume_versions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  storage_path TEXT NOT NULL,
  format TEXT NOT NULL CHECK (format IN ('pdf', 'docx', 'txt')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. jd_cache table for caching extracted JD requirements
CREATE TABLE IF NOT EXISTS jd_cache (
  jd_hash TEXT PRIMARY KEY,
  extracted_requirements JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. ats_analyses table for tracking ATS audits
CREATE TABLE IF NOT EXISTS ats_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  resume_version_id UUID REFERENCES resume_versions(id) ON DELETE SET NULL,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  jd_text TEXT NOT NULL,
  jd_hash TEXT NOT NULL,
  score_total INT NOT NULL,
  breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
  keywords JSONB NOT NULL DEFAULT '{}'::jsonb,
  issues JSONB NOT NULL DEFAULT '[]'::jsonb,
  suggestions JSONB NOT NULL DEFAULT '[]'::jsonb,
  model_info TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. Link resume_version_id to applications table
ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS resume_version_id UUID REFERENCES resume_versions(id) ON DELETE SET NULL;

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_resume_versions_user ON resume_versions (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_resume_files_version ON resume_files (version_id);
CREATE INDEX IF NOT EXISTS idx_ats_analyses_user ON ats_analyses (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ats_analyses_version ON ats_analyses (resume_version_id);
CREATE INDEX IF NOT EXISTS idx_ats_analyses_hash ON ats_analyses (jd_hash);

-- 7. RLS Policies
ALTER TABLE resume_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE jd_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE ats_analyses ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- resume_versions
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'resume_versions' AND policyname = 'Users can manage their own resume versions') THEN
    CREATE POLICY "Users can manage their own resume versions" ON resume_versions FOR ALL USING (auth.uid() = user_id);
  END IF;

  -- resume_files
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'resume_files' AND policyname = 'Users can manage their own resume files') THEN
    CREATE POLICY "Users can manage their own resume files" ON resume_files FOR ALL USING (auth.uid() = user_id);
  END IF;

  -- ats_analyses
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ats_analyses' AND policyname = 'Users can manage their own ats analyses') THEN
    CREATE POLICY "Users can manage their own ats analyses" ON ats_analyses FOR ALL USING (auth.uid() = user_id);
  END IF;

  -- jd_cache (accessible to all authenticated users for performance)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'jd_cache' AND policyname = 'Authenticated users can access jd cache') THEN
    CREATE POLICY "Authenticated users can access jd cache" ON jd_cache FOR ALL USING (auth.role() = 'authenticated');
  END IF;
END $$;
