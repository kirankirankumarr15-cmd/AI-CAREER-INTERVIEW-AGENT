'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';

export async function generateEmbeddingAction(content: string): Promise<{ success: boolean; embedding?: number[]; error?: string }> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  // 1. Try OpenAI if key is present
  if (openaiKey) {
    try {
      const { embed } = await import('ai');
      const { openai } = await import('@ai-sdk/openai');
      const { embedding } = await embed({
        model: openai.embedding('text-embedding-3-small'),
        value: content,
      });
      if (embedding && embedding.length === 1536) {
        return { success: true, embedding };
      }
    } catch (openaiErr: unknown) {
      const errMsg = openaiErr instanceof Error ? openaiErr.message : String(openaiErr);
      console.warn('OpenAI embedding failed (falling back to Gemini):', errMsg);
    }
  }

  // 2. Fallback to Gemini gemini-embedding-001 (configured for 1536 dims)
  if (geminiKey) {
    try {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const embedModel = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
      const embResult = await embedModel.embedContent({
        content: { role: 'user', parts: [{ text: content }] },
        outputDimensionality: 1536,
      } as unknown as import('@google/generative-ai').EmbedContentRequest);
      const embedding = embResult?.embedding?.values;
      if (embedding && embedding.length === 1536) {
        return { success: true, embedding };
      }
    } catch (geminiErr: unknown) {
      console.error('Gemini embedding failed:', geminiErr);
      const errMsg = geminiErr instanceof Error ? geminiErr.message : 'Gemini embedding failed';
      return { success: false, error: errMsg };
    }
  }

  return { success: false, error: 'No working embedding provider available.' };
}

