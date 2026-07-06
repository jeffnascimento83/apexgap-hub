'use client'
import { useState, useEffect, useCallback } from 'react'

interface CalendarEvent {
  id: string
  summary?: string
  start?: { dateTime?: string; date?: string }
  end?: { dateTime?: string; date?: string }
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
  folder?: { name: string }
}

// Mini Calendar Component
function MiniCalendar({ title, color, events }: {
  title: string
  color: 'blue' | 'emerald'
  events: CalendarEvent[]
}) {
  const today = new Date()
  const monthDays = getMonthDays(today.getFullYear(), today.getMonth())

  const dotColor = color === 'blue' ? 'bg-blue-400' : 'bg-emerald-400'
  const monthName = today.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  const eventsByDay = events.reduce((acc, ev) => {
    const d = new Date(ev.start?.dateTime || ev.start?.date || '').toDateString()
    if (!acc[d]) acc[d] = []
    acc[d].push(ev)
    return acc
  }, {} as Record<string, CalendarEvent[]>)

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${dotColor}`} />
          <h3 className="text-sm font-semibold text-white/80">{title}</h3>
        </div>
        <p className="text-xs text-white/40 capitalize">{monthName}</p>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map((d, i) => (
          <div key={i} className="text-center text-xs text-white/30 py-1">{d}</div>
        ))}
        {monthDays.map((day, i) => {
          if (!day) return <div key={i} />
          const key = day.toDateString()
          const dayEvts = eventsByDay[key] || []
          const isToday = day.toDateString() === new Date().toDateString()

          return (
            <div key={i} className={`p-1.5 rounded text-center text-xs ${
              isToday ? 'bg-white/10 text-white font-semibold' : 'text-white/50'
            }`}>
              {day.getDate()}
              {dayEvts.length > 0 && (
                <div className="flex justify-center gap-0.5 mt-1">
                  {dayEvts.slice(0,2).map((_, idx) => (
                    <div key={idx} className={`w-1 h-1 rounded-full ${dotColor}`} />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function getMonthDays(year: number, month: number) {
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const days: (Date | null)[] = []
  for (let i = 0; i < first.getDay(); i++) days.push(null)
  for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d))
  return days
}

// Task Card Component
function TaskCard({ task }: { task: ClickUpTask }) {
  // Cores para clientes (pastas)
  const clientColors: Record<string, { bg: string; text: string }> = {
    'default': { bg: 'bg-blue-500/20', text: 'text-blue-300' },
    'Koko': { bg: 'bg-purple-500/20', text: 'text-purple-300' },
    'Apex': { bg: 'bg-pink-500/20', text: 'text-pink-300' },
    'Digital': { bg: 'bg-cyan-500/20', text: 'text-cyan-300' },
    'Social': { bg: 'bg-emerald-500/20', text: 'text-emerald-300' },
    'Ads': { bg: 'bg-orange-500/20', text: 'text-orange-300' },
  }

  const getClientColor = (folderName?: string) => {
    if (!folderName) return clientColors['default']
    for (const [key, color] of Object.entries(clientColors)) {
      if (key !== 'default' && folderName.toLowerCase().includes(key.toLowerCase())) {
        return color
      }
    }
    return clientColors['default']
  }

  const clientColor = getClientColor(task.folder?.name)

  // Formatar data de entrega
  const getDueDate = () => {
    if (!task.due_date) return null
    return new Date(parseInt(task.due_date))
  }

  const dueDate = getDueDate()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const getDueDateStatus = () => {
    if (!dueDate) return { text: '', color: '', bg: '' }

    const dueDateNormalized = new Date(dueDate)
    dueDateNormalized.setHours(0, 0, 0, 0)

    const isOverdue = dueDateNormalized < today
    const isToday = dueDateNormalized.getTime() === today.getTime()

    const formatted = dueDateNormalized.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })

    if (isOverdue) {
      return { text: formatted, color: 'text-red-300', bg: 'bg-red-500/30 border-red-500/50' }
    } else if (isToday) {
      return { text: formatted, color: 'text-yellow-300', bg: 'bg-yellow-500/30 border-yellow-500/50' }
    }
    return { text: formatted, color: 'text-white/60', bg: 'bg-white/[0.05] border-white/[0.08]' }
  }

  const dueDateStatus = getDueDateStatus()

  return (
    <a href={task.url} target="_blank" rel="noopener noreferrer"
      className="block p-3 rounded-lg border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] transition-all group">
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-xs font-semibold text-white/80 group-hover:text-white line-clamp-2 flex-1">{task.name}</h4>
      </div>

      <div className="flex items-center gap-2 flex-wrap mb-2">
        <span className="text-xs px-2 py-0.5 rounded-full bg-white/[0.05] text-white/60">
          {task.status.status}
        </span>
        {task.priority && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-white/[0.05] text-white/60">
            {task.priority.priority}
          </span>
        )}
      </div>

      {dueDateStatus.text && (
        <div className={`text-xs px-2.5 py-1 rounded-lg border w-fit font-medium mb-2 ${dueDateStatus.bg} ${dueDateStatus.color}`}>
          📅 {dueDateStatus.text}
        </div>
      )}

      {task.folder && (
        <div className={`text-xs px-2 py-1 rounded-full w-fit ${clientColor.bg} ${clientColor.text} truncate`}>
          📁 {task.folder.name}
        </div>
      )}
    </a>
  )
}

// Task Column Component
function TaskColumn({ spaceName, tasks }: { spaceName: string; tasks: ClickUpTask[] }) {
  const spaceColors: Record<string, string> = {
    'Kala': 'border-purple-500/30 bg-purple-500/5',
    'Kongo': 'border-pink-500/30 bg-pink-500/5',
    'Koko Educação': 'border-blue-500/30 bg-blue-500/5',
    'Kora': 'border-emerald-500/30 bg-emerald-500/5',
  }

  const color = spaceColors[spaceName] || 'border-white/10 bg-white/[0.02]'

  return (
    <div className={`flex flex-col gap-3 flex-1 rounded-xl border ${color} p-4 h-full`}>
      <div>
        <h3 className="text-sm font-semibold text-white/80">{spaceName}</h3>
        <p className="text-xs text-white/40">{tasks.length} tarefa{tasks.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="space-y-2 overflow-y-auto pr-2 flex-1">
        {tasks.map(task => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  )
}

export default function HubHomeNew() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [tasks, setTasks] = useState<ClickUpTask[]>([])
  const [loading, setLoading] = useState(true)
  const [authP, setAuthP] = useState(false)
  const [authA, setAuthA] = useState(false)

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

  const personalEvents = events.filter(e => e._source === 'personal')
  const agencyEvents = events.filter(e => e._source === 'agency')

  // Group tasks by space
  const tasksBySpace = tasks.reduce((acc, task) => {
    const space = task.space_name || 'Sem Espaço'
    if (!acc[space]) acc[space] = []
    acc[space].push(task)
    return acc
  }, {} as Record<string, ClickUpTask[]>)

  // Ordem específica dos espaços
  const spaceOrder = ['Koko Educação', 'Kala', 'Kongo', 'Kora']
  const spaces = spaceOrder.filter(s => s in tasksBySpace)

  return (
    <div className="w-full bg-gradient-to-b from-[#0f0f17] to-[#1a1a28] min-h-screen flex flex-col">
      <div className="w-full px-6 py-8 space-y-8 flex-1 flex flex-col">

        {/* Auth Status */}
        <div className="space-y-2">
          {!authP && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs">
              <span className="text-amber-400">Calendário pessoal não conectado</span>
              <a href="/api/auth/google/personal" className="text-amber-400 underline">Conectar</a>
            </div>
          )}
          {!authA && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs">
              <span className="text-amber-400">Calendário da agência não conectado</span>
              <a href="/api/auth/google/agency" className="text-amber-400 underline">Conectar</a>
            </div>
          )}
        </div>

        {/* Calendários */}
        <section>
          <h2 className="text-xs font-semibold tracking-widest uppercase text-white/40 mb-4">Calendários</h2>
          {loading ? (
            <div className="grid grid-cols-2 gap-6">
              {[1,2].map(i => <div key={i} className="h-48 rounded-xl bg-white/[0.03] animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-6">
              <MiniCalendar title="Pessoal" color="blue" events={personalEvents} />
              <MiniCalendar title="Agência" color="emerald" events={agencyEvents} />
            </div>
          )}
        </section>

        {/* Tarefas por Espaço */}
        <section className="flex-1 flex flex-col">
          <h2 className="text-xs font-semibold tracking-widest uppercase text-white/40 mb-4">Minhas Demandas</h2>
          {loading ? (
            <div className="h-40 rounded-xl bg-white/[0.03] animate-pulse" />
          ) : spaces.length === 0 ? (
            <div className="p-8 rounded-xl border border-white/[0.04] bg-white/[0.02] text-center">
              <p className="text-xs text-white/30">Nenhuma tarefa encontrada</p>
            </div>
          ) : (
            <div className="flex-1 flex gap-6 pb-4">
              {spaces.map(space => (
                <TaskColumn key={space} spaceName={space} tasks={tasksBySpace[space]} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
