import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import type { Db } from './db.js'

export const permissionModules = [
  'dashboard', 'leads', 'projects', 'projectAccounts', 'employees', 'payroll', 'loans', 'assets', 'vendors', 'workOrders',
  'projectExpenses', 'officeExpenses', 'estimates', 'invoices', 'profitLoss',
] as const

export type PermissionModule = typeof permissionModules[number]
export type ModulePermission = { view: boolean; edit: boolean }
export type Permissions = Partial<Record<PermissionModule, ModulePermission>>
export type AuthUser = { id: number; name: string; email: string; role: 'admin' | 'user'; permissions: Permissions }
type UserRow = { id: number; name: string; email: string; role: 'admin' | 'user'; active: number; permissions: string }

export const allPermissions = (): Permissions => Object.fromEntries(permissionModules.map((module) => [module, { view: true, edit: true }]))

export function normalizePermissions(value: unknown): Permissions {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const input = value as Record<string, unknown>
  const result: Permissions = {}
  for (const module of permissionModules) {
    const permission = input[module]
    if (!permission || typeof permission !== 'object' || Array.isArray(permission)) continue
    const entry = permission as Record<string, unknown>
    const view = entry.view === true
    const edit = view && entry.edit === true
    if (view || edit) result[module] = { view, edit }
  }
  return result
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, expectedHex] = stored.split(':')
  if (!salt || !expectedHex || !/^[a-f\d]{128}$/i.test(expectedHex)) return false
  const expected = Buffer.from(expectedHex, 'hex')
  const actual = scryptSync(password, salt, expected.length)
  return timingSafeEqual(actual, expected)
}

export function createSession(db: Db, userId: number): string {
  const token = randomBytes(32).toString('base64url')
  const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString()
  db.prepare('INSERT INTO user_sessions (token_hash,user_id,expires_at) VALUES (?,?,?)').run(hashToken(token), userId, expiresAt)
  return token
}

export function getSessionUser(db: Db, token: string): AuthUser | undefined {
  const row = db.prepare(`SELECT u.id,u.name,u.email,u.role,u.active,u.permissions,s.expires_at
    FROM user_sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=?`).get(hashToken(token)) as (UserRow & { expires_at: string }) | undefined
  if (!row || !row.active || Date.parse(row.expires_at) <= Date.now()) {
    if (row) db.prepare('DELETE FROM user_sessions WHERE token_hash=?').run(hashToken(token))
    return undefined
  }
  return toAuthUser(row)
}

export function toAuthUser(row: UserRow): AuthUser {
  return { id: row.id, name: row.name, email: row.email, role: row.role, permissions: row.role === 'admin' ? allPermissions() : parsePermissions(row.permissions) }
}

export function tokenHash(token: string): string { return hashToken(token) }

function hashToken(token: string): string { return createHash('sha256').update(token).digest('hex') }
function parsePermissions(value: string): Permissions {
  try { return normalizePermissions(JSON.parse(value)) } catch { return {} }
}