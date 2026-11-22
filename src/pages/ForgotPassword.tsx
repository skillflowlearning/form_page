import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { CosmicStarfield, GlassInput } from '@/components/ui/space-login'
import { ArrowLeft, Loader2, KeyRound, CheckCircle2, AlertCircle } from 'lucide-react'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || loading) return
    setError('')
    setLoading(true)

    try {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (resetErr) throw resetErr
      setSuccess(true)
    } catch (err: any) {
      setError(err?.message || 'Failed to send password reset link.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full bg-[#03060f] text-white flex flex-col items-center justify-center px-4 py-10 select-none overflow-x-hidden">
      <CosmicStarfield />

      <div className="relative z-10 w-full max-w-[420px] rounded-[32px] p-8 md:p-10 border border-white/10 bg-[#070d1a]/80 backdrop-blur-2xl shadow-2xl">
        <Link
          to="/student/login"
          className="inline-flex items-center gap-2 text-xs font-medium text-neutral-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Login
        </Link>

        <div className="flex flex-col gap-2 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-2">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold font-['Space_Grotesk'] text-white">Reset Password</h1>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Enter your registered email address and we will send you a secure link to reset your account password.
          </p>
        </div>

        {error && (
          <div className="mb-5 flex items-center gap-2.5 p-3.5 rounded-xl text-xs bg-red-500/10 border border-red-500/20 text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="flex flex-col items-center text-center gap-3 p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Reset Link Sent</h3>
            <p className="text-xs text-neutral-300">
              Check your inbox for <strong>{email}</strong>. Follow the instructions in the email to set a new password.
            </p>
            <Link
              to="/student/login"
              className="mt-2 text-xs font-semibold text-indigo-400 hover:underline"
            >
              Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleReset} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                Email Address
              </label>
              <GlassInput
                type="email"
                placeholder="student@skillflowlearn.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="mt-2 w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:opacity-90 active:scale-98 transition-all cursor-pointer shadow-lg shadow-indigo-600/30 disabled:opacity-40"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mx-auto" />
              ) : (
                'Send Reset Instructions'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
