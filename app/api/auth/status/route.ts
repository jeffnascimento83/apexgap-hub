import { NextResponse } from 'next/server'
import { getTokens } from '@/lib/tokens'

export async function GET() {
  const tokens = getTokens()
  return NextResponse.json({
    personal: !!tokens.personal?.refresh_token,
    agency: !!tokens.agency?.refresh_token,
  })
}