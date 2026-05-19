'use client'

import { useState, useEffect, useCallback } from 'react'

interface CalendarEvent {
  id: string
  summary?: string
  description?: string
  location?: string
  start?: { dateTime?: string; date?: string }
  end?: { dateTime?: string; date?: string }
  hangoutLink?: string
  organizer?: { displayName?: string; email?: string; self?: boolean }
  attendees?: { displayName?: string; email?: string; self?: boolean; organizer?: boolean }[]
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
  folder: { name: string }
  space_name?: string | null
  assignees: { id: number; username: string }[]
  creator?: { id: number; username: string }
}

type CalendarView = 'week' | 'month'
type CalendarFilter = 'all' | 'personal' | 'agency'

function parseDate(event: CalendarEvent): Date {
  const str = event.start?.dateTime || event.start?.date || ''
  return new Date(str)
}

function formatTime(dateStr?: string) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function formatDayHeader(date: Date) {
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  if (date.toDateString() === today.toDateString()) return 'Hoje'
  if (date.toDateString() === tomorrow.toDateString()) return 'Amanhã'
  return date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' })
}

function isAllDay(event: CalendarEvent) {
  return !event.start?.dateTime
}

function groupEventsByDay(events: CalendarEvent[]) {
  const groups: Record<string, CalendarEvent[]> = {}
  events.forEach(event => {
    const date = parseDate(event)
    const key = date.toDateString()
    if (!groups[key]) groups[key] = []
    groups[key].push(event)
  })
  return groups
}

function getWeekRange() {
  const now = new Date()
  const end = new Date(now)
  end.setDate(now.getDate() + 6)
  return { start: now, end }
}

function getMonthRange() {
  const now = new Date()
  const end = new Date(now)
  end.setDate(now.getDate() + 29)
  return { start: now, end }
}

function getOrganizerName(event: CalendarEvent): string | null {
  if (!event.organizer) return null
  if (event.organizer.self) return null
  return event.organizer.displayName || event.organizer.email || null
}

function getAttendeesSummary(event: CalendarEvent): string | null {
  if (!event.attendees || event.attendees.length <= 1) return null
  const others = event.attendees.filter(a => !a.self)
  if (others.length === 0) return null
  if (others.length === 1) return others[0].displayName || others[0].email || null
  return `${others[0].displayName || others[0].email} +${others.length - 1}`
}

export default function HubHome() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [tasks, setTasks] = useState<ClickUpTask[]>([])
  const [authPersonal, setAuthPersonal] = useState(false)
  const [authAgency, setAuthAgency] = useState(false)
  const [loading, setLoading] = useState(true)
  const [calendarView, setCalendarView] = useState<CalendarView>('week')
  const [calendarFilter, setCalendarFilter] = useState<CalendarFilter>('all')
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [statusRes, eventsRes, tasksRes] = await Promise.all([
        fetch('/api/auth/status').catch(() => null),
        fetch('/api/calendar/events').catch(() => null),
        fetch('/api/clickup/tasks').catch(() => null),
      ])
      if (statusRes?.ok) {
        const s = await statusRes.json()
        setAuthPersonal(s.personal)
        setAuthAgency(s.agency)
      }
      if (eventsRes?.ok) setEvents(await eventsRes.json())
      if (tasksRes?.ok) setTasks(await tasksRes.json())
    } catch (e) {}
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const range = calendarView === 'week' ? getWeekRange() : getMonthRange()

  const filteredEvents = events.filter(e => {
    if (calendarFilter !== 'all' && e._source !== calendarFilter) return false
    const date = parseDate(e)
    return date >= range.start && date <= range.end
  })

  const grouped = groupEventsByDay(filteredEvents)
  const sortedDays = Object.keys(grouped).sort((a, b) => new Date(a).getTime() - new Date(b).getTime())

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-8">
      {!authPersonal && (
        <div className="mb-3 px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
          <span className="text-xs text-amber-400">Calendário pessoal não conectado</span>
          <a href="/api/auth/google/personal" className="text-xs text-amber-400 underline">Conectar</a>
        </div>
      )}
      {!authAgency && (
        <div className="mb-6 px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
          <span className="text-xs text-amber-400">Calendário da agência não conectado</span>
          <a href="/api/auth/google/agency" className="text-xs text-amber-400 underline">Conectar</a>
        </div>
      )}

      <div className="grid grid-cols-5 gap-6">
        <div className="col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold tracking-[0.15em] uppercase text-white/40">Calendário</h2>
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                {(['all', 'personal', 'agency'] as CalendarFilter[]).map(f => (
                  <button key={f} onClick={() => setCalendarFilter(f)}
                    className={`px-2.5 py-1 rounded text-[10px] font-medium tracking-wide transition-all ${calendarFilter === f ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/60'}`}>
                    {f === 'all' ? 'Todos' : f === 'personal' ? 'Pessoal' : 'Agência'}
                  </button>
                ))}
              </div>
              <div className="flex gap-1 border border-white/[0.08] rounded-md p-0.5">
                {(['week', 'month'] as CalendarView[]).map(v => (
                  <button key={v} onClick={() => setCalendarView(v)}
                    className={`px-2.5 py-1 rounded text-[10px] font-medium tracking-wide transition-all ${calendarView === v ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/60'}`}>
                    {v === 'week' ? '7 dias' : '30 dias'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-white/[0.03] animate-pulse" />)}
            </div>
          ) : sortedDays.length === 0 ? (
            <div className="h-48 rounded-xl border border-white/[0.04] bg-white/[0.02] flex items-center justify-center">
              <p className="text-xs text-white/20">Nenhum evento no período</p>
            </div>
          ) : (
            <div className="space-y-5">
              {sortedDays.map(day => (
                <div key={day}>
                  <p className="text-[10px] uppercase tracking-widest text-white/25 px-1 mb-2 capitalize">
                    {formatDayHeader(new Date(day))}
                  </p>
                  <div className="space-y-1.5">
                    {grouped[day].map(event => {
                      const isExpanded = expandedEvent === event.id
                      const allDay = isAllDay(event)
                      const sourceColor = event._source === 'personal' ? 'bg-blue-400' : 'bg-emerald-400'
                      const organizer = getOrganizerName(event)
                      const attendees = getAttendeesSummary(event)
                      const clientMatch = event.summary?.match(/\[([^\]]+)\]/)

                      return (
                        <div key={event.id}
                          className="group px-4 py-3 rounded-xl border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.04] transition-all cursor-pointer"
                          onClick={() => setExpandedEvent(isExpanded ? null : event.id)}>
                          <div className="flex items-start gap-3">
                            <div className={`w-1 rounded-full flex-shrink-0 mt-1 ${sourceColor} opacity-70`}
                              style={{ height: '32px', minHeight: '32px' }} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm text-white/80 leading-snug">{event.summary || 'Sem título'}</p>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {event.hangoutLink && (
                                    <a href={event.hangoutLink} target="_blank" rel="noopener noreferrer"
                                      onClick={e => e.stopPropagation()}
                                      className="text-[10px] text-emerald-400/60 hover:text-emerald-400 transition-colors">
                                      Meet →
                                    </a>
                                  )}
                                  <span className="text-[10px] text-white/20">
                                    {allDay ? 'Dia inteiro' : `${formatTime(event.start?.dateTime)} — ${formatTime(event.end?.dateTime)}`}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 mt-1 flex-wrap">
                                {organizer && (
                                  <span className="text-[11px] text-white/30">
                                    <span className="text-white/15">por </span>{organizer}
                                  </span>
                                )}
                                {attendees && (
                                  <span className="text-[11px] text-white/30">
                                    <span className="text-white/15">com </span>{attendees}
                                  </span>
                                )}
                                {event._source === 'agency' && clientMatch && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400/60">
                                    {clientMatch[1]}
                                  </span>
                                )}
                              </div>
                              {isExpanded && (
                                <div className="mt-3 pt-3 border-t border-white/[0.06] space-y-2">
                                  {event.description && (
                                    <p className="text-xs text-white/30 leading-relaxed line-clamp-4">
                                      {event.description.replace(/<[^>]*>/g, '').trim()}
                                    </p>
                                  )}
                                  {event.location && (
                                    <p className="text-[11px] text-white/25">
                                      <span className="text-white/15">local </span>{event.location}
                                    </p>
                                  )}
                                  {event.attendees && event.attendees.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                      {event.attendees.slice(0, 5).map((a, i) => (
                                        <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.05] text-white/30">
                                          {a.displayName || a.email?.split('@')[0]}
                                        </span>
                                      ))}
                                      {event.attendees.length > 5 && (
                                        <span className="text-[10px] text-white/20">+{event.attendees.length - 5}</span>
                                      )}
                                    </div>
                                  )}
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
          )}
        </div>

        <div className="col-span-2 space-y-6">
          <div className="space-y-3">
            <h2 className="text-xs font-semibold tracking-[0.15em] uppercase text-white/40">Minhas Tarefas</h2>
            {loading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => <div key={i} className="h-14 rounded-xl bg-white/[0.03] animate-pulse" />)}
              </div>
            ) : tasks.length === 0 ? (
              <div className="h-32 rounded-xl border border-white/[0.04] bg-white/[0.02] flex items-center justify-center">
                <p className="text-xs text-white/20">Nenhuma tarefa atribuída</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {tasks.map(task => {
                  const priorityColors: Record<string, string> = {
                    urgent: 'text-red-400', high: 'text-orange-400', normal: 'text-blue-400', low: 'text-white/20',
                  }
                  const dueDate = task.due_date
                    ? new Date(parseInt(task.due_date)).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
                    : null

                  return (
                    <a key={task.id} href={task.url} target="_blank" rel="noopener noreferrer"
                      className="group px-4 py-3 rounded-xl border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.04] transition-all block">
                      <div className="flex items-start gap-2.5">
                        <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                          style={{ backgroundColor: task.status.color || '#555' }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white/75 leading-snug">{task.name}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {task.space_name && <span className="text-[10px] text-white/20">{task.space_name}</span>}
                            {task.list?.name && <span className="text-[10px] text-white/20">· {task.list.name}</span>}
                            {task.creator && <span className="text-[10px] text-white/20">· por {task.creator.username}</span>}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          {task.priority && (
                            <span className={`text-[10px] capitalize ${priorityColors[task.priority.priority] || 'text-white/20'}`}>
                              {task.priority.priority}
                            </span>
                          )}
                          {dueDate && <span className="text-[10px] text-white/20">{dueDate}</span>}
                        </div>
                      </div>
                    </a>
                  )
                })}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <h2 className="text-xs font-semibold tracking-[0.15em] uppercase text-white/40">Menções & Conversas</h2>
            <div className="h-48 rounded-xl border border-white/[0.04] bg-white/[0.02] flex items-center justify-center">
              <p className="text-xs text-white/20">Em breve</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}