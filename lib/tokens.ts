import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

export interface AccountTokens {
  access_token: string
  refresh_token?: string
  expiry_date?: number
  token_type?: string
  scope?: string
}

export interface Tokens {
  personal?: AccountTokens
  agency?: AccountTokens
}

export async function getTokens(): Promise<Tokens> {
  const tokens = await redis.get<Tokens>('oauth_tokens')
  return tokens ?? {}
}

export async function saveTokens(tokens: Tokens): Promise<void> {
  await redis.set('oauth_tokens', tokens)
}
