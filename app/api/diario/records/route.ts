import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { getRecords, createRecord } from '@/lib/diario'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const clientId = searchParams.get('clientId')
  const records = await getRecords()
  const filtered = clientId ? records.filter(r => r.clientId === clientId) : records
  return NextResponse.json(filtered.sort((a, b) => b.createdAt - a.createdAt))
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json() as { clientId: string; campaignId?: string; date: string; text: string }
  const record = await createRecord(body)
  return NextResponse.json(record)
}
