import { NextRequest, NextResponse } from 'next/server'
import { createOAuthClient } from '@/lib/googleAuth'
import { getTokens, saveTokens } from '@/lib/tokens'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) return NextResponse.redirect(`${BASE_URL}?error=${error}`)

  const account = state as 'personal' | 'agency'
  const client = createOAuthClient()
  const { tokens } = await client.getToken(code!)
  const existing = getTokens()
  saveTokens({ ...existing, [account]: tokens })

  return NextResponse.redirect(`${BASE_URL}?connected=${account}`)
}