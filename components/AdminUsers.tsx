'use client'
import { useState, useEffect, useCallback } from 'react'

type UserRow = {
  id: string
  username: string
  name: string
  email: string
  role: 'admin' | 'user'
  tabs: string[]
  active: boolean
}

const ALL_TABS = [
  { id: 'hub', label: 'Hub' },
  { id: 'diario', label: 'Diário' },
  { id: 'propostas', label: 'Propostas' },
  { id: 'dashboard', label: 'Dashboard' },
]

export function AdminUsers({ onClose }: { onClose: () => void }) {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [sending, setSending] = useState<string | null>(null)

  const [form, setForm] = useState({ name: '', username: '', email: '', tabs: ['diario', 'dashboard'] })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/users')
    if (res.ok) setUsers(await res.json() as UserRow[])
    setLoading(false)
  }, [])

  useEffect(() => { void load() }, [load])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.username || !form.email) { setFormError('Preencha todos os campos'); return }
    if (form.tabs.length === 0) { setFormError('Selecione ao menos uma aba'); return }
    setSaving(true)
    setFormError('')
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      setForm({ name: '', username: '', email: '', tabs: ['diario', 'dashboard'] })
      setShowForm(false)
      await load()
    } else {
      const d = await res.json() as { error?: string }
      setFormError(d.error ?? 'Erro ao criar usuário')
    }
    setSaving(false)
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Remover ${name}? Esta ação não pode ser desfeita.`)) return
    await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
    await load()
  }

  async function handleResend(id: string) {
    setSending(id)
    await fetch(`/api/admin/users/${id}`, { method: 'POST' })
    setSending(null)
  }

  function toggleTab(tab: string) {
    setForm(f => ({
      ...f,
      tabs: f.tabs.includes(tab) ? f.tabs.filter(t => t !== tab) : [...f.tabs, tab]
    }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-[#0f0f18] border border-white/[0.08] rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <h2 className="text-sm font-semibold text-white/70 tracking-wide">Gestão de Usuários</h2>
          <div className="flex items-center gap-3">
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="text-[10px] px-3 py-1.5 rounded-lg bg-violet-600/30 hover:bg-violet-600/50 text-violet-300 border border-violet-500/20 transition-all"
              >
                + Adicionar
              </button>
            )}
            <button onClick={onClose} className="text-white/25 hover:text-white/60 text-lg transition-colors">×</button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          {/* Create form */}
          {showForm && (
            <form onSubmit={handleCreate} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 space-y-3">
              <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Novo usuário</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-white/30 block mb-1">Nome</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white/20"
                    placeholder="Nome completo" />
                </div>
                <div>
                  <label className="text-[10px] text-white/30 block mb-1">Usuário</label>
                  <input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white/20"
                    placeholder="login" />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-white/30 block mb-1">Email</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white/20"
                  placeholder="email@exemplo.com" />
              </div>
              <div>
                <label className="text-[10px] text-white/30 block mb-2">Abas com acesso</label>
                <div className="flex gap-2 flex-wrap">
                  {ALL_TABS.map(t => (
                    <button key={t.id} type="button" onClick={() => toggleTab(t.id)}
                      className={`px-3 py-1 rounded-lg text-[10px] border transition-all ${
                        form.tabs.includes(t.id)
                          ? 'bg-violet-600/30 text-violet-300 border-violet-500/30'
                          : 'bg-white/[0.03] text-white/30 border-white/[0.06] hover:border-white/10'
                      }`}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              {formError && <p className="text-xs text-red-400/80">{formError}</p>}
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={saving}
                  className="px-4 py-1.5 rounded-lg bg-violet-600/50 hover:bg-violet-600/70 text-violet-200 text-xs font-medium transition-all disabled:opacity-40">
                  {saving ? 'Criando…' : 'Criar e enviar convite'}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setFormError('') }}
                  className="px-4 py-1.5 rounded-lg text-white/30 hover:text-white/60 text-xs transition-colors">
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {/* User list */}
          {loading ? (
            <div className="space-y-2">
              {[1,2].map(i => <div key={i} className="h-16 rounded-xl bg-white/[0.02] animate-pulse" />)}
            </div>
          ) : (
            <div className="space-y-2">
              {users.map(u => (
                <div key={u.id} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/[0.05] bg-white/[0.02]">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white/75 font-medium">{u.name}</span>
                      <span className="text-[9px] text-white/25">@{u.username}</span>
                      {u.role === 'admin' && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-400/70 border border-violet-500/20">admin</span>
                      )}
                      <span className={`text-[9px] px-1.5 py-0.5 rounded border ${u.active ? 'bg-green-500/10 text-green-400/60 border-green-500/20' : 'bg-amber-500/10 text-amber-400/60 border-amber-500/20'}`}>
                        {u.active ? 'ativo' : 'pendente'}
                      </span>
                    </div>
                    <p className="text-[10px] text-white/25 mt-0.5">{u.email}</p>
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {u.tabs.map(t => (
                        <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.04] text-white/25 border border-white/[0.05]">
                          {ALL_TABS.find(a => a.id === t)?.label ?? t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {!u.active && (
                      <button onClick={() => handleResend(u.id)} disabled={sending === u.id}
                        className="text-[10px] text-amber-400/50 hover:text-amber-400 transition-colors disabled:opacity-40">
                        {sending === u.id ? 'Enviando…' : 'Reenviar'}
                      </button>
                    )}
                    {u.role !== 'admin' && (
                      <button onClick={() => handleDelete(u.id, u.name)}
                        className="text-[10px] text-red-400/30 hover:text-red-400/70 transition-colors">
                        Remover
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
