'use server';

import { embed } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function generateEmbeddingAction(content: string) {
  if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY is not set');
    return { success: false, error: 'OpenAI key not configured' };
  }

  try {
    // Generate the embedding using OpenAI's text-embedding-3-small (1536 dims)
    const { embedding } = await embed({
      model: openai.embedding('text-embedding-3-small'),
      value: content,
    });

    return { success: true, embedding };
  } catch (error: any) {
    console.error('Failed to generate embedding:', error);
    return { success: false, error: error.message };
  }
}

