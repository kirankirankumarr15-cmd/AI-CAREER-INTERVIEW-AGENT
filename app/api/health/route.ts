import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getAnthropicClient, getOpenAIClient, getGeminiClient } from '@/lib/ai/claude';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();

  // 1. Database Connection Check (Node.js Core SQLite Engine + Cloud Fallback)
  const dbStatus = {
    connected: true,
    latencyMs: 1,
    engine: 'Node.js SQLite Core (Persistent)',
    error: null as string | null,
    source: 'Local SQLite Engine (data/careerpilot.db) with Supabase Cloud Sync',
  };

  try {
    const dbPingStart = Date.now();
    const { nodeDb } = await import('@/lib/db/nodeDb');
    nodeDb.getSubjects();
    dbStatus.latencyMs = Math.max(1, Date.now() - dbPingStart);
  } catch (err) {
    dbStatus.error = err instanceof Error ? err.message : 'Database check failed';
    dbStatus.connected = false;
  }

  // 2. Storage Check
  const storageStatus = {
    accessible: false,
    error: null as string | null,
  };

  if (dbStatus.connected) {
    try {
      const supabase = await createClient();
      const { data: _buckets, error } = await supabase.storage.listBuckets();
      if (error) {
        storageStatus.error = error.message;
      } else {
        storageStatus.accessible = true;
      }
    } catch (err) {
      storageStatus.error = err instanceof Error ? err.message : 'Storage unreachable';
    }
  }

  // 3. AI Providers Health & Configuration
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  const anthropicModel = process.env.ANTHROPIC_MODEL || process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-latest';
  const openaiModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  const aiProviders = {
    anthropic: {
      configured: Boolean(anthropicKey && !anthropicKey.includes('...')),
      model: anthropicModel,
      clientReady: Boolean(getAnthropicClient()),
    },
    openai: {
      configured: Boolean(openaiKey && !openaiKey.includes('...')),
      model: openaiModel,
      clientReady: Boolean(getOpenAIClient()),
    },
    gemini: {
      configured: Boolean(geminiKey && !geminiKey.includes('...')),
      model: 'gemini-1.5-flash',
      clientReady: Boolean(getGeminiClient()),
    },
    activePrimary: anthropicKey && !anthropicKey.includes('...')
      ? 'anthropic'
      : openaiKey && !openaiKey.includes('...')
      ? 'openai'
      : geminiKey && !geminiKey.includes('...')
      ? 'gemini'
      : 'none',
  };

  const isProduction = process.env.NODE_ENV === 'production';
  const healthy = dbStatus.connected && aiProviders.activePrimary !== 'none';

  return NextResponse.json(
    {
      status: healthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      responseTimeMs: Date.now() - startTime,
      environment: process.env.NODE_ENV || 'development',
      devFallbackAllowed: !isProduction,
      database: dbStatus,
      storage: storageStatus,
      ai: aiProviders,
    },
    { status: healthy ? 200 : 503 }
  );
}

