import { Redis } from '@upstash/redis'
import crypto from 'crypto'

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

const CLIENTS_KEY = 'diario_clients'
const RECORDS_KEY = 'diario_records'

export type Platform = 'Meta Ads' | 'Google Ads' | 'Ambos' | 'Outro'

export interface Campaign {
  id: string
  name: string
  platform: Platform
  objective?: string
}

export interface Client {
  id: string
  name: string
  platform: Platform
  metaLink?: string
  googleLink?: string
  site?: string
  instagram?: string
  verbaPlanLink?: string
  verbaMeta?: number
  verbaGoogle?: number
  isKoko: boolean
  campaigns: Campaign[]
  createdAt: number
}

export interface DiarioRecord {
  id: string
  clientId: string
  campaignId?: string
  date: string
  text: string
  createdAt: number
}

export async function getClients(): Promise<Client[]> {
  return (await redis.get<Client[]>(CLIENTS_KEY)) ?? []
}

async function saveClients(clients: Client[]): Promise<void> {
  await redis.set(CLIENTS_KEY, clients)
}

export async function createClient(data: Omit<Client, 'id' | 'createdAt' | 'campaigns'>): Promise<Client> {
  const clients = await getClients()
  const client: Client = { ...data, id: crypto.randomUUID(), campaigns: [], createdAt: Date.now() }
  await saveClients([...clients, client])
  return client
}

export async function updateClient(id: string, updates: Partial<Omit<Client, 'id' | 'createdAt'>>): Promise<Client | null> {
  const clients = await getClients()
  const idx = clients.findIndex(c => c.id === id)
  if (idx === -1) return null
  clients[idx] = { ...clients[idx], ...updates }
  await saveClients(clients)
  return clients[idx]
}

export async function deleteClient(id: string): Promise<void> {
  const clients = await getClients()
  await saveClients(clients.filter(c => c.id !== id))
  const records = await getRecords()
  await saveRecords(records.filter(r => r.clientId !== id))
}

export async function getRecords(): Promise<DiarioRecord[]> {
  return (await redis.get<DiarioRecord[]>(RECORDS_KEY)) ?? []
}

async function saveRecords(records: DiarioRecord[]): Promise<void> {
  await redis.set(RECORDS_KEY, records)
}

export async function createRecord(data: Omit<DiarioRecord, 'id' | 'createdAt'>): Promise<DiarioRecord> {
  const records = await getRecords()
  const record: DiarioRecord = { ...data, id: crypto.randomUUID(), createdAt: Date.now() }
  await saveRecords([...records, record])
  return record
}

export async function updateRecord(id: string, updates: Partial<Omit<DiarioRecord, 'id' | 'createdAt'>>): Promise<DiarioRecord | null> {
  const records = await getRecords()
  const idx = records.findIndex(r => r.id === id)
  if (idx === -1) return null
  records[idx] = { ...records[idx], ...updates }
  await saveRecords(records)
  return records[idx]
}

export async function deleteRecord(id: string): Promise<void> {
  const records = await getRecords()
  await saveRecords(records.filter(r => r.id !== id))
}
