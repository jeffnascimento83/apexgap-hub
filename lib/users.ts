import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

export type UserRole = 'admin' | 'user'

export type User = {
  id: string
  username: string
  name: string
  email: string
  passwordHash: string | null
  role: UserRole
  tabs: string[]
  active: boolean
  inviteToken: string | null
  inviteExpiry: string | null
}

const DATA_PATH = path.join(process.cwd(), 'data', 'users.json')

function read(): User[] {
  if (!fs.existsSync(DATA_PATH)) return []
  return JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8')).users as User[]
}

function write(users: User[]) {
  fs.writeFileSync(DATA_PATH, JSON.stringify({ users }, null, 2))
}

export function getUsers() { return read() }

export function getUserById(id: string) {
  return read().find(u => u.id === id) ?? null
}

export function getUserByUsername(username: string) {
  return read().find(u => u.username === username) ?? null
}

export function getUserByInviteToken(token: string) {
  return read().find(u => u.inviteToken === token) ?? null
}

export function createUser(data: Pick<User, 'username' | 'name' | 'email' | 'tabs' | 'role'>): User {
  const users = read()
  const token = crypto.randomBytes(32).toString('hex')
  const user: User = {
    id: crypto.randomUUID(),
    ...data,
    passwordHash: null,
    active: false,
    inviteToken: token,
    inviteExpiry: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
  }
  write([...users, user])
  return user
}

export function updateUser(id: string, updates: Partial<User>) {
  const users = read()
  const idx = users.findIndex(u => u.id === id)
  if (idx === -1) throw new Error('User not found')
  users[idx] = { ...users[idx], ...updates }
  write(users)
  return users[idx]
}

export function deleteUser(id: string) {
  write(read().filter(u => u.id !== id))
}

export function generateInviteToken(id: string): string {
  const token = crypto.randomBytes(32).toString('hex')
  updateUser(id, {
    inviteToken: token,
    inviteExpiry: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
  })
  return token
}
