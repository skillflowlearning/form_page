// Shared helper: server-side current user aur role fetch karo
// Har server action mein import karo - client-side role check KAAFI NAHI hai

import { createClient } from '@/lib/supabase/server'

export type UserRole = 'student' | 'admin'

export interface CurrentUser {
  id: string
  role: UserRole
  email: string | undefined
}

/**
 * Current logged-in user ka id aur role return karta hai.
 * Agar user logged in nahi hai ya profile nahi mili → error throw karta hai.
 */
export async function requireAuth(): Promise<CurrentUser> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Unauthorized: Please log in first.')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    throw new Error('Profile not found.')
  }

  return {
    id: user.id,
    role: profile.role as UserRole,
    email: user.email,
  }
}

/**
 * Sirf admin ke liye - non-admin call kare to error.
 */
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireAuth()
  if (user.role !== 'admin') {
    throw new Error('Forbidden: Admin access required.')
  }
  return user
}
