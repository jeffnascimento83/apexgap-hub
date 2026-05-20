'use client'
import { useState, useEffect, useCallback } from 'react'

interface CalendarEvent {
  id: string
  summary?: string
  description?: string
  start?: { dateTime?: string; date?: string }
  end?: { dateTime?: string; date?: string }
  hangoutLink?: string
  organizer?: { displayName?: string; email?: string; self?: boolean }
  _source: 'personal' | 'agency'
}

interface ClickUpTask {
  id: string
  name: string
  status: { status: string; color: string }
  priority?: { priority: string; color: string }
  due_date?: string
  url: string
  list: { name: string }
  space_name?: string | null
  creator?: { id: number; username: string }
}

function formatTime(d?: string) {
  if (!d) return ''
  return new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function formatDayLabel(d: Date) {
  const today = new Date()
  const tomorrow = new Date(); tomorrow.setDate(today.getDate() + 1)
  if (d.toDateString() === today.toDateString()) return 'Hoje'
  if (d.toDateString() === tomorrow.toDateString()) return 'Amanhã'
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' })
}

function groupByDay(events: CalendarEvent[]) {
  const map: Record<string, CalendarEvent[]> = {}
  events.forEach(e => {
    const d = new Date(e.start?.dateTime || e.start?.date || '').toDateString()
    if (!map[d]) map[d] = []
    map[d].push(e)
  })
  return map
}

function getMonthDays(year: number, month: number) {
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const days: (Date | null)[] = []
  for (let i = 0; i < first.getDay(); i++) days.push(null)
  for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d))
  return days
}

function startOfDay(d: Date) {
  const r = new Date(d); r.setHours(0,0,0,0); return r
}
function endOfDay(d: Date) {
  const r = new Date(d); r.setHours(23,59,59,999); return r
}
function startOfWeek(d: Date) {
  const r = new Date(d); r.setDate(d.getDate() - d.getDay()); r.setHours(0,0,0,0); return r
}
function endOfWeek(d: Date) {
  const r = startOfWeek(d); r.setDate(r.getDate() + 6); r.setHours(23,59,59,999); return r
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
}

function MiniCalendar({
  title, color, events, calMonth, onPrev, onNext, selectedDay, onSelectDay
}: {
  title: string
  color: 'blue' | 'emerald'
  events: CalendarEvent[]
  calMonth: { year: number; month: number }
  onPrev: () => void
  onNext: () => void
  selectedDay: string | null
  onSelectDay: (key: string | null) => void
}) {
  const monthDays = getMonthDays(calMonth.year, calMonth.month)
  const grouped = groupByDay(events)
  const monthName = new Date(calMonth.year, calMonth.month, 1)
    .toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  const dotColor = color === 'blue' ? 'bg-blue-400' : 'bg-emerald-400'
  const cardBg = color === 'blue' ? 'bg-blue-500/20 text-blue-300/70' : 'bg-emerald-500/20 text-emerald-300/70'
  const barColor = color === 'blue' ? 'bg-blue-400' : 'bg-emerald-400'

  const selectedEvents = selectedDay ? (grouped[selectedDay] || []) : []

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${dotColor} opacity-70`} />
          <span className="text-[10px] text-white/40 font-medium uppercase tracking-wider">{title}</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onPrev} className="text-white/30 hover:text-white/70 px-1.5 py-0.5 text-xs transition-all">←</button>
          <span className="text-[10px] text-white/40 capitalize min-w-[100px] text-center">{monthName}</span>
          <button onClick={onNext} className="text-white/30 hover:text-white/70 px-1.5 py-0.5 text-xs transition-all">→</button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {['D','S','T','Q','Q','S','S'].map((d, i) => (
          <div key={i} className="text-center text-[9px] text-white/15 py-1">{d}</div>
        ))}
        {monthDays.map((day, i) => {
          if (!day) return <div key={i} />
          const key = day.toDateString()
          const dayEvts = grouped[key] || []
          const isToday = day.toDateString() === new Date().toDateString()
          const isSelected = selectedDay === key
          return (
            <div key={i} onClick={() => onSelectDay(isSelected ? null : key)}
              className={`min-h-[74px] rounded-md p-1 cursor-pointer transition-all border ${
                isSelected ? 'border-white/20 bg-white/[0.06]' :
                isToday ? 'border-white/10 bg-white/[0.04]' :
                'border-white/[0.03] bg-white/[0.01] hover:bg-white/[0.03]'
              }`}>
              <div className={`text-[10px] font-medium mb-0.5 ${isToday ? 'text-white' : 'text-white/35'}`}>
                {day.getDate()}
              </div>
              <div className="space-y-0.5">
                {dayEvts.slice(0, 3).map(ev => (
                  <div key={ev.id} className={`text-[8px] px-0.5 py-0.5 rounded truncate ${cardBg}`}>
                    {ev.summary?.replace(/\[.*?\]\s*/g, '') || '•'}
                  </div>
                ))}
                {dayEvts.length > 3 && (
  <div className="text-[8px] text-white/20">+{dayEvts.length - 3}</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
      {selectedDay && (
        <div className="pt-2 border-t border-white/[0.05] space-y-1.5">
          <p className="text-[10px] text-white/25 uppercase tracking-widest capitalize px-1">
            {formatDayLabel(new Date(selectedDay))}
          </p>
          {selectedEvents.length === 0 ? (
            <p className="text-xs text-white/15 text-center py-3">Nenhum evento</p>
          ) : selectedEvents.map(ev => {
            const allDay = !ev.start?.dateTime
            const organizer = ev.organizer && !ev.organizer.self ? (ev.organizer.displayName || ev.organizer.email) : null
            const client = ev.summary?.match(/\[([^\]]+)\]/)?.[1]
            return (
              <div key={ev.id} className="px-3 py-2.5 rounded-xl border border-white/[0.05] bg-white/[0.02]">
                <div className="flex items-start gap-2.5">
                  <div className={`w-1 h-7 rounded-full flex-shrink-0 mt-0.5 ${barColor} opacity-70`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs text-white/75 leading-snug">{ev.summary || 'Sem título'}</p>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {ev.hangoutLink && (
                          <a href={ev.hangoutLink} target="_blank" rel="noopener noreferrer"
                            className="text-[9px] text-emerald-400/60 hover:text-emerald-400">Meet →</a>
                        )}
                        <span className="text-[9px] text-white/20">
                          {allDay ? 'Dia inteiro' : `${formatTime(ev.start?.dateTime)}`}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {organizer && <span className="text-[10px] text-white/25"><span className="text-white/10">por </span>{organizer}</span>}
                      {client && <span className="text-[9px] px-1 py-0.5 rounded bg-emerald-500/10 text-emerald-400/50">{client}</span>}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function HubHome() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [tasks, setTasks] = useState<ClickUpTask[]>([])
  const [mentions, setMentions] = useState<any[]>([])
  const [mentionsLoading, setMentionsLoading] = useState(false)
  const [authP, setAuthP] = useState(false)
  const [authA, setAuthA] = useState(false)
  const [loading, setLoading] = useState(true)
  const [displayMode, setDisplayMode] = useState<'list' | 'grid'>('grid')
  const [listView, setListView] = useState<'week' | 'month'>('week')
  const [listFilter, setListFilter] = useState<'all' | 'personal' | 'agency'>('all')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [taskFilter, setTaskFilter] = useState<'today' | 'week' | 'month'>('week')
  const [leftOpen, setLeftOpen] = useState(true)
  const [rightOpen, setRightOpen] = useState(true)

  const now = new Date()
  const [calP, setCalP] = useState({ year: now.getFullYear(), month: now.getMonth() })
  const [calA, setCalA] = useState({ year: now.getFullYear(), month: now.getMonth() })
  const [selectedP, setSelectedP] = useState<string | null>(null)
  const [selectedA, setSelectedA] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [s, e, t] = await Promise.all([
        fetch('/api/auth/status').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/calendar/events').then(r => r.ok ? r.json() : []).catch(() => []),
        fetch('/api/clickup/tasks').then(r => r.ok ? r.json() : []).catch(() => []),
      ])
      if (s) { setAuthP(s.personal); setAuthA(s.agency) }
      if (Array.isArray(e)) setEvents(e)
      if (Array.isArray(t)) setTasks(t)
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    setMentionsLoading(true)
    fetch('/api/clickup/mentions')
      .then(r => r.ok ? r.json() : [])
      .catch(() => [])
      .then(m => { if (Array.isArray(m)) setMentions(m) })
      .finally(() => setMentionsLoading(false))
  }, [])

  const personalEvents = events.filter(e => e._source === 'personal')
  const agencyEvents = events.filter(e => e._source === 'agency')

  const filteredListEvents = events.filter(e => {
    if (listFilter !== 'all' && e._source !== listFilter) return false
    const d = new Date(e.start?.dateTime || e.start?.date || '')
    const end = new Date(now); end.setDate(now.getDate() + (listView === 'week' ? 6 : 29))
    return d >= now && d <= end
  })
  const groupedList = groupByDay(filteredListEvents)
  const listDays = Object.keys(groupedList).sort((a, b) => new Date(a).getTime() - new Date(b).getTime())

  // Task segmentation
  const filteredTasks = tasks.filter(t => {
    if (!t.due_date) return taskFilter === 'month'
    const due = new Date(parseInt(t.due_date))
    if (taskFilter === 'today') return due >= startOfDay(now) && due <= endOfDay(now)
    if (taskFilter === 'week') return due >= startOfDay(now) && due <= endOfWeek(now)
    return due >= startOfDay(now) && due <= endOfMonth(now)
  })

  const overdueCount = tasks.filter(t => {
    if (!t.due_date) return false
    return new Date(parseInt(t.due_date)) < startOfDay(now)
  }).length

  const pColors: Record<string, string> = { urgent: 'text-red-400', high: 'text-orange-400', normal: 'text-blue-400', low: 'text-white/20' }

  return (
    <div className="w-[82%] mx-auto px-6 py-8">
      {!authP ? (
        <div className="mb-3 px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
          <span className="text-xs text-amber-400">Calendário pessoal não conectado</span>
          <a href="/api/auth/google/personal" className="text-xs text-amber-400 underline">Conectar</a>
        </div>
      ) : (
        <div className="mb-3 px-4 py-3 rounded-lg bg-white/[0.02] border border-white/[0.04] flex items-center justify-between">
          <span className="text-xs text-white/30">Calendário pessoal conectado</span>
          <a href="/api/auth/disconnect?account=personal" className="text-xs text-white/20 hover:text-red-400 transition-colors">Desconectar</a>
        </div>
      )}
      {!authA ? (
        <div className="mb-6 px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
          <span className="text-xs text-amber-400">Calendário da agência não conectado</span>
          <a href="/api/auth/google/agency" className="text-xs text-amber-400 underline">Conectar</a>
        </div>
      ) : (
        <div className="mb-6 px-4 py-3 rounded-lg bg-white/[0.02] border border-white/[0.04] flex items-center justify-between">
          <span className="text-xs text-white/30">Calendário da agência conectado</span>
          <a href="/api/auth/disconnect?account=agency" className="text-xs text-white/20 hover:text-red-400 transition-colors">Desconectar</a>
        </div>
      )}

      <div className="flex gap-6 items-start">

        {/* Calendar column */}
        <div className={`transition-all duration-300 min-w-0 relative ${leftOpen ? 'flex-[3]' : 'flex-none w-7'}`}>
          <button
            onClick={() => setLeftOpen(o => !o)}
            className="absolute -right-3 top-0 z-10 w-6 h-6 rounded-full bg-[#1a1a28] border border-white/[0.08] flex items-center justify-center text-white/30 hover:text-white/70 hover:border-white/20 transition-all text-xs"
          >
            {leftOpen ? '‹' : '›'}
          </button>

          {leftOpen && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold tracking-[0.15em] uppercase text-white/40">Calendário</h2>
                <div className="flex items-center gap-2">
                  {displayMode === 'list' && (
                    <>
                      <div className="flex gap-1">
                        {(['all','personal','agency'] as const).map(f => (
                          <button key={f} onClick={() => setListFilter(f)}
                            className={`px-2.5 py-1 rounded text-[10px] font-medium transition-all ${listFilter===f?'bg-white/10 text-white':'text-white/30 hover:text-white/60'}`}>
                            {f==='all'?'Todos':f==='personal'?'Pessoal':'Agência'}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-1 border border-white/[0.08] rounded-md p-0.5">
                        {(['week','month'] as const).map(v => (
                          <button key={v} onClick={() => setListView(v)}
                            className={`px-2.5 py-1 rounded text-[10px] font-medium transition-all ${listView===v?'bg-white/10 text-white':'text-white/30 hover:text-white/60'}`}>
                            {v==='week'?'7 dias':'30 dias'}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                  <div className="flex gap-1 border border-white/[0.08] rounded-md p-0.5">
                    <button onClick={() => setDisplayMode('list')}
                      className={`px-2.5 py-1 rounded text-[10px] font-medium transition-all ${displayMode==='list'?'bg-white/10 text-white':'text-white/30 hover:text-white/60'}`}>
                      Lista
                    </button>
                    <button onClick={() => setDisplayMode('grid')}
                      className={`px-2.5 py-1 rounded text-[10px] font-medium transition-all ${displayMode==='grid'?'bg-white/10 text-white':'text-white/30 hover:text-white/60'}`}>
                      Mês
                    </button>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="space-y-2">{[...Array(4)].map((_,i) => <div key={i} className="h-16 rounded-xl bg-white/[0.03] animate-pulse"/>)}</div>
              ) : displayMode === 'list' ? (
                listDays.length === 0 ? (
                  <div className="h-48 rounded-xl border border-white/[0.04] bg-white/[0.02] flex items-center justify-center">
                    <p className="text-xs text-white/20">Nenhum evento no período</p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {listDays.map(day => (
                      <div key={day}>
                        <p className="text-[10px] uppercase tracking-widest text-white/25 px-1 mb-2 capitalize">{formatDayLabel(new Date(day))}</p>
                        <div className="space-y-1.5">
                          {groupedList[day].map(ev => {
                            const isExp = expanded === ev.id
                            const allDay = !ev.start?.dateTime
                            const bar = ev._source === 'personal' ? 'bg-blue-400' : 'bg-emerald-400'
                            const organizer = ev.organizer && !ev.organizer.self ? (ev.organizer.displayName || ev.organizer.email) : null
                            const client = ev.summary?.match(/\[([^\]]+)\]/)?.[1]
                            return (
                              <div key={ev.id} onClick={() => setExpanded(isExp ? null : ev.id)}
                                className="px-4 py-3 rounded-xl border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.04] transition-all cursor-pointer">
                                <div className="flex items-start gap-3">
                                  <div className={`w-1 h-8 rounded-full flex-shrink-0 mt-0.5 ${bar} opacity-70`}/>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                      <p className="text-sm text-white/80">{ev.summary || 'Sem título'}</p>
                                      <div className="flex items-center gap-2 flex-shrink-0">
                                        {ev.hangoutLink && (
                                          <a href={ev.hangoutLink} target="_blank" rel="noopener noreferrer"
                                            onClick={e => e.stopPropagation()}
                                            className="text-[10px] text-emerald-400/60 hover:text-emerald-400">Meet →</a>
                                        )}
                                        <span className="text-[10px] text-white/20">
                                          {allDay ? 'Dia inteiro' : `${formatTime(ev.start?.dateTime)} — ${formatTime(ev.end?.dateTime)}`}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                                      {organizer && <span className="text-[11px] text-white/30"><span className="text-white/15">por </span>{organizer}</span>}
                                      {client && ev._source === 'agency' && (
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400/60">{client}</span>
                                      )}
                                    </div>
                                    {isExp && ev.description && (
                                      <div className="mt-3 pt-3 border-t border-white/[0.06]">
                                        <p className="text-xs text-white/30 leading-relaxed">
                                          {ev.description.replace(/<[^>]*>/g,'').trim().slice(0,300)}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  <MiniCalendar
                    title="Pessoal"
                    color="blue"
                    events={personalEvents}
                    calMonth={calP}
                    onPrev={() => setCalP(c => c.month === 0 ? {year:c.year-1,month:11} : {year:c.year,month:c.month-1})}
                    onNext={() => setCalP(c => c.month === 11 ? {year:c.year+1,month:0} : {year:c.year,month:c.month+1})}
                    selectedDay={selectedP}
                    onSelectDay={setSelectedP}
                  />
                  <MiniCalendar
                    title="Agência"
                    color="emerald"
                    events={agencyEvents}
                    calMonth={calA}
                    onPrev={() => setCalA(c => c.month === 0 ? {year:c.year-1,month:11} : {year:c.year,month:c.month-1})}
                    onNext={() => setCalA(c => c.month === 11 ? {year:c.year+1,month:0} : {year:c.year,month:c.month+1})}
                    selectedDay={selectedA}
                    onSelectDay={setSelectedA}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tasks column */}
        <div className={`transition-all duration-300 min-w-0 relative ${rightOpen ? 'flex-[2]' : 'flex-none w-7'}`}>
          <button
            onClick={() => setRightOpen(o => !o)}
            className="absolute -left-3 top-0 z-10 w-6 h-6 rounded-full bg-[#1a1a28] border border-white/[0.08] flex items-center justify-center text-white/30 hover:text-white/70 hover:border-white/20 transition-all text-xs"
          >
            {rightOpen ? '›' : '‹'}
          </button>

          {rightOpen && (
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-semibold tracking-[0.15em] uppercase text-white/40">Minhas Tarefas</h2>
                  {overdueCount > 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/15 text-red-400">{overdueCount} atrasada{overdueCount > 1 ? 's' : ''}</span>
                  )}
                </div>
                <div className="flex gap-1 border border-white/[0.08] rounded-md p-0.5 w-fit">
                  {(['today','week','month'] as const).map(f => (
                    <button key={f} onClick={() => setTaskFilter(f)}
                      className={`px-3 py-1 rounded text-[10px] font-medium transition-all ${taskFilter===f?'bg-white/10 text-white':'text-white/30 hover:text-white/60'}`}>
                      {f==='today'?'Hoje':f==='week'?'Esta semana':'Este mês'}
                    </button>
                  ))}
                </div>
                {loading ? (
                  <div className="space-y-2">{[...Array(3)].map((_,i) => <div key={i} className="h-14 rounded-xl bg-white/[0.03] animate-pulse"/>)}</div>
                ) : filteredTasks.length === 0 ? (
                  <div className="h-24 rounded-xl border border-white/[0.04] bg-white/[0.02] flex items-center justify-center">
                    <p className="text-xs text-white/20">Nenhuma tarefa no período</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {filteredTasks.map(task => (
                      <a key={task.id} href={task.url} target="_blank" rel="noopener noreferrer"
                        className="block px-4 py-3 rounded-xl border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.04] transition-all">
                        <div className="flex items-start gap-2.5">
                          <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{backgroundColor: task.status.color||'#555'}}/>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white/75">{task.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {task.space_name && <span className="text-[10px] text-white/20">{task.space_name}</span>}
                              {task.list?.name && <span className="text-[10px] text-white/20">· {task.list.name}</span>}
                              {task.creator && <span className="text-[10px] text-white/20">· {task.creator.username}</span>}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            {task.priority && <span className={`text-[10px] capitalize ${pColors[task.priority.priority]||'text-white/20'}`}>{task.priority.priority}</span>}
                            {task.due_date && <span className="text-[10px] text-white/20">{new Date(parseInt(task.due_date)).toLocaleDateString('pt-BR',{day:'2-digit',month:'short'})}</span>}
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <h2 className="text-xs font-semibold tracking-[0.15em] uppercase text-white/40">Menções & Conversas</h2>
                {mentionsLoading ? (
                  <div className="h-24 rounded-xl border border-white/[0.04] bg-white/[0.02] flex items-center justify-center">
                    <p className="text-xs text-white/20">Carregando menções...</p>
                  </div>
                ) : mentions.length === 0 ? (
                  <div className="h-24 rounded-xl border border-white/[0.04] bg-white/[0.02] flex items-center justify-center">
                    <p className="text-xs text-white/20">Nenhuma menção nos últimos 30 dias</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {mentions.map((m: any) => (
                      <a key={m.commentId} href={m.taskUrl} target="_blank" rel="noreferrer"
                        className="block rounded-xl border border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.04] p-3 transition-all">
                        <div className="flex items-start gap-2">
                          <div className="w-1 h-5 rounded-full bg-emerald-400/60 flex-shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] text-white/70 font-medium truncate">{m.taskName}</p>
                            <p className="text-[10px] text-white/40 mt-0.5 line-clamp-2">{m.commentText}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[9px] text-white/25">{m.author}</span>
                              <span className="text-[9px] text-white/20">·</span>
                              <span className="text-[9px] text-white/25">
                                {new Date(m.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
