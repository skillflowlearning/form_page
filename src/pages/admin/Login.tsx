import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import {
  CosmicStarfield,
  GlassInput,
  SparkleStar,
  DEFAULT_ASTRONAUT_IMAGE,
} from '@/components/ui/space-login'
import { ArrowLeft, Loader2, Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  // Mouse parallax for astronaut
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, clientY } = e
    const { innerWidth, innerHeight } = window
    const x = (clientX / innerWidth - 0.5) * 20
    const y = (clientY / innerHeight - 0.5) * 20
    setMousePos({ x, y })
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password || loading) return
    setError('')
    setLoading(true)

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (signInError) {
        setLoading(false)
        return setError(signInError.message)
      }

      // Check admin role
      let { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .maybeSingle()

      if (data.user.email === 'support@skillflowlearn.com') {
        if (!profile || profile.role !== 'admin') {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            email: data.user.email,
            role: 'admin',
            name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || 'Admin',
          }, { onConflict: 'id' })
          profile = { role: 'admin' }
        }
      }

      if (!profile || profile.role !== 'admin') {
        await supabase.auth.signOut()
        setLoading(false)
        return setError('Access denied. Only administrators are allowed to sign in here.')
      }

      setIsSuccess(true)
      setTimeout(() => {
        setLoading(false)
        navigate('/admin/dashboard')
      }, 800)
    } catch (err: any) {
      setLoading(false)
      setError(err?.message || 'Admin sign-in failed.')
    }
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
              'radial-gradient(ellipse at 50% 100%, rgba(245, 158, 11, 0.85) 0%, rgba(225, 29, 72, 0.65) 25%, rgba(67, 56, 202, 0.4) 45%, rgba(15, 23, 42, 0.2) 65%, transparent 80%)',
            filter: 'blur(35px)',
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
            background: 'radial-gradient(circle at 35% 35%, #ffffff 0%, #fef3c7 45%, #d97706 85%, #78350f 100%)',
            boxShadow: '0 0 35px rgba(245, 158, 11, 0.3), inset -6px -6px 12px rgba(0, 0, 0, 0.5)',
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
          <SparkleStar className="w-7 h-7 text-[#fbbf24] drop-shadow-[0_0_15px_#fbbf24]" />
        </motion.div>

        <motion.div
          animate={{ scale: [1, 0.65, 1], opacity: [0.7, 0.3, 0.7] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute bottom-28 left-[8%] sm:left-[12%] pointer-events-none z-0"
        >
          <SparkleStar className="w-5 h-5 text-[#f43f5e] drop-shadow-[0_0_12px_#f43f5e]" />
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
              <SparkleStar className="w-6 h-6 text-[#fbbf24] drop-shadow-[0_0_12px_#fbbf24]" />
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Central Sign In Form Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative z-10 w-full max-w-[420px] mx-auto flex flex-col items-center bg-[#10141f]/80 border border-amber-500/20 backdrop-blur-xl p-8 sm:p-9 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.7)]"
        >
          {/* Shield Badge */}
          <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <ShieldCheck className="w-6 h-6" />
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-2 text-center drop-shadow-sm font-sans">
            Admin Portal
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mb-6 text-center">
            Restricted to authorized system administrators only
          </p>

          {/* Error Message */}
          {error && (
            <div className="w-full mb-5 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-start gap-2.5 backdrop-blur-md">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="w-full flex flex-col gap-4">
            {/* Email Field */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="admin-email"
                className="text-xs font-semibold text-neutral-300 tracking-wide select-none"
              >
                Admin Email
              </label>
              <GlassInput
                id="admin-email"
                type="email"
                required
                placeholder="Enter admin email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                borderRadius={12}
              />
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="admin-password"
                className="text-xs font-semibold text-neutral-300 tracking-wide select-none"
              >
                Password
              </label>
              <GlassInput
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={loading || isSuccess}
              whileTap={{ scale: 0.98 }}
              className={`relative w-full h-11 mt-2 rounded-xl font-bold text-xs sm:text-sm tracking-wide transition-all duration-200 flex items-center justify-center overflow-hidden shadow-lg select-none cursor-pointer ${
                isSuccess
                  ? 'bg-emerald-600 text-white shadow-emerald-500/25'
                  : 'bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white border border-amber-400/20 shadow-amber-500/20'
              }`}
            >
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Verifying Access...</span>
                  </motion.div>
                ) : isSuccess ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 text-white"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Access Granted!</span>
                  </motion.div>
                ) : (
                  <motion.span
                    key="text"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    Authorize Sign In
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </form>

          {/* Student Portal Link */}
          <div className="mt-6 text-center text-xs text-neutral-400">
            Are you a student?{' '}
            <Link to="/student/login" className="text-amber-400 hover:text-amber-300 underline font-medium">
              Student Login Portal
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="relative z-10 text-[11px] text-neutral-500 text-center mt-6">
        SkillFlow Learning Platform &copy; 2026 • Secure Admin System
      </div>
    </div>
  )
}
