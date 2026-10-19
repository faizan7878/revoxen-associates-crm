import { useEffect, useState, type FormEvent } from 'react'
import {
  Activity, ArrowRight, CheckCircle2, ChevronRight, Clock,
  Eye, EyeOff, KeyRound, Laptop, LockKeyhole, Monitor, Plus,
  RefreshCw, Save, ShieldCheck, Smartphone, Sparkles, UserCheck,
  UserRoundPlus, Users, X,
} from 'lucide-react'

type ModuleId = 'dashboard' | 'leads' | 'projects' | 'projectAccounts' | 'employees' | 'payroll' | 'loans' | 'assets' | 'vendors' | 'workOrders' | 'projectExpenses' | 'officeExpenses' | 'estimates' | 'invoices' | 'profitLoss'
type Access = { view: boolean; edit: boolean }
type Permissions = Partial<Record<ModuleId, Access>>

type User = {
  id: number
  name: string
  email: string
  phone?: string
  recovery_email?: string
  role: 'admin' | 'user'
  active: number
  permissions: Permissions
  created_at?: string
  last_active_at?: string
  lastDevice?: string
  totalDuration?: number
  activityCount?: number
  isOnline?: boolean
}

type ActivityItem = {
  id: number
  action: string
  module: string
  description: string
  device?: string
  ip_address?: string
  created_at: string
}

type SessionItem = {
  login_time: string
  last_active_at?: string
  device?: string
  ip_address?: string
  duration_seconds?: number
}

type UserActivityResponse = {
  user: User
  isOnline: boolean
  currentDevice: string
  lastSeen: string
  totalDurationSeconds: number
  sessions: SessionItem[]
  activities: ActivityItem[]
  moduleCounts: { module: string; count: number }[]
}

const modules: { id: ModuleId; label: string }[] = [
  { id: 'dashboard', label: 'Lead Source Tracking' },
  { id: 'leads', label: 'Leads & Pipeline' },
  { id: 'projects', label: 'Projects' },
  { id: 'projectAccounts', label: 'Project accounts' },
  { id: 'employees', label: 'Employees' },
  { id: 'payroll', label: 'Payroll' },
  { id: 'loans', label: 'Employee loans' },
  { id: 'assets', label: 'Company assets' },
  { id: 'vendors', label: 'Vendors' },
  { id: 'workOrders', label: 'Sublet work orders' },
  { id: 'projectExpenses', label: 'Project expenses' },
  { id: 'officeExpenses', label: 'Office & general' },
  { id: 'estimates', label: 'Estimates' },
  { id: 'invoices', label: 'Invoices' },
  { id: 'profitLoss', label: 'Profit & loss' },
]

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...init?.headers } })
  const result = await response.json().catch(() => ({})) as { error?: string } & T
  if (!response.ok) throw new Error(result.error || `Request failed (${response.status})`)
  return result
}

const emptyPermissions = (): Permissions => Object.fromEntries(modules.map(({ id }) => [id, { view: false, edit: false }]))
const allUserPermissions = (): Permissions => Object.fromEntries(modules.map(({ id }) => [id, { view: true, edit: true }]))

function formatDuration(seconds?: number): string {
  if (!seconds || seconds <= 0) return '0m'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes > 0) return `${minutes}m`
  return `${Math.floor(seconds)}s`
}

function formatRelativeTime(dateString?: string): string {
  if (!dateString) return 'Never'
  const ms = Date.now() - Date.parse(dateString)
  if (isNaN(ms)) return dateString
  const mins = Math.floor(ms / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function getDeviceIcon(deviceStr?: string) {
  const lower = (deviceStr || '').toLowerCase()
  if (lower.includes('iphone') || lower.includes('android') || lower.includes('mobile')) {
    return <Smartphone size={13} className="ops-device-icon mobile" />
  }
  if (lower.includes('mac') || lower.includes('laptop')) {
    return <Laptop size={13} className="ops-device-icon laptop" />
  }
  return <Monitor size={13} className="ops-device-icon pc" />
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<number | null>(null)

  // Create user form state
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newRecoveryEmail, setNewRecoveryEmail] = useState('')
  const [newRole, setNewRole] = useState<'user' | 'admin'>('user')
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [permissions, setPermissions] = useState<Permissions>(emptyPermissions)

  // Reset password modal state
  const [passwordTarget, setPasswordTarget] = useState<number | null>(null)
  const [resetPassword, setResetPassword] = useState('')
  const [showResetPassword, setShowResetPassword] = useState(false)

  // Activity Drawer / Modal state
  const [activityUserId, setActivityUserId] = useState<number | null>(null)
  const [activityData, setActivityData] = useState<UserActivityResponse | null>(null)
  const [activityLoading, setActivityLoading] = useState(false)
  const [activityModuleFilter, setActivityModuleFilter] = useState<string>('All')

  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const loadUsers = async () => setUsers(await api<User[]>('/users'))

  useEffect(() => {
    const task = window.setTimeout(() => {
      void loadUsers().catch((problem) => setError(problem instanceof Error ? problem.message : 'Could not load user accounts.'))
    }, 0)
    return () => window.clearTimeout(task)
  }, [])

  // Poll users list every 30 seconds to keep online badges & active durations fresh
  useEffect(() => {
    const timer = window.setInterval(() => {
      void loadUsers().catch(() => {})
    }, 30000)
    return () => window.clearInterval(timer)
  }, [])

  const openCreate = () => {
    setNewName('')
    setNewEmail('')
    setNewPhone('')
    setNewRecoveryEmail('')
    setNewRole('user')
    setNewPassword('')
    setShowPassword(false)
    setPermissions(emptyPermissions())
    setEditing(null)
    setCreateOpen(true)
    setError('')
  }

  const changePermission = (module: ModuleId, field: keyof Access, checked: boolean) => setPermissions((current) => {
    const existing = current[module] ?? { view: false, edit: false }
    if (field === 'view') return { ...current, [module]: { view: checked, edit: checked && existing.edit } }
    return { ...current, [module]: { view: checked || existing.view, edit: checked } }
  })

  const selectAllPermissions = () => setPermissions(allUserPermissions())
  const clearAllPermissions = () => setPermissions(emptyPermissions())

  const createUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api('/users', {
        method: 'POST',
        body: JSON.stringify({
          name: newName.trim(),
          email: newEmail.trim().toLowerCase(),
          phone: newPhone.trim(),
          recovery_email: newRecoveryEmail.trim().toLowerCase(),
          role: newRole,
          password: newPassword,
          permissions: newRole === 'admin' ? allUserPermissions() : permissions,
        }),
      })
      setCreateOpen(false)
      await loadUsers()
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : 'Could not create account.')
    } finally {
      setSaving(false)
    }
  }

  const savePermissions = async (id: number) => {
    setSaving(true)
    setError('')
    try {
      await api(`/users/${id}`, { method: 'PATCH', body: JSON.stringify({ permissions }) })
      setEditing(null)
      await loadUsers()
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : 'Could not save permissions.')
    } finally {
      setSaving(false)
    }
  }

  const toggleAccount = async (user: User) => {
    setError('')
    try {
      await api(`/users/${user.id}`, { method: 'PATCH', body: JSON.stringify({ active: !user.active }) })
      await loadUsers()
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : 'Could not update account.')
    }
  }

  const savePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (passwordTarget === null) return
    setSaving(true)
    setError('')
    try {
      await api(`/users/${passwordTarget}/password`, { method: 'POST', body: JSON.stringify({ password: resetPassword }) })
      setPasswordTarget(null)
      setResetPassword('')
      await loadUsers()
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : 'Could not reset password.')
    } finally {
      setSaving(false)
    }
  }

  const startEditing = (user: User) => {
    setPermissions(Object.fromEntries(modules.map(({ id }) => [id, user.permissions[id] ?? { view: false, edit: false }])))
    setEditing(user.id)
    setCreateOpen(false)
    setError('')
  }

  const openUserActivity = async (userId: number) => {
    setActivityUserId(userId)
    setActivityLoading(true)
    setActivityModuleFilter('All')
    try {
      const data = await api<UserActivityResponse>(`/users/${userId}/activity`)
      setActivityData(data)
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : 'Could not fetch user activity.')
    } finally {
      setActivityLoading(false)
    }
  }

  const refreshActivity = async () => {
    if (!activityUserId) return
    setActivityLoading(true)
    try {
      const data = await api<UserActivityResponse>(`/users/${activityUserId}/activity`)
      setActivityData(data)
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : 'Could not refresh activity.')
    } finally {
      setActivityLoading(false)
    }
  }

  const permissionCount = (user: User) => modules.filter(({ id }) => user.permissions[id]?.view).length

  // Filtered activity items based on chosen module pill
  const filteredActivities = (activityData?.activities || []).filter((item) => {
    if (activityModuleFilter === 'All') return true
    return item.module.toLowerCase() === activityModuleFilter.toLowerCase()
  })

  return <>
    <section className="ops-panel ops-table-panel">
      <div className="ops-panel-head">
        <div>
          <span className="ops-section-label">TEAM ACCOUNTS & WORK MONITORING</span>
          <h2>{users.length} {users.length === 1 ? 'account' : 'accounts'}</h2>
          <p className="ops-panel-subtitle">
            Admin can add users with mobile, laptop, or PC access and track login time and working activity. Click any user to inspect their live working log.
          </p>
        </div>
        <button className="ops-red-button" onClick={openCreate}>
          <UserRoundPlus size={15} />Add team user
        </button>
      </div>

      {error && (
        <div className="ops-error">
          <span><X size={14} />{error}</span>
          <button onClick={() => setError('')} aria-label="Dismiss error"><X size={14} /></button>
        </div>
      )}

      <div className="ops-table-wrap">
        <table className="ops-table ops-user-table">
          <thead>
            <tr>
              <th>USER & CONTACT</th>
              <th>STATUS & DEVICE</th>
              <th>PANEL TIME</th>
              <th>ACTIONS DONE</th>
              <th>ROLE & ACCESS</th>
              <th>ACCOUNT</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const isOnline = Boolean(user.isOnline)
              return (
                <tr
                  key={user.id}
                  className="ops-user-row"
                  onClick={(e) => {
                    // Do not trigger modal if clicked on action button
                    if ((e.target as HTMLElement).closest('button')) return
                    void openUserActivity(user.id)
                  }}
                  title="Click to view full work logs and login history"
                >
                  <td>
                    <div className="ops-user-primary-cell">
                      <div className={`ops-user-avatar ${isOnline ? 'online' : ''}`}>
                        {user.name.slice(0, 2).toUpperCase()}
                        <span className={`ops-online-dot ${isOnline ? 'live' : 'offline'}`} />
                      </div>
                      <div>
                        <strong>{user.name}</strong>
                        <small className="ops-cell-subtext">{user.email}</small>
                        {user.phone && <small className="ops-phone-pill">{user.phone}</small>}
                      </div>
                    </div>
                  </td>

                  <td>
                    <div className="ops-presence-pill">
                      {isOnline ? (
                        <span className="ops-badge-online">
                          <span className="ops-pulse-ring" />
                          Online
                        </span>
                      ) : (
                        <span className="ops-badge-offline">
                          {formatRelativeTime(user.last_active_at)}
                        </span>
                      )}
                      <span className="ops-device-tag">
                        {getDeviceIcon(user.lastDevice)}
                        <span>{user.lastDevice || 'Offline'}</span>
                      </span>
                    </div>
                  </td>

                  <td>
                    <div className="ops-duration-badge" title="Total active time logged in this panel">
                      <Clock size={13} />
                      <strong>{formatDuration(user.totalDuration)}</strong>
                    </div>
                  </td>

                  <td>
                    <button
                      type="button"
                      className="ops-action-count-pill"
                      onClick={() => void openUserActivity(user.id)}
                      title="Click to inspect what they worked on"
                    >
                      <Activity size={12} />
                      <span>{user.activityCount || 0} events</span>
                    </button>
                  </td>

                  <td>
                    <div className="ops-role-cell">
                      {user.role === 'admin' ? (
                        <span className="ops-user-role admin"><ShieldCheck size={12} />Admin</span>
                      ) : (
                        <span className="ops-user-role staff"><Users size={12} />Staff</span>
                      )}
                      <small className="ops-cell-subtext">
                        {user.role === 'admin' ? 'All 15 modules' : `${permissionCount(user)} of ${modules.length} modules`}
                      </small>
                    </div>
                  </td>

                  <td>
                    <span className={`ops-status ${user.active ? 'ops-status-active' : 'ops-status-void'}`}>
                      <i />{user.active ? 'Active' : 'Disabled'}
                    </span>
                  </td>

                  <td>
                    <div className="ops-user-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="ops-row-action ops-view-work-btn"
                        onClick={() => void openUserActivity(user.id)}
                        title="View work details & timeline"
                      >
                        <Eye size={13} />
                        <span>Working log</span>
                      </button>

                      {user.role !== 'admin' && (
                        <>
                          <button className="ops-row-action" onClick={() => startEditing(user)}>
                            Permissions
                          </button>
                          <button
                            className="ops-row-action"
                            onClick={() => {
                              setPasswordTarget(user.id)
                              setResetPassword('')
                              setShowResetPassword(false)
                              setError('')
                            }}
                          >
                            Password
                          </button>
                          <button className="ops-row-action" onClick={() => void toggleAccount(user)}>
                            {user.active ? 'Disable' : 'Enable'}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {users.length === 0 && (
        <div className="ops-user-empty">
          <LockKeyhole size={19} />
          <span>Loading accounts…</span>
        </div>
      )}
    </section>

    {/* --- ADD USER / EDIT PERMISSIONS PANEL --- */}
    {(createOpen || editing !== null) && (
      <section className="ops-panel ops-user-editor">
        <div className="ops-panel-head">
          <div>
            <span className="ops-section-label">{createOpen ? 'NEW USER ACCOUNT' : 'MODULE PERMISSIONS'}</span>
            <h2>{createOpen ? 'Create user & assign device access' : `Access for ${users.find((u) => u.id === editing)?.name ?? 'team member'}`}</h2>
            <p className="ops-panel-subtitle">
              {createOpen
                ? 'User can easily sign in from mobile, laptop, or PC using email or phone.'
                : 'Select exactly which CRM modules this team member can view or edit.'}
            </p>
          </div>
          <button className="ops-icon-button" onClick={() => { setCreateOpen(false); setEditing(null) }} aria-label="Close permissions editor">
            <X size={16} />
          </button>
        </div>

        <form className="ops-user-form" onSubmit={createOpen ? createUser : (event) => { event.preventDefault(); if (editing !== null) void savePermissions(editing) }}>
          {createOpen && (
            <div className="ops-user-identity-grid">
              <label className="ops-field">
                <span>Full name <i>*</i></span>
                <input
                  value={newName}
                  onChange={(event) => setNewName(event.target.value)}
                  placeholder="e.g. Sarah Khan"
                  required
                />
              </label>

              <label className="ops-field">
                <span>Work email <i>*</i></span>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(event) => setNewEmail(event.target.value)}
                  placeholder="sarah@company.com"
                  required
                />
                <small>Can be used for login on any device.</small>
              </label>

              <label className="ops-field">
                <span>Phone number (optional)</span>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(event) => setNewPhone(event.target.value)}
                  placeholder="03001234567 or +92 300 1234567"
                />
                <small>User can also log in directly using this phone number.</small>
              </label>

              <label className="ops-field">
                <span>Recovery email (optional)</span>
                <input
                  type="email"
                  value={newRecoveryEmail}
                  onChange={(event) => setNewRecoveryEmail(event.target.value)}
                  placeholder="personal@gmail.com"
                />
                <small>Useful for password resets.</small>
              </label>

              <label className="ops-field">
                <span>Account Role</span>
                <select
                  value={newRole}
                  onChange={(e) => {
                    const r = e.target.value as 'user' | 'admin'
                    setNewRole(r)
                    if (r === 'admin') selectAllPermissions()
                  }}
                >
                  <option value="user">Team Member (Custom permissions)</option>
                  <option value="admin">Administrator (Full CRM access)</option>
                </select>
              </label>

              <label className="ops-field">
                <span>Password <i>*</i></span>
                <div className="ops-input-with-action">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    minLength={8}
                    maxLength={128}
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder="At least 8 characters"
                    required
                  />
                  <button
                    type="button"
                    className="ops-icon-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <small>At least 8 characters. Share it with user securely.</small>
              </label>
            </div>
          )}

          {newRole !== 'admin' && (
            <>
              <div className="ops-permission-toolbar">
                <span className="ops-toolbar-title">MODULE ACCESS CONTROL</span>
                <div className="ops-toolbar-buttons">
                  <button type="button" className="ops-mini-btn" onClick={selectAllPermissions}>Select all</button>
                  <button type="button" className="ops-mini-btn" onClick={clearAllPermissions}>Clear all</button>
                </div>
              </div>

              <div className="ops-permission-head">
                <span>CRM SECTION</span>
                <span>VIEW</span>
                <span>EDIT</span>
              </div>

              <div className="ops-permission-list">
                {modules.map(({ id, label }) => {
                  const access = permissions[id] ?? { view: false, edit: false }
                  return (
                    <div className="ops-permission-row" key={id}>
                      <span>{label}</span>
                      <label>
                        <input
                          type="checkbox"
                          checked={access.view}
                          onChange={(event) => changePermission(id, 'view', event.target.checked)}
                          aria-label={`${label} view access`}
                        />
                      </label>
                      <label>
                        <input
                          type="checkbox"
                          checked={access.edit}
                          disabled={!access.view}
                          onChange={(event) => changePermission(id, 'edit', event.target.checked)}
                          aria-label={`${label} edit access`}
                        />
                      </label>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          <div className="ops-user-form-foot">
            <span><ShieldCheck size={14} />Edit access includes viewing that section.</span>
            <button className="ops-red-button" disabled={saving}>
              <Save size={14} />{saving ? 'Saving…' : createOpen ? 'Create user account' : 'Save permissions'}
            </button>
          </div>
        </form>
      </section>
    )}

    {/* --- RESET PASSWORD MODAL --- */}
    {passwordTarget !== null && (
      <div className="ops-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setPasswordTarget(null) }}>
        <section className="ops-modal ops-password-modal" role="dialog" aria-modal="true" aria-labelledby="reset-title">
          <div className="ops-modal-head">
            <span className="ops-section-label">ACCOUNT SECURITY</span>
            <h2 id="reset-title">Set new password for {users.find((u) => u.id === passwordTarget)?.name}</h2>
            <p>The user will immediately be able to sign in with this new password from PC or mobile.</p>
            <button className="ops-icon-button" onClick={() => setPasswordTarget(null)} aria-label="Close">
              <X size={16} />
            </button>
          </div>
          <form className="ops-form" onSubmit={savePassword}>
            <label className="ops-field">
              <span>New password <i>*</i></span>
              <div className="ops-input-with-action">
                <input
                  type={showResetPassword ? 'text' : 'password'}
                  minLength={8}
                  maxLength={128}
                  value={resetPassword}
                  onChange={(event) => setResetPassword(event.target.value)}
                  placeholder="At least 8 characters"
                  required
                  autoFocus
                />
                <button
                  type="button"
                  className="ops-icon-toggle-btn"
                  onClick={() => setShowResetPassword(!showResetPassword)}
                  tabIndex={-1}
                >
                  {showResetPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <small>At least 8 characters.</small>
            </label>
            {error && <div className="ops-error">{error}</div>}
            <div className="ops-form-actions">
              <button className="ops-outline-button" type="button" onClick={() => setPasswordTarget(null)}>
                Cancel
              </button>
              <button className="ops-red-button" disabled={saving}>
                <KeyRound size={14} />{saving ? 'Saving…' : 'Reset password'}
              </button>
            </div>
          </form>
        </section>
      </div>
    )}

    {/* --- DETAILED USER ACTIVITY & WORKING LOG MODAL --- */}
    {activityUserId !== null && (
      <div
        className="ops-modal-backdrop ops-activity-backdrop"
        onMouseDown={(event) => { if (event.target === event.currentTarget) setActivityUserId(null) }}
      >
        <section className="ops-modal ops-activity-modal" role="dialog" aria-modal="true" aria-labelledby="activity-title">
          <div className="ops-modal-head ops-activity-head">
            <div className="ops-activity-user-header">
              <div className={`ops-user-avatar large ${activityData?.isOnline ? 'online' : ''}`}>
                {(activityData?.user?.name || users.find((u) => u.id === activityUserId)?.name || 'U').slice(0, 2).toUpperCase()}
                <span className={`ops-online-dot ${activityData?.isOnline ? 'live' : 'offline'}`} />
              </div>
              <div>
                <span className="ops-section-label">USER WORKING DETAILS & AUDIT LOG</span>
                <h2 id="activity-title">
                  {activityData?.user?.name || users.find((u) => u.id === activityUserId)?.name}
                </h2>
                <div className="ops-activity-meta-row">
                  <span>{activityData?.user?.email || users.find((u) => u.id === activityUserId)?.email}</span>
                  {activityData?.user?.phone && <span>• {activityData?.user?.phone}</span>}
                  <span className={`ops-role-pill ${activityData?.user?.role === 'admin' ? 'admin' : 'staff'}`}>
                    {activityData?.user?.role === 'admin' ? 'Administrator' : 'Team Member'}
                  </span>
                  {activityData?.isOnline ? (
                    <span className="ops-badge-online-glow">
                      <span className="ops-pulse-ring" /> Online on {activityData?.currentDevice || 'Device'}
                    </span>
                  ) : (
                    <span className="ops-badge-offline-text">
                      Last seen {formatRelativeTime(activityData?.lastSeen)} ({activityData?.currentDevice || 'Offline'})
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="ops-activity-head-actions">
              <button
                className="ops-icon-button"
                onClick={refreshActivity}
                disabled={activityLoading}
                title="Refresh working log"
              >
                <RefreshCw size={15} className={activityLoading ? 'ops-spinning' : ''} />
              </button>
              <button className="ops-icon-button" onClick={() => setActivityUserId(null)} aria-label="Close activity log">
                <X size={17} />
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="ops-activity-stats-grid">
            <div className="ops-activity-stat-card">
              <span className="stat-label">TOTAL TIME LOGGED IN</span>
              <div className="stat-value-group">
                <Clock size={18} className="stat-icon red" />
                <strong className="stat-value">{formatDuration(activityData?.totalDurationSeconds)}</strong>
              </div>
              <small className="stat-hint">Active work session duration</small>
            </div>

            <div className="ops-activity-stat-card">
              <span className="stat-label">OPERATIONS PERFORMED</span>
              <div className="stat-value-group">
                <Activity size={18} className="stat-icon blue" />
                <strong className="stat-value">{activityData?.activities?.length || 0}</strong>
              </div>
              <small className="stat-hint">Leads, projects, expenses & documents</small>
            </div>

            <div className="ops-activity-stat-card">
              <span className="stat-label">LOGIN SESSIONS</span>
              <div className="stat-value-group">
                <Monitor size={18} className="stat-icon green" />
                <strong className="stat-value">{activityData?.sessions?.length || 0}</strong>
              </div>
              <small className="stat-hint">Recorded devices & IP addresses</small>
            </div>
          </div>

          {/* Module Filter Pills */}
          {Boolean(activityData?.moduleCounts?.length) && (
            <div className="ops-module-filter-bar">
              <span className="filter-title">Filter by module:</span>
              <button
                type="button"
                className={`ops-filter-pill ${activityModuleFilter === 'All' ? 'active' : ''}`}
                onClick={() => setActivityModuleFilter('All')}
              >
                All ({activityData?.activities?.length || 0})
              </button>
              {activityData?.moduleCounts.map((mc) => (
                <button
                  type="button"
                  key={mc.module}
                  className={`ops-filter-pill ${activityModuleFilter === mc.module ? 'active' : ''}`}
                  onClick={() => setActivityModuleFilter(mc.module)}
                >
                  {mc.module} ({mc.count})
                </button>
              ))}
            </div>
          )}

          {/* Main Working Feed & Timeline */}
          <div className="ops-activity-content">
            <div className="ops-activity-section-header">
              <h3>
                <Sparkles size={15} />
                Detailed Working Log ({filteredActivities.length})
              </h3>
              <small>Chronological record of every change, lead, budget, or invoice touched</small>
            </div>

            {activityLoading ? (
              <div className="ops-activity-loading">
                <RefreshCw size={20} className="ops-spinning" />
                <span>Fetching real-time activity…</span>
              </div>
            ) : filteredActivities.length === 0 ? (
              <div className="ops-activity-empty">
                <Activity size={28} />
                <h4>No actions recorded yet for this user</h4>
                <p>When this user logs in and creates leads, adds expenses, or updates projects, all details will appear here with exact timestamps and descriptions.</p>
              </div>
            ) : (
              <div className="ops-timeline-list">
                {filteredActivities.map((act) => (
                  <div className="ops-timeline-item" key={act.id}>
                    <div className="ops-timeline-marker" />
                    <div className="ops-timeline-card">
                      <div className="ops-timeline-card-header">
                        <div className="ops-timeline-title-group">
                          <span className={`ops-module-badge ${act.module.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}>
                            {act.module}
                          </span>
                          <strong className="ops-timeline-action">{act.action}</strong>
                        </div>
                        <span className="ops-timeline-time" title={act.created_at}>
                          {formatRelativeTime(act.created_at)}
                        </span>
                      </div>

                      <p className="ops-timeline-desc">{act.description}</p>

                      <div className="ops-timeline-footer">
                        <span className="ops-timeline-device">
                          {getDeviceIcon(act.device)}
                          <span>{act.device || 'Web Session'}</span>
                        </span>
                        {act.ip_address && (
                          <span className="ops-timeline-ip">IP: {act.ip_address}</span>
                        )}
                        <span className="ops-timeline-timestamp">
                          {new Date(act.created_at).toLocaleString('en-PK', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Sessions Table */}
            {Boolean(activityData?.sessions?.length) && (
              <div className="ops-sessions-section">
                <div className="ops-activity-section-header">
                  <h3>
                    <Clock size={15} />
                    Device Logins & Session Durations ({activityData?.sessions.length})
                  </h3>
                  <small>Shows when they signed in and how long they remained active on each device</small>
                </div>

                <div className="ops-table-wrap">
                  <table className="ops-table ops-sessions-table">
                    <thead>
                      <tr>
                        <th>LOGIN TIME</th>
                        <th>LAST ACTIVE</th>
                        <th>DURATION</th>
                        <th>DEVICE</th>
                        <th>IP ADDRESS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activityData?.sessions.map((sess, index) => (
                        <tr key={index}>
                          <td>{new Date(sess.login_time).toLocaleString('en-PK', { dateStyle: 'short', timeStyle: 'short' })}</td>
                          <td>{sess.last_active_at ? formatRelativeTime(sess.last_active_at) : '—'}</td>
                          <td>
                            <strong>{formatDuration(sess.duration_seconds)}</strong>
                          </td>
                          <td>
                            <div className="ops-device-tag">
                              {getDeviceIcon(sess.device)}
                              <span>{sess.device || 'Unknown'}</span>
                            </div>
                          </td>
                          <td><code>{sess.ip_address || '—'}</code></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    )}

    {!createOpen && editing === null && passwordTarget === null && activityUserId === null && (
      <span className="ops-user-access-note">
        <LockKeyhole size={13} />
        Users only see permitted modules. Real-time activity and time spent in panel are automatically updated.
      </span>
    )}
  </>
}