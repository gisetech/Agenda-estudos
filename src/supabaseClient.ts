import { createClient } from '@supabase/supabase-js';

const meta = (import.meta as any) || {};
const env = meta.env || {};
const supabaseUrl = env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

// Use lookalike placeholders if not configured to prevent crashes on initialization
const finalUrl = isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co';
const finalKey = isSupabaseConfigured ? supabaseAnonKey : 'placeholder-anon-key';

// We target the custom isolated 'novo_site' schema for all DB operations
export const supabase = createClient(finalUrl, finalKey, {
  db: {
    schema: 'novo_site'
  }
});

