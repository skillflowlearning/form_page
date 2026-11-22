import crypto from 'node:crypto'
import nodemailer from 'nodemailer'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// SHA-256 helper
function hashSecret(secret: string): string {
  return crypto.createHash('sha256').update(secret).digest('hex')
}

// In-memory fallback if Supabase table is not yet set up
const inMemoryOtpStore = new Map<string, {
  otp_code: string
  expires_at: number
  attempts: number
  last_sent_at: number
  purpose: string
}>()

function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
  if (!url || !serviceKey || url.includes('placeholder')) return null
  return createClient(url, serviceKey)
}

// (A) Generate & Store OTP
export async function generateAndStoreOtp(
  email: string,
  purpose: string = 'signup'
): Promise<{ success: boolean; otp?: string; error?: string; cooldownSeconds?: number }> {
  const normalizedEmail = email.toLowerCase().trim()
  const now = Date.now()
  const adminClient = getSupabaseAdmin()

  // 1. 60-second cooldown check
  if (adminClient) {
    try {
      const { data: existing } = await adminClient
        .from('otp_verifications')
        .select('last_sent_at')
        .eq('email', normalizedEmail)
        .maybeSingle()

      if (existing?.last_sent_at) {
        const lastSent = new Date(existing.last_sent_at).getTime()
        const diffSeconds = Math.floor((now - lastSent) / 1000)
        if (diffSeconds < 60) {
          return {
            success: false,
            error: `Please wait ${60 - diffSeconds}s before requesting a new code.`,
            cooldownSeconds: 60 - diffSeconds,
          }
        }
      }
    } catch {
      // fallback to memory check
    }
  }

  const mem = inMemoryOtpStore.get(normalizedEmail)
  if (mem) {
    const diffSeconds = Math.floor((now - mem.last_sent_at) / 1000)
    if (diffSeconds < 60) {
      return {
        success: false,
        error: `Please wait ${60 - diffSeconds}s before requesting a new code.`,
        cooldownSeconds: 60 - diffSeconds,
      }
    }
  }

  // 2. Cryptographically secure 6-digit random number
  const rawOtp = crypto.randomInt(100000, 999999).toString()
  const hashedOtp = hashSecret(rawOtp)
  const expiresAt = new Date(now + 5 * 60 * 1000).toISOString() // 5 min expiry

  // 3. Store in Supabase otp_verifications table
  if (adminClient) {
    try {
      await adminClient.from('otp_verifications').upsert({
        email: normalizedEmail,
        otp_code: hashedOtp,
        expires_at: expiresAt,
        attempts: 0,
        last_sent_at: new Date().toISOString(),
        purpose,
      })
    } catch {
      // Ignore if table does not exist
    }
  }

  // Always keep in memory store as reliable fallback
  inMemoryOtpStore.set(normalizedEmail, {
    otp_code: hashedOtp,
    expires_at: now + 5 * 60 * 1000,
    attempts: 0,
    last_sent_at: now,
    purpose,
  })

  return { success: true, otp: rawOtp }
}

// (B) Verify OTP
export async function verifyOtpCode(
  email: string,
  rawOtp: string,
  purpose: string = 'signup'
): Promise<{ success: boolean; error?: string }> {
  const normalizedEmail = email.toLowerCase().trim()
  const adminClient = getSupabaseAdmin()

  let record: { otp_code: string; expires_at: string | number; attempts: number; purpose: string } | null = null

  if (adminClient) {
    try {
      const { data } = await adminClient
        .from('otp_verifications')
        .select('*')
        .eq('email', normalizedEmail)
        .maybeSingle()
      if (data) record = data
    } catch {
      record = null
    }
  }

  if (!record) {
    const mem = inMemoryOtpStore.get(normalizedEmail)
    if (mem) record = mem
  }

  if (!record) {
    return { success: false, error: 'No pending verification code found. Please request a new OTP.' }
  }

  if (record.purpose !== purpose) {
    return { success: false, error: 'Invalid verification purpose.' }
  }

  // 1. Max 5 wrong attempts check (Brute-force protection)
  if (record.attempts >= 5) {
    if (adminClient) {
      try {
        await adminClient.from('otp_verifications').delete().eq('email', normalizedEmail)
      } catch {}
    }
    inMemoryOtpStore.delete(normalizedEmail)
    return { success: false, error: 'Too many incorrect attempts. Please request a new code.' }
  }

  // 2. Expiry check (5 minute check)
  const expiryTime = typeof record.expires_at === 'number' ? record.expires_at : new Date(record.expires_at).getTime()
  if (expiryTime < Date.now()) {
    if (adminClient) {
      try {
        await adminClient.from('otp_verifications').delete().eq('email', normalizedEmail)
      } catch {}
    }
    inMemoryOtpStore.delete(normalizedEmail)
    return { success: false, error: 'Verification code has expired. Please request a new code.' }
  }

  // 3. Hash match check
  const incomingHash = hashSecret(rawOtp.trim())
  if (incomingHash !== record.otp_code) {
    const newAttempts = record.attempts + 1
    if (adminClient) {
      try {
        await adminClient.from('otp_verifications').update({ attempts: newAttempts }).eq('email', normalizedEmail)
      } catch {}
    }
    if (inMemoryOtpStore.has(normalizedEmail)) {
      const item = inMemoryOtpStore.get(normalizedEmail)!
      item.attempts = newAttempts
    }
    const remaining = 5 - newAttempts
    return {
      success: false,
      error: remaining > 0 ? `Incorrect OTP code. ${remaining} attempts remaining.` : 'Incorrect code.',
    }
  }

  // 4. Success: Use ho chuka OTP delete kar do (One-time use)
  if (adminClient) {
    try {
      await adminClient.from('otp_verifications').delete().eq('email', normalizedEmail)
    } catch {}
  }
  inMemoryOtpStore.delete(normalizedEmail)

  return { success: true }
}

// (C) Mail Sending Function
export async function sendOtpEmail(email: string, otp: string) {
  const SMTP_USER = process.env.SMTP_USER || process.env.GMAIL_USER
  const SMTP_PASS = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD
  const RESEND_KEY = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 28px; background: #0B0F19; color: #ffffff; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1);">
      <h2 style="color: #60a5fa; text-align: center; margin-bottom: 8px;">Verification Code</h2>
      <p style="text-align: center; color: #cbd5e1; font-size: 14px; margin-top: 0;">SkillFlow Student Portal</p>
      <p style="color: #94a3b8; font-size: 14px; text-align: center;">Aapka 6-digit one-time verification code hai:</p>
      <div style="font-size: 36px; font-weight: bold; letter-spacing: 10px; margin: 24px 0; text-align: center; color: #38bdf8; background: rgba(56,189,248,0.1); padding: 14px; border-radius: 12px; font-family: monospace;">
        ${otp}
      </div>
      <p style="color: #64748b; font-size: 12px; text-align: center;">Ye code agle 5 minutes ke liye valid hai. Kisi ke saath share na karein.</p>
    </div>
  `

  // 1. Agar Gmail SMTP mila to direct Nodemailer se bhejo:
  if (SMTP_USER && SMTP_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: SMTP_USER.trim(),
          pass: SMTP_PASS.replace(/\s+/g, ''),
        },
      })
      await transporter.sendMail({
        from: `"SkillFlow Learn" <${SMTP_USER.trim()}>`,
        to: email,
        subject: `Your Verification Code: ${otp}`,
        html,
      })
      console.log(`[SMTP] Successfully sent OTP to ${email}`)
      return { success: true, method: 'gmail-smtp' }
    } catch (err: any) {
      console.error('[SMTP Error]:', err?.message || err)
      return { success: false, error: err?.message || 'SMTP sending failed' }
    }
  }

  // 2. Fallback: Agar Resend API key hai to Resend se bhejo:
  if (RESEND_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_KEY.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'SkillFlow <onboarding@resend.dev>',
          to: [email],
          subject: `Your Verification Code: ${otp}`,
          html,
        }),
      })
      const data = await res.json() as any
      if (res.ok) {
        console.log(`[Resend] Successfully sent OTP to ${email}`)
        return { success: true, method: 'resend' }
      }
      return { success: false, error: data?.message || 'Resend API error' }
    } catch (err: any) {
      return { success: false, error: err?.message || 'Resend failed' }
    }
  }

  return {
    success: false,
    error: 'SMTP_USER and SMTP_PASS (Gmail App Password) are not configured in .env.local yet.',
    otpFallback: otp,
  }
}
