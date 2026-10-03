/** Supabase client (web build, used for browser testing). Uses the browser's localStorage. */
import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';

export const supabaseConfigured = url.length > 0 && key.length > 0;

export const supabase = createClient(url || 'https://invalid.supabase.co', key || 'missing', {
  auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
});
