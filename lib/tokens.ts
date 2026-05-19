import fs from 'fs'
import path from 'path'

const TOKENS_FILE = path.join(process.cwd(), '.tokens.json')

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

export function getTokens(): Tokens {
  try {
    if (!fs.existsSync(TOKENS_FILE)) return {}
    return JSON.parse(fs.readFileSync(TOKENS_FILE, 'utf-8'))
  } catch {
    return {}
  }
}

export function saveTokens(tokens: Tokens) {
  fs.writeFileSync(TOKENS_FILE, JSON.stringify(tokens, null, 2))
}
