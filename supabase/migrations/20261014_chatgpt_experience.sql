-- Migration: ChatGPT-Style Experience Enhancements
-- Adds session metadata, message token/feedback tracking, and usage quotas

-- 1. Enhance chat_sessions table
ALTER TABLE chat_sessions 
ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT 'New Chat',
ADD COLUMN IF NOT EXISTS summary TEXT,
ADD COLUMN IF NOT EXISTS remember_across_chats BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS pinned BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL;

-- 2. Enhance chat_messages table
ALTER TABLE chat_messages
ADD COLUMN IF NOT EXISTS tokens_prompt INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS tokens_completion INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS feedback TEXT CHECK (feedback IN ('up', 'down', NULL)),
ADD COLUMN IF NOT EXISTS model TEXT,
ADD COLUMN IF NOT EXISTS latency_ms INT,
ADD COLUMN IF NOT EXISTS cost_cents NUMERIC(10, 4) DEFAULT 0,
ADD COLUMN IF NOT EXISTS tool_calls JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS tool_results JSONB DEFAULT '[]'::jsonb;

-- 3. Create chat_usage_quotas table for rate-limiting and daily/monthly spending control
CREATE TABLE IF NOT EXISTS chat_usage_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  daily_messages_count INT NOT NULL DEFAULT 0,
  daily_tokens_count INT NOT NULL DEFAULT 0,
  monthly_tokens_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, date)
);

-- Indexes for fast chat session and message lookups
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_active 
ON chat_sessions (user_id, last_active_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session_time 
ON chat_messages (session_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_chat_usage_quotas_user_date 
ON chat_usage_quotas (user_id, date);

-- RLS for chat_usage_quotas
ALTER TABLE chat_usage_quotas ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'chat_usage_quotas' AND policyname = 'Users can view their own usage quotas'
  ) THEN
    CREATE POLICY "Users can view their own usage quotas"
    ON chat_usage_quotas FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'chat_usage_quotas' AND policyname = 'Users can update their own usage quotas'
  ) THEN
    CREATE POLICY "Users can update their own usage quotas"
    ON chat_usage_quotas FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;
