import { generateEmbeddingAction } from '@/app/actions/rag';
import { supabase } from '@/lib/supabase/client';

export async function syncToVectorDB(
  userId: string,
  sourceType: string,
  sourceId: string,
  content: string
) {
  try {
    // 1. Get embedding from Server Action (hides API key)
    const { success, embedding, error } = await generateEmbeddingAction(content);
    
    if (!success || !embedding) {
      console.error('Embedding generation failed:', error);
      return false;
    }

    // 2. Upsert into Supabase from client (automatically uses current user session for RLS)
    const { error: dbError } = await supabase
      .from('career_embeddings')
      .upsert({
        user_id: userId,
        source_type: sourceType,
        source_id: sourceId,
        content: content,
        embedding: embedding,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id, source_type, source_id' });

    if (dbError) throw dbError;
    
    return true;
  } catch (err) {
    console.error('Failed to sync vector to DB:', err);
    return false;
  }
}
