import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _supabase: SupabaseClient | null = null;
let _supabaseAdmin: SupabaseClient | null = null;

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

// Server-side admin client — uses service role key to bypass RLS
export function getSupabaseAdmin(): SupabaseClient {
  if (_supabaseAdmin) return _supabaseAdmin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || url.includes('placeholder')) {
    throw new Error('Supabase not configured');
  }
  _supabaseAdmin = createClient(url, key, { auth: { persistSession: false } });
  return _supabaseAdmin;
}

// Convenience export — will throw if env not set (use try/catch at call site)
export const supabase = {
  get client() { return getSupabase(); },
  from: (table: string) => getSupabaseAdmin().from(table),
  rpc: (fn: string, args?: Record<string, unknown>) => getSupabaseAdmin().rpc(fn, args),
};
