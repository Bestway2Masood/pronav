import { supabase } from './supabase'

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return { data, error }
}

export async function upsertProfile(userId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: userId, ...updates, updated_at: new Date().toISOString() })
    .select()
    .single()
  return { data, error }
}

export async function uploadDocument(userId, file, category = 'general') {
  const ext = file.name.split('.').pop()
  const fileName = `${userId}/${category}/${Date.now()}.${ext}`

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('documents')
    .upload(fileName, file, { upsert: true })

  if (uploadError) return { data: null, error: uploadError }

  const { data: urlData } = supabase.storage
    .from('documents')
    .getPublicUrl(fileName)

  const { data, error } = await supabase
    .from('documents')
    .insert({
      user_id: userId,
      name: file.name,
      category,
      path: fileName,
      url: urlData.publicUrl,
      size: file.size,
      type: file.type
    })
    .select()
    .single()

  return { data, error }
}

export async function getDocuments(userId) {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return { data, error }
}

export async function deleteDocument(documentId, path) {
  await supabase.storage.from('documents').remove([path])
  const { error } = await supabase.from('documents').delete().eq('id', documentId)
  return { error }
}

export async function parseProfileFromCV(fileContent, userId) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'anthropic-dangerous-direct-browser-access': 'true',
      'anthropic-version': '2023-06-01',
      'x-api-key': import.meta.env.VITE_ANTHROPIC_KEY
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `Extract structured profile information from this CV. Return ONLY valid JSON, no markdown, no preamble.

Schema:
{
  "full_name": "",
  "headline": "",
  "summary": "",
  "years_experience": 0,
  "current_location": "",
  "sectors": [],
  "themes": [],
  "skills": [],
  "languages": [],
  "education": [{"degree":"","institution":"","year":""}],
  "experience": [{"title":"","org":"","from":"","to":"","summary":""}],
  "career_status": "active|seeking|open"
}

CV content:
${fileContent}`
      }]
    })
  })

  const result = await response.json()
  const text = result.content?.[0]?.text || '{}'

  try {
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim())
    await upsertProfile(userId, {
      full_name: parsed.full_name,
      headline: parsed.headline,
      summary: parsed.summary,
      years_experience: parsed.years_experience,
      location: parsed.current_location,
      sectors: parsed.sectors,
      themes: parsed.themes,
      skills: parsed.skills,
      languages: parsed.languages,
      education: parsed.education,
      experience: parsed.experience,
      career_status: parsed.career_status,
      cv_parsed: true
    })
    return { data: parsed, error: null }
  } catch (e) {
    return { data: null, error: e }
  }
}

export function calculateProfileStrength(profile) {
  if (!profile) return 0
  const checks = [
    profile.full_name,
    profile.headline,
    profile.summary,
    profile.sectors?.length > 0,
    profile.skills?.length > 0,
    profile.experience?.length > 0,
    profile.education?.length > 0,
    profile.languages?.length > 0,
    profile.cv_parsed,
    profile.avatar_url
  ]
  return Math.round((checks.filter(Boolean).length / checks.length) * 100)
}
