import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import {
  CosmicStarfield,
  GlassInput,
  SparkleStar,
  GoogleIcon,
  DEFAULT_ASTRONAUT_IMAGE,
} from '@/components/ui/space-login'
import { ArrowLeft, Loader2, Eye, EyeOff, KeyRound, Copy, CheckCircle2, AlertCircle } from 'lucide-react'

export default function StudentSignup() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', confirmPassword: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [otp, setOtp] = useState('')
  const [devOtp, setDevOtp] = useState<string | null>(null)
  const [step, setStep] = useState<'signup' | 'otp'>('signup')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  // Mouse parallax for astronaut
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, clientY } = e
    const { innerWidth, innerHeight } = window
    const x = (clientX / innerWidth - 0.5) * 20
    const y = (clientY / innerHeight - 0.5) * 20
    setMousePos({ x, y })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value })

  // Send OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match. Please try again.')
      return
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, purpose: 'signup' }),
      })

      const data = await res.json()
      setLoading(false)

      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to send verification OTP.')
        if (data.cooldownSeconds) setResendCooldown(data.cooldownSeconds)
        return
      }

      if (data.devOtp) {
        setDevOtp(data.devOtp)
      } else {
        setDevOtp(null)
      }

      setStep('otp')
    } catch (err: any) {
      setLoading(false)
      setError(err?.message || 'Network error while sending OTP.')
    }
  }

  // Verify OTP & register in Supabase
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const verifyRes = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, otp: otp.trim(), purpose: 'signup' }),
      })

      const verifyData = await verifyRes.json()

      if (!verifyRes.ok || !verifyData.success) {
        setLoading(false)
        setError(verifyData.error || 'Invalid OTP code.')
        return
      }

      // Supabase user registration
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
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

      if (signUpError) {
        setLoading(false)
        setError(signUpError.message)
        return
      }

      // Ensure active session
      if (!signUpData.session) {
        await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        })
      }

      setLoading(false)
      navigate('/student/dashboard')
    } catch (err: any) {
      setLoading(false)
      setError(err?.message || 'Verification failed. Please try again.')
    }
  }

  const handleGoogleSignup = async () => {
    setError('')
    setGoogleLoading(true)
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (oauthError) {
        setGoogleLoading(false)
        setError(oauthError.message)
      }
    } catch (err: any) {
      setGoogleLoading(false)
      setError(err?.message || 'Google sign-up failed.')
    }
  }

  const handleCopyOtp = () => {
    if (!devOtp) return
    navigator.clipboard.writeText(devOtp)
    setOtp(devOtp)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      onMouseMove={handleMouseMove}
      className="relative min-h-screen w-full bg-[#03060f] text-white flex flex-col items-center justify-center overflow-x-hidden px-4 py-10 select-none"
    >
      {/* Dynamic Starfield Canvas */}
      <CosmicStarfield />

      {/* Atmospheric Horizon / Planet Glow at the bottom */}
      <div className="absolute -bottom-48 sm:-bottom-56 md:-bottom-64 left-1/2 -translate-x-1/2 w-[160vw] max-w-[1900px] h-[480px] sm:h-[550px] md:h-[620px] pointer-events-none z-0">
        <div
          className="w-full h-full rounded-[100%]"
          style={{
            background:
              'radial-gradient(ellipse at 50% 100%, rgba(224, 102, 70, 0.95) 0%, rgba(199, 81, 58, 0.75) 20%, rgba(67, 142, 145, 0.5) 42%, rgba(20, 48, 70, 0.25) 60%, transparent 80%)',
            filter: 'blur(32px)',
          }}
        />
      </div>

      {/* Top Bar Navigation */}
      <div className="absolute top-6 left-6 z-20">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs text-neutral-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-md"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
        </Link>
      </div>

      {/* Outer Scene Wrapper */}
      <div className="relative z-10 w-full max-w-[1100px] mx-auto flex flex-col items-center justify-center min-h-[580px] my-auto">
        {/* Floating Moon */}
        <motion.div
          animate={{
            y: [-8, 8, -8],
            rotate: [-1, 2, -1],
          }}
          transition={{
            duration: 9,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute -top-10 sm:-top-14 left-[5%] sm:left-[10%] lg:left-[14%] w-16 h-16 sm:w-20 sm:h-20 rounded-full pointer-events-none z-0"
          style={{
            background: 'radial-gradient(circle at 35% 35%, #ffffff 0%, #d8e1e8 45%, #8899a6 85%, #4b5866 100%)',
            boxShadow: '0 0 35px rgba(255, 255, 255, 0.35), inset -6px -6px 12px rgba(0, 0, 0, 0.5)',
          }}
        >
          <div className="absolute top-3 left-4 w-3.5 h-3.5 rounded-full bg-black/15 blur-[0.5px]" />
          <div className="absolute bottom-4 right-5 w-5 h-5 rounded-full bg-black/20 blur-[0.8px]" />
        </motion.div>

        {/* Floating Sparkle Stars */}
        <motion.div
          animate={{ scale: [0.75, 1.2, 0.75], opacity: [0.4, 0.95, 0.4] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-12 right-[8%] sm:right-[15%] pointer-events-none z-0"
        >
          <SparkleStar className="w-7 h-7 text-[#5eead4] drop-shadow-[0_0_15px_#5eead4]" />
        </motion.div>

        <motion.div
          animate={{ scale: [1, 0.65, 1], opacity: [0.7, 0.3, 0.7] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute bottom-28 left-[8%] sm:left-[12%] pointer-events-none z-0"
        >
          <SparkleStar className="w-5 h-5 text-[#ffb86c] drop-shadow-[0_0_12px_#ffb86c]" />
        </motion.div>

        {/* Floating Astronaut with Parallax (Desktop) */}
        <motion.div
          style={{
            x: mousePos.x * 1.5,
            y: mousePos.y * 1.5,
          }}
          transition={{ type: 'spring', damping: 25, stiffness: 120 }}
          className="hidden lg:block absolute -left-6 xl:left-2 top-1/2 -translate-y-1/2 pointer-events-none z-10"
        >
          <motion.div
            animate={{
              y: [-12, 12, -12],
              rotate: [-2, 2.5, -2],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="relative"
          >
            <img
              src={DEFAULT_ASTRONAUT_IMAGE}
              alt="Floating Astronaut"
              className="w-48 xl:w-56 h-auto drop-shadow-[0_15px_30px_rgba(0,0,0,0.85)] filter contrast-125 select-none"
              draggable={false}
            />

            <motion.div
              animate={{
                scale: [0.85, 1.25, 0.85],
                opacity: [0.65, 1, 0.65],
              }}
              transition={{
                duration: 2.8,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute -right-3 top-1/2 -translate-y-1/2"
            >
              <SparkleStar className="w-6 h-6 text-[#ff4bb8] drop-shadow-[0_0_12px_#ff4bb8]" />
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Central Sign Up Form Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative z-10 w-full max-w-[440px] mx-auto flex flex-col items-center bg-[#10141f]/75 border border-white/10 backdrop-blur-xl p-7 sm:p-9 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
        >
          {/* Main Title */}
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-2 text-center drop-shadow-sm font-sans">
            {step === 'signup' ? 'Create Account' : 'Verify Email'}
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mb-6 text-center">
            {step === 'signup'
              ? 'Enter your details to receive an OTP verification code'
              : `Enter the 6-digit code sent to ${form.email}`}
          </p>

          {/* Error Message */}
          {error && (
            <div className="w-full mb-5 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-start gap-2.5 backdrop-blur-md">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <AnimatePresence mode="wait">
            {step === 'signup' ? (
              <motion.form
                key="signup-form"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleSendOtp}
                className="w-full flex flex-col gap-3.5"
              >
              {/* Full Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-neutral-300 tracking-wide select-none">
                  Full Name
                </label>
                <GlassInput
                  id="name"
                  name="name"
                  type="text"
                  required
                  placeholder="Enter your full name"
                  value={form.name}
                  onChange={handleChange}
                  borderRadius={12}
                />
              </div>

              {/* Phone Number */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-neutral-300 tracking-wide select-none">
                  Phone Number
                </label>
                <GlassInput
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  placeholder="Enter your phone number"
                  value={form.phone}
                  onChange={handleChange}
                  borderRadius={12}
                />
              </div>

              {/* Email Address */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-neutral-300 tracking-wide select-none">
                  Email Address
                </label>
                <GlassInput
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="Enter your email"
                  value={form.email}
                  onChange={handleChange}
                  borderRadius={12}
                />
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-neutral-300 tracking-wide select-none">
                  Password
                </label>
                <GlassInput
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Create a password (min 6 chars)"
                  value={form.password}
                  onChange={handleChange}
                  borderRadius={12}
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="p-1 text-neutral-400 hover:text-neutral-200 focus:outline-none transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 transition-transform active:scale-90" />
                      ) : (
                        <Eye className="w-4 h-4 transition-transform active:scale-90" />
                      )}
                    </button>
                  }
                />
              </div>

              {/* Confirm Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-neutral-300 tracking-wide select-none">
                  Confirm Password
                </label>
                <GlassInput
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  placeholder="Confirm your password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  borderRadius={12}
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      className="p-1 text-neutral-400 hover:text-neutral-200 focus:outline-none transition-colors"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4 transition-transform active:scale-90" />
                      ) : (
                        <Eye className="w-4 h-4 transition-transform active:scale-90" />
                      )}
                    </button>
                  }
                />
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={loading}
                whileTap={{ scale: 0.98 }}
                className="relative w-full h-11 mt-2 rounded-xl font-bold text-xs sm:text-sm tracking-wide transition-all duration-200 flex items-center justify-center overflow-hidden shadow-lg select-none cursor-pointer bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border border-white/10 shadow-black/40"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Sending OTP...</span>
                  </div>
                ) : (
                  <span>Send Verification Code</span>
                )}
              </motion.button>

              {/* Already have an account link */}
              <div className="text-center text-xs text-neutral-400 mt-1">
                <span>Already have an account? </span>
                <Link
                  to="/student/login"
                  className="text-white font-bold hover:underline underline-offset-4 transition-colors"
                >
                  Sign In
                </Link>
              </div>

              {/* Divider */}
              <div className="w-full flex items-center gap-3 my-1">
                <div className="flex-1 h-[1px] bg-white/[0.08]" />
                <span className="text-[11px] uppercase tracking-wider text-neutral-500">
                  Or continue with
                </span>
                <div className="flex-1 h-[1px] bg-white/[0.08]" />
              </div>

              {/* Google Signup Button */}
              <motion.button
                type="button"
                whileHover={{ y: -1, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGoogleSignup}
                disabled={googleLoading}
                aria-label="Sign up with Google"
                className="w-full h-10 rounded-xl bg-[#1c202d]/80 hover:bg-[#252a3a] border border-white/10 hover:border-white/20 flex items-center justify-center gap-2 text-xs text-neutral-200 hover:text-white transition-colors backdrop-blur-md shadow-md cursor-pointer"
              >
                {googleLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <GoogleIcon className="w-4 h-4" />
                )}
                <span>Continue with Google</span>
              </motion.button>
            </motion.form>
          ) : (
            /* OTP Step */
            <motion.form
              key="otp-form"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleVerifyOtp}
              className="w-full flex flex-col gap-4"
            >
              {/* Dev Auto-fill Banner */}
              {devOtp && (
                <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs flex items-center justify-between backdrop-blur-md">
                  <div>
                    <div className="text-[11px] text-blue-400 font-medium">OTP Code:</div>
                    <div className="text-base font-mono font-bold tracking-widest text-white mt-0.5">
                      {devOtp}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyOtp}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium cursor-pointer transition-colors shadow-sm"
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                        <span>Filled</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Auto-fill</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* OTP Input */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-neutral-300 tracking-wide select-none text-center">
                  Enter 6-Digit OTP
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <GlassInput
                    id="otp"
                    type="text"
                    maxLength={6}
                    placeholder="• • • • • •"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="pl-10 text-center tracking-[0.4em] font-mono text-lg font-bold"
                    borderRadius={12}
                    required
                  />
                </div>
              </div>

              {/* Verify Button */}
              <motion.button
                type="submit"
                disabled={loading || otp.length !== 6}
                whileTap={{ scale: 0.98 }}
                className="relative w-full h-11 mt-1 rounded-xl font-bold text-xs sm:text-sm tracking-wide transition-all duration-200 flex items-center justify-center overflow-hidden shadow-lg select-none cursor-pointer bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white border border-white/10 shadow-black/40"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Verifying & Creating Account...</span>
                  </div>
                ) : (
                  <span>Verify OTP & Create Account</span>
                )}
              </motion.button>

              {/* Edit Details & Resend */}
              <div className="flex items-center justify-between text-xs text-neutral-400 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setError('')
                    setStep('signup')
                  }}
                  className="hover:text-white transition-colors underline underline-offset-4 cursor-pointer"
                >
                  ← Edit details
                </button>

                <button
                  type="button"
                  onClick={() => handleSendOtp()}
                  disabled={loading || resendCooldown > 0}
                  className="text-blue-400 hover:text-blue-300 disabled:text-neutral-500 transition-colors cursor-pointer"
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                </button>
              </div>

              {/* Already have an account */}
              <div className="text-center text-xs text-neutral-400 mt-2">
                <span>Already have an account? </span>
                <Link
                  to="/student/login"
                  className="text-white font-bold hover:underline underline-offset-4 transition-colors"
                >
                  Sign In
                </Link>
              </div>
            </motion.form>
          )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="relative z-10 text-[11px] text-neutral-500 text-center mt-6">
        SkillFlow Learning Platform &copy; 2026
      </div>
    </div>
  )
}
