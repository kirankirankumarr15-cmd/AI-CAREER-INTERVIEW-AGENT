'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return { data, error };
}

export async function updateProfile(profileData: any) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Not authenticated' };

  const { data, error } = await supabase
    .from('profiles')
    .update({ ...profileData, updated_at: new Date().toISOString() })
    .eq('id', user.id)
    .select()
    .single();

  revalidatePath('/dashboard');
  revalidatePath('/profile');
  return { data, error };
}

export async function getSkills() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Not authenticated' };

  const { data, error } = await supabase
    .from('skills')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return { data, error };
}

export async function addSkill(skillData: any) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Not authenticated' };

  const { data, error } = await supabase
    .from('skills')
    .insert({ ...skillData, user_id: user.id })
    .select()
    .single();

  revalidatePath('/profile');
  return { data, error };
}

export async function addProject(projectData: any) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Not authenticated' };

  const { data, error } = await supabase
    .from('projects')
    .insert({ ...projectData, user_id: user.id })
    .select()
    .single();

  revalidatePath('/profile');
  return { data, error };
}
