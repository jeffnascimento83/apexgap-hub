import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getUserByUsername } from '@/lib/users'
import { createSessionToken, SESSION_COOKIE } from '@/lib/session'

export async function POST(req: NextRequest) {
  const { username, password } = await req.json() as { username: string; password: string }

  const user = await getUserByUsername(username)
  if (!user || !user.active || !user.passwordHash) {
    return NextResponse.json({ error: 'Usuário ou senha inválidos' }, { status: 401 })
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    return NextResponse.json({ error: 'Usuário ou senha inválidos' }, { status: 401 })
  }

  const token = await createSessionToken({
    userId: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    tabs: user.tabs,
  })

  const res = NextResponse.json({ ok: true })
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60,
  })
  return res
}
