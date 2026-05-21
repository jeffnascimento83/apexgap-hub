import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { getClients, createClient } from '@/lib/diario'
import type { Platform } from '@/lib/diario'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const clients = await getClients()
  const filtered = session.kokoOnly ? clients.filter(c => c.isKoko) : clients
  return NextResponse.json(filtered)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as {
    name: string; platform: Platform; isKoko: boolean
    metaLink?: string; googleLink?: string; site?: string; instagram?: string
    verbaPlanLink?: string; verbaMeta?: number; verbaGoogle?: number
  }

  const client = await createClient(body)
  return NextResponse.json(client)
}
