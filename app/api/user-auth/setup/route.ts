import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getUserByInviteToken, updateUser } from '@/lib/users'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') ?? ''
  const user = await getUserByInviteToken(token)
  if (!user || !user.inviteExpiry || new Date(user.inviteExpiry) < new Date()) {
    return NextResponse.json({ valid: false })
  }
  return NextResponse.json({ valid: true, name: user.name })
}

export async function POST(req: NextRequest) {
  const { token, password } = await req.json() as { token: string; password: string }
  const user = await getUserByInviteToken(token)
  if (!user || !user.inviteExpiry || new Date(user.inviteExpiry) < new Date()) {
    return NextResponse.json({ error: 'Link inválido ou expirado' }, { status: 400 })
  }
  const hash = await bcrypt.hash(password, 10)
  await updateUser(user.id, { passwordHash: hash, active: true, inviteToken: null, inviteExpiry: null })
  return NextResponse.json({ ok: true })
}
