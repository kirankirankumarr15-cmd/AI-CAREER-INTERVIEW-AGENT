/**
 * /api/chat/route.ts
 *
 * Core ChatGPT-style AI conversational endpoint for Ask CareerPilot.
 * 
 * Pipeline:
 * 1. Zod request validation
 * 2. Supabase auth and RLS enforcement
 * 3. Daily user quota & rate-limit check
 * 4. Grounded context building (verified credentials + pgvector RAG chunks + thread memory)
 * 5. Multi-turn tool calling (read-only automated, sensitive proposals require user confirmation)
 * 6. Real-time SSE streaming (token by token)
 * 7. Message persistence, token usage, latency & cost logging
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/utils/supabase/server';
import { getAIProvider, StreamChunk, ChatMessageParam } from '@/lib/ai/provider';
import { buildChatContext } from '@/lib/ai/context-builder';
import { checkUserQuota, recordUserUsage, estimateCostCents } from '@/lib/ai/quota-manager';
import { CHAT_TOOLS_DEFINITIONS, executeTool, SensitiveActionProposal } from '@/lib/ai/chat-tools';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ChatRequestSchema = z.object({
  message: z.string().max(10000).optional(),
  prompt: z.string().max(10000).optional(),
  sessionId: z.string().nullable().optional(),
  attachedContent: z.string().max(30000).nullable().optional(),
  rememberAcrossChats: z.boolean().optional(),
  stream: z.boolean().optional(),
  userId: z.string().optional(),
  profileState: z.any().optional(),
});

export async function POST(req: NextRequest) {
  const startMs = Date.now();

  try {
    const rawBody = await req.json().catch(() => ({}));
    const parsed = ChatRequestSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request payload', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const messageText = (parsed.data.message || parsed.data.prompt || '').trim();
    if (!messageText) {
      return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
    }

    const attachedContent = parsed.data.attachedContent || undefined;
    const rememberAcrossChats = parsed.data.rememberAcrossChats;
    const rawSessionId = parsed.data.sessionId?.trim();
    const isUuid = rawSessionId && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(rawSessionId);
    let sessionId = isUuid ? rawSessionId : undefined;

    // ─────────────────────────────────────────────────────────────
    // 1. Authenticate user via Supabase session
    // ─────────────────────────────────────────────────────────────
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthenticated. Please sign in to access Ask CareerPilot.' },
        { status: 401 }
      );
    }

    const userId = user.id;

    // ─────────────────────────────────────────────────────────────
    // 2. Rate limit & token quota enforcement
    // ─────────────────────────────────────────────────────────────
    const quotaCheck = await checkUserQuota(userId, supabase);
    if (!quotaCheck.allowed) {
      return NextResponse.json(
        {
          error: quotaCheck.reason,
          quota: {
            messagesUsed: quotaCheck.messagesUsed,
            messagesLimit: quotaCheck.messagesLimit,
            tokensUsed: quotaCheck.tokensUsed,
            tokensLimit: quotaCheck.tokensLimit,
          },
        },
        { status: 429 }
      );
    }

    // ─────────────────────────────────────────────────────────────
    // 3. Obtain AI Provider (OpenAI primary, Gemini fallback)
    // ─────────────────────────────────────────────────────────────
    const providerInfo = getAIProvider();
    if (!providerInfo.isConfigured || !providerInfo.provider) {
      return NextResponse.json(
        {
          error: "AI isn't configured yet",
          status: 'BLOCKED',
          reason: providerInfo.reason || 'Server is missing AI provider configuration.',
        },
        { status: 503 }
      );
    }

    const provider = providerInfo.provider;

    // ─────────────────────────────────────────────────────────────
    // 4. Ensure or Create Chat Session
    // ─────────────────────────────────────────────────────────────
    if (!sessionId) {
      // Auto-generate title from first 6 words of student prompt
      const words = messageText.trim().split(/\s+/).slice(0, 6).join(' ');
      const cleanTitle = words.length > 35 ? words.slice(0, 35) + '...' : words;

      const { data: newSession, error: sessErr } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: userId,
          title: cleanTitle || 'New Conversation',
          remember_across_chats: !!rememberAcrossChats,
        })
        .select('id')
        .single();

      if (sessErr || !newSession) {
        console.error('Failed to create chat session:', sessErr);
        return NextResponse.json({ error: 'Failed to initialize chat session' }, { status: 500 });
      }

      sessionId = newSession.id;
    } else {
      // Touch session last_active_at
      await supabase
        .from('chat_sessions')
        .update({ last_active_at: new Date().toISOString() })
        .eq('id', sessionId)
        .eq('user_id', userId);
    }

    // ─────────────────────────────────────────────────────────────
    // 5. Build Grounded Context (Verified data + RAG chunks + History)
    // ─────────────────────────────────────────────────────────────
    const { messages: promptMessages, retrievedChunkIds, groundingSources } = await buildChatContext({
      userId,
      userMessage: messageText,
      sessionId,
      supabase,
      rememberAcrossChats,
      attachedContent,
    });

    // ─────────────────────────────────────────────────────────────
    // 6. Tool-Calling Resolution (Read-only tools auto-enrich context)
    // ─────────────────────────────────────────────────────────────
    let pendingProposal: SensitiveActionProposal | null = null;
    let deepLinks: Array<{ label: string; href: string }> = [];

    // Check if the student's question directly relates to high-value tools
    const lowerMsg = messageText.toLowerCase();
    if (lowerMsg.includes('skill') || lowerMsg.includes('gap') || lowerMsg.includes('missing')) {
      const toolRes = await executeTool('get_skill_gap', { targetRole: 'Software Engineer' }, userId, supabase);
      if (toolRes.result) {
        promptMessages.push({
          role: 'system',
          content: `Real-time Skill Gap Data: ${JSON.stringify(toolRes.result)}`,
        });
      }
      if (toolRes.deepLinks) deepLinks.push(...toolRes.deepLinks);
    } else if (lowerMsg.includes('interview') || lowerMsg.includes('score') || lowerMsg.includes('report')) {
      const toolRes = await executeTool('get_latest_interview_report', {}, userId, supabase);
      if (toolRes.result) {
        promptMessages.push({
          role: 'system',
          content: `Latest Interview Performance: ${JSON.stringify(toolRes.result)}`,
        });
      }
      if (toolRes.deepLinks) deepLinks.push(...toolRes.deepLinks);
    } else if (lowerMsg.includes('today') || lowerMsg.includes('mission') || lowerMsg.includes('task')) {
      const toolRes = await executeTool('get_todays_mission', {}, userId, supabase);
      if (toolRes.result) {
        promptMessages.push({
          role: 'system',
          content: `Today's Daily Mission: ${JSON.stringify(toolRes.result)}`,
        });
      }
      if (toolRes.deepLinks) deepLinks.push(...toolRes.deepLinks);
    } else if (lowerMsg.includes('apply') || lowerMsg.includes('application')) {
      const toolRes = await executeTool('get_applications', {}, userId, supabase);
      if (toolRes.result) {
        promptMessages.push({
          role: 'system',
          content: `Current Job Applications: ${JSON.stringify(toolRes.result)}`,
        });
      }
      if (toolRes.deepLinks) deepLinks.push(...toolRes.deepLinks);
    } else if (lowerMsg.includes('practice') || lowerMsg.includes('coding') || lowerMsg.includes('dsa')) {
      const toolRes = await executeTool('recommend_practice', { category: 'technical' }, userId, supabase);
      if (toolRes.deepLinks) deepLinks.push(...toolRes.deepLinks);
    }

    // Deduplicate deep links
    const seenLinks = new Set<string>();
    deepLinks = deepLinks.filter((l) => {
      if (seenLinks.has(l.href)) return false;
      seenLinks.add(l.href);
      return true;
    });

    // ─────────────────────────────────────────────────────────────
    // 7. Save Student Turn to chat_messages
    // ─────────────────────────────────────────────────────────────
    await supabase.from('chat_messages').insert({
      session_id: sessionId,
      user_id: userId,
      role: 'user',
      content: messageText,
      retrieved_chunk_ids: retrievedChunkIds,
    });

    // ─────────────────────────────────────────────────────────────
    // 8. Stream Response to Client via Server-Sent Events (SSE)
    // ─────────────────────────────────────────────────────────────
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (eventData: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(eventData)}\n\n`));
        };

        // Emit initial metadata
        sendEvent({
          type: 'meta',
          sessionId,
          provider: provider.name,
          grounding: groundingSources,
          deepLinks,
        });

        let accumulatedText = '';
        let promptTokens = 0;
        let completionTokens = 0;

        try {
          const aiStream = await provider.chatStream({
            messages: promptMessages,
            tools: CHAT_TOOLS_DEFINITIONS,
            temperature: 0.4,
          });

          for await (const chunk of aiStream) {
            if (chunk.type === 'token' && chunk.text) {
              accumulatedText += chunk.text;
              sendEvent({ type: 'token', text: chunk.text });
            } else if (chunk.type === 'meta' && chunk.usage) {
              promptTokens = chunk.usage.promptTokens;
              completionTokens = chunk.usage.completionTokens;
            } else if (chunk.type === 'tool_call' && chunk.toolCall) {
              try {
                const args = JSON.parse(chunk.toolCall.arguments || '{}');
                const toolExecution = await executeTool(chunk.toolCall.name, args, userId, supabase);
                if (toolExecution.proposal) {
                  pendingProposal = toolExecution.proposal;
                  sendEvent({ type: 'proposal', proposal: toolExecution.proposal });
                }
              } catch (tcErr) {
                console.warn('Tool call parse error:', tcErr);
              }
            } else if (chunk.type === 'error') {
              sendEvent({ type: 'error', error: chunk.error });
            }
          }

          // If provider did not report token counts, estimate based on length
          if (!promptTokens) {
            promptTokens = Math.round(messageText.length / 4) + 350;
          }
          if (!completionTokens) {
            completionTokens = Math.round(accumulatedText.length / 4);
          }

          const latencyMs = Date.now() - startMs;
          const costCents = estimateCostCents(provider.name, promptTokens, completionTokens);

          // ─────────────────────────────────────────────────────────
          // 9. Persist Assistant Reply to chat_messages
          // ─────────────────────────────────────────────────────────
          const { data: savedMsg } = await supabase
            .from('chat_messages')
            .insert({
              session_id: sessionId,
              user_id: userId,
              role: 'assistant',
              content: accumulatedText,
              retrieved_chunk_ids: retrievedChunkIds,
              tokens_prompt: promptTokens,
              tokens_completion: completionTokens,
              model: provider.name,
              latency_ms: latencyMs,
              cost_cents: costCents,
              tool_results: pendingProposal ? [pendingProposal] : [],
            })
            .select('id')
            .single();

          // 10. Record usage in daily quota tracking
          await recordUserUsage(userId, promptTokens, completionTokens, supabase);

          // Final completion event
          sendEvent({
            type: 'done',
            messageId: savedMsg?.id,
            tokens: { promptTokens, completionTokens, totalTokens: promptTokens + completionTokens },
            latencyMs,
            costCents,
          });

          controller.close();
        } catch (streamErr: unknown) {
          console.error('Streaming error in chat route:', streamErr);
          const errMessage = streamErr instanceof Error ? streamErr.message : 'Streaming interrupted';
          sendEvent({ type: 'error', error: errMessage });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (err: unknown) {
    console.error('Unhandled error in /api/chat:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
