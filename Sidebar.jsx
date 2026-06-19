import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { signOut } from '../lib/supabase'
import { calculateProfileStrength } from '../lib/profile'

const NAV = [
  { section: 'Overview', items: [
    { to: '/dashboard', icon: 'ti-layout-dashboard', label: 'Dashboard' },
    { to: '/profile', icon: 'ti-user', label: 'My profile' },
    { to: '/documents', icon: 'ti-files', label: 'Documents' }
  ]},
  { section: 'Advisory', items: [
    { to: '/advisor', icon: 'ti-message-dots', label: 'Ask advisor', badge: 'AI' },
    { to: '/career', icon: 'ti-briefcase', label: 'Career tools' },
    { to: '/interview', icon: 'ti-microphone', label: 'Interview prep' }
  ]},
  { section: 'Knowledge', items: [
    { to: '/knowledge', icon: 'ti-book', label: 'Knowledge hub' },
    { to: '/tests', icon: 'ti-checklist', label: 'Knowledge tests' }
  ]},
  { section: 'Services', items: [
    { to: '/notes', icon: 'ti-notes', label: 'Note taker' },
    { to: '/presentation', icon: 'ti-presentation', label: 'Presentation' },
    { to: '/reports', icon: 'ti-file-text', label: 'Report drafter' }
  ]}
]

function initials(name) {
  if (!name) return '?'
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

export default function Sidebar({ escalationCount = 0 }) {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const strength = calculateProfileStrength(profile)

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  const displayName = profile?.full_name || user?.user_metadata?.full_name || 'Professional'
  const headline = profile?.headline || 'Complete your profile'

  return (
    <aside style={{
      width: 'var(--sidebar-w)',
      minWidth: 'var(--sidebar-w)',
      background: 'var(--navy)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0,
      overflowY: 'auto'
    }}>
      <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
          <div style={{ width: '28px', height: '28px', background: 'var(--green)', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="ti ti-compass" style={{ fontSize: '15px', color: '#fff' }} />
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#fff', letterSpacing: '-0.01em' }}>ProNav</div>
            <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Advisory Hub</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="avatar avatar-md" style={{ flexShrink: 0 }}>
            {profile?.avatar_url
              ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              : initials(displayName)
            }
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '12px', fontWeight: '500', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayName}</div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{headline}</div>
          </div>
        </div>
        {strength < 100 && (
          <div style={{ marginTop: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'rgba(255,255,255,0.3)', marginBottom: '4px' }}>
              <span>Profile strength</span><span>{strength}%</span>
            </div>
            <div className="progress-bar"><div className="progress-fill" style={{ width: `${strength}%` }} /></div>
          </div>
        )}
      </div>

      <nav style={{ flex: 1, padding: '10px 0' }}>
        {NAV.map(({ section, items }) => (
          <div key={section}>
            <div style={{ padding: '8px 16px 4px', fontSize: '9px', color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{section}</div>
            {items.map(({ to, icon, label, badge }) => (
              <NavLink key={to} to={to} style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: '9px',
                padding: '8px 16px', fontSize: '12px', textDecoration: 'none',
                color: isActive ? '#fff' : 'rgba(255,255,255,0.55)',
                background: isActive ? 'rgba(255,255,255,0.06)' : 'transparent',
                borderLeft: `2px solid ${isActive ? 'var(--green)' : 'transparent'}`,
                transition: 'all 0.15s'
              })}>
                <i className={`ti ${icon}`} style={{ fontSize: '15px' }} />
                <span style={{ flex: 1 }}>{label}</span>
                {badge && <span style={{ fontSize: '9px', background: 'var(--green)', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontWeight: '600' }}>{badge}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {escalationCount > 0 && (
        <div style={{ margin: '0 12px 12px', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 'var(--radius-md)', padding: '10px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <i className="ti ti-alert-circle" style={{ fontSize: '14px', color: 'var(--amber)' }} />
            <span style={{ fontSize: '11px', color: '#fbbf24', fontWeight: '500' }}>{escalationCount} referral{escalationCount > 1 ? 's' : ''} pending</span>
          </div>
          <NavLink to="/advisor-studio" style={{ fontSize: '10px', color: 'rgba(251,191,36,0.7)', marginTop: '4px', display: 'block' }}>Open advisor studio →</NavLink>
        </div>
      )}

      <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ background: 'rgba(29,158,117,0.15)', border: '1px solid rgba(29,158,117,0.25)', borderRadius: 'var(--radius-md)', padding: '8px 10px', marginBottom: '10px' }}>
          <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.35)' }}>Current plan</div>
          <div style={{ fontSize: '12px', color: 'var(--green-light)', fontWeight: '500', marginTop: '1px' }}>Pro Monthly</div>
        </div>
        <button onClick={handleSignOut} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', background: 'none', color: 'rgba(255,255,255,0.35)', fontSize: '11px', padding: '4px 0', border: 'none', cursor: 'pointer' }}>
          <i className="ti ti-logout" style={{ fontSize: '14px' }} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
