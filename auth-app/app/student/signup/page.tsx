'use client'
// /student/signup - Student registration with OTP email verification

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function StudentSignupPage() {
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'signup' | 'otp'>('signup')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  // Step 1: Signup form submit
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      setError('Passwords match nahi karte!')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          name: form.name,
          phone: form.phone,
          role: 'student',
        },
      },
    })

    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      // OTP input step par jao
      setStep('otp')
    }
  }

  // Step 2: OTP verify
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.verifyOtp({
      email: form.email,
      token: otp,
      type: 'email',
    })

    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      router.push('/student/dashboard')
    }
  }

  return (
    <div>
      <h1>Student Signup</h1>

      {step === 'signup' ? (
        <form onSubmit={handleSignup}>
          <div>
            <label>Name</label><br />
            <input name="name" value={form.name} onChange={handleChange} required />
          </div>
          <div>
            <label>Phone</label><br />
            <input name="phone" value={form.phone} onChange={handleChange} required />
          </div>
          <div>
            <label>Email</label><br />
            <input name="email" type="email" value={form.email} onChange={handleChange} required />
          </div>
          <div>
            <label>Password</label><br />
            <input name="password" type="password" value={form.password} onChange={handleChange} required />
          </div>
          <div>
            <label>Confirm Password</label><br />
            <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} required />
          </div>
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? 'Loading...' : 'Signup'}
          </button>
        </form>
      ) : (
        // OTP verification step
        <form onSubmit={handleVerifyOtp}>
          <p>OTP aapke email {form.email} par bheja gaya hai.</p>
          <div>
            <label>6-digit OTP</label><br />
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
              required
            />
          </div>
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
        </form>
      )}

      <p>Already account hai? <a href="/student/login">Login karo</a></p>
    </div>
  )
}
