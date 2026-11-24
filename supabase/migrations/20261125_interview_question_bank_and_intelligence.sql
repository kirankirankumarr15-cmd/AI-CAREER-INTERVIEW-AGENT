-- PRISM Interview Intelligence & Structured Question Bank Migration
-- Module: Adaptive AI Interviewer Engine

CREATE TABLE IF NOT EXISTS public.interview_question_bank (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL,
  company_tag TEXT,
  interview_type TEXT NOT NULL,
  category TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  question_text TEXT NOT NULL,
  expected_concepts JSONB NOT NULL DEFAULT '[]'::jsonb,
  evaluation_criteria JSONB NOT NULL DEFAULT '{}'::jsonb,
  model_answer TEXT NOT NULL,
  adaptive_harder TEXT,
  adaptive_easier TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_iqb_role_type ON public.interview_question_bank(role, interview_type);
CREATE INDEX IF NOT EXISTS idx_iqb_difficulty ON public.interview_question_bank(difficulty);
CREATE INDEX IF NOT EXISTS idx_iqb_category ON public.interview_question_bank(category);
CREATE INDEX IF NOT EXISTS idx_iqb_company ON public.interview_question_bank(company_tag);

-- Ensure interview_turns has full rubric evaluation columns
ALTER TABLE public.interview_turns ADD COLUMN IF NOT EXISTS technical_accuracy INT;
ALTER TABLE public.interview_turns ADD COLUMN IF NOT EXISTS relevance INT;
ALTER TABLE public.interview_turns ADD COLUMN IF NOT EXISTS communication_clarity INT;
ALTER TABLE public.interview_turns ADD COLUMN IF NOT EXISTS answer_structure INT;
ALTER TABLE public.interview_turns ADD COLUMN IF NOT EXISTS problem_solving INT;
ALTER TABLE public.interview_turns ADD COLUMN IF NOT EXISTS feedback_evidence TEXT;
ALTER TABLE public.interview_turns ADD COLUMN IF NOT EXISTS feedback_improvement TEXT;

-- Ensure interview_sessions has adaptive tracking columns
ALTER TABLE public.interview_sessions ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE public.interview_sessions ADD COLUMN IF NOT EXISTS difficulty_progression JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.interview_sessions ADD COLUMN IF NOT EXISTS adaptive_level TEXT DEFAULT 'Intermediate';
