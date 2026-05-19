import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { deleteUser, generateInviteToken, getUserById } from '@/lib/users'
import { sendInviteEmail } from '@/lib/email'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await params
  if (id === session.userId) {
    return NextResponse.json({ error: 'Não é possível deletar sua própria conta' }, { status: 400 })
  }
  deleteUser(id)
  return NextResponse.json({ ok: true })
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await params
  const user = getUserById(id)
  if (!user) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  const token = generateInviteToken(id)
  await sendInviteEmail(user.email, user.name, token)
  return NextResponse.json({ ok: true })
}
