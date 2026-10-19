import { useState, useEffect, type FormEvent } from 'react'
import { ArrowRight, LockKeyhole, ShieldCheck } from 'lucide-react'
import './auth.css'

type AuthUser = { id: number; name: string; email: string; role: 'admin' | 'user'; permissions: Record<string, { view: boolean; edit: boolean }> }

export default function AuthScreen({ setupRequired, onAuthenticated }: { setupRequired: boolean; onAuthenticated: (user: AuthUser) => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [googleEnabled, setGoogleEnabled] = useState(false)

  // Check if Google OAuth is configured on the server
  useEffect(() => {
    fetch('/api/auth/google/url')
      .then((res) => { if (res.ok) setGoogleEnabled(true) })
      .catch(() => {})
  }, [])

  // Handle Google OAuth callback code from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    if (!code) return
    // Clean the URL
    window.history.replaceState({}, '', window.location.pathname)
    setGoogleLoading(true)
    setError('')
    fetch('/api/auth/google/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
      .then(async (res) => {
        const result = await res.json() as AuthUser & { error?: string }
        if (!res.ok) throw new Error(result.error || 'Google sign-in failed.')
        onAuthenticated(result)
      })
      .catch((problem) => {
        setError(problem instanceof Error ? problem.message : 'Google sign-in failed.')
        setGoogleLoading(false)
      })
  }, [onAuthenticated])

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

  const signInWithGoogle = async () => {
    setError('')
    setGoogleLoading(true)
    try {
      const res = await fetch('/api/auth/google/url')
      const { url } = await res.json() as { url: string }
      window.location.href = url
    } catch {
      setError('Could not initiate Google sign-in.')
      setGoogleLoading(false)
    }
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

        {!setupRequired && googleEnabled && (
          <div className="auth-google-section">
            <button
              id="google-signin-btn"
              type="button"
              className="auth-google-btn"
              onClick={signInWithGoogle}
              disabled={googleLoading || saving}
            >
              {googleLoading ? (
                <span className="auth-google-spinner" />
              ) : (
                <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v8.51h12.93c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.1-10.36 7.1-17.14z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                </svg>
              )}
              <span>{googleLoading ? 'Connecting to Google…' : 'Sign in with Google'}</span>
            </button>
            <div className="auth-divider"><span>or sign in with email</span></div>
          </div>
        )}

        <form className="auth-form" onSubmit={submit}>
          {setupRequired && <label><span>Full name</span><input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} required /></label>}
          <label><span>Work email</span><input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
          <label><span>Password</span><input type="password" autoComplete={setupRequired ? 'new-password' : 'current-password'} minLength={10} value={password} onChange={(event) => setPassword(event.target.value)} required /><small>At least 10 characters</small></label>
          {error && <div className="auth-error" role="alert">{error}</div>}
          <button className="auth-submit" disabled={saving || googleLoading}>{saving ? 'Please wait…' : setupRequired ? 'Create admin account' : 'Sign in'}<ArrowRight size={16} /></button>
        </form>
      </section>
    </div>
    <footer className="auth-footer"><span>REVOXEN ASSOCIATES</span><span>Authorized team members only</span></footer>
  </main>
}