/**
 * lib/ai/quota-manager.ts
 *
 * User rate limiting, daily/monthly quota tracking, and token cost calculation.
 * Prevents runaway spending and provides transparent quota indicators to the student.
 */

import { SupabaseClient } from '@supabase/supabase-js';

export const DAILY_MESSAGE_LIMIT = 50;
export const DAILY_TOKEN_LIMIT = 150_000;

export interface QuotaCheckResult {
  allowed: boolean;
  messagesUsed: number;
  messagesLimit: number;
  tokensUsed: number;
  tokensLimit: number;
  reason?: string;
}

export async function checkUserQuota(
  userId: string,
  supabase: SupabaseClient
): Promise<QuotaCheckResult> {
  const today = new Date().toISOString().split('T')[0];

  try {
    const { data, error } = await supabase
      .from('chat_usage_quotas')
      .select('daily_messages_count, daily_tokens_count')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.warn('Quota check error (proceeding in safe mode):', error);
      return {
        allowed: true,
        messagesUsed: 0,
        messagesLimit: DAILY_MESSAGE_LIMIT,
        tokensUsed: 0,
        tokensLimit: DAILY_TOKEN_LIMIT,
      };
    }

    const messagesUsed = data?.daily_messages_count || 0;
    const tokensUsed = data?.daily_tokens_count || 0;

    if (messagesUsed >= DAILY_MESSAGE_LIMIT) {
      return {
        allowed: false,
        messagesUsed,
        messagesLimit: DAILY_MESSAGE_LIMIT,
        tokensUsed,
        tokensLimit: DAILY_TOKEN_LIMIT,
        reason: `Daily AI usage limit reached (${messagesUsed}/${DAILY_MESSAGE_LIMIT} chats today). Your quota resets at midnight UTC.`,
      };
    }

    if (tokensUsed >= DAILY_TOKEN_LIMIT) {
      return {
        allowed: false,
        messagesUsed,
        messagesLimit: DAILY_MESSAGE_LIMIT,
        tokensUsed,
        tokensLimit: DAILY_TOKEN_LIMIT,
        reason: `Daily token limit reached (${Math.round(tokensUsed / 1000)}k tokens). Quota resets at midnight UTC.`,
      };
    }

    return {
      allowed: true,
      messagesUsed,
      messagesLimit: DAILY_MESSAGE_LIMIT,
      tokensUsed,
      tokensLimit: DAILY_TOKEN_LIMIT,
    };
  } catch {
    return {
      allowed: true,
      messagesUsed: 0,
      messagesLimit: DAILY_MESSAGE_LIMIT,
      tokensUsed: 0,
      tokensLimit: DAILY_TOKEN_LIMIT,
    };
  }
}

export async function recordUserUsage(
  userId: string,
  promptTokens: number,
  completionTokens: number,
  supabase: SupabaseClient
): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const totalNewTokens = promptTokens + completionTokens;

  try {
    const { data: existing } = await supabase
      .from('chat_usage_quotas')
      .select('daily_messages_count, daily_tokens_count, monthly_tokens_count')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('chat_usage_quotas')
        .update({
          daily_messages_count: (existing.daily_messages_count || 0) + 1,
          daily_tokens_count: (existing.daily_tokens_count || 0) + totalNewTokens,
          monthly_tokens_count: (existing.monthly_tokens_count || 0) + totalNewTokens,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('date', today);
    } else {
      await supabase.from('chat_usage_quotas').insert({
        user_id: userId,
        date: today,
        daily_messages_count: 1,
        daily_tokens_count: totalNewTokens,
        monthly_tokens_count: totalNewTokens,
      });
    }
  } catch (err) {
    console.warn('Failed to record token usage:', err);
  }
}

export function estimateCostCents(model: string, promptTokens: number, completionTokens: number): number {
  // Typical rates (e.g. gpt-4o-mini is $0.15/1M prompt, $0.60/1M completion)
  // in cents: $0.15 = 15 cents/1M tokens
  if (model.includes('gpt-4o-mini') || model.includes('flash')) {
    const promptCost = (promptTokens / 1_000_000) * 15;
    const completionCost = (completionTokens / 1_000_000) * 60;
    return Number((promptCost + completionCost).toFixed(4));
  }
  // Standard GPT-4o
  const promptCost = (promptTokens / 1_000_000) * 250;
  const completionCost = (completionTokens / 1_000_000) * 1000;
  return Number((promptCost + completionCost).toFixed(4));
}
