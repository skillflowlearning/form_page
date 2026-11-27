import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState<string>('')

  useEffect(() => {
    let isMounted = true

    const handleUserSession = async (sessionUser: any) => {
      try {
        const userId = sessionUser.id
        const userEmail = sessionUser.email || ''
        const metadata = sessionUser.user_metadata || {}
        const fullName = metadata.full_name || metadata.name || (userEmail ? userEmail.split('@')[0] : 'Student')

        // 1. Fetch profile to check existing role
        let { data: profile, error: profileErr } = await supabase
          .from('profiles')
          .select('id, role')
          .eq('id', userId)
          .maybeSingle()

        if (profileErr) {
          console.warn('Profile fetch warning:', profileErr.message)
        }

        let userRole = profile?.role

        // 2. If new Google OAuth user, create student profile automatically
        if (!profile) {
          const newProfile = {
            id: userId,
            email: userEmail,
            name: fullName,
            role: 'student',
          }

          const { error: insertErr } = await supabase
            .from('profiles')
            .upsert(newProfile, { onConflict: 'id' })

          if (insertErr) {
            console.error('Error inserting profile:', insertErr.message)
          }
          userRole = 'student'
        }

        if (!isMounted) return

        // 3. Direct route without any OTP
        if (userRole === 'admin') {
          navigate('/admin/dashboard', { replace: true })
        } else {
          navigate('/student/dashboard', { replace: true })
        }
      } catch (err: any) {
        console.error('Callback error:', err)
        if (isMounted) {
          setError(err?.message || 'Authentication processing failed.')
          setTimeout(() => {
            navigate('/student/login?error=' + encodeURIComponent(err?.message || 'Login failed'), { replace: true })
          }, 1500)
        }
      }
    }

    const processSession = async () => {
      try {
        // Step 1: getSession() call karo
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          throw sessionError
        }

        if (session?.user) {
          await handleUserSession(session.user)
          return
        }

        // Step 2: Listen for OAuth hash exchange
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
          if (newSession?.user && isMounted) {
            subscription.unsubscribe()
            await handleUserSession(newSession.user)
          }
        })

        // Safety fallback timer if no session is detected after redirect
        const timer = setTimeout(() => {
          if (isMounted) {
            subscription.unsubscribe()
            setError('No active session found. Redirecting to login...')
            navigate('/student/login?error=' + encodeURIComponent('Authentication session not found. Please try again.'), { replace: true })
          }
        }, 4000)

        return () => clearTimeout(timer)
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || 'Authentication failed.')
          setTimeout(() => {
            navigate('/student/login?error=' + encodeURIComponent(err?.message || 'Authentication failed'), { replace: true })
          }, 1500)
        }
      }
    }

    processSession()

    return () => {
      isMounted = false
    }
  }, [navigate])

  return (
    <div className="min-h-screen bg-[#03060f] text-white flex flex-col items-center justify-center gap-3 p-4 select-none">
      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      <p className="text-sm text-neutral-300">Signing you in...</p>
      {error && (
        <div className="mt-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-2.5 rounded-xl">
          {error}
        </div>
      )}
    </div>
  )
}
