-- Enable the pgvector extension to work with embedding vectors
CREATE EXTENSION IF NOT EXISTS vector;

-- Table for storing career data embeddings
CREATE TABLE IF NOT EXISTS career_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  source_type TEXT NOT NULL, -- e.g., 'profile', 'skill', 'project', 'interview'
  source_id TEXT NOT NULL,   -- e.g., skill.id, project.id (to allow upserting/replacing)
  content TEXT NOT NULL,
  embedding vector(1536) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, source_type, source_id)
);

-- Table for chat sessions
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Table for chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  retrieved_chunk_ids UUID[] DEFAULT ARRAY[]::UUID[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS Policies
ALTER TABLE career_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only read and write their own embeddings"
ON career_embeddings FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only read and write their own chat sessions"
ON chat_sessions FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only read and write their own chat messages"
ON chat_messages FOR ALL USING (auth.uid() = user_id);

-- Function for similarity search
CREATE OR REPLACE FUNCTION match_career_embeddings (
  query_embedding vector(1536),
  match_count int DEFAULT 10,
  filter_user_id UUID DEFAULT auth.uid()
) RETURNS TABLE (
  id UUID,
  source_type TEXT,
  source_id TEXT,
  content TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    career_embeddings.id,
    career_embeddings.source_type,
    career_embeddings.source_id,
    career_embeddings.content,
    1 - (career_embeddings.embedding <=> query_embedding) AS similarity
  FROM career_embeddings
  WHERE career_embeddings.user_id = filter_user_id
  ORDER BY career_embeddings.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
