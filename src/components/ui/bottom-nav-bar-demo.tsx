import BottomNavBar from '@/components/ui/bottom-nav-bar'
import { Home, Zap, MessageSquare, Trophy, User } from 'lucide-react'
import { useState } from 'react'

const demoItems = [
  { label: 'Home', icon: Home },
  { label: 'Quiz', icon: Zap },
  { label: 'Community', icon: MessageSquare },
  { label: 'Rewards', icon: Trophy },
  { label: 'Profile', icon: User },
]

export default function Demo() {
  const [active, setActive] = useState(0)
  return (
    <div className="min-h-screen bg-[#03060f] flex items-center justify-center p-4">
      <BottomNavBar items={demoItems} activeIndex={active} onChange={setActive} />
    </div>
  )
}
