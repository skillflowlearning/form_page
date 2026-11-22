// Protected route - session aur role check karta hai
// Logged out user ko login page par bhejta hai
import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

interface Props {
  children: React.ReactNode
  requiredRole: 'student' | 'admin'
  redirectTo: string
}

export default function ProtectedRoute({ children, requiredRole, redirectTo }: Props) {
  const [status, setStatus] = useState<'loading' | 'allowed' | 'denied'>('loading')

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return setStatus('denied')

      let { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).maybeSingle()

      // Profile agar missing hai toh auto-create karo
      if (!profile) {
        const assignedRole = user.email === 'support@skillflowlearn.com' ? 'admin' : 'student'
        await supabase.from('profiles').upsert({
          id: user.id,
          email: user.email,
          role: assignedRole,
          name: user.user_metadata?.full_name || user.user_metadata?.name || '',
        }, { onConflict: 'id' })
        profile = { role: assignedRole }
      }

      if (requiredRole === 'admin') {
        setStatus(profile?.role === 'admin' ? 'allowed' : 'denied')
      } else {
        // Student dashboard can be viewed by student or admin
        setStatus(profile?.role === 'student' || profile?.role === 'admin' ? 'allowed' : 'denied')
      }
    }
    check()
  }, [requiredRole])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-white flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-sm text-slate-400">Verifying access...</p>
      </div>
    )
  }

  if (status === 'denied') return <Navigate to={redirectTo} replace />
  return <>{children}</>
}
