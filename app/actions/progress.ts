'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getProgress() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', user.id)
    .single();

  return { data, error };
}

export async function updateProgress(progressData: any) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Not authenticated' };

  const { data, error } = await supabase
    .from('user_progress')
    .update({ ...progressData, updated_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .select()
    .single();

  revalidatePath('/dashboard');
  revalidatePath('/practice');
  return { data, error };
}
