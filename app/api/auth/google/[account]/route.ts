import { NextRequest, NextResponse } from 'next/server'
import { getAuthUrl } from '@/lib/googleAuth'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ account: string }> }
) {
  const { account } = await params
  if (account !== 'personal' && account !== 'agency') {
    return NextResponse.json({ error: 'Invalid account' }, { status: 400 })
  }
  return NextResponse.redirect(getAuthUrl(account as 'personal' | 'agency'))
}