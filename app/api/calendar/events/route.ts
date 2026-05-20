import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import { createOAuthClient } from '@/lib/googleAuth'
import { getTokens, saveTokens, type AccountTokens } from '@/lib/tokens'

export const revalidate = 300 // cache 5 min

async function getCalendarClient(account: 'personal' | 'agency') {
  const tokens = await getTokens()
  const accountTokens = tokens[account]
  if (!accountTokens) return null
  const client = createOAuthClient()
  client.setCredentials(accountTokens)
  client.on('tokens', async (newTokens) => {
    const current = await getTokens()
    await saveTokens({ ...current, [account]: { ...accountTokens, ...newTokens } as AccountTokens })
  })
  return google.calendar({ version: 'v3', auth: client })
}

export async function GET() {
  const now = new Date()
  const future = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000)
  const allEvents: object[] = []

  for (const account of ['personal', 'agency'] as const) {
    const cal = await getCalendarClient(account)
    if (!cal) continue
    try {
      const calList = await cal.calendarList.list()
      const calendars = (calList.data.items || []).filter(c =>
        c.id &&
        !c.id.includes('holiday') &&
        !c.id.includes('addressbook') &&
        !c.id.includes('contacts') &&
        c.summary?.toLowerCase() !== 'tarefas' &&
        c.summary?.toLowerCase() !== 'tasks' &&
        c.summary?.toLowerCase() !== 'reminders' &&
        c.summary?.toLowerCase() !== 'lembretes'
      )

      const seen = new Set<string>()

      for (const calendar of calendars) {
        if (!calendar.id) continue
        try {
          const res = await cal.events.list({
            calendarId: calendar.id,
            timeMin: now.toISOString(),
            timeMax: future.toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
            maxResults: 100,
          })
          for (const e of res.data.items ?? []) {
            if (!e.id || seen.has(e.id)) continue
            if (!e.summary) continue
            if (account === 'agency') {
              const isOrganizer = e.organizer?.email === 'jeff@koko.ag'
              const isAttendee = e.attendees?.some((a: any) => a.email === 'jeff@koko.ag')
              const isCreator = e.creator?.email === 'jeff@koko.ag'
              if (!isOrganizer && !isAttendee && !isCreator) continue
            }
            seen.add(e.id)
            allEvents.push({ ...e, _source: account, _calendar: calendar.summary })
          }
        } catch {}
      }
    } catch (e) {
      console.error(`[calendar] ${account} error:`, e)
    }
  }

  const dedupeKey = new Set<string>()
  const dedupedEvents = allEvents.filter((e: any) => {
    const key = `${e.summary?.toLowerCase()}-${e.start?.dateTime || e.start?.date}`
    if (dedupeKey.has(key)) return false
    dedupeKey.add(key)
    return true
  })
  allEvents.length = 0
  allEvents.push(...dedupedEvents)

  allEvents.sort((a: any, b: any) => {
    const aTime = (a as any).start?.dateTime ?? (a as any).start?.date ?? ''
    const bTime = (b as any).start?.dateTime ?? (b as any).start?.date ?? ''
    return aTime.localeCompare(bTime)
  })

  return NextResponse.json(allEvents)
}
