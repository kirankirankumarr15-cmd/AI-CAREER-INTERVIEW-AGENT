-- =====================================================================
-- PRISM Phase 4 — Step C: Timed Assessment Engine, Proctoring, Readiness & Roadmap
-- Migration: 20261114_step_c_phase4_assessments_readiness_roadmap.sql
-- =====================================================================

-- 1. Assessments Engine (Core Specification)
CREATE TABLE IF NOT EXISTS public.assessments (
  id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title             TEXT NOT NULL,
  description       TEXT,
  category          TEXT NOT NULL DEFAULT 'Aptitude & Technical',
  difficulty        TEXT NOT NULL DEFAULT 'Medium' CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  duration_minutes  INT NOT NULL DEFAULT 30 CHECK (duration_minutes > 0),
  total_marks       NUMERIC(6,2) NOT NULL DEFAULT 100.0,
  pass_marks        NUMERIC(6,2) NOT NULL DEFAULT 40.0,
  total_questions   INT NOT NULL DEFAULT 0,
  negative_marking  BOOLEAN NOT NULL DEFAULT false,
  status            TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  is_active         BOOLEAN NOT NULL DEFAULT true,
  created_by        UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Backward compatibility columns in case table was previously created
ALTER TABLE public.assessments
  ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT 'Medium',
  ADD COLUMN IF NOT EXISTS total_questions INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS negative_marking BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE TABLE IF NOT EXISTS public.assessment_sections (
  id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  assessment_id       TEXT NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  title               TEXT NOT NULL,
  description         TEXT,
  order_index         INT NOT NULL DEFAULT 0,
  duration_minutes    INT,
  marks_per_question  NUMERIC(4,2) NOT NULL DEFAULT 1.0,
  negative_marks      NUMERIC(4,2) NOT NULL DEFAULT 0.25,
  created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.assessment_questions (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  assessment_id   TEXT NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  section_id      TEXT REFERENCES public.assessment_sections(id) ON DELETE SET NULL,
  question_text   TEXT NOT NULL,
  question_type   TEXT NOT NULL DEFAULT 'mcq' CHECK (question_type IN ('mcq', 'multi_choice', 'coding', 'short_text')),
  options         JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of { id: "A", text: "..." }
  correct_option  TEXT NOT NULL, -- Stored server-side only; never leaked before submit
  explanation     TEXT NOT NULL, -- Stored server-side only; never leaked before submit
  topic           TEXT NOT NULL DEFAULT 'General',
  difficulty      TEXT NOT NULL DEFAULT 'Medium' CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  marks           NUMERIC(4,2) NOT NULL DEFAULT 1.0,
  negative_marks  NUMERIC(4,2) NOT NULL DEFAULT 0.0,
  order_index     INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Assessment Attempts
CREATE TABLE IF NOT EXISTS public.assessment_attempts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id     TEXT NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  started_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  deadline_at       TIMESTAMP WITH TIME ZONE NOT NULL,
  submitted_at      TIMESTAMP WITH TIME ZONE,
  time_taken_secs   INT DEFAULT 0,
  score             NUMERIC(6,2) DEFAULT 0,
  total_marks       NUMERIC(6,2) DEFAULT 0,
  percentage        NUMERIC(5,2) DEFAULT 0,
  status            TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'expired', 'abandoned')),
  result_status     TEXT NOT NULL DEFAULT 'pending' CHECK (result_status IN ('passed', 'failed', 'pending')),
  tab_switch_count  INT NOT NULL DEFAULT 0,
  summary           JSONB DEFAULT '{}'::jsonb,
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Adapt legacy assessment_attempts if it existed from Phase 0
ALTER TABLE public.assessment_attempts
  ADD COLUMN IF NOT EXISTS assessment_id TEXT,
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS deadline_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS time_taken_secs INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS score NUMERIC(6,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_marks NUMERIC(6,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS percentage NUMERIC(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'in_progress',
  ADD COLUMN IF NOT EXISTS result_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS tab_switch_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS summary JSONB DEFAULT '{}'::jsonb;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'assessment_attempts' AND column_name = 'skill_name'
  ) THEN
    ALTER TABLE public.assessment_attempts ALTER COLUMN skill_name DROP NOT NULL;
  END IF;
END $$;

-- Assessment Answers
CREATE TABLE IF NOT EXISTS public.assessment_answers (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id        UUID NOT NULL REFERENCES public.assessment_attempts(id) ON DELETE CASCADE,
  question_id       TEXT NOT NULL REFERENCES public.assessment_questions(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  selected_option   TEXT,
  is_correct        BOOLEAN,
  marks_awarded     NUMERIC(4,2) DEFAULT 0,
  time_spent_secs   INT DEFAULT 0,
  is_marked_review  BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE (attempt_id, question_id)
);

-- Legacy alias attempt_answers table if needed
CREATE TABLE IF NOT EXISTS public.attempt_answers (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id        UUID NOT NULL REFERENCES public.assessment_attempts(id) ON DELETE CASCADE,
  question_id       TEXT NOT NULL,
  user_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  selected_option   TEXT,
  is_correct        BOOLEAN,
  marks_awarded     NUMERIC(4,2) DEFAULT 0,
  time_spent_secs   INT DEFAULT 0,
  is_marked_review  BOOLEAN NOT NULL DEFAULT false,
  updated_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE (attempt_id, question_id)
);

-- Proctor Events (Module 4.1 Specification)
CREATE TABLE IF NOT EXISTS public.proctor_events (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id        UUID NOT NULL REFERENCES public.assessment_attempts(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type        TEXT NOT NULL,
  event_timestamp   TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  severity          TEXT NOT NULL DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high')),
  review_status     TEXT NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending', 'reviewed', 'flagged', 'cleared')),
  metadata          JSONB DEFAULT '{}'::jsonb,
  details           JSONB DEFAULT '{}'::jsonb,
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Ensure proctor_events columns exist if table was previously partially created
ALTER TABLE public.proctor_events
  ADD COLUMN IF NOT EXISTS event_timestamp TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS severity TEXT DEFAULT 'low',
  ADD COLUMN IF NOT EXISTS review_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}'::jsonb;

-- Question CSV Imports
CREATE TABLE IF NOT EXISTS public.question_imports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id   TEXT REFERENCES public.assessments(id) ON DELETE CASCADE,
  imported_by     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  filename        TEXT NOT NULL,
  total_rows      INT NOT NULL DEFAULT 0,
  successful_rows INT NOT NULL DEFAULT 0,
  failed_rows     INT NOT NULL DEFAULT 0,
  error_log       JSONB DEFAULT '[]'::jsonb,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 2. Readiness Index (5 Pillars)
CREATE TABLE IF NOT EXISTS public.readiness_weight_configs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_weight   NUMERIC(4,2) NOT NULL DEFAULT 25.0,
  resume_weight       NUMERIC(4,2) NOT NULL DEFAULT 20.0,
  interview_weight    NUMERIC(4,2) NOT NULL DEFAULT 25.0,
  gd_weight           NUMERIC(4,2) NOT NULL DEFAULT 15.0,
  profile_weight      NUMERIC(4,2) NOT NULL DEFAULT 15.0,
  updated_by          UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.readiness_snapshots (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  overall_score       NUMERIC(5,2) NOT NULL,
  coverage_pct        NUMERIC(5,2) NOT NULL,
  assessment_score    NUMERIC(5,2),
  resume_score        NUMERIC(5,2),
  interview_score     NUMERIC(5,2),
  gd_score            NUMERIC(5,2),
  profile_score       NUMERIC(5,2),
  weights_used        JSONB NOT NULL,
  top_recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 3. Dynamic 12-Week Roadmap
CREATE TABLE IF NOT EXISTS public.roadmap_plans (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_role         TEXT NOT NULL,
  target_company      TEXT,
  starting_readiness  NUMERIC(5,2) DEFAULT 0,
  current_readiness   NUMERIC(5,2) DEFAULT 0,
  current_week        INT NOT NULL DEFAULT 1,
  total_weeks         INT NOT NULL DEFAULT 12,
  is_active           BOOLEAN NOT NULL DEFAULT true,
  created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.roadmap_weeks (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id             UUID NOT NULL REFERENCES public.roadmap_plans(id) ON DELETE CASCADE,
  week_number         INT NOT NULL CHECK (week_number >= 1 AND week_number <= 12),
  objective           TEXT NOT NULL,
  milestone_name      TEXT NOT NULL,
  estimated_hours     NUMERIC(4,1) DEFAULT 10.0,
  status              TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE (plan_id, week_number)
);

CREATE TABLE IF NOT EXISTS public.roadmap_tasks (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id           UUID NOT NULL REFERENCES public.roadmap_weeks(id) ON DELETE CASCADE,
  plan_id           UUID NOT NULL REFERENCES public.roadmap_plans(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  description       TEXT,
  category          TEXT NOT NULL,
  task_type         TEXT NOT NULL DEFAULT 'daily' CHECK (task_type IN ('daily', 'milestone', 'assessment', 'revision')),
  estimated_minutes INT NOT NULL DEFAULT 30,
  priority          TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  day_of_week       INT CHECK (day_of_week >= 1 AND day_of_week <= 7),
  is_completed      BOOLEAN NOT NULL DEFAULT false,
  completed_at      TIMESTAMP WITH TIME ZONE,
  resources         JSONB DEFAULT '[]'::jsonb,
  source_module     TEXT,
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.roadmap_replans (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id             UUID NOT NULL REFERENCES public.roadmap_plans(id) ON DELETE CASCADE,
  user_id             UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  week_number         INT NOT NULL,
  trigger_reason      TEXT NOT NULL,
  completed_task_ids  JSONB NOT NULL DEFAULT '[]'::jsonb,
  previous_summary    JSONB DEFAULT '{}'::jsonb,
  new_priorities      JSONB DEFAULT '[]'::jsonb,
  created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- =====================================================================
-- Indexes for High Performance & Server-Authoritative Timer Lookups
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_assessment_sections_assessment ON public.assessment_sections(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_questions_assessment ON public.assessment_questions(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_questions_section ON public.assessment_questions(section_id);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_user ON public.assessment_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_assessment ON public.assessment_attempts(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_deadline ON public.assessment_attempts(deadline_at);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_status ON public.assessment_attempts(status);
CREATE INDEX IF NOT EXISTS idx_assessment_answers_attempt ON public.assessment_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_assessment_answers_question ON public.assessment_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_proctor_events_attempt ON public.proctor_events(attempt_id);
CREATE INDEX IF NOT EXISTS idx_proctor_events_user ON public.proctor_events(user_id);
CREATE INDEX IF NOT EXISTS idx_readiness_snapshots_user ON public.readiness_snapshots(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_roadmap_plans_user ON public.roadmap_plans(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_roadmap_weeks_plan ON public.roadmap_weeks(plan_id, week_number);
CREATE INDEX IF NOT EXISTS idx_roadmap_tasks_week ON public.roadmap_tasks(week_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_tasks_user_day ON public.roadmap_tasks(user_id, is_completed, created_at);

-- =====================================================================
-- Row Level Security (RLS)
-- =====================================================================
ALTER TABLE public.assessments               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_sections      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_questions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_attempts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_answers       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attempt_answers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proctor_events           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_imports         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.readiness_weight_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.readiness_snapshots      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmap_plans            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmap_weeks            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmap_tasks            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmap_replans          ENABLE ROW LEVEL SECURITY;

-- Assessments: viewable by all authenticated users if active or published
DROP POLICY IF EXISTS "Assessments viewable by authenticated users" ON public.assessments;
CREATE POLICY "Assessments viewable by authenticated users"
  ON public.assessments FOR SELECT TO authenticated
  USING (is_active = true OR status = 'published' OR auth.uid() = created_by);

DROP POLICY IF EXISTS "Sections viewable by authenticated users" ON public.assessment_sections;
CREATE POLICY "Sections viewable by authenticated users"
  ON public.assessment_sections FOR SELECT TO authenticated
  USING (true);

-- Assessment questions: readable by authenticated users (backend API strips answer keys)
DROP POLICY IF EXISTS "Questions viewable by authenticated users" ON public.assessment_questions;
CREATE POLICY "Questions viewable by authenticated users"
  ON public.assessment_questions FOR SELECT TO authenticated
  USING (true);

-- Attempts: users manage only their own attempts
DROP POLICY IF EXISTS "Users manage their own attempts" ON public.assessment_attempts;
CREATE POLICY "Users manage their own attempts"
  ON public.assessment_attempts FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Assessment Answers: isolated strictly by user
DROP POLICY IF EXISTS "Users manage their own answers" ON public.assessment_answers;
CREATE POLICY "Users manage their own answers"
  ON public.assessment_answers FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage their attempt answers" ON public.attempt_answers;
CREATE POLICY "Users manage their attempt answers"
  ON public.attempt_answers FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Proctor events: users manage and review their own events
DROP POLICY IF EXISTS "Users manage their proctor events" ON public.proctor_events;
CREATE POLICY "Users manage their proctor events"
  ON public.proctor_events FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Readiness snapshots: isolated by user
DROP POLICY IF EXISTS "Users read their readiness snapshots" ON public.readiness_snapshots;
CREATE POLICY "Users read their readiness snapshots"
  ON public.readiness_snapshots FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Weight configs viewable by authenticated" ON public.readiness_weight_configs;
CREATE POLICY "Weight configs viewable by authenticated"
  ON public.readiness_weight_configs FOR SELECT TO authenticated
  USING (true);

-- Dynamic Roadmap: isolated by user
DROP POLICY IF EXISTS "Users manage their own roadmap plans" ON public.roadmap_plans;
CREATE POLICY "Users manage their own roadmap plans"
  ON public.roadmap_plans FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users view their roadmap weeks" ON public.roadmap_weeks;
CREATE POLICY "Users view their roadmap weeks"
  ON public.roadmap_weeks FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.roadmap_plans p WHERE p.id = public.roadmap_weeks.plan_id AND p.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users manage their roadmap tasks" ON public.roadmap_tasks;
CREATE POLICY "Users manage their roadmap tasks"
  ON public.roadmap_tasks FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users view their roadmap replans" ON public.roadmap_replans;
CREATE POLICY "Users view their roadmap replans"
  ON public.roadmap_replans FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =====================================================================
-- Seed Standard Assessments & High-Quality Production Questions
-- =====================================================================
INSERT INTO public.assessments (id, title, description, category, difficulty, duration_minutes, total_marks, pass_marks, total_questions, negative_marking, status, is_active)
VALUES
(
  'asmt-tcs-nqt-full',
  'TCS NQT & IT Placement Full Mock Test',
  'Comprehensive 30-minute placement screening covering Quantitative Aptitude, Logical Reasoning, Verbal Ability, and Core Technical fundamentals (DSA, DBMS, OS).',
  'Placement Mock',
  'Medium',
  30,
  30.0,
  18.0,
  15,
  true,
  'published',
  true
),
(
  'asmt-tech-core',
  'Core CS Fundamentals (DSA, DBMS, OS & Networks)',
  'Targeted assessment evaluating algorithmic complexity, SQL querying, concurrency, memory management, and network protocols.',
  'Technical Core',
  'Hard',
  20,
  20.0,
  12.0,
  10,
  true,
  'published',
  true
),
(
  'asmt-quant-reasoning',
  'Quantitative & Analytical Aptitude Sprint',
  'Fast-paced speed assessment focusing on Work & Time, Profit & Loss, Number Series, and Data Interpretation.',
  'Aptitude',
  'Easy',
  15,
  15.0,
  9.0,
  10,
  false,
  'published',
  true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  duration_minutes = EXCLUDED.duration_minutes,
  total_marks = EXCLUDED.total_marks,
  pass_marks = EXCLUDED.pass_marks,
  total_questions = EXCLUDED.total_questions,
  negative_marking = EXCLUDED.negative_marking,
  status = EXCLUDED.status,
  is_active = EXCLUDED.is_active;

-- Seed Assessment Sections
INSERT INTO public.assessment_sections (id, assessment_id, title, description, order_index, duration_minutes, marks_per_question, negative_marks)
VALUES
('sec-quant', 'asmt-tcs-nqt-full', 'Section A: Quantitative & Numerical Ability', 'Arithmetic, Algebra, and Numerical reasoning', 0, 10, 2.0, 0.5),
('sec-reasoning', 'asmt-tcs-nqt-full', 'Section B: Logical & Analytical Reasoning', 'Deductive logic, patterns, and arrangements', 1, 10, 2.0, 0.5),
('sec-tech', 'asmt-tcs-nqt-full', 'Section C: Core Technical CS Fundamentals', 'Data Structures, Algorithms, DBMS and OS concepts', 2, 10, 2.0, 0.5)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  order_index = EXCLUDED.order_index,
  marks_per_question = EXCLUDED.marks_per_question,
  negative_marks = EXCLUDED.negative_marks;

-- Seed Assessment Questions
INSERT INTO public.assessment_questions (id, assessment_id, section_id, question_text, question_type, options, correct_option, explanation, topic, difficulty, marks, negative_marks, order_index)
VALUES
(
  'q-nqt-01',
  'asmt-tcs-nqt-full',
  'sec-quant',
  'A can complete a project in 12 days, and B can complete the same project in 18 days. If they work together for 4 days, what fraction of the project remains incomplete?',
  'mcq',
  '[{"id":"A","text":"1/3"},{"id":"B","text":"4/9"},{"id":"C","text":"5/9"},{"id":"D","text":"2/5"}]'::jsonb,
  'B',
  'Work done by A in 1 day = 1/12. Work done by B in 1 day = 1/18. Together in 1 day = 1/12 + 1/18 = 5/36. In 4 days: 4 × 5/36 = 20/36 = 5/9. Remaining = 1 - 5/9 = 4/9.',
  'Time & Work',
  'Easy',
  2.0,
  0.5,
  0
),
(
  'q-nqt-02',
  'asmt-tcs-nqt-full',
  'sec-quant',
  'A train 180 meters long travelling at 72 km/h crosses an electric pole in how many seconds?',
  'mcq',
  '[{"id":"A","text":"8 seconds"},{"id":"B","text":"9 seconds"},{"id":"C","text":"10 seconds"},{"id":"D","text":"12 seconds"}]'::jsonb,
  'B',
  'Speed in m/s = 72 × (5/18) = 20 m/s. Time to cross a pole = Distance / Speed = 180 / 20 = 9 seconds.',
  'Speed & Distance',
  'Easy',
  2.0,
  0.5,
  1
),
(
  'q-nqt-03',
  'asmt-tcs-nqt-full',
  'sec-quant',
  'An article is sold for ₹840 at a gain of 20%. What would be the gain or loss percentage if it were sold for ₹630?',
  'mcq',
  '[{"id":"A","text":"10% loss"},{"id":"B","text":"12.5% loss"},{"id":"C","text":"8% loss"},{"id":"D","text":"15% loss"}]'::jsonb,
  'A',
  'Cost Price (CP) = 840 / 1.20 = ₹700. If new SP = ₹630, Loss = 700 - 630 = ₹70. Loss % = (70 / 700) × 100% = 10% loss.',
  'Profit & Loss',
  'Medium',
  2.0,
  0.5,
  2
),
(
  'q-nqt-04',
  'asmt-tcs-nqt-full',
  'sec-quant',
  'The average age of 24 students and their teacher is 15 years. If the teacher’s age is excluded, the average age decreases by 1 year. What is the teacher’s age?',
  'mcq',
  '[{"id":"A","text":"35 years"},{"id":"B","text":"39 years"},{"id":"C","text":"42 years"},{"id":"D","text":"40 years"}]'::jsonb,
  'B',
  'Total sum with teacher (25 people) = 25 × 15 = 375. Total sum without teacher (24 students, avg 14) = 24 × 14 = 336. Teacher’s age = 375 - 336 = 39 years.',
  'Averages',
  'Medium',
  2.0,
  0.5,
  3
),
(
  'q-nqt-05',
  'asmt-tcs-nqt-full',
  'sec-quant',
  'If 2^x = 4^y = 8^z and xyz = 288, what is the value of 1/(2x) + 1/(4y) + 1/(6z)?',
  'mcq',
  '[{"id":"A","text":"1/8"},{"id":"B","text":"7/48"},{"id":"C","text":"11/96"},{"id":"D","text":"5/36"}]'::jsonb,
  'A',
  'Let 2^x = 2^(2y) = 2^(3z). Then x = 2y = 3z. Let x=6m, y=3m, z=2m. xyz = 36m^3 = 288 => m^3 = 8 => m = 2. Then x = 12, y = 6, z = 4. 1/(2*12) + 1/(4*6) + 1/(6*4) = 1/24 + 1/24 + 1/24 = 3/24 = 1/8.',
  'Number System',
  'Hard',
  2.0,
  0.5,
  4
),
(
  'q-nqt-06',
  'asmt-tcs-nqt-full',
  'sec-reasoning',
  'Find the next number in the series: 7, 10, 16, 28, 52, ?',
  'mcq',
  '[{"id":"A","text":"88"},{"id":"B","text":"96"},{"id":"C","text":"100"},{"id":"D","text":"104"}]'::jsonb,
  'C',
  'Differences: 10 - 7 = 3; 16 - 10 = 6; 28 - 16 = 12; 52 - 28 = 24. Next diff is 24 × 2 = 48. Next number = 52 + 48 = 100.',
  'Number Series',
  'Easy',
  2.0,
  0.5,
  5
),
(
  'q-nqt-07',
  'asmt-tcs-nqt-full',
  'sec-reasoning',
  'Pointing to a photograph of a boy, Suresh said, "He is the son of the only son of my mother." How is Suresh related to that boy?',
  'mcq',
  '[{"id":"A","text":"Brother"},{"id":"B","text":"Uncle"},{"id":"C","text":"Father"},{"id":"D","text":"Cousin"}]'::jsonb,
  'C',
  'The only son of Suresh’s mother is Suresh himself. Therefore, the boy is the son of Suresh, making Suresh his father.',
  'Blood Relations',
  'Easy',
  2.0,
  0.5,
  6
),
(
  'q-nqt-08',
  'asmt-tcs-nqt-full',
  'sec-reasoning',
  'In a certain code, "CLOUD" is written as "GPRYI". How is "SMILE" written in that code?',
  'mcq',
  '[{"id":"A","text":"WQMPI"},{"id":"B","text":"WQQPI"},{"id":"C","text":"VQLOI"},{"id":"D","text":"VQMOH"}]'::jsonb,
  'A',
  'Standard shift pattern (+4): S(+4)=W, M(+4)=Q, I(+4)=M, L(+4)=P, E(+4)=I => WQMPI.',
  'Coding & Decoding',
  'Medium',
  2.0,
  0.5,
  7
),
(
  'q-nqt-09',
  'asmt-tcs-nqt-full',
  'sec-reasoning',
  'Statements: (1) All mangoes are golden. (2) No golden things are cheap. Conclusions: I. All golden things are mangoes. II. Mangoes are not cheap.',
  'mcq',
  '[{"id":"A","text":"Only conclusion I follows"},{"id":"B","text":"Only conclusion II follows"},{"id":"C","text":"Either I or II follows"},{"id":"D","text":"Neither I nor II follows"}]'::jsonb,
  'B',
  'Since all mangoes are inside golden, and golden is completely disjoint from cheap, mangoes can never be cheap (II follows). All golden are not necessarily mangoes (I does not follow).',
  'Syllogisms',
  'Medium',
  2.0,
  0.5,
  8
),
(
  'q-nqt-10',
  'asmt-tcs-nqt-full',
  'sec-reasoning',
  'Six friends P, Q, R, S, T, and U sit in a circle facing the center. P is between Q and S. T is second to the left of Q. U is opposite P. Who is sitting immediately to the right of R?',
  'mcq',
  '[{"id":"A","text":"Q"},{"id":"B","text":"T"},{"id":"C","text":"S"},{"id":"D","text":"P"}]'::jsonb,
  'B',
  'Clockwise arrangement: P, Q, T, U, R, S. Facing center, immediately to the right of R is T.',
  'Seating Arrangement',
  'Hard',
  2.0,
  0.5,
  9
),
(
  'q-nqt-11',
  'asmt-tcs-nqt-full',
  'sec-tech',
  'What is the worst-case time complexity of searching an element in a Red-Black Tree with n nodes?',
  'mcq',
  '[{"id":"A","text":"O(1)"},{"id":"B","text":"O(log n)"},{"id":"C","text":"O(n)"},{"id":"D","text":"O(n log n)"}]'::jsonb,
  'B',
  'A Red-Black Tree is a self-balancing binary search tree. The maximum height is guaranteed to be at most 2 * log2(n + 1). Hence worst-case search is O(log n).',
  'Data Structures',
  'Medium',
  2.0,
  0.5,
  10
),
(
  'q-nqt-12',
  'asmt-tcs-nqt-full',
  'sec-tech',
  'In a Relational Database, which normal form eliminates transitive functional dependencies for non-prime attributes?',
  'mcq',
  '[{"id":"A","text":"First Normal Form (1NF)"},{"id":"B","text":"Second Normal Form (2NF)"},{"id":"C","text":"Third Normal Form (3NF)"},{"id":"D","text":"Boyce-Codd Normal Form (BCNF)"}]'::jsonb,
  'C',
  '2NF removes partial dependency. 3NF removes transitive dependencies (X -> Y and Y -> Z where Z is non-prime).',
  'DBMS',
  'Medium',
  2.0,
  0.5,
  11
),
(
  'q-nqt-13',
  'asmt-tcs-nqt-full',
  'sec-tech',
  'Which CPU scheduling algorithm is non-preemptive and can suffer severely from the "Convoy Effect"?',
  'mcq',
  '[{"id":"A","text":"Round Robin (RR)"},{"id":"B","text":"First-Come, First-Served (FCFS)"},{"id":"C","text":"Shortest Remaining Time First (SRTF)"},{"id":"D","text":"Multilevel Feedback Queue"}]'::jsonb,
  'B',
  'In FCFS, if a long CPU-bound process arrives first, all subsequent short I/O-bound processes wait behind it, causing the Convoy Effect.',
  'Operating Systems',
  'Medium',
  2.0,
  0.5,
  12
),
(
  'q-nqt-14',
  'asmt-tcs-nqt-full',
  'sec-tech',
  'In the TCP/IP stack, which flag in the TCP header is used by the sender to gracefully close a connection?',
  'mcq',
  '[{"id":"A","text":"SYN"},{"id":"B","text":"RST"},{"id":"C","text":"FIN"},{"id":"D","text":"PSH"}]'::jsonb,
  'C',
  'FIN (Finish) is used to gracefully close a connection by signaling that the sender has finished transmitting data.',
  'Computer Networks',
  'Easy',
  2.0,
  0.5,
  13
),
(
  'q-nqt-15',
  'asmt-tcs-nqt-full',
  'sec-tech',
  'Which design pattern guarantees that a class has only one instance and provides a global point of access to it?',
  'mcq',
  '[{"id":"A","text":"Factory Pattern"},{"id":"B","text":"Observer Pattern"},{"id":"C","text":"Singleton Pattern"},{"id":"D","text":"Adapter Pattern"}]'::jsonb,
  'C',
  'The Singleton pattern restricts class instantiation to a single object, typically implemented using a private constructor and a static getInstance() method.',
  'Object Oriented Programming',
  'Easy',
  2.0,
  0.5,
  14
)
ON CONFLICT (id) DO UPDATE SET
  question_text = EXCLUDED.question_text,
  options = EXCLUDED.options,
  correct_option = EXCLUDED.correct_option,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  marks = EXCLUDED.marks,
  negative_marks = EXCLUDED.negative_marks;
