import { useEffect, useState, useRef } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { upsertProfile, uploadDocument, calculateProfileStrength } from '../lib/profile'

const SECTORS = ['Education in Emergencies', 'Child Protection', 'Gender Equality', 'Public Health', 'Early Childhood Development', 'Diaspora Engagement', 'Humanitarian Coordination', 'Food Security', 'WASH', 'Shelter & NFI', 'Livelihoods', 'Mental Health & Psychosocial', 'Refugee Response', 'Peacebuilding', 'Climate & Environment', 'Urban Resilience']
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

async function parseWithClaude(fileContent, fileName, apiKey) {
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

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'anthropic-dangerous-direct-browser-access': 'true',
      'anthropic-version': '2023-06-01',
      'x-api-key': apiKey
    },
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
      setParseProgress('Saving your profile...')
      const safeUpdate = { cv_parsed: true }
      if (parsed.full_name?.trim()) safeUpdate.full_name = parsed.full_name.trim()
      if (parsed.headline?.trim()) safeUpdate.headline = parsed.headline.trim()
      if (parsed.summary?.trim()) safeUpdate.summary = parsed.summary.trim()
      if (parsed.years_experience > 0) safeUpdate.years_experience = parsed.years_experience
      if (parsed.location?.trim()) safeUpdate.location = parsed.location.trim()
      if (parsed.sectors?.length > 0) safeUpdate.sectors = parsed.sectors
      if (parsed.themes?.length > 0) safeUpdate.themes = parsed.themes
      if (parsed.skills?.length > 0) safeUpdate.skills = parsed.skills
      if (parsed.languages?.length > 0) safeUpdate.languages = parsed.languages
      if (parsed.education?.length > 0) safeUpdate.education = parsed.education
      if (parsed.experience?.length > 0) safeUpdate.experience = parsed.experience
      if (parsed.career_status) safeUpdate.career_status = parsed.career_status
      const { error: saveError } = await upsertProfile(user.id, safeUpdate)
      if (saveError) {
        setParseMsg({ type: 'error', text: 'Profile could not be saved: ' + saveError.message })
      } else {
        await refreshProfile()
       setParseMsg({ type: 'success', text: 'CV parsed successfully — your existing data has been preserved and enhanced. Switching to profile view...' })
        setTimeout(() => setActiveTab('profile'), 2000)
      }
    } catch (err) {
      setParseMsg({ type: 'error', text: 'Something went wrong. Please try again or fill in your profile manually.' })
    }
    setParsing(false); setParseProgress('')
    if (fileRef.current) fileRef.current.value = ''
  }

  const initials = (name) => name ?
