'use client'
import { useState, useEffect, useCallback } from 'react'
import type { SessionPayload } from '../lib/session'

type Platform = 'Meta Ads' | 'Google Ads' | 'Ambos' | 'Outro'
const PLATFORMS: Platform[] = ['Meta Ads', 'Google Ads', 'Ambos', 'Outro']

type Campaign = { id: string; name: string; platform: Platform; objective?: string }
type Client = {
  id: string; name: string; platform: Platform; isKoko: boolean; campaigns: Campaign[]
  metaLink?: string; googleLink?: string; site?: string; instagram?: string
  verbaPlanLink?: string; verbaMeta?: number; verbaGoogle?: number; createdAt: number
}
type DiarioRecord = {
  id: string; clientId: string; campaignId?: string; date: string; text: string; createdAt: number
}

const EMPTY_CLIENT = {
  name: '', platform: 'Meta Ads' as Platform, isKoko: false,
  metaLink: '', googleLink: '', site: '', instagram: '', verbaPlanLink: '',
  verbaMeta: '', verbaGoogle: '',
}

function platColor(p: Platform) {
  if (p === 'Meta Ads') return 'bg-blue-500/15 text-blue-400/70'
  if (p === 'Google Ads') return 'bg-emerald-500/15 text-emerald-400/70'
  if (p === 'Ambos') return 'bg-violet-500/15 text-violet-400/70'
  return 'bg-white/[0.06] text-white/30'
}

function today() {
  return new Date().toISOString().split('T')[0]
}

function formatDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function DiarioPage({ session }: { session: SessionPayload }) {
  const isAdmin = session.role === 'admin'

  const [clients, setClients] = useState<Client[]>([])
  const [records, setRecords] = useState<DiarioRecord[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterKoko, setFilterKoko] = useState<'all' | 'koko' | 'outros'>('all')
  const [loading, setLoading] = useState(true)

  // Client form
  const [showClientForm, setShowClientForm] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [clientForm, setClientForm] = useState(EMPTY_CLIENT)
  const [clientCampaigns, setClientCampaigns] = useState<Campaign[]>([])
  const [savingClient, setSavingClient] = useState(false)

  // Record form
  const [showRecordForm, setShowRecordForm] = useState(false)
  const [recordForm, setRecordForm] = useState({ campaignId: '', date: today(), text: '' })
  const [savingRecord, setSavingRecord] = useState(false)
  const [editingRecord, setEditingRecord] = useState<DiarioRecord | null>(null)
  const [recordCampaignFilter, setRecordCampaignFilter] = useState('')

  const loadClients = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/diario/clients')
    if (res.ok) setClients(await res.json() as Client[])
    setLoading(false)
  }, [])

  const loadRecords = useCallback(async (clientId: string) => {
    const res = await fetch(`/api/diario/records?clientId=${clientId}`)
    if (res.ok) setRecords(await res.json() as DiarioRecord[])
  }, [])

  useEffect(() => { loadClients() }, [loadClients])

  useEffect(() => {
    if (selectedId) loadRecords(selectedId)
    else setRecords([])
  }, [selectedId, loadRecords])

  const selectedClient = clients.find(c => c.id === selectedId) ?? null

  const visibleClients = clients.filter(c => {
    if (filterKoko === 'koko' && !c.isKoko) return false
    if (filterKoko === 'outros' && c.isKoko) return false
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  function openNewClient() {
    setEditingClient(null)
    setClientForm(EMPTY_CLIENT)
    setClientCampaigns([])
    setShowClientForm(true)
  }

  function openEditClient(c: Client) {
    setEditingClient(c)
    setClientForm({
      name: c.name, platform: c.platform, isKoko: c.isKoko,
      metaLink: c.metaLink ?? '', googleLink: c.googleLink ?? '',
      site: c.site ?? '', instagram: c.instagram ?? '',
      verbaPlanLink: c.verbaPlanLink ?? '',
      verbaMeta: c.verbaMeta?.toString() ?? '',
      verbaGoogle: c.verbaGoogle?.toString() ?? '',
    })
    setClientCampaigns(c.campaigns)
    setShowClientForm(true)
  }

  async function saveClient() {
    if (!clientForm.name.trim()) return
    setSavingClient(true)
    const body = {
      ...clientForm,
      verbaMeta: clientForm.verbaMeta ? Number(clientForm.verbaMeta) : undefined,
      verbaGoogle: clientForm.verbaGoogle ? Number(clientForm.verbaGoogle) : undefined,
      campaigns: clientCampaigns,
    }
    if (editingClient) {
      await fetch(`/api/diario/clients/${editingClient.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
    } else {
      await fetch('/api/diario/clients', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
    }
    await loadClients()
    setShowClientForm(false)
    setSavingClient(false)
  }

  async function deleteClient(id: string, name: string) {
    if (!confirm(`Remover "${name}" e todos os seus registros?`)) return
    await fetch(`/api/diario/clients/${id}`, { method: 'DELETE' })
    if (selectedId === id) setSelectedId(null)
    await loadClients()
  }

  function addCampaign() {
    setClientCampaigns(cs => [...cs, {
      id: crypto.randomUUID(), name: '', platform: 'Meta Ads', objective: ''
    }])
  }

  function updateCampaign(id: string, field: keyof Campaign, value: string) {
    setClientCampaigns(cs => cs.map(c => c.id === id ? { ...c, [field]: value } : c))
  }

  function removeCampaign(id: string) {
    setClientCampaigns(cs => cs.filter(c => c.id !== id))
  }

  async function saveRecord() {
    if (!recordForm.text.trim() || !selectedId) return
    setSavingRecord(true)
    if (editingRecord) {
      await fetch(`/api/diario/records/${editingRecord.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...recordForm, campaignId: recordForm.campaignId || undefined }),
      })
    } else {
      await fetch('/api/diario/records', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...recordForm, clientId: selectedId, campaignId: recordForm.campaignId || undefined }),
      })
    }
    await loadRecords(selectedId)
    setRecordForm({ campaignId: '', date: today(), text: '' })
    setEditingRecord(null)
    setShowRecordForm(false)
    setSavingRecord(false)
  }

  async function deleteRecord(id: string) {
    if (!confirm('Remover este registro?')) return
    await fetch(`/api/diario/records/${id}`, { method: 'DELETE' })
    if (selectedId) await loadRecords(selectedId)
  }

  function openEditRecord(r: DiarioRecord) {
    setEditingRecord(r)
    setRecordForm({ campaignId: r.campaignId ?? '', date: r.date, text: r.text })
    setShowRecordForm(true)
  }

  const filteredRecords = recordCampaignFilter
    ? records.filter(r => r.campaignId === recordCampaignFilter)
    : records

  return (
    <div className="flex h-[calc(100vh-56px)]">

      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 border-r border-white/[0.05] flex flex-col bg-[#0a0a0f]">
        <div className="p-4 border-b border-white/[0.05] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-white/30">Clientes</span>
            {isAdmin && (
              <button onClick={openNewClient}
                className="text-[10px] px-2 py-1 rounded-lg bg-violet-600/25 hover:bg-violet-600/40 text-violet-300 border border-violet-500/20 transition-all">
                + Novo
              </button>
            )}
          </div>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar cliente..."
            className="w-full bg-white/[0.04] border border-white/[0.07] rounded-lg px-3 py-1.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-white/15"
          />
          {!session.kokoOnly && (
            <div className="flex gap-1">
              {(['all', 'koko', 'outros'] as const).map(f => (
                <button key={f} onClick={() => setFilterKoko(f)}
                  className={`flex-1 py-1 rounded text-[10px] transition-all ${filterKoko === f ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/60'}`}>
                  {f === 'all' ? 'Todos' : f === 'koko' ? 'Koko' : 'Outros'}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {loading ? (
            <div className="space-y-1.5 px-3 pt-1">
              {[...Array(5)].map((_, i) => <div key={i} className="h-10 rounded-lg bg-white/[0.03] animate-pulse" />)}
            </div>
          ) : visibleClients.length === 0 ? (
            <p className="text-center text-white/15 text-xs mt-8">Nenhum cliente</p>
          ) : visibleClients.map(c => (
            <button key={c.id} onClick={() => setSelectedId(c.id)}
              className={`w-full text-left px-3 py-2.5 transition-all ${selectedId === c.id ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'}`}>
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/70 truncate flex-1">{c.name}</span>
                {c.isKoko && <span className="text-[8px] px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-400/60 flex-shrink-0">Koko</span>}
              </div>
              <span className={`text-[9px] px-1.5 py-0.5 rounded mt-1 inline-block ${platColor(c.platform)}`}>{c.platform}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 overflow-y-auto">
        {!selectedClient ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-white/15 text-sm">Selecione um cliente para ver os registros</p>
          </div>
        ) : (
          <div className="p-6 space-y-6 max-w-3xl">

            {/* Client header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-lg font-semibold text-white/80">{selectedClient.name}</h1>
                  <span className={`text-[10px] px-2 py-0.5 rounded ${platColor(selectedClient.platform)}`}>{selectedClient.platform}</span>
                  {selectedClient.isKoko && <span className="text-[10px] px-2 py-0.5 rounded bg-violet-500/15 text-violet-400/70 border border-violet-500/20">Koko</span>}
                </div>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  {selectedClient.verbaMeta && <span className="text-[11px] text-white/30">Meta: <span className="text-white/50">R$ {selectedClient.verbaMeta.toLocaleString('pt-BR')}</span></span>}
                  {selectedClient.verbaGoogle && <span className="text-[11px] text-white/30">Google: <span className="text-white/50">R$ {selectedClient.verbaGoogle.toLocaleString('pt-BR')}</span></span>}
                </div>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {selectedClient.metaLink && <a href={selectedClient.metaLink} target="_blank" rel="noreferrer" className="text-[10px] text-blue-400/50 hover:text-blue-400 transition-colors">Meta Ads ↗</a>}
                  {selectedClient.googleLink && <a href={selectedClient.googleLink} target="_blank" rel="noreferrer" className="text-[10px] text-emerald-400/50 hover:text-emerald-400 transition-colors">Google Ads ↗</a>}
                  {selectedClient.site && <a href={selectedClient.site} target="_blank" rel="noreferrer" className="text-[10px] text-white/30 hover:text-white/60 transition-colors">Site ↗</a>}
                  {selectedClient.instagram && <a href={selectedClient.instagram} target="_blank" rel="noreferrer" className="text-[10px] text-pink-400/50 hover:text-pink-400 transition-colors">Instagram ↗</a>}
                  {selectedClient.verbaPlanLink && <a href={selectedClient.verbaPlanLink} target="_blank" rel="noreferrer" className="text-[10px] text-amber-400/50 hover:text-amber-400 transition-colors">Programação ↗</a>}
                </div>
              </div>
              {isAdmin && (
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => openEditClient(selectedClient)}
                    className="text-[10px] px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] text-white/40 hover:text-white/70 border border-white/[0.07] transition-all">
                    Editar
                  </button>
                  <button onClick={() => deleteClient(selectedClient.id, selectedClient.name)}
                    className="text-[10px] px-3 py-1.5 rounded-lg text-red-400/30 hover:text-red-400/70 border border-red-400/10 hover:border-red-400/20 transition-all">
                    Remover
                  </button>
                </div>
              )}
            </div>

            {/* Campaigns */}
            {selectedClient.campaigns.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold tracking-[0.15em] uppercase text-white/25 mb-2">Campanhas</p>
                <div className="flex flex-wrap gap-2">
                  {selectedClient.campaigns.map(camp => (
                    <div key={camp.id} className="px-3 py-2 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                      <p className="text-xs text-white/65">{camp.name}</p>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded mt-1 inline-block ${platColor(camp.platform)}`}>{camp.platform}</span>
                      {camp.objective && <p className="text-[10px] text-white/25 mt-1">{camp.objective}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Records */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-semibold tracking-[0.15em] uppercase text-white/25">Registros</p>
                <div className="flex items-center gap-2">
                  {selectedClient.campaigns.length > 0 && (
                    <select value={recordCampaignFilter} onChange={e => setRecordCampaignFilter(e.target.value)}
                      className="bg-white/[0.04] border border-white/[0.07] rounded-lg px-2 py-1 text-[10px] text-white/40 focus:outline-none">
                      <option value="">Todas as campanhas</option>
                      {selectedClient.campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  )}
                  <button onClick={() => { setEditingRecord(null); setRecordForm({ campaignId: '', date: today(), text: '' }); setShowRecordForm(true) }}
                    className="text-[10px] px-3 py-1.5 rounded-lg bg-violet-600/25 hover:bg-violet-600/40 text-violet-300 border border-violet-500/20 transition-all">
                    + Novo registro
                  </button>
                </div>
              </div>

              {/* Record form */}
              {showRecordForm && (
                <div className="mb-4 p-4 rounded-xl border border-white/[0.07] bg-white/[0.02] space-y-3">
                  <p className="text-[10px] text-white/30 uppercase tracking-wider">{editingRecord ? 'Editar registro' : 'Novo registro'}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-white/25 block mb-1">Data</label>
                      <input type="date" value={recordForm.date} onChange={e => setRecordForm(f => ({ ...f, date: e.target.value }))}
                        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white/20" />
                    </div>
                    {selectedClient.campaigns.length > 0 && (
                      <div>
                        <label className="text-[10px] text-white/25 block mb-1">Campanha (opcional)</label>
                        <select value={recordForm.campaignId} onChange={e => setRecordForm(f => ({ ...f, campaignId: e.target.value }))}
                          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white/20">
                          <option value="">Nenhuma</option>
                          {selectedClient.campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-[10px] text-white/25 block mb-1">Registro</label>
                    <textarea value={recordForm.text} onChange={e => setRecordForm(f => ({ ...f, text: e.target.value }))}
                      rows={4} placeholder="Descreva o que aconteceu, resultados, observações..."
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white placeholder-white/15 focus:outline-none focus:border-white/20 resize-none" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={saveRecord} disabled={savingRecord || !recordForm.text.trim()}
                      className="px-4 py-1.5 rounded-lg bg-violet-600/50 hover:bg-violet-600/70 text-violet-200 text-xs font-medium transition-all disabled:opacity-40">
                      {savingRecord ? 'Salvando…' : 'Salvar'}
                    </button>
                    <button onClick={() => { setShowRecordForm(false); setEditingRecord(null) }}
                      className="px-4 py-1.5 rounded-lg text-white/30 hover:text-white/60 text-xs transition-colors">
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {filteredRecords.length === 0 ? (
                <div className="h-24 rounded-xl border border-white/[0.04] bg-white/[0.01] flex items-center justify-center">
                  <p className="text-xs text-white/15">Nenhum registro ainda</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredRecords.map(r => {
                    const camp = selectedClient.campaigns.find(c => c.id === r.campaignId)
                    return (
                      <div key={r.id} className="px-4 py-3 rounded-xl border border-white/[0.05] bg-white/[0.02]">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="text-[10px] text-white/35">{formatDate(r.date)}</span>
                              {camp && <span className={`text-[9px] px-1.5 py-0.5 rounded ${platColor(camp.platform)}`}>{camp.name}</span>}
                            </div>
                            <p className="text-xs text-white/60 leading-relaxed whitespace-pre-wrap">{r.text}</p>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <button onClick={() => openEditRecord(r)} className="text-[10px] text-white/20 hover:text-white/50 transition-colors">Editar</button>
                            <button onClick={() => deleteRecord(r.id)} className="text-[10px] text-red-400/20 hover:text-red-400/60 transition-colors">×</button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Client form modal */}
      {showClientForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-[#0f0f18] border border-white/[0.08] rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
              <h2 className="text-sm font-semibold text-white/70">{editingClient ? 'Editar cliente' : 'Novo cliente'}</h2>
              <button onClick={() => setShowClientForm(false)} className="text-white/25 hover:text-white/60 text-lg">×</button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-[10px] text-white/30 block mb-1">Nome do cliente *</label>
                  <input value={clientForm.name} onChange={e => setClientForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white/20"
                    placeholder="Ex.: Acme Corp" />
                </div>
                <div>
                  <label className="text-[10px] text-white/30 block mb-1">Plataforma principal</label>
                  <select value={clientForm.platform} onChange={e => setClientForm(f => ({ ...f, platform: e.target.value as Platform }))}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white/20">
                    {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                  <span className="text-[11px] text-white/40">Cliente da Koko</span>
                  <button type="button" onClick={() => setClientForm(f => ({ ...f, isKoko: !f.isKoko }))}
                    className={`w-9 h-5 rounded-full transition-all relative ${clientForm.isKoko ? 'bg-violet-600' : 'bg-white/10'}`}>
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${clientForm.isKoko ? 'left-4' : 'left-0.5'}`} />
                  </button>
                </div>
                <div>
                  <label className="text-[10px] text-white/30 block mb-1">Link Meta Ads</label>
                  <input value={clientForm.metaLink} onChange={e => setClientForm(f => ({ ...f, metaLink: e.target.value }))}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white/20"
                    placeholder="https://adsmanager.facebook.com/..." />
                </div>
                <div>
                  <label className="text-[10px] text-white/30 block mb-1">Link Google Ads</label>
                  <input value={clientForm.googleLink} onChange={e => setClientForm(f => ({ ...f, googleLink: e.target.value }))}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white/20"
                    placeholder="https://ads.google.com/..." />
                </div>
                <div>
                  <label className="text-[10px] text-white/30 block mb-1">Site</label>
                  <input value={clientForm.site} onChange={e => setClientForm(f => ({ ...f, site: e.target.value }))}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white/20"
                    placeholder="https://exemplo.com" />
                </div>
                <div>
                  <label className="text-[10px] text-white/30 block mb-1">Instagram</label>
                  <input value={clientForm.instagram} onChange={e => setClientForm(f => ({ ...f, instagram: e.target.value }))}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white/20"
                    placeholder="https://instagram.com/usuario" />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] text-white/30 block mb-1">Programação de verba (link)</label>
                  <input value={clientForm.verbaPlanLink} onChange={e => setClientForm(f => ({ ...f, verbaPlanLink: e.target.value }))}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white/20"
                    placeholder="https://docs.google.com/..." />
                </div>
                <div>
                  <label className="text-[10px] text-white/30 block mb-1">Verba Meta Ads (R$)</label>
                  <input type="number" value={clientForm.verbaMeta} onChange={e => setClientForm(f => ({ ...f, verbaMeta: e.target.value }))}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white/20"
                    placeholder="3000" />
                </div>
                <div>
                  <label className="text-[10px] text-white/30 block mb-1">Verba Google Ads (R$)</label>
                  <input type="number" value={clientForm.verbaGoogle} onChange={e => setClientForm(f => ({ ...f, verbaGoogle: e.target.value }))}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white/20"
                    placeholder="2000" />
                </div>
              </div>

              {/* Campaigns */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] text-white/30 uppercase tracking-wider">Campanhas</label>
                  <button type="button" onClick={addCampaign}
                    className="text-[10px] px-2 py-1 rounded bg-white/[0.05] hover:bg-white/[0.08] text-white/35 hover:text-white/60 transition-all">
                    + Adicionar
                  </button>
                </div>
                <div className="space-y-2">
                  {clientCampaigns.map((camp, i) => (
                    <div key={camp.id} className="p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-white/25">Campanha {i + 1}</span>
                        <button type="button" onClick={() => removeCampaign(camp.id)} className="text-[10px] text-red-400/30 hover:text-red-400/60">×</button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input value={camp.name} onChange={e => updateCampaign(camp.id, 'name', e.target.value)}
                          placeholder="Nome da campanha"
                          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-white/20" />
                        <select value={camp.platform} onChange={e => updateCampaign(camp.id, 'platform', e.target.value)}
                          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-white/20">
                          {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                      <input value={camp.objective ?? ''} onChange={e => updateCampaign(camp.id, 'objective', e.target.value)}
                        placeholder="Objetivo (opcional)"
                        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-white/20" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-white/[0.06] flex gap-2">
              <button onClick={saveClient} disabled={savingClient || !clientForm.name.trim()}
                className="px-4 py-2 rounded-lg bg-violet-600/50 hover:bg-violet-600/70 text-violet-200 text-xs font-medium transition-all disabled:opacity-40">
                {savingClient ? 'Salvando…' : 'Salvar cliente'}
              </button>
              <button onClick={() => setShowClientForm(false)}
                className="px-4 py-2 rounded-lg text-white/30 hover:text-white/60 text-xs transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
