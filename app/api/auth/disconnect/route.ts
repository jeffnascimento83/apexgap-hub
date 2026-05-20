import { NextRequest, NextResponse } from 'next/server'
import { getTokens, saveTokens } from '@/lib/tokens'
import { getSession } from '@/lib/session'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.redirect(`${BASE_URL}/login`)

  const account = new URL(req.url).searchParams.get('account') as 'personal' | 'agency' | null
  if (!account) return NextResponse.json({ error: 'account param required' }, { status: 400 })

  const existing = await getTokens()
  const updated = { ...existing }
  delete updated[account]
  await saveTokens(updated)

  return NextResponse.redirect(`${BASE_URL}`)
}
