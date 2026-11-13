import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/utils/supabase/server';
import { generatePrismJSON } from '@/lib/ai/claude';
import { GDParticipant, GDTurn } from '@/types';

const GD_TOPICS = [
  {
    topic: 'Artificial Intelligence in Tech Recruitment: Efficient Scaling vs. Human Fairness',
    domain: 'Technology & Human Capital',
    description: 'Examining whether automated screening algorithms eliminate human bias or inadvertently amplify systemic exclusion.',
    bot1: { name: 'Aarav', role: 'bot' as const, persona: 'Data-driven Innovation Advocate', stance: 'Pro-AI screening: eliminates resume screening fatigue and standardizes baseline evaluation across diverse colleges.' },
    bot2: { name: 'Priya', role: 'bot' as const, persona: 'Ethics & Human Context Specialist', stance: 'Cautionary: algorithms overlook non-traditional student projects and lack contextual empathy for unusual candidate trajectories.' },
  },
  {
    topic: 'Remote Work vs. Office Collaboration: The Optimal Model for Entry-Level Engineers',
    domain: 'Workplace Culture & Velocity',
    description: 'Balancing flexibility and global talent access against osmotic mentoring and hands-on whiteboarding.',
    bot1: { name: 'Rohan', role: 'bot' as const, persona: 'Async Productivity Proponent', stance: 'Favors remote: enables focused deep-work, documentation-first culture, and eliminates commuting fatigue.' },
    bot2: { name: 'Sneha', role: 'bot' as const, persona: 'Collaborative Mentorship Advocate', stance: 'Favors in-person: rapid unblocking, informal hallway learning, and cultural bonding are crucial for fresh graduates.' },
  },
  {
    topic: 'Open Source Software vs. Proprietary Cloud Ecosystems in Enterprise Architecture',
    domain: 'Software Engineering Strategy',
    description: 'Debating vendor independence and community auditing against managed security guarantees and SLA uptime.',
    bot1: { name: 'Aditya', role: 'bot' as const, persona: 'Open Source & Security Auditor', stance: 'Favors Open Source: avoids vendor lock-in, allows full codebase sovereignty, and drives collective security inspection.' },
    bot2: { name: 'Ananya', role: 'bot' as const, persona: 'Enterprise Cloud Architect', stance: 'Favors Managed Cloud: provides guaranteed 99.99% SLAs, compliance certifications, and zero maintenance overhead for engineering teams.' },
  },
  {
    topic: 'Green Computing: Balancing Generative AI Scale with Environmental Sustainability',
    domain: 'Sustainability & AI Scale',
    description: 'Assessing energy-intensive LLM data centers against tangible economic value and productivity gains.',
    bot1: { name: 'Vikram', role: 'bot' as const, persona: 'Techno-Optimist', stance: 'Productivity acceleration from AI will discover new clean energy materials and optimize grid efficiency far beyond its operational draw.' },
    bot2: { name: 'Meera', role: 'bot' as const, persona: 'Sustainability Analyst', stance: 'Unchecked compute consumption without water and carbon caps poses urgent environmental risks that tech leaders must regulate immediately.' },
  },
];

const StartGDSchema = z.object({
  topicIndex: z.number().int().min(0).max(10).optional(),
  customTopic: z.string().max(300).optional(),
  studentName: z.string().min(1).max(100).default('Student'),
  durationMinutes: z.number().int().min(5).max(30).default(10),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = StartGDSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid parameters', details: parsed.error.flatten() }, { status: 400 });
    }

    const { topicIndex = 0, customTopic, studentName, durationMinutes } = parsed.data;
    const selectedPreset = GD_TOPICS[topicIndex % GD_TOPICS.length];
    const topicText = customTopic && customTopic.trim().length > 5 ? customTopic.trim() : selectedPreset.topic;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const sessionId = `gd-${Date.now()}`;

    // Participants definition
    const moderator: GDParticipant = {
      id: `p-mod-${Date.now()}`,
      role: 'moderator',
      name: 'Dr. Sharma',
      persona: 'PRISM Placement Group Discussion Moderator',
      stance: 'Neutral moderator maintaining constructive turn discipline and structured discourse.',
    };

    const bot1: GDParticipant = {
      id: `p-bot1-${Date.now()}`,
      role: 'bot',
      name: selectedPreset.bot1.name,
      persona: selectedPreset.bot1.persona,
      stance: selectedPreset.bot1.stance,
    };

    const bot2: GDParticipant = {
      id: `p-bot2-${Date.now()}`,
      role: 'bot',
      name: selectedPreset.bot2.name,
      persona: selectedPreset.bot2.persona,
      stance: selectedPreset.bot2.stance,
    };

    const human: GDParticipant = {
      id: `p-human-${Date.now()}`,
      role: 'human',
      name: studentName,
      persona: 'Candidate',
    };

    const participants = [moderator, bot1, bot2, human];

    // Moderator opening utterance
    const openingPrompt = `
You are Dr. Sharma, an esteemed Placement Moderator conducting a collegiate Group Discussion for engineering campus recruitment.
Topic: "${topicText}"

TASK:
Generate a professional, balanced 60-second OPENING SPEECH:
1. State the topic clearly.
2. Outline the 3 fundamental rules:
   - Listen actively and build constructively on peers' viewpoints.
   - Ground assertions in evidence and practical engineering realities.
   - Use the "Raise Hand" function or wait for natural pauses to speak.
3. Invite the first participant to start the discussion with their opening perspective.
Keep it under 90 words. Tone: authoritative, welcoming, balanced.

Return ONLY valid JSON:
{
  "content": "Good morning candidates. Welcome to today's placement group discussion on...",
  "suggestedStarter": "Aarav or anyone who wishes to initiate may take the floor."
}
`;

    let openingText = `Good morning candidates. Welcome to today's group discussion round on "${topicText}". In this round, we are evaluating substantive content, clear articulation, initiative, and respectful listening. Remember to build constructively on peer arguments rather than speaking over each other. You may raise your hand or take the floor. ${bot1.name}, would you like to initiate the discussion?`;

    try {
      const gen = await generatePrismJSON<{ content: string; suggestedStarter?: string }>({
        systemPrompt: 'You are the PRISM Group Discussion Moderator.',
        userPrompt: openingPrompt,
      });
      if (gen?.content) {
        openingText = gen.content;
      }
    } catch (err) {
      console.warn('[GD Start API] AI Opening fallback used:', err);
    }

    const openingTurn: GDTurn = {
      id: `turn-0-${Date.now()}`,
      sessionId,
      participantId: moderator.id,
      speakerName: moderator.name,
      speakerRole: 'moderator',
      turnIndex: 0,
      content: openingText,
      inputMethod: 'system',
      timestampMs: Date.now(),
      durationSeconds: 20,
    };

    // Store in Supabase if user is authenticated
    if (user) {
      const { data: sessionData } = await supabase
        .from('gd_sessions')
        .insert({
          user_id: user.id,
          topic: topicText,
          status: 'in_progress',
          duration_seconds: durationMinutes * 60,
          turns: [openingTurn],
        })
        .select()
        .maybeSingle();

      if (sessionData) {
        // Insert participants
        await supabase.from('gd_participants').insert(
          participants.map((p) => ({
            session_id: sessionData.id,
            role: p.role,
            name: p.name,
            persona: p.persona,
            stance: p.stance,
          }))
        );

        // Insert opening turn
        await supabase.from('gd_turns').insert({
          session_id: sessionData.id,
          participant_id: moderator.id,
          speaker_name: moderator.name,
          speaker_role: 'moderator',
          turn_index: 0,
          content: openingText,
          inputMethod: 'system',
          duration_seconds: 20,
          timestamp_ms: Date.now(),
        });

        return NextResponse.json({
          sessionId: sessionData.id,
          topic: topicText,
          durationMinutes,
          participants,
          openingTurn,
        });
      }
    }

    return NextResponse.json({
      sessionId,
      topic: topicText,
      durationMinutes,
      participants,
      openingTurn,
    });
  } catch (err) {
    console.error('[GD Start API] Fatal error:', err);
    return NextResponse.json({ error: 'Failed to initialize Group Discussion' }, { status: 500 });
  }
}

