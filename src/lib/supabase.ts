// Supabase browser client - auth ke liye
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const rawUrl = import.meta.env.VITE_SUPABASE_URL
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// URL ko sanitize karo: agar galti se /rest/v1 ya trailing slash laga ho toh strip kar do
function sanitizeUrl(url: string | undefined): string {
  if (!url || !url.startsWith('http')) return 'https://placeholder.supabase.co'
  return url
    .trim()
    .replace(/\/rest\/v1\/?$/, '')
    .replace(/\/auth\/v1\/?$/, '')
    .replace(/\/+$/, '')
}

const supabaseUrl = sanitizeUrl(rawUrl)
const supabaseAnonKey = rawKey?.trim() || 'placeholder-key'

export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true,
  },
})
