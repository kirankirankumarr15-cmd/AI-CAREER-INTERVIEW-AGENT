/**
 * /api/chat/speak/route.ts
 *
 * POST - Converts text to audio speech using OpenAI TTS (tts-1)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getAIProvider } from '@/lib/ai/provider';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const SpeakSchema = z.object({
  text: z.string().min(1).max(4000),
  voice: z.enum(['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']).optional().default('alloy'),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = SpeakSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid text payload', details: parsed.error.flatten() }, { status: 400 });
    }

    const providerInfo = getAIProvider();
    if (!providerInfo.provider) {
      return NextResponse.json({ error: 'AI provider is not configured.' }, { status: 503 });
    }

    try {
      const audioBuffer = await providerInfo.provider.speak(parsed.data.text, parsed.data.voice);
      return new Response(new Uint8Array(audioBuffer), {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': audioBuffer.length.toString(),
        },
      });
    } catch (ttsErr: unknown) {
      return NextResponse.json(
        { error: ttsErr instanceof Error ? ttsErr.message : 'Text-to-speech failed.' },
        { status: 500 }
      );
    }
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
