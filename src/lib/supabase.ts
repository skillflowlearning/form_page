// Supabase browser client - auth ke liye
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const DEFAULT_SUPABASE_URL = 'https://aaxwmkodmbdgoobhvlcs.supabase.co'
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_-EUOW7884Uqg8MVSsBP5Dg_6akHEO4D'

const rawUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY

// URL ko sanitize karo: agar galti se /rest/v1 ya trailing slash laga ho toh strip kar do
function sanitizeUrl(url: string | undefined): string {
  if (!url || !url.startsWith('http')) return DEFAULT_SUPABASE_URL
  return url
    .trim()
    .replace(/\/rest\/v1\/?$/, '')
    .replace(/\/auth\/v1\/?$/, '')
    .replace(/\/+$/, '')
}

const supabaseUrl = sanitizeUrl(rawUrl)
const supabaseAnonKey = rawKey?.trim() || DEFAULT_SUPABASE_ANON_KEY

export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true,
  },
})
