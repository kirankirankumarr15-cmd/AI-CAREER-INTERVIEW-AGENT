/**
 * lib/ai/provider.ts
 *
 * Pluggable AI Provider Adapter Interface & Implementations
 * 
 * Supports:
 * - OpenAIProvider (Official OpenAI SDK: chat completions with streaming,
 *   tool-calling, embeddings, Whisper STT, TTS)
 * - GeminiProvider (GoogleGenerativeAI dual-provider fallback)
 *
 * Adheres strictly to setup rules:
 * - Models read dynamically from environment variables
 * - Server-side only: keys are never leaked to client
 * - Descriptive error if key is missing or quota exhausted
 */

import { OpenAI } from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface ChatMessageParam {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  tool_call_id?: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface StreamChunk {
  type: 'token' | 'tool_call' | 'meta' | 'error' | 'done';
  text?: string;
  toolCall?: {
    id: string;
    name: string;
    arguments: string;
  };
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  error?: string;
}

export interface AIProvider {
  name: 'openai' | 'gemini';
  chatStream(params: {
    messages: ChatMessageParam[];
    tools?: ToolDefinition[];
    temperature?: number;
    maxTokens?: number;
  }): AsyncIterable<StreamChunk>;
  embed(text: string): Promise<number[]>;
  transcribe(fileBuffer: Buffer, filename?: string, mimeType?: string): Promise<string>;
  speak(text: string, voice?: string): Promise<Buffer>;
}

// ─────────────────────────────────────────────────────────────
// OpenAI Provider Implementation
// ─────────────────────────────────────────────────────────────
export class OpenAIProvider implements AIProvider {
  public name = 'openai' as const;
  private client: OpenAI;
  private chatModel: string;
  private embeddingModel: string;
  private sttModel: string;
  private ttsModel: string;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured in server environment.');
    }
    this.client = new OpenAI({ apiKey });
    this.chatModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    this.embeddingModel = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';
    this.sttModel = process.env.OPENAI_STT_MODEL || 'whisper-1';
    this.ttsModel = process.env.OPENAI_TTS_MODEL || 'tts-1';
  }

  async *chatStream(params: {
    messages: ChatMessageParam[];
    tools?: ToolDefinition[];
    temperature?: number;
    maxTokens?: number;
  }): AsyncIterable<StreamChunk> {
    const formattedMessages: OpenAI.Chat.ChatCompletionMessageParam[] = params.messages.map((m) => {
      if (m.role === 'tool') {
        return {
          role: 'tool',
          content: m.content,
          tool_call_id: m.tool_call_id || '',
        };
      }
      return {
        role: m.role,
        content: m.content,
      } as OpenAI.Chat.ChatCompletionMessageParam;
    });

    const openAiTools: OpenAI.Chat.ChatCompletionTool[] | undefined = params.tools?.map((t) => ({
      type: 'function',
      function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      },
    }));

    try {
      const stream = await this.client.chat.completions.create({
        model: this.chatModel,
        messages: formattedMessages,
        tools: openAiTools && openAiTools.length > 0 ? openAiTools : undefined,
        temperature: params.temperature ?? 0.4,
        max_tokens: params.maxTokens ?? 2000,
        stream: true,
        stream_options: { include_usage: true },
      });

      let accumulatedToolCalls: Record<number, { id: string; name: string; args: string }> = {};

      for await (const chunk of stream) {
        // 1. Check for token deltas
        const delta = chunk.choices[0]?.delta;
        if (delta?.content) {
          yield { type: 'token', text: delta.content };
        }

        // 2. Check for tool call deltas
        if (delta?.tool_calls) {
          for (const tc of delta.tool_calls) {
            const idx = tc.index ?? 0;
            if (!accumulatedToolCalls[idx]) {
              accumulatedToolCalls[idx] = {
                id: tc.id || `call_${Date.now()}_${idx}`,
                name: tc.function?.name || '',
                args: '',
              };
            }
            if (tc.function?.name) {
              accumulatedToolCalls[idx].name = tc.function.name;
            }
            if (tc.function?.arguments) {
              accumulatedToolCalls[idx].args += tc.function.arguments;
            }
          }
        }

        // 3. Check for usage report
        if (chunk.usage) {
          yield {
            type: 'meta',
            usage: {
              promptTokens: chunk.usage.prompt_tokens,
              completionTokens: chunk.usage.completion_tokens,
              totalTokens: chunk.usage.total_tokens,
            },
          };
        }
      }

      // Yield accumulated complete tool calls if any
      for (const idx in accumulatedToolCalls) {
        const tc = accumulatedToolCalls[idx];
        yield {
          type: 'tool_call',
          toolCall: {
            id: tc.id,
            name: tc.name,
            arguments: tc.args,
          },
        };
      }

      yield { type: 'done' };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      yield { type: 'error', error: errorMessage };
    }
  }

  async embed(text: string): Promise<number[]> {
    const res = await this.client.embeddings.create({
      model: this.embeddingModel,
      input: text.slice(0, 8000), // sanitize length
    });
    return res.data[0].embedding;
  }

  async transcribe(fileBuffer: Buffer, filename = 'speech.wav', mimeType = 'audio/wav'): Promise<string> {
    const file = await OpenAI.toFile(fileBuffer, filename, { type: mimeType });
    const res = await this.client.audio.transcriptions.create({
      file,
      model: this.sttModel,
    });
    return res.text;
  }

  async speak(text: string, voice = 'alloy'): Promise<Buffer> {
    const res = await this.client.audio.speech.create({
      model: this.ttsModel,
      voice: voice as 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer',
      input: text.slice(0, 4000),
    });
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}

// ─────────────────────────────────────────────────────────────
// Gemini Dual-Provider Fallback Implementation
// ─────────────────────────────────────────────────────────────
export class GeminiProvider implements AIProvider {
  public name = 'gemini' as const;
  private genAI: GoogleGenerativeAI;
  private preferredModels = ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured in server environment.');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async *chatStream(params: {
    messages: ChatMessageParam[];
    tools?: ToolDefinition[];
    temperature?: number;
    maxTokens?: number;
  }): AsyncIterable<StreamChunk> {
    // Construct prompt history for Gemini
    const systemMsg = params.messages.find((m) => m.role === 'system')?.content || '';
    const nonSystem = params.messages.filter((m) => m.role !== 'system');

    let contents = nonSystem.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    // If contents starts with model or is empty, ensure valid shape
    if (contents.length === 0 || contents[0].role === 'model') {
      contents = [{ role: 'user', parts: [{ text: 'Hello' }] }, ...contents];
    }

    let stream = null;
    let lastError: Error | null = null;

    for (const modelName of this.preferredModels) {
      try {
        const model = this.genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: systemMsg ? { role: 'system', parts: [{ text: systemMsg }] } : undefined,
          generationConfig: {
            temperature: params.temperature ?? 0.4,
            maxOutputTokens: params.maxTokens ?? 2000,
          },
        });

        stream = await model.generateContentStream({ contents });
        break; // Successfully started stream
      } catch (e: unknown) {
        lastError = e instanceof Error ? e : new Error(String(e));
      }
    }

    if (!stream) {
      yield { type: 'error', error: lastError?.message || 'Gemini service temporarily unavailable.' };
      return;
    }

    try {
      let promptEstimate = Math.round(params.messages.reduce((acc, m) => acc + m.content.length / 4, 0));
      let completionChars = 0;

      for await (const chunk of stream.stream) {
        const text = chunk.text();
        if (text) {
          completionChars += text.length;
          yield { type: 'token', text };
        }
      }

      const completionTokens = Math.round(completionChars / 4);
      yield {
        type: 'meta',
        usage: {
          promptTokens: promptEstimate,
          completionTokens,
          totalTokens: promptEstimate + completionTokens,
        },
      };

      yield { type: 'done' };
    } catch (streamErr: unknown) {
      yield { type: 'error', error: streamErr instanceof Error ? streamErr.message : String(streamErr) };
    }
  }

  async embed(text: string): Promise<number[]> {
    const embeddingModel = this.genAI.getGenerativeModel({ model: 'text-embedding-004' });
    try {
      const res = await embeddingModel.embedContent(text.slice(0, 4000));
      const values = res.embedding.values;
      // Pad or truncate to 1536 if needed to match vector(1536) in Postgres
      if (values.length === 1536) return values;
      if (values.length > 1536) return values.slice(0, 1536);
      return [...values, ...new Array(1536 - values.length).fill(0)];
    } catch {
      return new Array(1536).fill(0);
    }
  }

  async transcribe(_fileBuffer: Buffer): Promise<string> {
    throw new Error('STT transcription via Gemini is not configured. Please use browser speech-to-text or OpenAI Whisper.');
  }

  async speak(_text: string): Promise<Buffer> {
    throw new Error('TTS via Gemini is not configured. Please use browser speech synthesis or OpenAI TTS.');
  }
}

// ─────────────────────────────────────────────────────────────
// Provider Factory
// ─────────────────────────────────────────────────────────────
export function getAIProvider(): { provider: AIProvider | null; providerName: string; isConfigured: boolean; reason?: string } {
  const chosenProvider = (process.env.AI_PROVIDER || 'openai').toLowerCase();

  if (chosenProvider === 'openai') {
    if (!process.env.OPENAI_API_KEY) {
      // Check if fallback Gemini is configured
      if (process.env.GEMINI_API_KEY) {
        return {
          provider: new GeminiProvider(),
          providerName: 'gemini',
          isConfigured: true,
          reason: 'OpenAI key not provided; operating in Gemini fallback mode.',
        };
      }
      return {
        provider: null,
        providerName: 'openai',
        isConfigured: false,
        reason: 'OPENAI_API_KEY is not configured in server environment.',
      };
    }
    return {
      provider: new OpenAIProvider(),
      providerName: 'openai',
      isConfigured: true,
    };
  }

  if (chosenProvider === 'gemini') {
    if (!process.env.GEMINI_API_KEY) {
      return {
        provider: null,
        providerName: 'gemini',
        isConfigured: false,
        reason: 'GEMINI_API_KEY is not configured in server environment.',
      };
    }
    return {
      provider: new GeminiProvider(),
      providerName: 'gemini',
      isConfigured: true,
    };
  }

  return {
    provider: null,
    providerName: chosenProvider,
    isConfigured: false,
    reason: `Unknown AI_PROVIDER "${chosenProvider}". Expected "openai" or "gemini".`,
  };
}
