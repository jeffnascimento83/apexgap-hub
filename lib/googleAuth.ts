import { google } from 'googleapis'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
const REDIRECT_URI = `${BASE_URL}/api/auth/callback`
const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly']

export function createOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    REDIRECT_URI
  )
}

export function getAuthUrl(account: 'personal' | 'agency') {
  const client = createOAuthClient()
  const email = account === 'personal'
    ? process.env.PERSONAL_EMAIL
    : process.env.AGENCY_EMAIL

  return client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    login_hint: email,
    state: account,
    prompt: 'consent',
  })
}
