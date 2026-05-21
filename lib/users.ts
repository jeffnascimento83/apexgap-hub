import { Redis } from '@upstash/redis'
import crypto from 'crypto'

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

const KEY = 'users'

export type UserRole = 'admin' | 'user'

export type User = {
  id: string
  username: string
  name: string
  email: string
  passwordHash: string | null
  role: UserRole
  tabs: string[]
  kokoOnly: boolean
  active: boolean
  inviteToken: string | null
  inviteExpiry: string | null
}

const SEED: User[] = [
  {
    id: '1',
    username: 'jefferson',
    name: 'Jefferson',
    email: 'jeffnascimento@gmail.com',
    passwordHash: '$2b$10$55ffVhUA25M0nVZ//Ox8xe1M4tzIZzKJZAzaxaz2c7OT9cBPUD5hS',
    role: 'admin',
    tabs: ['hub', 'diario', 'propostas', 'dashboard'],
    kokoOnly: false,
    active: true,
    inviteToken: null,
    inviteExpiry: null,
  },
  {
    id: '2',
    username: 'erika',
    name: 'Erika',
    email: 'erika.cecilia.rodriguez@gmail.com',
    passwordHash: null,
    role: 'user',
    tabs: ['diario', 'dashboard'],
    kokoOnly: false,
    active: false,
    inviteToken: null,
    inviteExpiry: null,
  },
]

async function read(): Promise<User[]> {
  const users = await redis.get<User[]>(KEY)
  if (!users) {
    await redis.set(KEY, SEED)
    return SEED
  }
  return users
}

async function write(users: User[]): Promise<void> {
  await redis.set(KEY, users)
}

export async function getUsers(): Promise<User[]> {
  return read()
}

export async function getUserById(id: string): Promise<User | null> {
  const users = await read()
  return users.find(u => u.id === id) ?? null
}

export async function getUserByUsername(username: string): Promise<User | null> {
  const users = await read()
  return users.find(u => u.username === username) ?? null
}

export async function getUserByInviteToken(token: string): Promise<User | null> {
  const users = await read()
  return users.find(u => u.inviteToken === token) ?? null
}

export async function createUser(data: Pick<User, 'username' | 'name' | 'email' | 'tabs' | 'role' | 'kokoOnly'>): Promise<User> {
  const users = await read()
  const token = crypto.randomBytes(32).toString('hex')
  const user: User = {
    id: crypto.randomUUID(),
    ...data,
    passwordHash: null,
    active: false,
    inviteToken: token,
    inviteExpiry: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
  }
  await write([...users, user])
  return user
}

export async function updateUser(id: string, updates: Partial<User>): Promise<User> {
  const users = await read()
  const idx = users.findIndex(u => u.id === id)
  if (idx === -1) throw new Error('User not found')
  users[idx] = { ...users[idx], ...updates }
  await write(users)
  return users[idx]
}

export async function deleteUser(id: string): Promise<void> {
  const users = await read()
  await write(users.filter(u => u.id !== id))
}

export async function generateInviteToken(id: string): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex')
  await updateUser(id, {
    inviteToken: token,
    inviteExpiry: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
  })
  return token
}
