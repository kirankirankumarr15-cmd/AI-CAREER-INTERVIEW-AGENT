import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

// Singleton clients
let anthropicClient: Anthropic | null = null;
let openaiClient: OpenAI | null = null;
let geminiClient: GoogleGenerativeAI | null = null;

export function getAnthropicClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.includes('...')) return null;
  if (!anthropicClient) {
    anthropicClient = new Anthropic({ apiKey });
  }
  return anthropicClient;
}

export function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

export function getGeminiClient(): GoogleGenerativeAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!geminiClient) {
    geminiClient = new GoogleGenerativeAI(apiKey);
  }
  return geminiClient;
}

export interface AIGenerationOptions {
  systemPrompt?: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}

/**
 * Universal PRISM AI Generator:
 * 1. Primary: Anthropic Claude (claude-3-5-sonnet-20241022)
 * 2. Secondary Fallback: OpenAI (gpt-4o-mini)
 * 3. Tertiary Fallback: Google Gemini
 */
export async function generatePrismAI(options: AIGenerationOptions): Promise<string> {
  const {
    systemPrompt = 'You are PRISM AI, an expert career and placement readiness mentor for engineering students.',
    userPrompt,
    temperature = 0.2,
    maxTokens = 2500,
    jsonMode = false,
  } = options;

  // 1. Try Claude (Anthropic)
  const claude = getAnthropicClient();
  if (claude) {
    try {
      const response = await claude.messages.create({
        model: process.env.ANTHROPIC_MODEL || process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-latest',
        max_tokens: maxTokens,
        system: systemPrompt + (jsonMode ? '\nYou MUST respond ONLY with valid, parseable JSON. Do not include markdown code blocks or conversational text.' : ''),
        messages: [{ role: 'user', content: userPrompt }],
      });

      const firstBlock = response.content[0];
      if (firstBlock && firstBlock.type === 'text') {
        return firstBlock.text.trim();
      }
    } catch (err) {
      console.warn('[PRISM AI] Claude API call failed, attempting fallback:', err instanceof Error ? err.message : err);
    }
  }

  // 2. Fallback to OpenAI if Anthropic key is not present or failed
  const openai = getOpenAIClient();
  if (openai) {
    try {
      const response = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        temperature,
        max_tokens: maxTokens,
        response_format: jsonMode ? { type: 'json_object' } : undefined,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      });
      return response.choices[0]?.message?.content?.trim() || '';
    } catch (err) {
      console.warn('[PRISM AI] OpenAI fallback call failed:', err instanceof Error ? err.message : err);
    }
  }

  // 3. Fallback to Gemini
  const gemini = getGeminiClient();
  if (gemini) {
    try {
      const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
      const model = gemini.getGenerativeModel({ model: modelName });
      const prompt = `${systemPrompt}\n\n${userPrompt}`;
      const result = await model.generateContent(prompt);
      return result.response.text().trim();
    } catch (err) {
      console.warn('[PRISM AI] Gemini fallback call failed:', err instanceof Error ? err.message : err);
    }
  }

  throw new Error('No AI provider available. Please set ANTHROPIC_API_KEY, OPENAI_API_KEY, or GEMINI_API_KEY in .env.local.');
}

/**
 * Generates and parses structured JSON with safety sanitization
 */
export async function generatePrismJSON<T = Record<string, unknown>>(options: AIGenerationOptions): Promise<T> {
  const raw = await generatePrismAI({ ...options, jsonMode: true });
  
  // Clean markdown code blocks if returned
  let cleaned = raw.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  cleaned = cleaned.trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch (err) {
    console.error('[PRISM AI] Failed to parse JSON output:', cleaned);
    throw new Error('AI produced invalid JSON output. Please retry.');
  }
}
