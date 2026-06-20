import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [ready, setReady] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true)
      else setError('This reset link has expired or is invalid. Please request a new one.')
    })
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setLoading(true); setError('')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) setError(error.message)
    else { setSuccess(true); setTimeout(() => navigate('/dashboard'), 2500) }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{ width: '36px', height: '36px', background: 'var(--navy)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="ti ti-compass" style={{ fontSize: '18px', color: 'var(--green-light)' }} />
            </div>
            <span style={{ fontSize: '20px', fontWeight: '600', color: 'var(--navy)', letterSpacing: '-0.02em' }}>ProNav</span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: '400', color: 'var(--navy)', marginTop: '16px' }}>Set new password</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px' }}>Choose a strong password for your account</p>
        </div>

        <div className="card" style={{ padding: '28px' }}>
          {success ? (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ width: '56px', height: '56px', background: 'var(--green-pale)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <i className="ti ti-circle-check" style={{ fontSize: '26px', color: 'var(--green)' }} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '8px' }}>Password updated</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Redirecting you to your dashboard...</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="alert alert-error" style={{ marginBottom: '20px' }}>
                  <i className="ti ti-alert-circle" style={{ fontSize: '16px', flexShrink: 0 }} />
                  <div>
                    {error}
                    {!ready && <a href="/forgot-password" style={{ display: 'block', marginTop: '6px', color: 'var(--red)', fontSize: '12px' }}>Request a new reset link</a>}
                  </div>
                </div>
              )}
              {ready && (
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label className="form-label">New password</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" required minLength={8} />
                  </div>
                  <div className="form-group" style={{ marginBottom: '24px' }}>
                    <label className="form-label">Confirm new password</label>
                    <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repeat your password" required />
                  </div>
                  <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }} disabled={loading}>
                    {loading ? <><div className="spinner" style={{ width: '16px', height: '16px' }} /> Updating...</> : 'Set new password'}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
