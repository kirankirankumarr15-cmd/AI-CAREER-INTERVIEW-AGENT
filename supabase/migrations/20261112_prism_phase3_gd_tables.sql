-- ==============================================================================
-- PRISM — Placement Readiness Intelligence & Skill Measurement
-- Phase 3: Group Discussion (GD) Schema & Indexes & RLS
-- ==============================================================================

-- 1. Upgrade gd_sessions with lifecycle columns
ALTER TABLE public.gd_sessions 
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  ADD COLUMN IF NOT EXISTS duration_seconds INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- 2. Create gd_participants Table (Human + AI Moderator + AI Participant Bots)
CREATE TABLE IF NOT EXISTS public.gd_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.gd_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('moderator', 'human', 'bot')),
  name TEXT NOT NULL,
  persona TEXT,
  stance TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Create gd_turns Table (Speech/Text utterances in strict sequence)
CREATE TABLE IF NOT EXISTS public.gd_turns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.gd_sessions(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES public.gd_participants(id) ON DELETE CASCADE,
  speaker_name TEXT NOT NULL,
  speaker_role TEXT NOT NULL CHECK (speaker_role IN ('moderator', 'human', 'bot')),
  turn_index INT NOT NULL,
  content TEXT NOT NULL,
  input_method TEXT DEFAULT 'voice' CHECK (input_method IN ('voice', 'text', 'system')),
  duration_seconds INT DEFAULT 0,
  timestamp_ms BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Create gd_evaluations Table (Post-session 4-metric evidence-backed rubric)
CREATE TABLE IF NOT EXISTS public.gd_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.gd_sessions(id) ON DELETE CASCADE UNIQUE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content_score INT NOT NULL CHECK (content_score BETWEEN 0 AND 100),
  clarity_score INT NOT NULL CHECK (clarity_score BETWEEN 0 AND 100),
  initiative_score INT NOT NULL CHECK (initiative_score BETWEEN 0 AND 100),
  listening_score INT NOT NULL CHECK (listening_score BETWEEN 0 AND 100),
  overall_score INT NOT NULL CHECK (overall_score BETWEEN 0 AND 100),
  evidence_quotes JSONB NOT NULL DEFAULT '[]'::jsonb,
  strengths TEXT[] DEFAULT ARRAY[]::TEXT[],
  improvement_tips TEXT[] DEFAULT ARRAY[]::TEXT[],
  model_contributions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. Foreign Key & Performance Indexes
CREATE INDEX IF NOT EXISTS idx_gd_participants_session ON public.gd_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_gd_turns_session_index ON public.gd_turns(session_id, turn_index ASC);
CREATE INDEX IF NOT EXISTS idx_gd_evaluations_user ON public.gd_evaluations(user_id);
CREATE INDEX IF NOT EXISTS idx_gd_sessions_user_status ON public.gd_sessions(user_id, status);

-- 6. Row Level Security Policies
ALTER TABLE public.gd_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gd_turns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gd_evaluations ENABLE ROW LEVEL SECURITY;

-- gd_participants RLS
CREATE POLICY "Users can manage participants of their GD sessions"
  ON public.gd_participants
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.gd_sessions s
      WHERE s.id = gd_participants.session_id
        AND (s.user_id = auth.uid() OR public.is_admin(auth.uid()))
    )
  );

-- gd_turns RLS
CREATE POLICY "Users can view and insert turns of their GD sessions"
  ON public.gd_turns
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.gd_sessions s
      WHERE s.id = gd_turns.session_id
        AND (s.user_id = auth.uid() OR public.is_admin(auth.uid()))
    )
  );

-- gd_evaluations RLS
CREATE POLICY "Users can view their own GD evaluations"
  ON public.gd_evaluations
  FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Users and system can insert their own GD evaluations"
  ON public.gd_evaluations
  FOR INSERT
  WITH CHECK (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Users and system can update their own GD evaluations"
  ON public.gd_evaluations
  FOR UPDATE
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

