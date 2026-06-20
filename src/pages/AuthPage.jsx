import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signIn, signUp } from '../lib/supabase'

export default function AuthPage() {
  const [mode, setMode] = useState('login')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setSuccess(''); setLoading(true)
    if (mode === 'register') {
      const { error } = await signUp(email, password, fullName)
      if (error) setError(error.message)
      else setSuccess('Account created — check your email to confirm, then sign in.')
    } else {
      const { error } = await signIn(email, password)
      if (error) setError(error.message)
      else navigate('/dashboard')
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{ width: '36px', height: '36px', background: 'var(--navy)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="ti ti-compass" style={{ fontSize: '18px', color: 'var(--green-light)' }} />
            </div>
            <span style={{ fontSize: '20px', fontWeight: '600', color: 'var(--navy)', letterSpacing: '-0.02em' }}>ProNav</span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Professional Advisory Hub</p>
          <div style={{ marginTop: '20px' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', color: 'var(--navy)', fontWeight: '400' }}>
              {mode === 'login' ? 'Welcome back' : 'Start your journey'}
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px' }}>
              {mode === 'login' ? 'Sign in to access your advisory hub' : 'Create your account to get personalised expert guidance'}
            </p>
          </div>
        </div>

        <div className="card" style={{ padding: '28px' }}>
          {error && (
            <div className="alert alert-error" style={{ marginBottom: '20px' }}>
              <i className="ti ti-alert-circle" style={{ fontSize: '16px', flexShrink: 0, marginTop: '1px' }} />
              {error}
            </div>
          )}
          {success && (
            <div className="alert alert-success" style={{ marginBottom: '20px' }}>
              <i className="ti ti-circle-check" style={{ fontSize: '16px', flexShrink: 0, marginTop: '1px' }} />
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {mode === 'register' && (
              <div className="form-group">
                <label className="form-label">Full name</label>
                <input type="text" placeholder="e.g. Leena S. Rammah" value={fullName} onChange={e => setFullName(e.target.value)} required />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input type="email" placeholder="you@organisation.org" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Password</span>
                {mode === 'login' && (
                  <Link to="/forgot-password" style={{ fontSize: '12px', color: 'var(--green)', fontWeight: '400' }}>
                    Forgot password?
                  </Link>
                )}
              </label>
              <input type="password" placeholder={mode === 'register' ? 'At least 8 characters' : '••••••••'} value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: '8px' }} disabled={loading}>
              {loading
                ? <><div className="spinner" style={{ width: '16px', height: '16px' }} /> Processing...</>
                : mode === 'login' ? 'Sign in' : 'Create account'
              }
            </button>
          </form>

          <div className="divider" />
          <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)' }}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setSuccess('') }}
              style={{ background: 'none', color: 'var(--green)', fontWeight: '500', fontSize: '13px', border: 'none', cursor: 'pointer' }}>
              {mode === 'login' ? 'Register here' : 'Sign in'}
            </button>
          </p>
        </div>

        <p style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', marginTop: '20px' }}>
          Humanitarian & Development Professional Advisory Platform
        </p>
      </div>
    </div>
  )
}
