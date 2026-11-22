// Service role Supabase client - sirf server-side use karo
// NEVER browser/client component mein import karo
// Yeh RLS bypass karta hai - sirf admin server actions ke liye

import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL aur SUPABASE_SERVICE_ROLE_KEY env variables required hain'
    )
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
