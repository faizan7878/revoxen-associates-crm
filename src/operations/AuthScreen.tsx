import { useState, useEffect, type FormEvent } from 'react'
import {
  ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff,
  KeyRound, LockKeyhole, ShieldCheck,
} from 'lucide-react'
import './auth.css'

type AuthUser = { id: number; name: string; email: string; role: 'admin' | 'user'; permissions: Record<string, { view: boolean; edit: boolean }> }

type AuthMode = 'auth' | 'forgot_request' | 'forgot_verify'

export default function AuthScreen({ setupRequired, onAuthenticated }: { setupRequired: boolean; onAuthenticated: (user: AuthUser) => void }) {
  const [mode, setMode] = useState<AuthMode>('auth')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [googleEnabled, setGoogleEnabled] = useState(false)

  // Forgot password states
  const [forgotIdentifier, setForgotIdentifier] = useState('')
  const [forgotCode, setForgotCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [forgotDestination, setForgotDestination] = useState('')
  const [demoCode, setDemoCode] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

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
        body: JSON.stringify(setupRequired ? { name, email: email.trim(), password } : { email: email.trim(), identifier: email.trim(), password }),
      })
      const result = await response.json() as AuthUser & { error?: string }
      if (!response.ok) throw new Error(result.error || 'Could not sign in.')
      onAuthenticated(result)
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : 'Could not connect to the Revoxen database.')
    } finally { setSaving(false) }
  }

  const handleRequestCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSuccessMessage('')
    setSaving(true)
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: forgotIdentifier.trim() }),
      })
      const result = await response.json() as { ok?: boolean; message?: string; destination?: string; code?: string; error?: string }
      if (!response.ok) throw new Error(result.error || 'Failed to request recovery code.')
      setForgotDestination(result.destination || forgotIdentifier)
      setDemoCode(result.code || '')
      setSuccessMessage(result.message || 'Verification code generated!')
      setMode('forgot_verify')
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : 'No account found matching this identifier.')
    } finally { setSaving(false) }
  }

  const handleResetPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    if (newPassword.length < 10) {
      setError('Password must be at least 10 characters long.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setSaving(true)
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: forgotIdentifier.trim(),
          code: forgotCode.trim(),
          newPassword,
        }),
      })
      const result = await response.json() as AuthUser & { error?: string }
      if (!response.ok) throw new Error(result.error || 'Failed to reset password.')
      onAuthenticated(result)
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : 'Password reset failed.')
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

      {/* --- Mode: Login / Setup --- */}
      {mode === 'auth' && (
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
            {setupRequired && (
              <label>
                <span>Full name</span>
                <input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} required />
              </label>
            )}
            <label>
              <span>{setupRequired ? 'Work email' : 'Work email, phone, or name'}</span>
              <input
                type="text"
                autoComplete="username"
                placeholder={setupRequired ? 'admin@company.com' : 'email@company.com, 0300..., or name'}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
            <label>
              <div className="auth-field-header">
                <span>Password</span>
                {!setupRequired && (
                  <button
                    type="button"
                    className="auth-link-btn"
                    onClick={() => {
                      setMode('forgot_request')
                      setError('')
                      setSuccessMessage('')
                    }}
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="auth-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={setupRequired ? 'new-password' : 'current-password'}
                  minLength={8}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <button
                  type="button"
                  className="auth-toggle-pwd"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <small>At least 8 characters</small>
            </label>
            {error && <div className="auth-error" role="alert">{error}</div>}
            <button className="auth-submit" disabled={saving || googleLoading}>
              {saving ? 'Please wait…' : setupRequired ? 'Create admin account' : 'Sign in'}
              <ArrowRight size={16} />
            </button>
            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <a href="/" style={{ color: '#769173', textDecoration: 'none', fontSize: '13px', fontWeight: 500 }}>
                ← Return to CRM Dashboard
              </a>
            </div>
          </form>
        </section>
      )}

      {/* --- Mode: Forgot Password (Step 1 - Request Code) --- */}
      {mode === 'forgot_request' && (
        <section className="auth-panel">
          <div className="auth-panel-icon"><KeyRound size={18} /></div>
          <span className="auth-kicker">ACCOUNT RECOVERY</span>
          <h2>Forgot password?</h2>
          <p>Enter your primary work email, recovery email, or registered phone number to receive a verification code.</p>

          <form className="auth-form" onSubmit={handleRequestCode}>
            <label>
              <span>Email, recovery email, or phone</span>
              <input
                type="text"
                placeholder="e.g. revoxenadmin@gmail.com or 0300..."
                value={forgotIdentifier}
                onChange={(event) => setForgotIdentifier(event.target.value)}
                autoFocus
                required
              />
              <small>You can use your work email, backup email, or registered phone number.</small>
            </label>

            {error && <div className="auth-error" role="alert">{error}</div>}

            <button className="auth-submit" disabled={saving}>
              {saving ? 'Sending verification code…' : 'Send verification code'}
              <ArrowRight size={16} />
            </button>

            <button
              type="button"
              className="auth-back-btn"
              onClick={() => {
                setMode('auth')
                setError('')
              }}
            >
              <ArrowLeft size={14} /> Back to Sign in
            </button>
          </form>
        </section>
      )}

      {/* --- Mode: Forgot Password (Step 2 - Verify Code & Set New Password) --- */}
      {mode === 'forgot_verify' && (
        <section className="auth-panel">
          <div className="auth-panel-icon"><ShieldCheck size={18} /></div>
          <span className="auth-kicker">VERIFICATION</span>
          <h2>Reset password</h2>
          <p>We verified your account. Enter the 6-digit code and choose a new password.</p>

          {demoCode && (
            <div className="auth-code-badge">
              <CheckCircle2 size={15} />
              <div>
                <span>Verification code: <strong>{demoCode}</strong></span>
                <small>Sent to: {forgotDestination}</small>
              </div>
            </div>
          )}

          <form className="auth-form" onSubmit={handleResetPassword}>
            <label>
              <span>6-digit verification code</span>
              <input
                type="text"
                maxLength={6}
                placeholder="123456"
                value={forgotCode}
                onChange={(event) => setForgotCode(event.target.value.replace(/\D/g, ''))}
                required
                autoFocus
                style={{ letterSpacing: '4px', fontWeight: 'bold', fontSize: '14px', textAlign: 'center' }}
              />
            </label>

            <label>
              <span>New password</span>
              <div className="auth-input-wrapper">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  minLength={10}
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="At least 10 characters"
                  required
                />
                <button
                  type="button"
                  className="auth-toggle-pwd"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  title={showNewPassword ? 'Hide password' : 'Show password'}
                  aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <small>At least 10 characters</small>
            </label>

            <label>
              <span>Confirm new password</span>
              <div className="auth-input-wrapper">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  minLength={10}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Confirm password"
                  required
                />
              </div>
            </label>

            {error && <div className="auth-error" role="alert">{error}</div>}

            <button className="auth-submit" disabled={saving}>
              {saving ? 'Resetting password…' : 'Reset password & sign in'}
              <ArrowRight size={16} />
            </button>

            <div className="auth-verify-actions">
              <button
                type="button"
                className="auth-link-btn"
                onClick={handleRequestCode}
                disabled={saving}
              >
                Resend code
              </button>
              <button
                type="button"
                className="auth-back-btn"
                onClick={() => {
                  setMode('auth')
                  setError('')
                }}
              >
                <ArrowLeft size={14} /> Back to Sign in
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
    <footer className="auth-footer"><span>REVOXEN ASSOCIATES</span><span>Authorized team members only</span></footer>
  </main>
}