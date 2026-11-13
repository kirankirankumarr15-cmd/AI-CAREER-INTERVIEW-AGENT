import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/utils/supabase/server';
import { generatePrismJSON } from '@/lib/ai/claude';
import { GDParticipant, GDTurn } from '@/types';

const TurnRequestSchema = z.object({
  sessionId: z.string(),
  topic: z.string(),
  studentContent: z.string().optional(),
  inputMethod: z.enum(['voice', 'text', 'system']).default('voice'),
  raisedHand: z.boolean().optional().default(false),
  recentTurns: z.array(z.object({
    speakerName: z.string(),
    speakerRole: z.enum(['moderator', 'human', 'bot']),
    content: z.string(),
    turnIndex: z.number(),
  })),
  participants: z.array(z.object({
    id: z.string(),
    role: z.enum(['moderator', 'human', 'bot']),
    name: z.string(),
    persona: z.string().optional(),
    stance: z.string().optional(),
  })),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = TurnRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 });
    }

    const { sessionId, topic, studentContent, inputMethod, raisedHand, recentTurns, participants } = parsed.data;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const moderator = participants.find((p) => p.role === 'moderator') || {
      id: 'p-mod',
      role: 'moderator' as const,
      name: 'Dr. Sharma',
    };
    const bots = participants.filter((p) => p.role === 'bot');
    const human = participants.find((p) => p.role === 'human') || {
      id: 'p-human',
      role: 'human' as const,
      name: 'Candidate',
    };

    const currentTurnIndex = recentTurns.length;

    // Case 1: Student raised hand
    if (raisedHand) {
      const modSpeech = `Thank you. ${human.name} has raised their hand. Please go ahead, the floor is yours.`;
      const modTurn: GDTurn = {
        id: `turn-${currentTurnIndex}-${Date.now()}`,
        sessionId,
        participantId: moderator.id,
        speakerName: moderator.name,
        speakerRole: 'moderator',
        turnIndex: currentTurnIndex,
        content: modSpeech,
        inputMethod: 'system',
        timestampMs: Date.now(),
        durationSeconds: 8,
      };

      if (user) {
        await supabase.from('gd_turns').insert({
          session_id: sessionId,
          participant_id: moderator.id,
          speaker_name: moderator.name,
          speaker_role: 'moderator',
          turn_index: currentTurnIndex,
          content: modSpeech,
          input_method: 'system',
          duration_seconds: 8,
          timestamp_ms: Date.now(),
        });
      }

      return NextResponse.json({
        nextTurn: modTurn,
        speaker: moderator,
      });
    }

    // Case 2: Standard turn progression (Bot responds to student or peer)
    // Determine which bot should speak (alternate or pick based on stance)
    const lastTurn = recentTurns[recentTurns.length - 1];
    let respondingBot = bots[0];
    if (lastTurn && lastTurn.speakerName === bots[0]?.name && bots[1]) {
      respondingBot = bots[1];
    } else if (bots[1] && Math.random() > 0.5) {
      respondingBot = bots[1];
    }

    const transcriptExcerpt = recentTurns.slice(-6).map((t) => `${t.speakerName} (${t.speakerRole}): "${t.content}"`).join('\n');

    const botPrompt = `
You are roleplaying as ${respondingBot.name}, a candidate in an active campus placement Group Discussion.
Topic: "${topic}"
Your Persona: ${respondingBot.persona || 'Analytical Candidate'}
Your Stance: ${respondingBot.stance || 'Balanced Perspective'}

RECENT DISCUSSION TRANSCRIPT:
${transcriptExcerpt || '(Discussion starting)'}

${studentContent ? `THE HUMAN CANDIDATE (${human.name}) JUST SAID:\n"${studentContent}"` : 'The floor has opened for the next participant to contribute.'}

TASK:
Deliver your next spoken contribution (under 75 words):
1. RESPOND DIRECTLY to what was actually said above by ${studentContent ? human.name : 'the previous speaker'}.
2. Either build on their argument ("I agree with that point, and to add...", or "While that is valid, from a scalability perspective...") or present a polite, evidence-grounded counter-argument.
3. Keep the discussion energetic, professional, and collaborative.
4. Do not summarize or act as a moderator. Act as a sharp, collegiate peer.

Return ONLY valid JSON:
{
  "content": "Your spoken contribution here...",
  "keyPoint": "Summary of your argument"
}
`;

    let generatedContent = `I appreciate that perspective. Looking at the operational realities in industry, we also have to account for implementation overhead and security compliance. A phased hybrid rollout often mitigates the risks while capturing the core efficiencies.`;

    try {
      const gen = await generatePrismJSON<{ content: string; keyPoint?: string }>({
        systemPrompt: `You are roleplaying as ${respondingBot.name} in a collegiate group discussion.`,
        userPrompt: botPrompt,
      });
      if (gen?.content) {
        generatedContent = gen.content;
      }
    } catch (err) {
      console.warn('[GD Turn API] AI fallback used:', err);
    }

    const nextTurn: GDTurn = {
      id: `turn-${currentTurnIndex}-${Date.now()}`,
      sessionId,
      participantId: respondingBot.id,
      speakerName: respondingBot.name,
      speakerRole: 'bot',
      turnIndex: currentTurnIndex,
      content: generatedContent,
      inputMethod: 'voice',
      timestampMs: Date.now(),
      durationSeconds: 15,
    };

    if (user) {
      await supabase.from('gd_turns').insert({
        session_id: sessionId,
        participant_id: respondingBot.id,
        speaker_name: respondingBot.name,
        speaker_role: 'bot',
        turn_index: currentTurnIndex,
        content: generatedContent,
        input_method: 'voice',
        duration_seconds: 15,
        timestamp_ms: Date.now(),
      });
    }

    return NextResponse.json({
      nextTurn,
      speaker: respondingBot,
    });
  } catch (err) {
    console.error('[GD Turn API] Fatal error:', err);
    return NextResponse.json({ error: 'Failed to process discussion turn' }, { status: 500 });
  }
}

