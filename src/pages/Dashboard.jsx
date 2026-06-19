import { useEffect } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { calculateProfileStrength } from '../lib/profile'

const SECTORS = ['Education in Emergencies', 'Child Protection', 'Gender Equality', 'Public Health', 'ECD', 'Diaspora Engagement']

const KNOWLEDGE_FEED = [
  { title: 'INEE minimum standards update 2025', sector: 'Education in Emergencies', read: '5 min' },
  { title: 'New WHO framework on ECD in crisis settings', sector: 'Early Childhood Dev.', read: '8 min' },
  { title: 'Gender-responsive programming — IASC update', sector: 'Gender Equality', read: '6 min' }
]

const ADVISORY_SERVICES = [
  { icon: 'ti-briefcase', label: 'Job suitability check', desc: 'Upload a JD and get a fit analysis', to: '/career', color: '#eaf3de', iconColor: '#3b6d11' },
  { icon: 'ti-file-cv', label: 'CV & cover letter', desc: 'AI-powered review and redrafting', to: '/career', color: '#faeeda', iconColor: '#854f0b' },
  { icon: 'ti-microphone', label: 'Interview preparation', desc: 'Sector-specific questions and coaching', to: '/interview', color: '#faece7', iconColor: '#993c1d' }
]

function MetricCard({ icon, iconBg, iconColor, value, label }) {
  return (
    <div className="card" style={{ padding: '16px' }}>
      <div style={{ width: '30px', height: '30px', background: iconBg, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
        <i className={`ti ${icon}`} style={{ fontSize: '15px', color: iconColor }} />
      </div>
      <div style={{ fontSize: '22px', fontWeight: '600', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{value}</div>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{label}</div>
    </div>
  )
}

export default function Dashboard() {
  const { setPageTitle } = useOutletContext()
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const strength = calculateProfileStrength(profile)

  useEffect(() => { setPageTitle('Dashboard') }, [])

  const firstName = (profile?.full_name || user?.user_metadata?.full_name || 'there').split(' ')[0]
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1100px' }}>

      <div style={{ background: 'linear-gradient(100deg, var(--navy) 0%, var(--navy-mid) 100%)', borderRadius: 'var(--radius-xl)', padding: '24px 28px', display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>{greeting}</p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: '400', color: '#fff' }}>Welcome back, {firstName}</h1>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', marginTop: '4px' }}>3 new knowledge updates in your sectors today</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/advisor')} style={{ flexShrink: 0 }}>
          Ask your advisor <i className="ti ti-arrow-right" style={{ fontSize: '14px' }} />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        <MetricCard icon="ti-message-dots" iconBg="var(--green-pale)" iconColor="#0f6e56" value="12" label="Advisory sessions" />
        <MetricCard icon="ti-files" iconBg="#e6f1fb" iconColor="#185fa5" value="5" label="Documents uploaded" />
        <MetricCard icon="ti-book" iconBg="var(--amber-pale)" iconColor="#854f0b" value="8" label="Topics explored" />
        <MetricCard icon="ti-trophy" iconBg="#eeedfe" iconColor="#534ab7" value="74%" label="Knowledge score" />
      </div>

      {strength < 80 && (
        <div style={{ background: 'var(--amber-pale)', border: '1px solid #fac775', borderRadius: 'var(--radius-lg)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <i className="ti ti-alert-triangle" style={{ fontSize: '20px', color: '#854f0b', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '13px', fontWeight: '500', color: '#633806' }}>Complete your profile to unlock personalised advice</p>
            <p style={{ fontSize: '12px', color: '#854f0b', marginTop: '2px' }}>Your profile is {strength}% complete. Upload your CV to get started.</p>
          </div>
          <button className="btn-primary" onClick={() => navigate('/profile')} style={{ flexShrink: 0, fontSize: '12px', padding: '8px 16px' }}>
            Complete profile
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div className="card">
          <div className="card-head">
            <h3>My profile</h3>
            <button className="btn-ghost" style={{ fontSize: '12px', padding: '4px 10px' }} onClick={() => navigate('/profile')}>Edit →</button>
          </div>
          <div className="card-body">
            {profile ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="avatar avatar-lg">{(profile.full_name || '?').split(' ').slice(0,2).map(n=>n[0]).join('')}</div>
                  <div>
                    <p style={{ fontWeight: '500', fontSize: '14px' }}>{profile.full_name}</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{profile.headline || 'No headline yet'}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '14px' }}>
                  {(profile.sectors || SECTORS).slice(0, 6).map(s => (
                    <span key={s} className="tag tag-green">{s}</span>
                  ))}
                </div>
                <div style={{ marginTop: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '5px' }}>
                    <span>Profile strength</span><span>{strength}%</span>
                  </div>
                  <div className="progress-bar"><div className="progress-fill" style={{ width: `${strength}%` }} /></div>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <i className="ti ti-user-plus" style={{ fontSize: '32px', color: 'var(--text-muted)' }} />
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>No profile yet</p>
                <button className="btn-primary" style={{ marginTop: '12px', fontSize: '12px', padding: '8px 16px' }} onClick={() => navigate('/profile')}>Build my profile</button>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h3>Advisory services</h3>
            <button className="btn-ghost" style={{ fontSize: '12px', padding: '4px 10px' }} onClick={() => navigate('/advisor')}>View all →</button>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {ADVISORY_SERVICES.map(({ icon, label, desc, to, color, iconColor }) => (
              <button key={label} onClick={() => navigate(to)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', textAlign: 'left', width: '100%', cursor: 'pointer', transition: 'background 0.15s' }}>
                <div style={{ width: '30px', height: '30px', background: color, borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className={`ti ${icon}`} style={{ fontSize: '15px', color: iconColor }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-primary)' }}>{label}</p>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>{desc}</p>
                </div>
                <i className="ti ti-arrow-right" style={{ fontSize: '14px', color: 'var(--text-muted)' }} />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>Knowledge hub — today</h3>
          <button className="btn-ghost" style={{ fontSize: '12px', padding: '4px 10px' }} onClick={() => navigate('/knowledge')}>Browse all →</button>
        </div>
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {KNOWLEDGE_FEED.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: i < KNOWLEDGE_FEED.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--green)', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>{item.title}</p>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{item.sector} · {item.read} read</p>
              </div>
              <button style={{ background: 'none', border: 'none', color: 'var(--green)', fontSize: '12px', cursor: 'pointer', flexShrink: 0 }}>Read →</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
