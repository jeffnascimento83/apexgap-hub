/**
 * Migration script: DailyWise → APEXGap Hub (Diário)
 *
 * Usage:
 *   KV_REST_API_URL=<url> KV_REST_API_TOKEN=<token> node scripts/migrate-from-dailywise.mjs
 *
 * CSV files expected in scripts/:
 *   clients.csv    — exported from DailyWise
 *   campaigns.csv  — exported from DailyWise
 *   records.csv    — exported from DailyWise
 *
 * Get KV_REST_API_URL and KV_REST_API_TOKEN from Vercel → Project → Settings → Environment Variables
 */

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import crypto from 'crypto'
const __dir = dirname(fileURLToPath(import.meta.url))

// ─── Hub API endpoint ─────────────────────────────────────────────────────────
// Uses the hub's own Redis connection — no local credentials needed.
// Requires HUB_SESSION cookie from a logged-in admin session.

const HUB_URL     = process.env.HUB_URL     || 'https://apexgap-hub-prod.vercel.app'
const HUB_COOKIE  = process.env.HUB_COOKIE

if (!HUB_COOKIE) {
  console.error('❌  Missing HUB_COOKIE env var.')
  console.error('    1. Login no hub como admin')
  console.error('    2. Abra DevTools → Application → Cookies → copie o valor de hub_session')
  console.error('    3. export HUB_COOKIE="valor_copiado"')
  process.exit(1)
}


// ─── CSV parser ───────────────────────────────────────────────────────────────

function parseCsv(filePath) {
  const raw = readFileSync(filePath, 'utf-8').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const lines = raw.split('\n').filter(l => l.trim())

  function parseLine(line) {
    const fields = []
    let cur = ''
    let inQuote = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (inQuote && line[i + 1] === '"') { cur += '"'; i++ }
        else inQuote = !inQuote
      } else if (ch === ';' && !inQuote) {
        fields.push(cur); cur = ''
      } else {
        cur += ch
      }
    }
    fields.push(cur)
    return fields
  }

  const headers = parseLine(lines[0]).map(h => h.trim())
  return lines.slice(1).map(line => {
    const values = parseLine(line)
    return Object.fromEntries(headers.map((h, i) => [h, (values[i] ?? '').trim()]))
  })
}

// ─── Platform mapping ─────────────────────────────────────────────────────────

function mapPlatform(raw) {
  const v = (raw ?? '').toLowerCase()
  if (v.includes('meta') && v.includes('google')) return 'Ambos'
  if (v.includes('meta')) return 'Meta Ads'
  if (v.includes('google')) return 'Google Ads'
  if (v === 'both') return 'Ambos'
  return 'Outro'
}

function parseNum(v) {
  if (!v) return undefined
  const n = parseFloat(String(v).replace(',', '.'))
  return isNaN(n) ? undefined : n
}

function ts(iso) {
  if (!iso) return Date.now()
  const d = new Date(iso)
  return isNaN(d.getTime()) ? Date.now() : d.getTime()
}

// ─── Load CSVs ────────────────────────────────────────────────────────────────

const clientsRaw   = parseCsv(join(__dir, 'clients.csv'))
const campaignsRaw = parseCsv(join(__dir, 'campaigns.csv'))
const recordsRaw   = parseCsv(join(__dir, 'records.csv'))

console.log(`Loaded: ${clientsRaw.length} clients, ${campaignsRaw.length} campaigns, ${recordsRaw.length} records`)

// ─── Build campaigns map (clientId → Campaign[]) ──────────────────────────────

const campaignsByClient = {}
const campaignIdMap = {}  // old DW id → new hub id

for (const c of campaignsRaw) {
  if (c.archived_at) continue  // skip archived

  const newId = crypto.randomUUID()
  campaignIdMap[c.id] = newId

  const campaign = {
    id: newId,
    name: c.name || 'Sem nome',
    platform: mapPlatform(c.platform),
    ...(c.objective ? { objective: c.objective } : {}),
  }

  if (!campaignsByClient[c.client_id]) campaignsByClient[c.client_id] = []
  campaignsByClient[c.client_id].push(campaign)
}

// ─── Build clients ────────────────────────────────────────────────────────────

const clientIdMap = {}  // old DW id → new hub id

const clients = clientsRaw.map(c => {
  const newId = crypto.randomUUID()
  clientIdMap[c.id] = newId

  const client = {
    id: newId,
    name: c.name || 'Sem nome',
    platform: mapPlatform(c.platform),
    isKoko: c.is_koko === 'true',
    campaigns: campaignsByClient[c.id] ?? [],
    createdAt: ts(c.created_at),
  }

  if (c.meta_ads_url)   client.metaLink      = c.meta_ads_url
  if (c.google_ads_url) client.googleLink     = c.google_ads_url
  if (c.site_url)       client.site          = c.site_url
  if (c.instagram_url)  client.instagram      = c.instagram_url
  if (c.budget_url)     client.verbaPlanLink  = c.budget_url

  const verbaMeta   = parseNum(c.verba_meta)   ?? parseNum(c.verba_mensal)
  const verbaGoogle = parseNum(c.verba_google)
  if (verbaMeta   !== undefined) client.verbaMeta   = verbaMeta
  if (verbaGoogle !== undefined) client.verbaGoogle = verbaGoogle

  return client
})

// ─── Build records ────────────────────────────────────────────────────────────

const records = recordsRaw.map(r => {
  const newClientId   = clientIdMap[r.client_id]
  const newCampaignId = r.campaign_id ? campaignIdMap[r.campaign_id] : undefined

  if (!newClientId) {
    console.warn(`  ⚠ Record ${r.id} skipped — client ${r.client_id} not found`)
    return null
  }

  const parts = [r.title, r.body].filter(Boolean)
  const text  = parts.join('\n\n') || '—'

  const record = {
    id: crypto.randomUUID(),
    clientId: newClientId,
    date: r.date || new Date(ts(r.created_at)).toISOString().slice(0, 10),
    text,
    createdAt: ts(r.created_at),
  }

  if (newCampaignId) record.campaignId = newCampaignId

  return record
}).filter(Boolean)

// ─── Write via Hub API ────────────────────────────────────────────────────────

const activeCampaigns = Object.values(campaignsByClient).flat().length
console.log(`Sending ${clients.length} clients, ${activeCampaigns} campaigns, ${records.length} records to hub…`)

const res = await fetch(`${HUB_URL}/api/admin/migrate`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Cookie': `hub_session=${HUB_COOKIE}`,
  },
  body: JSON.stringify({ clients, records }),
})
const data = await res.json()
if (!res.ok || data.error) throw new Error(data.error ?? `HTTP ${res.status}`)

console.log(`\n✅  Migration complete`)
console.log(`   Clients   : ${data.clients}`)
console.log(`   Campaigns : ${activeCampaigns} (archived skipped)`)
console.log(`   Records   : ${data.records}`)
