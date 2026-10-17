import { useEffect, useState, type FormEvent } from 'react'
import { KeyRound, LockKeyhole, Plus, Save, ShieldCheck, UserRoundPlus, X } from 'lucide-react'

type ModuleId = 'dashboard' | 'projects' | 'projectAccounts' | 'employees' | 'payroll' | 'loans' | 'assets' | 'vendors' | 'workOrders' | 'projectExpenses' | 'officeExpenses' | 'estimates' | 'invoices' | 'profitLoss'
type Access = { view: boolean; edit: boolean }
type Permissions = Partial<Record<ModuleId, Access>>
type User = { id: number; name: string; email: string; role: 'admin' | 'user'; active: number; permissions: Permissions; created_at?: string }

const modules: { id: ModuleId; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' }, { id: 'projects', label: 'Projects' }, { id: 'projectAccounts', label: 'Project accounts' }, { id: 'employees', label: 'Employees' },
  { id: 'payroll', label: 'Payroll' }, { id: 'loans', label: 'Employee loans' }, { id: 'assets', label: 'Company assets' },
  { id: 'vendors', label: 'Vendors' }, { id: 'workOrders', label: 'Sublet work orders' }, { id: 'projectExpenses', label: 'Project expenses' },
  { id: 'officeExpenses', label: 'Office & general' }, { id: 'estimates', label: 'Estimates' }, { id: 'invoices', label: 'Invoices' },
  { id: 'profitLoss', label: 'Profit & loss' },
]

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...init?.headers } })
  const result = await response.json().catch(() => ({})) as { error?: string } & T
  if (!response.ok) throw new Error(result.error || `Request failed (${response.status})`)
  return result
}

const emptyPermissions = (): Permissions => Object.fromEntries(modules.map(({ id }) => [id, { view: false, edit: false }]))

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<number | null>(null)
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [permissions, setPermissions] = useState<Permissions>(emptyPermissions)
  const [passwordTarget, setPasswordTarget] = useState<number | null>(null)
  const [resetPassword, setResetPassword] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const loadUsers = async () => setUsers(await api<User[]>('/users'))
  useEffect(() => {
    const task = window.setTimeout(() => { void loadUsers().catch((problem) => setError(problem instanceof Error ? problem.message : 'Could not load user accounts.')) }, 0)
    return () => window.clearTimeout(task)
  }, [])

  const openCreate = () => {
    setNewName('')
    setNewEmail('')
    setNewPassword('')
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

  const createUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api('/users', { method: 'POST', body: JSON.stringify({ name: newName, email: newEmail, password: newPassword, permissions }) })
      setCreateOpen(false)
      await loadUsers()
    } catch (problem) { setError(problem instanceof Error ? problem.message : 'Could not create account.') }
    finally { setSaving(false) }
  }

  const savePermissions = async (id: number) => {
    setSaving(true)
    setError('')
    try {
      await api(`/users/${id}`, { method: 'PATCH', body: JSON.stringify({ permissions }) })
      setEditing(null)
      await loadUsers()
    } catch (problem) { setError(problem instanceof Error ? problem.message : 'Could not save permissions.') }
    finally { setSaving(false) }
  }

  const toggleAccount = async (user: User) => {
    setError('')
    try {
      await api(`/users/${user.id}`, { method: 'PATCH', body: JSON.stringify({ active: !user.active }) })
      await loadUsers()
    } catch (problem) { setError(problem instanceof Error ? problem.message : 'Could not update account.') }
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
    } catch (problem) { setError(problem instanceof Error ? problem.message : 'Could not reset password.') }
    finally { setSaving(false) }
  }

  const startEditing = (user: User) => {
    setPermissions(Object.fromEntries(modules.map(({ id }) => [id, user.permissions[id] ?? { view: false, edit: false }])))
    setEditing(user.id)
    setCreateOpen(false)
    setError('')
  }

  const permissionCount = (user: User) => modules.filter(({ id }) => user.permissions[id]?.view).length

  return <>
    <section className="ops-panel ops-table-panel">
      <div className="ops-panel-head"><div><span className="ops-section-label">ACCESS CONTROL</span><h2>{users.length} {users.length === 1 ? 'account' : 'accounts'}</h2></div><button className="ops-red-button" onClick={openCreate}><UserRoundPlus size={15} />Add user</button></div>
      {error && <div className="ops-error"><span><X size={14} />{error}</span><button onClick={() => setError('')} aria-label="Dismiss error"><X size={14} /></button></div>}
      <div className="ops-table-wrap"><table className="ops-table ops-user-table"><thead><tr><th>ACCOUNT</th><th>ROLE</th><th>ACCESS</th><th>STATUS</th><th>ACTIONS</th></tr></thead><tbody>
        {users.map((user) => <tr key={user.id}>
          <td><span className="ops-primary-cell">{user.name}<small>{user.email}</small></span></td>
          <td>{user.role === 'admin' ? <span className="ops-user-role"><ShieldCheck size={12} />Admin</span> : 'Team member'}</td>
          <td>{user.role === 'admin' ? 'All modules' : `${permissionCount(user)} of ${modules.length} modules`}</td>
          <td><span className={`ops-status ${user.active ? 'ops-status-active' : 'ops-status-void'}`}><i />{user.active ? 'Active' : 'Disabled'}</span></td>
          <td><div className="ops-user-actions">{user.role !== 'admin' && <><button className="ops-row-action" onClick={() => startEditing(user)}>Permissions</button><button className="ops-row-action" onClick={() => { setPasswordTarget(user.id); setResetPassword(''); setError('') }}>Reset password</button><button className="ops-row-action" onClick={() => void toggleAccount(user)}>{user.active ? 'Disable' : 'Enable'}</button></>}</div></td>
        </tr>)}
      </tbody></table></div>
      {users.length === 0 && <div className="ops-user-empty"><LockKeyhole size={19} /><span>Loading accounts…</span></div>}
    </section>

    {(createOpen || editing !== null) && <section className="ops-panel ops-user-editor">
      <div className="ops-panel-head"><div><span className="ops-section-label">{createOpen ? 'NEW TEAM ACCOUNT' : 'MODULE PERMISSIONS'}</span><h2>{createOpen ? 'Invite a user' : `Access for ${users.find((user) => user.id === editing)?.name ?? 'team member'}`}</h2></div><button className="ops-icon-button" onClick={() => { setCreateOpen(false); setEditing(null) }} aria-label="Close permissions editor"><X size={16} /></button></div>
      <form className="ops-user-form" onSubmit={createOpen ? createUser : (event) => { event.preventDefault(); if (editing !== null) void savePermissions(editing) }}>
        {createOpen && <div className="ops-user-identity"><label className="ops-field"><span>Full name <i>*</i></span><input value={newName} onChange={(event) => setNewName(event.target.value)} required /></label><label className="ops-field"><span>Work email <i>*</i></span><input type="email" value={newEmail} onChange={(event) => setNewEmail(event.target.value)} required /></label><label className="ops-field"><span>Temporary password <i>*</i></span><input type="password" minLength={10} maxLength={128} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required /><small>At least 10 characters. Share it with the user securely.</small></label></div>}
        <div className="ops-permission-head"><span>CRM SECTION</span><span>VIEW</span><span>EDIT</span></div>
        <div className="ops-permission-list">{modules.map(({ id, label }) => { const access = permissions[id] ?? { view: false, edit: false }; return <div className="ops-permission-row" key={id}><span>{label}</span><label><input type="checkbox" checked={access.view} onChange={(event) => changePermission(id, 'view', event.target.checked)} aria-label={`${label} view access`} /></label><label><input type="checkbox" checked={access.edit} disabled={!access.view} onChange={(event) => changePermission(id, 'edit', event.target.checked)} aria-label={`${label} edit access`} /></label></div> })}</div>
        <div className="ops-user-form-foot"><span><ShieldCheck size={14} />Edit access includes viewing that section.</span><button className="ops-red-button" disabled={saving}><Save size={14} />{saving ? 'Saving…' : createOpen ? 'Create account' : 'Save permissions'}</button></div>
      </form>
    </section>}

    {passwordTarget !== null && <div className="ops-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setPasswordTarget(null) }}><section className="ops-modal ops-password-modal" role="dialog" aria-modal="true" aria-labelledby="reset-title"><div className="ops-modal-head"><span className="ops-section-label">ACCOUNT SECURITY</span><h2 id="reset-title">Set a new password</h2><p>The user will need to sign in again after this change.</p><button className="ops-icon-button" onClick={() => setPasswordTarget(null)} aria-label="Close"><X size={16} /></button></div><form className="ops-form" onSubmit={savePassword}><label className="ops-field"><span>New password <i>*</i></span><input type="password" minLength={10} maxLength={128} value={resetPassword} onChange={(event) => setResetPassword(event.target.value)} required autoFocus /><small>At least 10 characters.</small></label>{error && <div className="ops-error">{error}</div>}<div className="ops-form-actions"><button className="ops-outline-button" type="button" onClick={() => setPasswordTarget(null)}>Cancel</button><button className="ops-red-button" disabled={saving}><KeyRound size={14} />{saving ? 'Saving…' : 'Reset password'}</button></div></form></section></div>}
    {!createOpen && editing === null && passwordTarget === null && <span className="ops-user-access-note"><LockKeyhole size={13} />Users only see permitted modules. Changes take effect immediately.</span>}
    <span className="ops-user-add-icon" aria-hidden="true"><Plus size={13} /></span>
  </>
}