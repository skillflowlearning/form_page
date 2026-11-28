import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Loader2, User } from 'lucide-react'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState<string>('')
  const [needsName, setNeedsName] = useState(false)
  const [pendingUser, setPendingUser] = useState<{ id: string; email: string; role: string } | null>(null)
  const [nameInput, setNameInput] = useState('')
  const [savingName, setSavingName] = useState(false)

  useEffect(() => {
    let isMounted = true

    const handleUserSession = async (sessionUser: any) => {
      try {
        const userId = sessionUser.id
        const userEmail = sessionUser.email || ''
        const metadata = sessionUser.user_metadata || {}
        const suggestedName = metadata.full_name || metadata.name || ''
        const defaultRole = userEmail === 'support@skillflowlearn.com' ? 'admin' : 'student'

        // 1. Fetch profile to check existing role & name
        const { data: profile, error: profileErr } = await supabase
          .from('profiles')
          .select('id, role, name')
          .eq('id', userId)
          .maybeSingle()

        if (profileErr) {
          console.warn('Profile fetch warning:', profileErr.message)
        }

        const resolvedRole = profile?.role || defaultRole

        // 2. If new Google user or name is missing, ask for their name before entering dashboard
        if (!profile || !profile.name || !profile.name.trim()) {
          if (!isMounted) return
          setPendingUser({ id: userId, email: userEmail, role: resolvedRole })
          setNameInput(suggestedName)
          setNeedsName(true)
          return
        }

        if (!isMounted) return

        // 3. Returning user with name already saved -> direct redirect
        if (resolvedRole === 'admin') {
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
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          throw sessionError
        }

        if (session?.user) {
          await handleUserSession(session.user)
          return
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
          if (newSession?.user && isMounted) {
            subscription.unsubscribe()
            await handleUserSession(newSession.user)
          }
        })

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

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pendingUser) return
    const trimmed = nameInput.trim()
    if (!trimmed) {
      setError('Please enter your name to continue.')
      return
    }

    setError('')
    setSavingName(true)
    try {
      const { error: upsertErr } = await supabase.from('profiles').upsert(
        {
          id: pendingUser.id,
          email: pendingUser.email,
          name: trimmed,
          role: pendingUser.role,
        },
        { onConflict: 'id' }
      )
      if (upsertErr) throw upsertErr

      await supabase.auth.updateUser({
        data: { name: trimmed, full_name: trimmed },
      })

      if (pendingUser.role === 'admin') {
        navigate('/admin/dashboard', { replace: true })
      } else {
        navigate('/student/dashboard', { replace: true })
      }
    } catch (err: any) {
      setSavingName(false)
      setError(err?.message || 'Failed to save your name. Please try again.')
    }
  }

  if (needsName) {
    return (
      <div className="min-h-screen bg-white text-[#0A0A0A] flex flex-col items-center justify-center p-4 font-sans">
        <div className="w-full max-w-md rounded-3xl p-6 sm:p-8 bg-[#439775]/20 flex flex-col gap-5">
          <div className="flex flex-col items-start gap-2">
            <span className="-rotate-2 px-4 py-1 rounded-full bg-[#0A0A0A]/90 text-white text-xs font-semibold inline-flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#36D399]" />
              Complete Profile
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0A0A0A] mt-1">
              What&apos;s your name?
            </h1>
            <p className="text-xs sm:text-sm text-[#222222]/70 font-medium">
              This name will be displayed on your dashboard and the student leaderboard.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-[#FF0F67]/15 text-[#FF0F67] text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSaveName} className="flex flex-col gap-3">
            <input
              type="text"
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              placeholder="Enter your full name"
              required
              autoFocus
              className="w-full bg-white rounded-xl px-4 py-3.5 text-sm text-[#0A0A0A] placeholder-[#222222]/40 outline-none focus:ring-2 focus:ring-[#439775] font-medium"
            />
            <button
              type="submit"
              disabled={savingName || !nameInput.trim()}
              className="w-full py-3.5 rounded-full font-semibold text-sm bg-[#0A0A0A]/90 hover:bg-[#0A0A0A] text-white cursor-pointer disabled:opacity-40 transition-colors"
            >
              {savingName ? 'Saving...' : 'Continue to Dashboard'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white text-[#0A0A0A] flex flex-col items-center justify-center gap-3 p-4 select-none">
      <Loader2 className="w-8 h-8 text-[#439775] animate-spin" />
      <p className="text-sm font-medium text-[#222222]/70">Signing you in...</p>
      {error && (
        <div className="mt-2 text-xs text-[#FF0F67] bg-[#FF0F67]/15 px-4 py-2.5 rounded-xl font-semibold">
          {error}
        </div>
      )}
    </div>
  )
}
