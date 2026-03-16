import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (_supabase) return _supabase;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || url.includes('placeholder')) {
    throw new Error('Supabase not configured');
  }
  _supabase = createClient(url, key);
  return _supabase;
}

// Convenience export — will throw if env not set (use try/catch at call site)
export const supabase = {
  get client() {
    return getSupabase();
  },
  from: (table: string) => getSupabase().from(table),
  rpc: (fn: string, args?: Record<string, unknown>) => getSupabase().rpc(fn, args),
};
