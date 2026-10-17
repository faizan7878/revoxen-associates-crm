import { useState, type FormEvent } from 'react'
import { ArrowRight, LockKeyhole, ShieldCheck } from 'lucide-react'
import './auth.css'

type AuthUser = { id: number; name: string; email: string; role: 'admin' | 'user'; permissions: Record<string, { view: boolean; edit: boolean }> }

export default function AuthScreen({ setupRequired, onAuthenticated }: { setupRequired: boolean; onAuthenticated: (user: AuthUser) => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSaving(true)
    try {
      const response = await fetch(`/api/auth/${setupRequired ? 'setup' : 'login'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(setupRequired ? { name, email, password } : { email, password }),
      })
      const result = await response.json() as AuthUser & { error?: string }
      if (!response.ok) throw new Error(result.error || 'Could not sign in.')
      onAuthenticated(result)
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : 'Could not connect to the Revoxen database.')
    } finally { setSaving(false) }
  }

  return <main className="auth-screen">
    <div className="auth-brand"><span className="auth-brand-mark">R<i /></span><span>REVOXEN<small>ASSOCIATES</small></span></div>
    <div className="auth-layout">
      <section className="auth-intro">
        <span className="auth-overline"><i /> OPERATIONS WORKSPACE</span>
        <h1>{setupRequired ? 'Set up your admin account.' : 'Good work starts with a clear view.'}</h1>
        <p>{setupRequired ? 'Create the owner account. You can invite your team and assign their access after setup.' : 'Sign in with the account provided by your Revoxen administrator.'}</p>
        <div className="auth-security"><ShieldCheck size={17} /><span>Private company workspace<small>Access is limited to your assigned permissions.</small></span></div>
      </section>
      <section className="auth-panel">
        <div className="auth-panel-icon"><LockKeyhole size={18} /></div>
        <span className="auth-kicker">{setupRequired ? 'FIRST-TIME SETUP' : 'TEAM ACCESS'}</span>
        <h2>{setupRequired ? 'Create administrator' : 'Sign in'}</h2>
        <p>{setupRequired ? 'This account will manage users and access.' : 'Enter your work account credentials.'}</p>
        <form className="auth-form" onSubmit={submit}>
          {setupRequired && <label><span>Full name</span><input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} required /></label>}
          <label><span>Work email</span><input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
          <label><span>Password</span><input type="password" autoComplete={setupRequired ? 'new-password' : 'current-password'} minLength={10} value={password} onChange={(event) => setPassword(event.target.value)} required /><small>At least 10 characters</small></label>
          {error && <div className="auth-error" role="alert">{error}</div>}
          <button className="auth-submit" disabled={saving}>{saving ? 'Please wait…' : setupRequired ? 'Create admin account' : 'Sign in'}<ArrowRight size={16} /></button>
        </form>
      </section>
    </div>
    <footer className="auth-footer"><span>REVOXEN ASSOCIATES</span><span>Authorized team members only</span></footer>
  </main>
}