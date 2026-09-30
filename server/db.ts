import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseServerClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient | null {
  if (supabaseServerClient) return supabaseServerClient;

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (url && key) {
    try {
      supabaseServerClient = createClient(url, key, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
      console.log('✅ Supabase Server Client initialized successfully.');
      return supabaseServerClient;
    } catch (err) {
      console.error('Failed to initialize Supabase server client:', err);
      return null;
    }
  }

  return null;
}

export function isSupabaseConnected(): boolean {
  return getSupabaseAdmin() !== null;
}
