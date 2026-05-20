'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import HubHome from './HubHome'
import { AdminUsers } from './AdminUsers'
import type { SessionPayload } from '../lib/session'

const DiarioPage = dynamic(() => import('./DiarioPage'))
const PropostasPage = dynamic(() => import('./PropostasPage'))
const DashboardPage = dynamic(() => import('./DashboardPage'))

type Tab = 'hub' | 'diario' | 'propostas' | 'dashboard'

const ALL_TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'hub',       label: 'Hub',       icon: '⌂' },
  { id: 'diario',    label: 'Diário',    icon: '📋' },
  { id: 'propostas', label: 'Propostas', icon: '📄' },
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
]

export default function HubShell({ session }: { session: SessionPayload }) {
  const router = useRouter()
  const firstTab = ALL_TABS.find(t => session.tabs.includes(t.id))
  const [activeTab, setActiveTab] = useState<Tab>(firstTab?.id ?? 'hub')
  const [showAdmin, setShowAdmin] = useState(false)
  const visibleTabs = ALL_TABS.filter(t => session.tabs.includes(t.id))

  async function handleLogout() {
    await fetch('/api/user-auth/logout', { method: 'POST' })
    router.push('/login')
  }

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
            {session.role === 'admin' && (
              <button onClick={() => setShowAdmin(true)}
                className="text-[10px] text-white/25 hover:text-white/60 transition-colors px-2 py-1 rounded border border-white/[0.06] hover:border-white/10">
                Usuários
              </button>
            )}
            <span className="text-[10px] text-white/20">{session.name}</span>
            <button onClick={handleLogout}
              className="text-[10px] text-white/20 hover:text-white/50 transition-colors">
              Sair
            </button>
          </div>
        </div>
      </header>

      <main>
        {activeTab === 'hub'       && session.tabs.includes('hub')       && <HubHome />}
        {activeTab === 'diario'    && session.tabs.includes('diario')    && <DiarioPage />}
        {activeTab === 'propostas' && session.tabs.includes('propostas') && <PropostasPage />}
        {activeTab === 'dashboard' && session.tabs.includes('dashboard') && <DashboardPage />}
      </main>
    </div>
  )
}
