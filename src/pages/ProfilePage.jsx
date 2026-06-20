import { useEffect, useState, useRef } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { upsertProfile, uploadDocument, calculateProfileStrength } from '../lib/profile'

const SECTORS = [
  'Agriculture', 'Camp Coordination & Management', 'Child Protection',
  'Climate & Environment', 'Coordination', 'Diaspora Engagement',
  'Disaster Risk Reduction', 'Early Childhood Development', 'Education in Emergencies',
  'Food Security & Nutrition', 'Gender Equality & GBV', 'Health', 'HIV/Aids',
  'Humanitarian Coordination', 'Livelihoods', 'Mental Health & Psychosocial',
  'Migration & Displacement', 'Mine Action', 'Peacebuilding & Conflict',
  'Protection & Human Rights', 'Public Health', 'Recovery & Reconstruction',
  'Refugee Response', 'Safety & Security', 'Shelter & NFI', 'WASH', 'Urban Resilience'
]

const CAREER_STATUS = [
  { value: 'seeking', label: 'Actively seeking opportunities' },
  { value: 'open', label: 'Open to opportunities' },
  { value: 'active', label: 'Currently employed' }
]

async function extractTextFromFile(file) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (ev) => resolve(ev.target.result)
    reader.onerror = () => resolve('')
    if (file.type === 'application/pdf') {
      reader.readAsDataURL(file)
    } else {
      reader.readAsText(file)
    }
  })
}

async function parseWithClaude(fileContent, fileName) {
  const isPDF = fileName.toLowerCase().endsWith('.pdf')
  let messages
  if (isPDF) {
    const base64 = fileContent.split(',')[1]
    messages = [{
      role: 'user',
      content: [
        { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } },
        { type: 'text', text: 'Extract structured profile information from this CV. Return ONLY valid JSON, no markdown, no preamble, no backticks.\n\nSchema:\n{\n  "full_name": "",\n  "headline": "",\n  "summary": "",\n  "years_experience": 0,\n  "location": "",\n  "sectors": [],\n  "themes": [],\n  "skills": [],\n  "languages": [],\n  "education": [{"degree":"","institution":"","year":""}],\n  "experience": [{"title":"","org":"","from":"","to":"","summary":""}],\n  "career_status": "active"\n}' }
      ]
    }]
  } else {
    messages = [{
      role: 'user',
      content: 'Extract structured profile information from this CV. Return ONLY valid JSON, no markdown, no preamble, no backticks.\n\nSchema:\n{\n  "full_name": "",\n  "headline": "",\n  "summary": "",\n  "years_experience": 0,\n  "location": "",\n  "sectors": [],\n  "themes": [],\n  "skills": [],\n  "languages": [],\n  "education": [{"degree":"","institution":"","year":""}],\n  "experience": [{"title":"","org":"","from":"","to":"","summary":""}],\n  "career_status": "active"\n}\n\nCV content:\n' + fileContent
    }]
  }

  const response = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 2000, messages })
  })

  const result = await response.json()
  const text = result.content?.[0]?.text || '{}'
  try {
    return JSON.parse(text.replace(/```json|```/g, '').trim())
  } catch {
    return null
  }
}

// Only include fields that have actual values — never overwrite with empty
function buildSafeProfileUpdate(parsed, existingProfile) {
  const update = { cv_parsed: true }
  if (parsed.full_name?.trim()) update.full_name = parsed.full_name.trim()
  if (parsed.headline?.trim()) update.headline = parsed.headline.trim()
  if (parsed.summary?.trim()) update.summary = parsed.summary.trim()
  if (parsed.years_experience > 0) update.years_experience = parsed.years_experience
  if (parsed.location?.trim()) update.location = parsed.location.trim()
  if (parsed.sectors?.length > 0) update.sectors = parsed.sectors
  if (parsed.themes?.length > 0) update.themes = parsed.themes
  if (parsed.skills?.length > 0) update.skills = parsed.skills
  if (parsed.languages?.length > 0) update.languages = parsed.languages
  if (parsed.education?.length > 0) update.education = parsed.education
  if (parsed.experience?.length > 0) update.experience = parsed.experience
  if (parsed.career_status) update.career_status = parsed.career_status
  return update
}

export default function ProfilePage() {
  const { setPageTitle } = useOutletContext()
  const { user, profile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const fileRef = useRef()

  const [form, setForm] = useState({
    full_name: '', headline: '', summary: '', location: '',
    years_experience: '', career_status: 'seeking', sectors: [], languages: ''
  })
  const [saving, setSaving] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [parseProgress, setParseProgress] = useState('')
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

    try {
      setParseProgress('Uploading your CV...')
      const { error: uploadError } = await uploadDocument(user.id, file, 'cv')
      if (uploadError) {
        setParseMsg({ type: 'error', text: 'Upload failed: ' + uploadError.message })
        setParsing(false); return
      }

      setParseProgress('Reading document...')
      const fileContent = await extractTextFromFile(file)

      setParseProgress('AI is analysing your CV — this takes about 15 seconds...')
      const parsed = await parseWithClaude(fileContent, file.name)

      if (!parsed || !parsed.full_name) {
        setParseMsg({ type: 'error', text: 'Could not extract profile from CV. Your existing profile data has been preserved. Please fill in details manually.' })
        setParsing(false); setParseProgress(''); return
      }

      setParseProgress('Saving your profile...')
      // SAFE UPDATE: only overwrite fields that have actual values from CV
      const safeUpdate = buildSafeProfileUpdate(parsed, profile)
      const { error: saveError } = await upsertProfile(user.id, safeUpdate)

      if (saveError) {
        setParseMsg({ type: 'error', text: 'Profile could not be saved: ' + saveError.message })
      } else {
        await refreshProfile()
        setParseMsg({ type: 'success', text: `CV parsed successfully — ${Object.keys(safeUpdate).length - 1} fields updated. Switching to profile view...` })
        setTimeout(() => setActiveTab('profile'), 2000)
      }
    } catch (err) {
      setParseMsg({ type: 'error', text: 'Something went wrong. Your existing profile data has been preserved.' })
    }

    setParsing(false); setParseProgress('')
    if (fileRef.current) fileRef.current.value = ''
  }

  const initials = (name) => name ? name.split(' ').slice(0,2).map(n=>n[0]).join('').toUpperCase() : '?'
  const displayName = form.full_name || profile?.full_name || 'Your profile'

  return (
    <div style={{ maxWidth: '820px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <div className="avatar avatar-xl">{initials(displayName)}</div>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: '400', color: 'var(--text-primary)' }}>
            {displayName}
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
            <div style={{ background: 'var(--green-pale)', border: '1px solid #9fe1cb', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: '16px', fontSize: '12px', color: '#0f6e56' }}>
              <i className="ti ti-shield-check" style={{ marginRight: '6px' }} />
              Your existing profile data is protected — CV upload will only add or improve fields, never delete what you've saved.
            </div>
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
                padding: '48px 20px', textAlign: 'center', cursor: parsing ? 'wait' : 'pointer',
                background: parsing ? 'var(--surface-2)' : 'transparent', transition: 'all 0.15s'
              }}
            >
              {parsing ? (
                <>
                  <div className="spinner" style={{ width: '32px', height: '32px', margin: '0 auto 16px' }} />
                  <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>{parseProgress}</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>Please wait — do not close this page</p>
                </>
              ) : (
                <>
                  <i className="ti ti-upload" style={{ fontSize: '36px', color: 'var(--text-muted)' }} />
                  <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)', marginTop: '14px' }}>Click to upload your CV</p>
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
                <input value={form.headline} onChange={e => set('headline', e.target.value)} placeholder="e.g. Humanitarian & Development Advisor · 20+ years UN/INGO experience" />
              </div>
              <div className="form-group">
                <label className="form-label">Years of experience</label>
                <input type="number" value={form.years_experience} onChange={e => set('years_experience', e.target.value)} placeholder="e.g. 20" min="0" max="50" />
              </div>
              <div className="form-group">
                <label className="form-label">Career status</label>
                <select value={form.career_status} onChange={e => set('career_status', e.target.value)}>
                  {CAREER_STATUS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Languages (comma separated)</label>
                <input value={form.languages} onChange={e => set('languages', e.target.value)} placeholder="e.g. English, Arabic, Urdu, French" />
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

          {profile?.experience?.length > 0 && (
            <div className="card" style={{ marginBottom: '20px' }}>
              <div className="card-head"><h3>Experience extracted from CV</h3></div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {profile.experience.map((exp, i) => (
                  <div key={i} style={{ padding: '12px', background: 'var(--surface-2)', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--green)' }}>
                    <p style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>{exp.title}</p>
                    <p style={{ fontSize: '12px', color: 'var(--green)', marginTop: '2px' }}>{exp.org}</p>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{exp.from} – {exp.to}</p>
                    {exp.summary && <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>{exp.summary}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button type="button" onClick={() => navigate('/dashboard')} className="btn-ghost">
              ← Back to dashboard
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? <><div className="spinner" style={{ width: '14px', height: '14px' }} /> Saving…</> : <><i className="ti ti-device-floppy" style={{ fontSize: '15px' }} /> Save profile</>}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
