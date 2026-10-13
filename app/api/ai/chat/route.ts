import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import { generateEmbeddingAction } from '@/app/actions/rag';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const geminiApiKey = process.env.GEMINI_API_KEY;

interface RetrievedChunk {
  id: string;
  source_type: string;
  source_id: string;
  content: string;
  similarity: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messageText: string = (body.message || body.prompt || '').trim();
    const sessionId: string | undefined = body.sessionId;
    const userId: string | undefined = body.userId;
    const profileState = body.profileState;
    const shouldStream: boolean = body.stream === true;

    if (!messageText) {
      return NextResponse.json({ error: 'No message provided' }, { status: 400 });
    }

    if (!geminiApiKey) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // ─────────────────────────────────────────────────────────────
    // STEP 1: Vector search career_embeddings (top 8-12, filtered to user_id)
    // ─────────────────────────────────────────────────────────────
    let retrievedChunks: RetrievedChunk[] = [];
    let groundingSources: string[] = [];

    if (userId) {
      try {
        const { success, embedding } = await generateEmbeddingAction(messageText);
        if (success && embedding && embedding.length === 1536) {
          const { data, error } = await supabase.rpc('match_career_embeddings', {
            query_embedding: embedding,
            match_count: 10, // top 8-12 chunks
            filter_user_id: userId,
          });

          if (!error && Array.isArray(data) && data.length > 0) {
            retrievedChunks = data as RetrievedChunk[];
            groundingSources = retrievedChunks.map((chunk) => {
              const preview = chunk.content.split('\n')[0] || `${chunk.source_type} record`;
              return `${preview} (${Math.round(chunk.similarity * 100)}% match)`;
            });
          }
        }
      } catch (ragErr) {
        console.warn('Vector retrieval error:', ragErr);
      }
    }

    // ─────────────────────────────────────────────────────────────
    // STEP 2: Pull fixed current-state facts directly from DB (or state)
    // ─────────────────────────────────────────────────────────────
    let readinessScore = profileState?.readinessScore ?? 65;
    let targetRole = profileState?.targetRole ?? 'Software Engineer';
    let latestInterviewScore: string = 'None recorded yet';
    let activeWeakAreas: string[] = profileState?.weakAreas ?? [];

    if (userId) {
      try {
        // Query profile facts
        const { data: profData } = await supabase
          .from('profiles')
          .select('readiness_score, target_role')
          .eq('id', userId)
          .single();

        if (profData) {
          if (profData.readiness_score !== null) readinessScore = profData.readiness_score;
          if (profData.target_role) targetRole = profData.target_role;
        }

        // Query latest completed interview
        const { data: latestInterview } = await supabase
          .from('interview_sessions')
          .select('overall_score, technical_score, interview_type, weak_areas, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (latestInterview) {
          latestInterviewScore = `${latestInterview.overall_score}/100 in ${latestInterview.interview_type} (Tech: ${latestInterview.technical_score || latestInterview.overall_score}/100)`;
          if (latestInterview.weak_areas && latestInterview.weak_areas.length > 0) {
            activeWeakAreas = Array.from(new Set([...activeWeakAreas, ...latestInterview.weak_areas]));
          }
        }

        // Query user_progress for streak and questions solved
        const { data: progressData } = await supabase
          .from('user_progress')
          .select('questions_solved, daily_streak')
          .eq('user_id', userId)
          .single();

        if (progressData) {
          if (activeWeakAreas.length === 0) {
            activeWeakAreas = ['System Design trade-offs', 'DSA edge cases'];
          }
        }
      } catch (factsErr) {
        console.warn('Could not pull fixed facts from DB:', factsErr);
      }
    }

    if (groundingSources.length === 0) {
      if (targetRole) groundingSources.push(`Target Role: ${targetRole}`);
      groundingSources.push(`Readiness Score: ${readinessScore}%`);
      if (profileState?.skills?.length) groundingSources.push(`${profileState.skills.length} Profile Skills`);
      if (profileState?.projects?.length) groundingSources.push(`${profileState.projects.length} Verified Projects`);
    }

    // ─────────────────────────────────────────────────────────────
    // STEP 3: Pull last 6-10 messages from this chat session
    // ─────────────────────────────────────────────────────────────
    let conversationHistory = '';
    let currentSessionId = sessionId;

    if (sessionId && userId) {
      try {
        const { data: historyMessages } = await supabase
          .from('chat_messages')
          .select('role, content')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: false })
          .limit(8);

        if (historyMessages && historyMessages.length > 0) {
          conversationHistory = historyMessages
            .reverse()
            .map((m) => `${m.role === 'assistant' ? 'Jarvis' : 'Student'}: ${m.content}`)
            .join('\n');
        }
      } catch (histErr) {
        console.warn('Could not fetch chat history:', histErr);
      }
    } else if (userId && !sessionId) {
      try {
        const { data: newSession } = await supabase
          .from('chat_sessions')
          .insert({ user_id: userId })
          .select('id')
          .single();
        if (newSession) {
          currentSessionId = newSession.id;
        }
      } catch (sessErr) {
        console.warn('Could not create chat session:', sessErr);
      }
    }

    // ─────────────────────────────────────────────────────────────
    // STEP 4: Assemble Prompt strictly adhering to Jarvis Persona & Answer Rules
    // ─────────────────────────────────────────────────────────────
    const retrievedChunksText = retrievedChunks.length > 0
      ? retrievedChunks
          .map(
            (c, i) =>
              `[CHUNK ${i + 1} | Source: ${c.source_type} (ID: ${c.source_id}) | Similarity: ${Math.round(
                c.similarity * 100
              )}%]:\n${c.content}`
          )
          .join('\n\n')
      : 'No pre-indexed vector embeddings found in database. Rely strictly on the verified current-state facts.';

    const clientFallbackFacts = profileState
      ? `Verified Skills in Profile: ${(profileState.skills || [])
          .map((s: { name: string; proficiency?: string; verificationStatus?: string }) => `${s.name} (${s.proficiency || 'Intermediate'}, ${s.verificationStatus || 'Verified'})`)
          .join(', ') || 'None listed'}
Showcase Projects in Profile: ${(profileState.projects || [])
          .map((p: { title: string; techStack?: string[] | string; description?: string }) => `${p.title} [Stack: ${Array.isArray(p.techStack) ? p.techStack.join(', ') : p.techStack}]: ${p.description || ''}`)
          .join('; ') || 'None listed'}`
      : '';

    const assembledPrompt = `You are CareerPilot's AI Agent ("Jarvis").
You are NOT customer support. You are a direct, sharp, precise, and proactive engineering mentor speaking directly to THIS specific student.

## PERSONALITY & TONE RULES:
1. Direct, precise, proactive — speak like Jarvis. No conversational fluff, no pleasantries ("Hello, thank you for your question"), no restating the student's question, no disclaimers.
2. Address the student directly ("You", "Your").
3. Always end with ONE concrete, immediate next action (e.g., "Solve 2 Kadane's algorithm drills in Practice Hub", "Add Redis caching architecture notes to your E-Commerce project").

## CORE RETRIEVAL & ANSWER RULES:
1. GROUNDING: Ground your answer strictly in THIS student's actual retrieved data.
2. CITE SPECIFICS: Always cite specific numbers, scores, projects, and skills from their retrieved data (e.g., "Your last interview scored ${latestInterviewScore}", "In your project ${profileState?.projects?.[0]?.title || 'showcase'}..."). Never give generic placement advice.
3. WEIGH REAL OPTIONS: For questions with depth (study priority, resume fix, role choices), briefly weigh 2-3 real options based on their actual verified stack and weak areas before concluding.
4. MISSING DATA HONESTY: If the retrieved data doesn't contain what they ask about, state plainly what's missing instead of inventing facts.
5. NO INVENTED DATA: Never fabricate skills, degrees, grades, projects, or scores not present in the data below.
6. CONTINUITY: Keep answers tight and do not repeat points already established earlier in the session.

## CURRENT-STATE FACTS (Fixed ground truth):
- Target Role: ${targetRole}
- Placement Readiness Score: ${readinessScore}/100
- Latest Interview Benchmark: ${latestInterviewScore}
- Active Critical Weak Areas: ${activeWeakAreas.join(', ') || 'DSA edge cases, System Design trade-offs'}
${clientFallbackFacts ? `- Current Profile Items:\n${clientFallbackFacts}` : ''}

## RETRIEVED VECTOR CHUNKS (Freshly searched from career_embeddings):
${retrievedChunksText}

${conversationHistory ? `## RECENT SESSION CONVERSATION:\n${conversationHistory}\n` : ''}
## STUDENT'S QUESTION:
"${messageText}"`;

    // STEP 6: Call LLM (Gemini 3.5 Flash / Flash Latest with streaming/fallback)
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const candidateModels = ['gemini-3.5-flash', 'gemini-flash-latest', 'gemini-2.5-flash', 'gemini-3.8-flash'];

    // Handle Streaming Response if requested
    if (shouldStream) {
      for (const modelName of candidateModels) {
        try {
          const model = genAI.getGenerativeModel({ model: modelName });
          const resultStream = await model.generateContentStream(assembledPrompt);

          const stream = new ReadableStream({
            async start(controller) {
              const encoder = new TextEncoder();
              let fullAssistantText = '';

              // Send initial metadata event
              const metaEvent = JSON.stringify({
                type: 'meta',
                sessionId: currentSessionId,
                grounding: groundingSources,
                retrievedCount: retrievedChunks.length,
              });
              controller.enqueue(encoder.encode(`data: ${metaEvent}\n\n`));

              // Stream tokens
              for await (const chunk of resultStream.stream) {
                const textChunk = chunk.text();
                fullAssistantText += textChunk;
                const tokenEvent = JSON.stringify({ type: 'token', text: textChunk });
                controller.enqueue(encoder.encode(`data: ${tokenEvent}\n\n`));
              }

              // Send completion event
              const doneEvent = JSON.stringify({ type: 'done', text: fullAssistantText });
              controller.enqueue(encoder.encode(`data: ${doneEvent}\n\n`));
              controller.close();

              // Persist to Supabase asynchronously after stream completes
              if (userId && currentSessionId) {
                try {
                  const chunkIds = retrievedChunks.map((c) => c.id);
                  await supabase.from('chat_messages').insert([
                    {
                      session_id: currentSessionId,
                      user_id: userId,
                      role: 'user',
                      content: messageText,
                      retrieved_chunk_ids: chunkIds,
                    },
                    {
                      session_id: currentSessionId,
                      user_id: userId,
                      role: 'assistant',
                      content: fullAssistantText,
                      retrieved_chunk_ids: chunkIds,
                    },
                  ]);
                } catch (saveErr) {
                  console.warn('Could not persist chat message to Supabase:', saveErr);
                }
              }
            },
          });

          return new Response(stream, {
            headers: {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache, no-transform',
              Connection: 'keep-alive',
            },
          });
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : String(err);
          console.warn(`Streaming failed with ${modelName}, trying next:`, errMsg);
        }
      }
    }

    // Standard Non-Streaming Fallback
    let aiResponseText = '';
    let lastError = '';

    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(assembledPrompt);
        aiResponseText = result.response.text();
        if (aiResponseText) break;
      } catch (err: unknown) {
        lastError = err instanceof Error ? err.message : 'Model call failed';
        console.warn(`Model ${modelName} failed:`, lastError);
      }
    }

    if (!aiResponseText) {
      return NextResponse.json(
        { error: `AI generation failed across models. ${lastError}` },
        { status: 500 }
      );
    }

    // Persist messages to Supabase chat_messages
    if (userId && currentSessionId) {
      try {
        const chunkIds = retrievedChunks.map((c) => c.id);
        await supabase.from('chat_messages').insert([
          {
            session_id: currentSessionId,
            user_id: userId,
            role: 'user',
            content: messageText,
            retrieved_chunk_ids: chunkIds,
          },
          {
            session_id: currentSessionId,
            user_id: userId,
            role: 'assistant',
            content: aiResponseText,
            retrieved_chunk_ids: chunkIds,
          },
        ]);
      } catch (saveErr) {
        console.warn('Could not persist chat message to Supabase:', saveErr);
      }
    }

    return NextResponse.json({
      text: aiResponseText,
      sessionId: currentSessionId,
      grounding: groundingSources,
      retrievedCount: retrievedChunks.length,
      currentFacts: {
        targetRole,
        readinessScore,
        latestInterviewScore,
        activeWeakAreas,
      },
    });
  } catch (error: unknown) {
    console.error('RAG Agent API error:', error);
    const errMsg = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
