# Implementation Plan: Ask CareerPilot (RAG Agent)

This is a comprehensive plan to build the genuine RAG-powered, Jarvis-mode AI assistant. Because this involves database schema changes, backend vector pipelines, and a new UI, we will tackle this in 4 distinct phases.

## Phase 1: Supabase & Vector DB Schema
1. **Enable pgvector:** We will add the `vector` extension to your Supabase instance.
2. **Create Tables:** We will define `career_embeddings` (to store profile, skills, projects, and interview chunks), `chat_sessions`, and `chat_messages`.
3. **Similarity Search RPC:** We will create a PostgreSQL function (`match_career_embeddings`) that performs cosine similarity search.
> *Note: I will provide the SQL script for you to run in your Supabase SQL Editor.*

## Phase 2: Embedding Pipeline (Data Sync)
1. **Choose Model:** Your `.env.local` has keys for both Gemini and OpenAI. Your prompt requested `vector(1536)`, which is specifically OpenAI's embedding size. I will install the `openai` SDK for generating these embeddings.
2. **Re-embedding Trigger:** I will write a utility that hooks into your `useProfileStore`. Whenever you verify a skill, add a project, or complete an interview, it will silently chunk that data, call the OpenAI Embeddings API, and upsert it into Supabase.

## Phase 3: The Agent Backend (Query & Retrieve)
1. **Retrieval Route (`/api/chat`):** I will build the core RAG logic.
2. **Flow:**
   - Take the student's question and embed it.
   - Vector-search `career_embeddings` for the top 8-12 most relevant chunks.
   - Pull fixed "current state" facts (e.g., Readiness Score).
   - Pull the last 6-10 messages for conversational continuity.
   - Assemble the final prompt with the direct, precise "Jarvis" persona rules.
   - Stream the response back using the Vercel AI SDK.

## Phase 4: Chat UI
1. **Persistent Interface:** I will build a clean, RAG-aware chat UI.
2. **Thinking State:** We will implement a custom loading state that explicitly shows when the AI is "Searching your verified career profile..." before streaming the answer.

---

### Questions before we begin Phase 1:
1. Are you okay with using OpenAI for the embeddings (since it natively outputs the 1536 dimensions you requested), or do you want to use Gemini (which uses 768 dimensions)?
2. Do you want the Chat UI to be a standalone page (e.g., `/career/chat`) or a persistent slide-out panel that you can open from anywhere in the app?
