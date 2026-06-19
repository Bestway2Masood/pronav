import { Outlet, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import Sidebar from './Sidebar'
import { supabase } from '../lib/supabase'

export default function AppShell() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [escalationCount, setEscalationCount] = useState(0)
  const [pageTitle, setPageTitle] = useState('Dashboard')

  useEffect(() => {
    if (!loading && !user) navigate('/')
  }, [user, loading, navigate])

  useEffect(() => {
    async function loadEscalations() {
      const { count } = await supabase
        .from('escalations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
      setEscalationCount(count || 0)
    }

    loadEscalations()

    const channel = supabase
      .channel('escalations-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'escalations' }, loadEscalations)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-3)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ width: '28px', height: '28px', margin: '0 auto 12px' }} />
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Loading your workspace…</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar escalationCount={escalationCount} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header style={{
          height: 'var(--topbar-h)',
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          gap: '12px',
          flexShrink: 0
        }}>
          <h2 style={{ flex: 1, fontSize: '15px', fontWeight: '500', color: 'var(--text-primary)' }} id="page-title">
            {pageTitle}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '7px 12px', fontSize: '12px', color: 'var(--text-muted)', width: '200px' }}>
            <i className="ti ti-search" style={{ fontSize: '14px' }} />
            Search anything…
          </div>
          <button style={{ width: '34px', height: '34px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <i className="ti ti-bell" style={{ fontSize: '16px', color: 'var(--text-secondary)' }} />
            {escalationCount > 0 && (
              <span style={{ position: 'absolute', top: '5px', right: '5px', width: '7px', height: '7px', background: 'var(--green)', borderRadius: '50%', border: '1.5px solid var(--surface)' }} />
            )}
          </button>
        </header>

        <main style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          <Outlet context={{ setPageTitle }} />
        </main>
      </div>
    </div>
  )
}
