'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import HubHome from '../components/HubHome'
import DiarioPage from '../components/DiarioPage'
import PropostasPage from '../components/PropostasPage'
import DashboardPage from '../components/DashboardPage'
import { AdminUsers } from '../components/AdminUsers'

type Tab = 'hub' | 'diario' | 'propostas' | 'dashboard'
type Session = { userId: string; username: string; name: string; role: 'admin' | 'user'; tabs: string[] }

const ALL_TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'hub',       label: 'Hub',       icon: '⌂' },
  { id: 'diario',    label: 'Diário',    icon: '📋' },
  { id: 'propostas', label: 'Propostas', icon: '📄' },
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
]

export default function Page() {
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('hub')
  const [showAdmin, setShowAdmin] = useState(false)

  useEffect(() => {
    fetch('/api/user-auth/me')
      .then(r => r.json())
      .then((s: Session | null) => {
        if (!s) { router.push('/login'); return }
        setSession(s)
        const first = ALL_TABS.find(t => s.tabs.includes(t.id))
        if (first) setActiveTab(first.id)
        setLoading(false)
      })
      .catch(() => router.push('/login'))
  }, [router])

  async function handleLogout() {
    await fetch('/api/user-auth/logout', { method: 'POST' })
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="flex gap-2">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/20 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    )
  }

  const visibleTabs = ALL_TABS.filter(t => session?.tabs.includes(t.id))

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {showAdmin && <AdminUsers onClose={() => setShowAdmin(false)} />}

      <header className="border-b border-white/[0.06] bg-[#0d0d14]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="w-[82%] mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-xs font-bold tracking-[0.2em] uppercase text-white/30">APEXGAP · Hub</span>

          <nav className="flex items-center gap-1">
            {visibleTabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                  activeTab === tab.id ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'
                }`}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {session?.role === 'admin' && (
              <button onClick={() => setShowAdmin(true)}
                className="text-[10px] text-white/25 hover:text-white/60 transition-colors px-2 py-1 rounded border border-white/[0.06] hover:border-white/10">
                Usuários
              </button>
            )}
            <span className="text-[10px] text-white/20">{session?.name}</span>
            <button onClick={handleLogout}
              className="text-[10px] text-white/20 hover:text-white/50 transition-colors">
              Sair
            </button>
          </div>
        </div>
      </header>

      <main>
        {activeTab === 'hub'       && session?.tabs.includes('hub')       && <HubHome />}
        {activeTab === 'diario'    && session?.tabs.includes('diario')    && <DiarioPage />}
        {activeTab === 'propostas' && session?.tabs.includes('propostas') && <PropostasPage />}
        {activeTab === 'dashboard' && session?.tabs.includes('dashboard') && <DashboardPage />}
      </main>
    </div>
  )
}
