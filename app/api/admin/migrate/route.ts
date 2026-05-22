import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { clients, records } = await req.json() as { clients: unknown[]; records: unknown[] }

  if (!Array.isArray(clients) || !Array.isArray(records)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  await redis.set('diario_clients', clients)
  await redis.set('diario_records', records)

  return NextResponse.json({ ok: true, clients: clients.length, records: records.length })
}
