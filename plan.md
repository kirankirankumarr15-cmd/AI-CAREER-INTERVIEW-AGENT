# Implementation Plan: Ask CareerPilot (RAG Agent) — Completed ✅

The genuine RAG-powered, Jarvis-mode AI assistant for CareerPilot AI is fully built and operational.

---

## ✅ Phase 1: Supabase & Vector DB Schema
- **pgvector Extension:** Enabled in Supabase.
- **Tables Created:**
  - `career_embeddings` with `vector(1536)` dimensional embedding column, user isolation, and unique constraint on `(user_id, source_type, source_id)`.
  - `chat_sessions` tracking started and last active timestamps per user.
  - `chat_messages` recording user/assistant turns, markdown content, and `retrieved_chunk_ids`.
- **Similarity Search RPC:** `match_career_embeddings(query_embedding, match_count, filter_user_id)` calculating cosine distance (`1 - (career_embeddings.embedding <=> query_embedding)`).

---

## ✅ Phase 2: Embedding Pipeline (Data Sync)
- **Embedding Models:** Dual-provider support:
  - Gemini `gemini-embedding-001` with `outputDimensionality: 1536` (active & tested).
  - OpenAI `text-embedding-3-small` (1536 dims) as secondary provider.
- **Sync Helpers in `lib/rag/sync.ts`:**
  - `syncProfileCoreToVectorDB`: Student target role, graduation, readiness score, target companies.
  - `syncSkillToVectorDB`: Verified skills, proficiency, and evidence.
  - `syncProjectToVectorDB`: Tech stack, architecture, student contribution, and challenges.
  - `syncExperienceToVectorDB`: Roles, companies, and achievements.
  - `syncInterviewToVectorDB`: Mock interview scores, strengths, and weaknesses.
  - `syncEntireProfileToVectorDB`: Batch indexes the entire profile.
  - `getVectorDBStats`: Live query for indexed chunk counts.
- **Store Triggers in `store/useProfileStore.ts`:**
  - `addSkill` and `addProject` trigger silent background vector sync upon insertion.
  - `syncVectorKnowledgeBase()` action available for on-demand 1-click re-indexing.

---

## ✅ Phase 3: The Agent Backend (Query & Retrieve)
- **Route:** `app/api/ai/chat/route.ts`
- **Workflow:**
  1. Generates 1536-dimensional query embedding of the student's question.
  2. Queries `match_career_embeddings` via RPC in Supabase.
  3. Pulls client profile state as instant grounding fallback if vector DB is not yet populated.
  4. Retrieves multi-turn conversation history from `chat_messages`.
  5. Formulates the Jarvis persona system prompt grounded in the verified credentials.
  6. Generates response using Gemini 3.8 Flash (`gemini-3.8-flash` with fallbacks).
  7. Persists both student question and assistant reply in `chat_messages`.
  8. Returns answer text, grounding attribution chips, and retrieved chunk metadata.

---

## ✅ Phase 4: Chat UI & Experience
- **Component:** `components/chat/CareerChat.tsx`
- **Features:**
  - Persistent slide-out drawer accessible globally via `Ctrl+K` / `Cmd+K` or sidebar button.
  - Live vector knowledge base indicator showing total indexed chunks + instant "Sync DB" button.
  - Multi-stage thinking animation: "Searching vector embeddings & verified credentials..." → "Synthesizing recommendation...".
  - Grounding citation badges showing exactly which verified skills/projects were referenced.
  - Full Markdown rendering with code blocks, bold text, and bulleted lists.
  - Text-to-speech audio playback button using `ttsEngine`.
  - Quick action prompt carousel personalized to target role.
  - Copy response and new session reset buttons.
