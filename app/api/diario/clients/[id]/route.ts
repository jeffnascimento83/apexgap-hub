import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { getClients, updateClient, deleteClient } from '@/lib/diario'
import type { Platform, Campaign } from '@/lib/diario'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const clients = await getClients()
  const client = clients.find(c => c.id === id)
  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(client)
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const body = await req.json() as Partial<{
    name: string; platform: Platform; isKoko: boolean; campaigns: Campaign[]
    metaLink: string; googleLink: string; site: string; instagram: string
    verbaPlanLink: string; verbaMeta: number; verbaGoogle: number
  }>
  const updated = await updateClient(id, body)
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(updated)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  await deleteClient(id)
  return NextResponse.json({ ok: true })
}
