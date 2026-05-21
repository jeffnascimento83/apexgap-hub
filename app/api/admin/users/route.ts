import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { getUsers, createUser } from '@/lib/users'
import { sendInviteEmail } from '@/lib/email'

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const users = (await getUsers()).map(({ passwordHash: _p, inviteToken: _t, ...u }) => u)
  return NextResponse.json(users)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { username, name, email, tabs, kokoOnly } = await req.json() as {
    username: string; name: string; email: string; tabs: string[]; kokoOnly: boolean
  }
  const user = await createUser({ username, name, email, tabs, role: 'user', kokoOnly: kokoOnly ?? false })
  await sendInviteEmail(email, name, user.inviteToken!)
  return NextResponse.json({ ok: true })
}
