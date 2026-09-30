import { createClient } from '@supabase/supabase-js';

const metaEnv = (import.meta as any).env || {};
const supabaseUrl = metaEnv.VITE_SUPABASE_URL || '';
const supabaseAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;

/**
 * Helper to upload image to Supabase Storage
 * Standard path structure: products/{productId}/{filename}
 */
export async function uploadProductImage(productId: string, file: File): Promise<{ url: string; path: string } | null> {
  if (!supabase) {
    console.warn('Supabase storage is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
    return null;
  }

  const cleanName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  const filePath = `products/${productId}/${cleanName}`;

  const { data, error } = await supabase.storage
    .from('product-photos')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error('Failed to upload image to Supabase Storage:', error);
    throw error;
  }

  const { data: publicUrlData } = supabase.storage
    .from('product-photos')
    .getPublicUrl(data.path);

  return {
    url: publicUrlData.publicUrl,
    path: data.path
  };
}
