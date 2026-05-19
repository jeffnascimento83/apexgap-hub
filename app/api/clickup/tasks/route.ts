import { NextResponse } from 'next/server'

const BASE = 'https://api.clickup.com/api/v2'

let cachedUserId: number | null = null
let cachedTeamId: string | null = null
let cachedSpaces: Record<string, string> = {}

async function getIds(token: string) {
  if (cachedUserId && cachedTeamId) return { userId: cachedUserId, teamId: cachedTeamId }
  const [userRes, teamRes] = await Promise.all([
    fetch(`${BASE}/user`, { headers: { Authorization: token } }).then(r => r.json()),
    fetch(`${BASE}/team`, { headers: { Authorization: token } }).then(r => r.json()),
  ])
  cachedUserId = userRes.user.id
  cachedTeamId = teamRes.teams[0]?.id
  return { userId: cachedUserId, teamId: cachedTeamId }
}

async function getSpaces(token: string, teamId: string): Promise<Record<string, string>> {
  if (Object.keys(cachedSpaces).length > 0) return cachedSpaces
  const res = await fetch(`${BASE}/team/${teamId}/space?archived=false`, {
    headers: { Authorization: token },
  }).then(r => r.json())
  cachedSpaces = Object.fromEntries((res.spaces ?? []).map((s: any) => [s.id, s.name]))
  return cachedSpaces
}

export async function GET() {
  const token = process.env.CLICKUP_API_TOKEN
  if (!token) return NextResponse.json({ error: 'CLICKUP_API_TOKEN not set' }, { status: 500 })
  try {
    const { userId, teamId } = await getIds(token)
    if (!teamId) return NextResponse.json([])
    const [tasksRes, spaces] = await Promise.all([
      fetch(`${BASE}/team/${teamId}/task?assignees[]=${userId}&include_closed=false&subtasks=true&order_by=due_date`, {
        headers: { Authorization: token },
      }).then(r => r.json()),
      getSpaces(token, teamId),
    ])
    const tasks = (tasksRes.tasks ?? []).map((task: any) => ({
      ...task,
      space_name: spaces[task.space?.id] ?? null,
    }))
    return NextResponse.json(tasks)
  } catch (error: any) {
    console.error('[clickup] error:', error.message)
    return NextResponse.json({ error: 'Erro ao buscar tarefas' }, { status: 500 })
  }
}