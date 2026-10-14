-- Migration: 20261014_phase0_interviewer_engine
-- Purpose: Extend interview tables for real turn-based dialog management (F21),
--          add interview_memory and interview_turn_events (RLS on all).

-- =====================================================================
-- 1. Extend interview_sessions with dialog engine fields
-- =====================================================================
ALTER TABLE interview_sessions
  ADD COLUMN IF NOT EXISTS session_mode TEXT DEFAULT 'solo'
    CHECK (session_mode IN ('solo', 'panel', 'peer', 'first_timer')),
  ADD COLUMN IF NOT EXISTS panel_config JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS turn_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dialog_state TEXT DEFAULT 'not_started'
    CHECK (dialog_state IN ('not_started','greeting','questioning','follow_up',
                            'transition','closing','completed','error')),
  ADD COLUMN IF NOT EXISTS resumed_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS finished_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS ai_persona JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS silence_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS off_topic_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS session_metadata JSONB DEFAULT '{}'::jsonb;

-- =====================================================================
-- 2. Extend interview_questions with turn-based dialog fields
-- =====================================================================
ALTER TABLE interview_questions
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS turn_index INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dialog_move TEXT DEFAULT 'ask'
    CHECK (dialog_move IN ('greeting','ask','follow_up','clarify','acknowledge',
                           'probe','transition','closing','nudge')),
  ADD COLUMN IF NOT EXISTS is_follow_up BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS parent_question_id UUID REFERENCES interview_questions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS ai_tone_note TEXT,
  ADD COLUMN IF NOT EXISTS answer_quality TEXT
    CHECK (answer_quality IN ('strong','partial','weak','off_topic','silence','repeat',
                              'false_claim','one_word','rambling',NULL)),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- =====================================================================
-- 3. interview_memory — per-session AI short-term memory
--    Stores topics covered, weak spots detected, question IDs used
--    so the dialog manager never repeats.
-- =====================================================================
CREATE TABLE IF NOT EXISTS interview_memory (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    UUID REFERENCES interview_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id       UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  topics_asked  TEXT[]  DEFAULT ARRAY[]::TEXT[],
  questions_asked TEXT[] DEFAULT ARRAY[]::TEXT[], -- question texts (dedup guard)
  weak_areas_detected TEXT[] DEFAULT ARRAY[]::TEXT[],
  strong_areas_detected TEXT[] DEFAULT ARRAY[]::TEXT[],
  false_claims_flagged TEXT[] DEFAULT ARRAY[]::TEXT[],
  total_turns   INT     DEFAULT 0,
  last_move     TEXT    DEFAULT 'greeting',
  context_window JSONB  DEFAULT '[]'::jsonb, -- last N turns for LLM context
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_interview_memory_session
  ON interview_memory(session_id);

-- =====================================================================
-- 4. interview_turn_events — audit log for each dialog turn
-- =====================================================================
CREATE TABLE IF NOT EXISTS interview_turn_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    UUID REFERENCES interview_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id       UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  question_id   UUID REFERENCES interview_questions(id) ON DELETE SET NULL,
  turn_index    INT  NOT NULL,
  event_type    TEXT NOT NULL
    CHECK (event_type IN ('question_delivered','answer_received','follow_up_triggered',
                          'silence_nudge','off_topic_detected','barge_in_detected',
                          'repeat_request','provider_fallback','session_resumed',
                          'session_completed','error')),
  event_data    JSONB DEFAULT '{}'::jsonb,
  latency_ms    INT,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_turn_events_session
  ON interview_turn_events(session_id, turn_index);

CREATE INDEX IF NOT EXISTS idx_turn_events_user
  ON interview_turn_events(user_id);

-- =====================================================================
-- 5. RLS on new tables
-- =====================================================================
ALTER TABLE interview_memory     ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_turn_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their interview memory" ON interview_memory;
CREATE POLICY "Users can manage their interview memory"
  ON interview_memory FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their turn events" ON interview_turn_events;
CREATE POLICY "Users can manage their turn events"
  ON interview_turn_events FOR ALL USING (auth.uid() = user_id);

-- Re-assert RLS on interview_questions (user_id column now populated)
DROP POLICY IF EXISTS "Users can manage their interview questions" ON interview_questions;
CREATE POLICY "Users can manage their interview questions"
  ON interview_questions FOR ALL USING (auth.uid() = user_id);

-- =====================================================================
-- 6. Phase 1 — F1: Aptitude & Reasoning Practice tables
-- =====================================================================
CREATE TABLE IF NOT EXISTS aptitude_questions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category      TEXT NOT NULL CHECK (category IN ('Quantitative','Logical','Verbal')),
  topic         TEXT NOT NULL,
  difficulty    TEXT NOT NULL CHECK (difficulty IN ('Easy','Medium','Hard')),
  question_text TEXT NOT NULL,
  options       JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{label:"A",text:"..."}]
  correct_option TEXT NOT NULL,
  explanation   TEXT NOT NULL,
  source_type   TEXT DEFAULT 'AI-generated'
    CHECK (source_type IN ('AI-generated','Authored','Validated')),
  confidence    NUMERIC(3,2) DEFAULT 1.00, -- 0.00-1.00; <0.7 flagged for review
  flagged_review BOOLEAN DEFAULT FALSE,
  solve_verified BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS aptitude_attempts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  attempt_type  TEXT DEFAULT 'drill' CHECK (attempt_type IN ('drill','full_test')),
  category      TEXT,
  topic         TEXT,
  started_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  finished_at   TIMESTAMP WITH TIME ZONE,
  total_questions INT DEFAULT 0,
  correct_count   INT DEFAULT 0,
  score_percent   NUMERIC(5,2),
  time_taken_secs INT DEFAULT 0,
  negative_marking BOOLEAN DEFAULT FALSE,
  status        TEXT DEFAULT 'in_progress'
    CHECK (status IN ('in_progress','completed','abandoned'))
);

CREATE TABLE IF NOT EXISTS aptitude_answers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id    UUID REFERENCES aptitude_attempts(id) ON DELETE CASCADE NOT NULL,
  user_id       UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  question_id   UUID REFERENCES aptitude_questions(id) ON DELETE CASCADE NOT NULL,
  selected_option TEXT,
  is_correct    BOOLEAN,
  is_marked_review BOOLEAN DEFAULT FALSE,
  time_taken_secs INT DEFAULT 0,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE aptitude_questions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE aptitude_attempts   ENABLE ROW LEVEL SECURITY;
ALTER TABLE aptitude_answers    ENABLE ROW LEVEL SECURITY;

-- Questions are readable by all authenticated users
DROP POLICY IF EXISTS "Authenticated users can read aptitude questions" ON aptitude_questions;
CREATE POLICY "Authenticated users can read aptitude questions"
  ON aptitude_questions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can manage their aptitude attempts" ON aptitude_attempts;
CREATE POLICY "Users can manage their aptitude attempts"
  ON aptitude_attempts FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their aptitude answers" ON aptitude_answers;
CREATE POLICY "Users can manage their aptitude answers"
  ON aptitude_answers FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_aptitude_q_cat_topic  ON aptitude_questions(category, topic, difficulty);
CREATE INDEX IF NOT EXISTS idx_aptitude_attempts_user ON aptitude_attempts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_aptitude_answers_attempt ON aptitude_answers(attempt_id);

-- =====================================================================
-- 7. Phase 1 — F9: Coding Platform Stats tables
-- =====================================================================
CREATE TABLE IF NOT EXISTS coding_profiles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  platform      TEXT NOT NULL CHECK (platform IN ('LeetCode','CodeChef','Codeforces','GitHub')),
  username      TEXT NOT NULL,
  stats         JSONB DEFAULT '{}'::jsonb,
  fetched_at    TIMESTAMP WITH TIME ZONE,
  status        TEXT DEFAULT 'pending'
    CHECK (status IN ('pending','active','error','manual')),
  data_source   TEXT DEFAULT 'api'
    CHECK (data_source IN ('api','manual','screenshot')),
  verification_level TEXT DEFAULT 'Unverified'
    CHECK (verification_level IN ('Unverified','Student-Promoted','Verified')),
  last_error    TEXT,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, platform)
);

ALTER TABLE coding_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their coding profiles" ON coding_profiles;
CREATE POLICY "Users can manage their coding profiles"
  ON coding_profiles FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_coding_profiles_user ON coding_profiles(user_id);

-- =====================================================================
-- 8. Phase 1 — F13: TPO Dashboard tables
-- =====================================================================
CREATE TABLE IF NOT EXISTS organizations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  short_code    TEXT UNIQUE NOT NULL,
  org_type      TEXT DEFAULT 'college'
    CHECK (org_type IN ('college','company','bootcamp')),
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS organization_members (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  user_id       UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('student','tpo','admin')),
  joined_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(org_id, user_id)
);

CREATE TABLE IF NOT EXISTS batches (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name          TEXT NOT NULL,  -- e.g. "2026 CS-A"
  branch        TEXT,
  graduation_year INT,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS batch_members (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id      UUID REFERENCES batches(id) ON DELETE CASCADE NOT NULL,
  user_id       UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  UNIQUE(batch_id, user_id)
);

CREATE TABLE IF NOT EXISTS consent_grants (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  org_id        UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  granted_scopes TEXT[] DEFAULT ARRAY[]::TEXT[], -- ['readiness_score','weak_areas','interview_count']
  granted_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  revoked_at    TIMESTAMP WITH TIME ZONE,
  is_active     BOOLEAN GENERATED ALWAYS AS (revoked_at IS NULL) STORED,
  UNIQUE(user_id, org_id)
);

CREATE TABLE IF NOT EXISTS drives (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  company       TEXT NOT NULL,
  role_title    TEXT NOT NULL,
  drive_date    DATE,
  eligibility   TEXT,
  description   TEXT,
  status        TEXT DEFAULT 'upcoming'
    CHECK (status IN ('upcoming','active','completed','cancelled')),
  created_by    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- TPO audit log
CREATE TABLE IF NOT EXISTS tpo_audit_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tpo_user_id   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  org_id        UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  action        TEXT NOT NULL, -- 'view_batch_stats','view_student_detail','export_report'
  target_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  metadata      JSONB DEFAULT '{}'::jsonb,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE organizations         ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members  ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches               ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_members         ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_grants        ENABLE ROW LEVEL SECURITY;
ALTER TABLE drives                ENABLE ROW LEVEL SECURITY;
ALTER TABLE tpo_audit_log         ENABLE ROW LEVEL SECURITY;

-- Organizations: readable by members
DROP POLICY IF EXISTS "Org members can read their org" ON organizations;
CREATE POLICY "Org members can read their org"
  ON organizations FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.org_id = organizations.id AND om.user_id = auth.uid()
    )
  );

-- Organization members: visible to members of the same org
DROP POLICY IF EXISTS "Members can see org membership" ON organization_members;
CREATE POLICY "Members can see org membership"
  ON organization_members FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM organization_members om2
      WHERE om2.org_id = organization_members.org_id
        AND om2.user_id = auth.uid()
        AND om2.role IN ('tpo','admin')
    )
  );

-- TPOs/admins can insert/update members
DROP POLICY IF EXISTS "TPO can manage org members" ON organization_members;
CREATE POLICY "TPO can manage org members"
  ON organization_members FOR ALL USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.org_id = organization_members.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('tpo','admin')
    )
  );

-- Batches: visible to org members
DROP POLICY IF EXISTS "Org members can read batches" ON batches;
CREATE POLICY "Org members can read batches"
  ON batches FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.org_id = batches.org_id AND om.user_id = auth.uid()
    )
  );

-- Batch members: student sees their own rows; TPO sees all in org
DROP POLICY IF EXISTS "Users can see batch membership" ON batch_members;
CREATE POLICY "Users can see batch membership"
  ON batch_members FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM batches b
      JOIN organization_members om ON om.org_id = b.org_id
      WHERE b.id = batch_members.batch_id
        AND om.user_id = auth.uid()
        AND om.role IN ('tpo','admin')
    )
  );

-- Consent grants: user manages their own; TPO reads (only active)
DROP POLICY IF EXISTS "Users manage their own consents" ON consent_grants;
CREATE POLICY "Users manage their own consents"
  ON consent_grants FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "TPO can read active consents" ON consent_grants;
CREATE POLICY "TPO can read active consents"
  ON consent_grants FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.org_id = consent_grants.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('tpo','admin')
    ) AND revoked_at IS NULL
  );

-- Drives: org members read; TPO/admin write
DROP POLICY IF EXISTS "Org members can read drives" ON drives;
CREATE POLICY "Org members can read drives"
  ON drives FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.org_id = drives.org_id AND om.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "TPO can manage drives" ON drives;
CREATE POLICY "TPO can manage drives"
  ON drives FOR ALL USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.org_id = drives.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('tpo','admin')
    )
  );

-- TPO audit log: only admins can read their org logs
DROP POLICY IF EXISTS "Admins can read audit log" ON tpo_audit_log;
CREATE POLICY "Admins can read audit log"
  ON tpo_audit_log FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.org_id = tpo_audit_log.org_id
        AND om.user_id = auth.uid()
        AND om.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "TPO can insert audit log" ON tpo_audit_log;
CREATE POLICY "TPO can insert audit log"
  ON tpo_audit_log FOR INSERT WITH CHECK (tpo_user_id = auth.uid());

-- =====================================================================
-- 9. Phase 2/3 prep — F5–F8, F10, F11 tables (lightweight; pages built later)
-- =====================================================================

-- F6: Outreach drafts
CREATE TABLE IF NOT EXISTS outreach_drafts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  draft_type    TEXT DEFAULT 'recruiter'
    CHECK (draft_type IN ('recruiter','referral','follow_up')),
  target_name   TEXT,
  target_company TEXT,
  subject       TEXT,
  body          TEXT NOT NULL,
  job_ref       TEXT,
  follow_up_at  DATE,
  sent_manually BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- F7: Opportunities (internship & hackathon tracker)
CREATE TABLE IF NOT EXISTS opportunities (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  opp_type      TEXT NOT NULL CHECK (opp_type IN ('Internship','Hackathon','Contest','Scholarship','Other')),
  title         TEXT NOT NULL,
  organization  TEXT,
  deadline      DATE,
  link          TEXT,
  status        TEXT DEFAULT 'Saved'
    CHECK (status IN ('Saved','Applied','Shortlisted','Selected','Rejected','Expired')),
  notes         TEXT,
  notify_days_before INT DEFAULT 3,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- F8: Offers
CREATE TABLE IF NOT EXISTS offers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  company       TEXT NOT NULL,
  role_title    TEXT NOT NULL,
  location      TEXT,
  fixed_ctc     NUMERIC(12,2),
  variable_ctc  NUMERIC(12,2),
  joining_date  DATE,
  offer_deadline DATE,
  notes         TEXT,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- F4: Speaking attempts
CREATE TABLE IF NOT EXISTS speaking_drills (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_text   TEXT NOT NULL,
  category      TEXT DEFAULT 'Introduction',
  duration_secs INT DEFAULT 90,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS speaking_attempts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  drill_id      UUID REFERENCES speaking_drills(id) ON DELETE SET NULL,
  transcript    TEXT,
  pace_wpm      INT,
  filler_words  TEXT[] DEFAULT ARRAY[]::TEXT[],
  clarity_score INT,
  grammar_score INT,
  feedback      TEXT,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- F11: Skill assessments
CREATE TABLE IF NOT EXISTS skill_assessments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_name    TEXT NOT NULL,
  questions     JSONB NOT NULL DEFAULT '[]'::jsonb,
  passing_score INT DEFAULT 70,
  time_limit_secs INT DEFAULT 600,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS assessment_attempts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  skill_name    TEXT NOT NULL,
  score         INT,
  passed        BOOLEAN,
  answers       JSONB DEFAULT '{}'::jsonb,
  time_taken_secs INT,
  badge_awarded BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- F15: Peer mock interviews
CREATE TABLE IF NOT EXISTS peer_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_code   TEXT UNIQUE NOT NULL DEFAULT substring(md5(random()::text), 1, 8),
  status        TEXT DEFAULT 'waiting'
    CHECK (status IN ('waiting','active','completed','cancelled')),
  recording_consent_a BOOLEAN DEFAULT FALSE,
  recording_consent_b BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS peer_participants (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    UUID REFERENCES peer_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id       UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role          TEXT CHECK (role IN ('interviewer','interviewee')),
  joined_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, user_id)
);

CREATE TABLE IF NOT EXISTS peer_feedback (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    UUID REFERENCES peer_sessions(id) ON DELETE CASCADE NOT NULL,
  reviewer_id   UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reviewee_id   UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  scores        JSONB DEFAULT '{}'::jsonb,
  comments      TEXT,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- F16: Share links
CREATE TABLE IF NOT EXISTS share_links (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  token         TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  scope         TEXT[] DEFAULT ARRAY[]::TEXT[],  -- ['report','resume','roadmap']
  expires_at    TIMESTAMP WITH TIME ZONE NOT NULL,
  revoked_at    TIMESTAMP WITH TIME ZONE,
  view_count    INT DEFAULT 0,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- F2: Group discussion
CREATE TABLE IF NOT EXISTS gd_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  topic         TEXT NOT NULL,
  status        TEXT DEFAULT 'active' CHECK (status IN ('active','completed')),
  duration_secs INT DEFAULT 0,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS gd_turns (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    UUID REFERENCES gd_sessions(id) ON DELETE CASCADE NOT NULL,
  speaker       TEXT NOT NULL, -- 'student' | 'ai_participant_1' | 'moderator'
  content       TEXT NOT NULL,
  turn_index    INT NOT NULL,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS gd_feedback (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    UUID REFERENCES gd_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id       UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  structure_score    INT,
  relevance_score    INT,
  initiative_score   INT,
  listening_score    INT,
  clarity_score      INT,
  filler_words       TEXT[] DEFAULT ARRAY[]::TEXT[],
  overall_feedback   TEXT,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on all new tables
ALTER TABLE outreach_drafts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities        ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers               ENABLE ROW LEVEL SECURITY;
ALTER TABLE speaking_drills      ENABLE ROW LEVEL SECURITY;
ALTER TABLE speaking_attempts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_assessments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_attempts  ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_sessions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_participants    ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_feedback        ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_links          ENABLE ROW LEVEL SECURITY;
ALTER TABLE gd_sessions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE gd_turns             ENABLE ROW LEVEL SECURITY;
ALTER TABLE gd_feedback          ENABLE ROW LEVEL SECURITY;

-- Simple owner-only policies for user-scoped tables
CREATE POLICY "user_owns_outreach"        ON outreach_drafts     FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_owns_opportunities"   ON opportunities       FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_owns_offers"          ON offers              FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_owns_speaking_attempts" ON speaking_attempts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_owns_assessment_attempts" ON assessment_attempts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_owns_share_links"     ON share_links         FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_owns_gd_sessions"     ON gd_sessions         FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_owns_gd_feedback"     ON gd_feedback         FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "authenticated_read_speaking_drills" ON speaking_drills FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read_skill_assessments" ON skill_assessments FOR SELECT TO authenticated USING (true);

-- Peer sessions: participants only
CREATE POLICY "peer_participants_see_sessions"
  ON peer_sessions FOR SELECT USING (
    EXISTS (SELECT 1 FROM peer_participants pp WHERE pp.session_id = peer_sessions.id AND pp.user_id = auth.uid())
  );
CREATE POLICY "user_can_create_peer_session" ON peer_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "peer_participants_manage"
  ON peer_participants FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "peer_feedback_owner"
  ON peer_feedback FOR ALL USING (auth.uid() = reviewer_id OR auth.uid() = reviewee_id);
CREATE POLICY "gd_turns_session_owner"
  ON gd_turns FOR ALL USING (
    EXISTS (SELECT 1 FROM gd_sessions gs WHERE gs.id = gd_turns.session_id AND gs.user_id = auth.uid())
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_outreach_user     ON outreach_drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_user ON opportunities(user_id, status);
CREATE INDEX IF NOT EXISTS idx_offers_user        ON offers(user_id);
CREATE INDEX IF NOT EXISTS idx_speaking_user      ON speaking_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_user    ON assessment_attempts(user_id, skill_name);
CREATE INDEX IF NOT EXISTS idx_peer_participants_user ON peer_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_share_links_token  ON share_links(token);
CREATE INDEX IF NOT EXISTS idx_gd_sessions_user   ON gd_sessions(user_id);
