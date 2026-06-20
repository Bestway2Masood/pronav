import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://theadvisorhub.netlify.app/reset-password'
    })
    if (error) setError(error.message)
    else setSent(true)
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
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: '400', color: 'var(--navy)', marginTop: '16px' }}>Reset your password</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px' }}>Enter your email and we will send you a reset link</p>
        </div>

        <div className="card" style={{ padding: '28px' }}>
          {sent ? (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ width: '56px', height: '56px', background: 'var(--green-pale)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <i className="ti ti-mail-check" style={{ fontSize: '26px', color: 'var(--green)' }} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '8px' }}>Check your inbox</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                We have sent a password reset link to <strong>{email}</strong>. Click the link in the email to set a new password.
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '12px' }}>
                Did not receive it? Check your spam folder or{' '}
                <button onClick={() => setSent(false)} style={{ background: 'none', border: 'none', color: 'var(--green)', fontSize: '12px', cursor: 'pointer', padding: 0 }}>try again</button>.
              </p>
            </div>
          ) : (
            <>
              {error && (
                <div className="alert alert-error" style={{ marginBottom: '20px' }}>
                  <i className="ti ti-alert-circle" style={{ fontSize: '16px', flexShrink: 0 }} />
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit}>
                <div className="form-group" style={{ marginBottom: '24px' }}>
                  <label className="form-label">Email address</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@organisation.org" required />
                </div>
                <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }} disabled={loading}>
                  {loading ? <><div className="spinner" style={{ width: '16px', height: '16px' }} /> Sending...</> : 'Send reset link'}
                </button>
              </form>
            </>
          )}
          <div className="divider" />
          <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)' }}>
            Remember your password? <Link to="/" style={{ color: 'var(--green)', fontWeight: '500' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
