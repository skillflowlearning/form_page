'use server'

// ============================================================
// Admin Server Actions
// makeAdmin, removeAdmin, deleteStudent, postCommunityMessage
// Har action mein server-side role check hai
// ============================================================

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth-helpers'
import { revalidatePath } from 'next/cache'

// ─────────────────────────────────────────────
// 1. makeAdmin(email)
// Kisi bhi existing user ko admin banao
// Sirf current admin call kar sakta hai
// ─────────────────────────────────────────────
export async function makeAdmin(email: string) {
  // Server-side admin check
  await requireAdmin()

  if (!email || !email.includes('@')) {
    return { success: false, error: 'Valid email required.' }
  }

  const supabase = await createClient()

  // Check karo ki user exist karta hai ya nahi
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('id, role, email')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle()

  if (fetchError) {
    return { success: false, error: 'Database error: ' + fetchError.message }
  }

  if (!profile) {
    return { success: false, error: `User with email "${email}" not found in profiles.` }
  }

  if (profile.role === 'admin') {
    return { success: false, error: 'User is already an admin.' }
  }

  // Role update karo
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ role: 'admin' })
    .eq('id', profile.id)

  if (updateError) {
    return { success: false, error: 'Failed to update role: ' + updateError.message }
  }

  revalidatePath('/admin/dashboard')
  return { success: true, message: `${email} is now an admin.` }
}


// ─────────────────────────────────────────────
// 2. removeAdmin(userId)
// Admin ko wapas student banao
// Khud apna role demote nahi kar sakta
// ─────────────────────────────────────────────
export async function removeAdmin(userId: string) {
  const caller = await requireAdmin()

  if (!userId) {
    return { success: false, error: 'userId required.' }
  }

  // Self-demotion rokna
  if (caller.id === userId) {
    return {
      success: false,
      error: 'You cannot demote yourself. Ask another admin to do it.',
    }
  }

  const supabase = await createClient()

  // Check karo target user admin hai ya nahi
  const { data: target, error: fetchError } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', userId)
    .maybeSingle()

  if (fetchError || !target) {
    return { success: false, error: 'User not found.' }
  }

  if (target.role !== 'admin') {
    return { success: false, error: 'User is not an admin.' }
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ role: 'student' })
    .eq('id', userId)

  if (updateError) {
    return { success: false, error: 'Failed to demote: ' + updateError.message }
  }

  revalidatePath('/admin/dashboard')
  return { success: true, message: 'Admin demoted to student.' }
}


// ─────────────────────────────────────────────
// 3. deleteStudent(userId)
// Supabase Auth se + profile cascade delete
// Service role key use hoti hai (RLS bypass)
// ─────────────────────────────────────────────
export async function deleteStudent(userId: string) {
  await requireAdmin()

  if (!userId) {
    return { success: false, error: 'userId required.' }
  }

  // Service role client - auth.admin access ke liye
  const adminClient = createAdminClient()

  // Pehle verify karo ki ye user student hai
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle()

  if (!profile) {
    return { success: false, error: 'User not found.' }
  }

  if (profile.role === 'admin') {
    return {
      success: false,
      error: 'Cannot delete an admin account. Remove admin role first.',
    }
  }

  // Auth user delete karo (profile bhi cascade delete hogi — ensure FK ON DELETE CASCADE)
  const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId)

  if (deleteError) {
    return { success: false, error: 'Delete failed: ' + deleteError.message }
  }

  revalidatePath('/admin/dashboard')
  return { success: true, message: 'Student deleted successfully.' }
}


// ─────────────────────────────────────────────
// 4. postCommunityMessage(message)
// Sirf admin post kar sakta hai
// ─────────────────────────────────────────────
export async function postCommunityMessage(message: string) {
  const admin = await requireAdmin()

  if (!message || message.trim().length === 0) {
    return { success: false, error: 'Message cannot be empty.' }
  }

  if (message.trim().length > 2000) {
    return { success: false, error: 'Message too long (max 2000 characters).' }
  }

  const supabase = await createClient()

  const { error } = await supabase.from('community_messages').insert({
    sender_id: admin.id,
    message: message.trim(),
  })

  if (error) {
    return { success: false, error: 'Failed to post message: ' + error.message }
  }

  revalidatePath('/student/dashboard')
  revalidatePath('/admin/dashboard')
  return { success: true, message: 'Message posted successfully.' }
}
