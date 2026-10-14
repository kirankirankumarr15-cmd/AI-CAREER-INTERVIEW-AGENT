/**
 * /api/chat/transcribe/route.ts
 *
 * POST - Transcribes audio blob using OpenAI Whisper (or provider)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getAIProvider } from '@/lib/ai/provider';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as Blob | null;

    if (!file) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    const providerInfo = getAIProvider();
    if (!providerInfo.provider) {
      return NextResponse.json({ error: 'AI provider is not configured.' }, { status: 503 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    try {
      const transcript = await providerInfo.provider.transcribe(buffer, 'speech.wav', file.type || 'audio/wav');
      return NextResponse.json({ text: transcript });
    } catch (transcribeErr: unknown) {
      return NextResponse.json(
        { error: transcribeErr instanceof Error ? transcribeErr.message : 'Transcription failed.' },
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
