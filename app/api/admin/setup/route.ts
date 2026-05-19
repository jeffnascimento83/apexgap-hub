import { NextRequest, NextResponse } from 'next/server'
import { getUsers, generateInviteToken } from '@/lib/users'
import { sendInviteEmail } from '@/lib/email'

// First-time setup: sends invite emails to all pending users.
// Protected by SETUP_KEY env var. Only works while no admin is active.
export async function POST(req: NextRequest) {
  const users = getUsers()
  const hasActiveAdmin = users.some(u => u.role === 'admin' && u.active)
  if (hasActiveAdmin) {
    return NextResponse.json({ error: 'Sistema já foi configurado' }, { status: 403 })
  }

  const key = req.headers.get('x-setup-key')
  if (!key || key !== process.env.SETUP_KEY) {
    return NextResponse.json({ error: 'Chave inválida' }, { status: 401 })
  }

  const pending = users.filter(u => !u.active)
  for (const user of pending) {
    const token = generateInviteToken(user.id)
    await sendInviteEmail(user.email, user.name, token)
  }

  return NextResponse.json({ ok: true, sent: pending.length })
}
