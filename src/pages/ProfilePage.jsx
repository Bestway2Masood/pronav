import { useEffect, useState, useRef } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { upsertProfile, uploadDocument, parseProfileFromCV, calculateProfileStrength } from '../lib/profile'

const SECTORS = ['Education in Emergencies', 'Child Protection', 'Gender Equality', 'Public Health', 'Early Childhood Development', 'Diaspora Engagement', 'Humanitarian Coordination', 'Food Security', 'WASH', 'Shelter & NFI', 'Livelihoods', 'Mental Health & Psychosocial']
const CAREER_STATUS = [
  { value: 'seeking', label: 'Actively seeking opportunities' },
  { value: 'open', label: 'Open to opportunities' },
  { value: 'active', label: 'Currently employed' }
]

export default function ProfilePage() {
  const { setPageTitle } = useOutletContext()
  const { user, profile, refreshProfile } = useAuth()
  const fileRef = useRef()

  const [form, setForm] = useState({
    full_name: '', headline: '', summary: '', location: '',
    years_experience: '', career_status: 'seeking', sectors: [], languages: ''
  })
  const [saving, setSaving] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [msg, setMsg] = useState(null)
  const [parseMsg, setParseMsg] = useState(null)
  const [activeTab, setActiveTab] = useState('profile')
  const strength = calculateProfileStrength(profile)

  useEffect(() => {
    setPageTitle('My profile')
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        headline: profile.headline || '',
        summary: profile.summary || '',
        location: profile.location || '',
        years_experience: profile.years_experience || '',
        career_status: profile.career_status || 'seeking',
        sectors: profile.sectors || [],
        languages: (profile.languages || []).join(', ')
      })
    }
  }, [profile])

  function set(key, value) { setForm(f => ({ ...f, [key]: value })) }

  function toggleSector(s) {
    setForm(f => ({
      ...f,
      sectors: f.sectors.includes(s) ? f.sectors.filter(x => x !== s) : [...f.sectors, s]
    }))
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true); setMsg(null)
    const { error } = await upsertProfile(user.id, {
      ...form,
      languages: form.languages.split(',').map(l => l.trim()).filter(Boolean)
    })
    if (error) setMsg({ type: 'error', text: error.message })
    else { setMsg({ type: 'success', text: 'Profile saved successfully.' }); await refreshProfile() }
    setSaving(false)
  }

  async function handleCVUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setParsing(true); setParseMsg(null)

    const { error: uploadError } = await uploadDocument(user.id, file, 'cv')
    if (uploadError) { setParseMsg({ type: 'error', text: 'Upload failed: ' + uploadError.message }); setParsing(false); return }

    const reader = new FileReader()
    reader.onload = async (ev) => {
      const text = ev.target.result
      const { data, error } = await parseProfileFromCV(text, user.id)
      if (error || !data) {
        setParseMsg({ type: 'error', text: 'Could not parse CV. You can fill in your profile manually.' })
      } else {
        setParseMsg({ type: 'success', text: 'CV parsed successfully — your profile has been updated.' })
        await refreshProfile()
      }
      setParsing(false)
    }
    reader.readAsText(file)
  }

  const initials = (name) => name ? name.split(' ').slice(0,2).map(n=>n[0]).join('').toUpperCase() : '?'

  return (
    <div style={{ maxWidth: '820px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <div className="avatar avatar-xl">{initials(form.full_name || profile?.full_name)}</div>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: '400', color: 'var(--text-primary)' }}>
            {form.full_name || 'Your profile'}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '3px' }}>{form.headline || 'Add a headline to your profile'}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
            <div className="progress-bar" style={{ width: '120px' }}><div className="progress-fill" style={{ width: `${strength}%` }} /></div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{strength}% complete</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: 'var(--surface-2)', padding: '4px', borderRadius: 'var(--radius-md)', width: 'fit-content', border: '1px solid var(--border)' }}>
        {['profile', 'cv'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '7px 16px', borderRadius: '7px', fontSize: '13px', fontWeight: '500', border: 'none',
            background: activeTab === tab ? 'var(--surface)' : 'transparent',
            color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-muted)',
            boxShadow: activeTab === tab ? 'var(--shadow-sm)' : 'none'
          }}>
            {tab === 'profile' ? 'Profile details' : 'Upload CV'}
          </button>
        ))}
      </div>

      {activeTab === 'cv' && (
        <div className="card">
          <div className="card-head"><h3>Upload your CV</h3></div>
          <div className="card-body">
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Upload your CV and our AI will automatically extract and populate your profile — saving you time and ensuring accuracy. Supported formats: PDF, DOC, DOCX, TXT.
            </p>
            {parseMsg && (
              <div className={`alert alert-${parseMsg.type}`} style={{ marginBottom: '16px' }}>
                <i className={`ti ${parseMsg.type === 'success' ? 'ti-circle-check' : 'ti-alert-circle'}`} style={{ fontSize: '16px', flexShrink: 0 }} />
                {parseMsg.text}
              </div>
            )}
            <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt" style={{ display: 'none' }} onChange={handleCVUpload} />
            <div
              onClick={() => !parsing && fileRef.current.click()}
              style={{
                border: '2px dashed var(--border-mid)', borderRadius: 'var(--radius-lg)',
                padding: '40px 20px', textAlign: 'center', cursor: parsing ? 'wait' : 'pointer',
                transition: 'border-color 0.15s, background 0.15s',
                background: parsing ? 'var(--surface-2)' : 'transparent'
              }}
            >
              {parsing ? (
                <>
                  <div className="spinner" style={{ width: '28px', height: '28px', margin: '0 auto 12px' }} />
                  <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>Analysing your CV…</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Our AI is extracting your experience and skills</p>
                </>
              ) : (
                <>
                  <i className="ti ti-upload" style={{ fontSize: '32px', color: 'var(--text-muted)' }} />
                  <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)', marginTop: '12px' }}>Click to upload your CV</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>PDF, DOC, DOCX or TXT — max 10MB</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'profile' && (
        <form onSubmit={handleSave}>
          {msg && (
            <div className={`alert alert-${msg.type}`} style={{ marginBottom: '20px' }}>
              <i className={`ti ${msg.type === 'success' ? 'ti-circle-check' : 'ti-alert-circle'}`} style={{ fontSize: '16px', flexShrink: 0 }} />
              {msg.text}
            </div>
          )}

          <div className="card" style={{ marginBottom: '16px' }}>
            <div className="card-head"><h3>Basic information</h3></div>
            <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <div className="form-group">
                <label className="form-label">Full name</label>
                <input value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="Your full name" />
              </div>
              <div className="form-group">
                <label className="form-label">Current location</label>
                <input value={form.location} onChange={e => set('location', e.target.value)} placeholder="e.g. Geneva, Switzerland" />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Professional headline</label>
                <input value={form.headline} onChange={e => set('headline', e.target.value)} placeholder="e.g. Humanitarian & Development Specialist · 15+ years UN/INGO experience" />
              </div>
              <div className="form-group">
                <label className="form-label">Years of experience</label>
                <input type="number" value={form.years_experience} onChange={e => set('years_experience', e.target.value)} placeholder="e.g. 15" min="0" max="50" />
              </div>
              <div className="form-group">
                <label className="form-label">Career status</label>
                <select value={form.career_status} onChange={e => set('career_status', e.target.value)}>
                  {CAREER_STATUS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Languages (comma separated)</label>
                <input value={form.languages} onChange={e => set('languages', e.target.value)} placeholder="e.g. English, Arabic, French" />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Professional summary</label>
                <textarea value={form.summary} onChange={e => set('summary', e.target.value)} rows={4} placeholder="A brief overview of your professional background, expertise, and career goals…" />
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: '20px' }}>
            <div className="card-head"><h3>Sectors & themes</h3></div>
            <div className="card-body">
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px' }}>Select all sectors relevant to your experience — this powers personalised advice and knowledge content.</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {SECTORS.map(s => {
                  const active = form.sectors.includes(s)
                  return (
                    <button type="button" key={s} onClick={() => toggleSector(s)} style={{
                      padding: '6px 12px', borderRadius: 'var(--radius-full)', fontSize: '12px', fontWeight: '500',
                      background: active ? 'var(--green)' : 'var(--surface-2)',
                      color: active ? '#fff' : 'var(--text-secondary)',
                      border: `1px solid ${active ? 'var(--green)' : 'var(--border-mid)'}`,
                      transition: 'all 0.15s'
                    }}>
                      {active && <i className="ti ti-check" style={{ fontSize: '12px', marginRight: '5px' }} />}
                      {s}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? <><div className="spinner" style={{ width: '14px', height: '14px' }} /> Saving…</> : <><i className="ti ti-device-floppy" style={{ fontSize: '15px' }} /> Save profile</>}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
