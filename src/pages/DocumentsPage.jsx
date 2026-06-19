import { useEffect, useState, useRef } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { uploadDocument, getDocuments, deleteDocument } from '../lib/profile'

const CATEGORIES = ['cv', 'cover_letter', 'reference', 'certificate', 'report', 'general']
const CAT_LABELS = { cv: 'CV', cover_letter: 'Cover Letter', reference: 'Reference', certificate: 'Certificate', report: 'Report', general: 'General' }
const CAT_COLORS = { cv: 'tag-green', cover_letter: 'tag-blue', reference: 'tag-purple', certificate: 'tag-amber', report: 'tag-blue', general: 'tag-gray' }

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days/7)} weeks ago`
  return `${Math.floor(days/30)} months ago`
}

export default function DocumentsPage() {
  const { setPageTitle } = useOutletContext()
  const { user } = useAuth()
  const fileRef = useRef()
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [category, setCategory] = useState('general')
  const [msg, setMsg] = useState(null)
  const [filter, setFilter] = useState('all')

  useEffect(() => { setPageTitle('Documents'); load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await getDocuments(user.id)
    setDocs(data || [])
    setLoading(false)
  }

  async function handleUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true); setMsg(null)
    const { error } = await uploadDocument(user.id, file, category)
    if (error) setMsg({ type: 'error', text: 'Upload failed: ' + error.message })
    else { setMsg({ type: 'success', text: `${file.name} uploaded successfully.` }); await load() }
    setUploading(false)
    fileRef.current.value = ''
  }

  async function handleDelete(doc) {
    if (!confirm(`Delete "${doc.name}"? This cannot be undone.`)) return
    const { error } = await deleteDocument(doc.id, doc.path)
    if (error) setMsg({ type: 'error', text: 'Delete failed.' })
    else { setMsg({ type: 'success', text: 'Document deleted.' }); await load() }
  }

  const filtered = filter === 'all' ? docs : docs.filter(d => d.category === filter)

  return (
    <div style={{ maxWidth: '900px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: '400' }}>Documents</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '3px' }}>All your files in one place — powering personalised AI advice</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select value={category} onChange={e => setCategory(e.target.value)} style={{ width: 'auto', fontSize: '13px', padding: '8px 12px' }}>
            {CATEGORIES.map(c => <option key={c} value={c}>{CAT_LABELS[c]}</option>)}
          </select>
          <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={handleUpload} />
          <button className="btn-primary" onClick={() => fileRef.current.click()} disabled={uploading}>
            {uploading ? <><div className="spinner" style={{ width: '14px', height: '14px' }} /> Uploading…</> : <><i className="ti ti-upload" style={{ fontSize: '15px' }} /> Upload file</>}
          </button>
        </div>
      </div>

      {msg && (
        <div className={`alert alert-${msg.type}`} style={{ marginBottom: '16px' }}>
          <i className={`ti ${msg.type === 'success' ? 'ti-circle-check' : 'ti-alert-circle'}`} style={{ fontSize: '16px', flexShrink: 0 }} />
          {msg.text}
        </div>
      )}

      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {['all', ...CATEGORIES].map(c => (
          <button key={c} onClick={() => setFilter(c)} style={{
            padding: '5px 12px', borderRadius: 'var(--radius-full)', fontSize: '12px', border: '1px solid',
            background: filter === c ? 'var(--navy)' : 'var(--surface)',
            color: filter === c ? '#fff' : 'var(--text-secondary)',
            borderColor: filter === c ? 'var(--navy)' : 'var(--border-mid)'
          }}>
            {c === 'all' ? 'All files' : CAT_LABELS[c]}
          </button>
        ))}
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center' }}>
            <i className="ti ti-file-off" style={{ fontSize: '36px', color: 'var(--text-muted)' }} />
            <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)', marginTop: '12px' }}>No documents yet</p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Upload your CV, cover letters, and other documents to get started</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Name', 'Category', 'Size', 'Uploaded', ''].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '500', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((doc, i) => (
                <tr key={doc.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '30px', height: '30px', background: '#e6f1fb', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <i className="ti ti-file-text" style={{ fontSize: '14px', color: '#185fa5' }} />
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>{doc.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}><span className={`tag ${CAT_COLORS[doc.category] || 'tag-gray'}`}>{CAT_LABELS[doc.category] || doc.category}</span></td>
                  <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-muted)' }}>{formatSize(doc.size || 0)}</td>
                  <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-muted)' }}>{timeAgo(doc.created_at)}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      {doc.url && <a href={doc.url} target="_blank" rel="noreferrer" style={{ padding: '5px 10px', fontSize: '12px', color: 'var(--green)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><i className="ti ti-download" style={{ fontSize: '13px' }} /></a>}
                      <button onClick={() => handleDelete(doc)} style={{ padding: '5px 10px', fontSize: '12px', color: 'var(--red)', background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                        <i className="ti ti-trash" style={{ fontSize: '13px' }} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
