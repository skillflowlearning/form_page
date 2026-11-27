import { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import {
  CosmicStarfield,
  GlassInput,
  SparkleStar,
  GoogleIcon,
  DEFAULT_ASTRONAUT_IMAGE,
} from '@/components/ui/space-login'
import { ArrowLeft, Loader2, Eye, EyeOff, Check, AlertCircle } from 'lucide-react'

export default function StudentLogin() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  useEffect(() => {
    const urlError = searchParams.get('error')
    if (urlError) {
      setError(urlError)
    }
  }, [searchParams])

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

      // Verify or create role
      let { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .maybeSingle()

      if (!profile) {
        const assignedRole = data.user.email === 'support@skillflowlearn.com' ? 'admin' : 'student'
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email: data.user.email,
          role: assignedRole,
          name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || '',
        }, { onConflict: 'id' })
        profile = { role: assignedRole }
      }

      setIsSuccess(true)
      setTimeout(() => {
        setLoading(false)
        if (profile?.role === 'admin') {
          navigate('/admin/dashboard')
        } else {
          navigate('/student/dashboard')
        }
      }, 800)
    } catch (err: any) {
      setLoading(false)
      setError(err?.message || 'Login failed.')
    }
  }

  const handleGoogleLogin = async () => {
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
      setError(err?.message || 'Google sign-in failed.')
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

        {/* Central Sign In Form Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative z-10 w-full max-w-[420px] mx-auto flex flex-col items-center bg-[#10141f]/75 border border-white/10 backdrop-blur-xl p-8 sm:p-9 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
        >
          {/* Main Title */}
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-2 text-center drop-shadow-sm font-sans">
            Student Sign In
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mb-6 text-center">
            Enter your credentials to access your student portal
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
                htmlFor="space-email"
                className="text-xs font-semibold text-neutral-300 tracking-wide select-none"
              >
                Email Address
              </label>
              <GlassInput
                id="space-email"
                type="email"
                required
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                borderRadius={12}
              />
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="space-password"
                className="text-xs font-semibold text-neutral-300 tracking-wide select-none"
              >
                Password
              </label>
              <GlassInput
                id="space-password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Enter your password"
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

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer group select-none">
                <div
                  onClick={() => setRememberMe(!rememberMe)}
                  className={`w-4 h-4 rounded-[4px] border transition-all duration-150 flex items-center justify-center ${
                    rememberMe
                      ? 'bg-neutral-200 border-neutral-200 text-black'
                      : 'border-neutral-600 bg-white/5 group-hover:border-neutral-400'
                  }`}
                >
                  {rememberMe && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <span className="text-neutral-300 group-hover:text-white transition-colors">
                  Remember me
                </span>
              </label>

              <Link
                to="/forgot-password"
                className="text-indigo-400 hover:text-indigo-300 transition-colors font-medium hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={loading || isSuccess}
              whileTap={{ scale: 0.98 }}
              className={`relative w-full h-11 mt-1 rounded-xl font-bold text-xs sm:text-sm tracking-wide transition-all duration-200 flex items-center justify-center overflow-hidden shadow-lg select-none cursor-pointer ${
                isSuccess
                  ? 'bg-emerald-600 text-white shadow-emerald-500/25'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border border-white/10 shadow-black/40'
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
                    <span>Signing in...</span>
                  </motion.div>
                ) : isSuccess ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 text-white"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Welcome Back!</span>
                  </motion.div>
                ) : (
                  <motion.span
                    key="text"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    Sign In
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Don't have an account link */}
            <div className="text-center text-xs text-neutral-400 mt-1">
              <span>Don't Have an Account? </span>
              <Link
                to="/student/signup"
                className="text-white font-bold hover:underline underline-offset-4 transition-colors"
              >
                Sign Up
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

            {/* Google Login Button */}
            <motion.button
              type="button"
              whileHover={{ y: -1, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              aria-label="Sign in with Google"
              className="w-full h-10 rounded-xl bg-[#1c202d]/80 hover:bg-[#252a3a] border border-white/10 hover:border-white/20 flex items-center justify-center gap-2 text-xs text-neutral-200 hover:text-white transition-colors backdrop-blur-md shadow-md cursor-pointer"
            >
              {googleLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <GoogleIcon className="w-4 h-4" />
              )}
              <span>Continue with Google</span>
            </motion.button>
          </form>

          {/* Admin link */}
          <div className="mt-5 text-center text-xs text-neutral-500">
            Administrator?{' '}
            <Link to="/admin/login" className="text-neutral-400 hover:text-neutral-200 underline">
              Admin Portal
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="relative z-10 text-[11px] text-neutral-500 text-center mt-6">
        SkillFlow Learning Platform &copy; 2026
      </div>
    </div>
  )
}
