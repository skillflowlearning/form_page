import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    const checkRoleAndRedirect = async (userId: string) => {
      try {
        // 1. Fetch profile to check existing role
        let { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .maybeSingle()

        // 2. If new user, create profile automatically
        if (!profile) {
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            const assignedRole = user.email === 'support@skillflowlearn.com' ? 'admin' : 'student'
            await supabase.from('profiles').upsert({
              id: userId,
              email: user.email,
              role: assignedRole,
              name: user.user_metadata?.full_name || user.user_metadata?.name || '',
            }, { onConflict: 'id' })
            profile = { role: assignedRole }
          }
        }

        if (!mounted) return

        // 3. Direct route without any OTP
        if (profile?.role === 'admin') {
          navigate('/admin/dashboard', { replace: true })
        } else {
          navigate('/student/dashboard', { replace: true })
        }
      } catch {
        if (mounted) navigate('/student/dashboard', { replace: true })
      }
    }

    const processSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          if (mounted) setError(sessionError.message)
          return
        }

        if (session?.user) {
          await checkRoleAndRedirect(session.user.id)
          return
        }

        // Listen for OAuth hash exchange
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
          if (newSession?.user && mounted) {
            subscription.unsubscribe()
            await checkRoleAndRedirect(newSession.user.id)
          }
        })
      } catch (err: any) {
        if (mounted) setError(err?.message || 'Authentication failed.')
      }
    }

    processSession()

    return () => {
      mounted = false
    }
  }, [navigate])

  return (
    <div className="min-h-screen bg-[#03060f] text-white flex flex-col items-center justify-center gap-3 p-4 select-none">
      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      <p className="text-sm text-neutral-300">Signing in with Google...</p>
      {error && (
        <div className="mt-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-2.5 rounded-xl">
          {error}
        </div>
      )}
    </div>
  )
}
