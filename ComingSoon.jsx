import { useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'

export default function ComingSoon({ title, icon, description }) {
  const { setPageTitle } = useOutletContext()
  useEffect(() => { setPageTitle(title) }, [title])
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center', maxWidth: '380px' }}>
        <div style={{ width: '56px', height: '56px', background: 'var(--green-pale)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <i className={`ti ${icon}`} style={{ fontSize: '26px', color: 'var(--green)' }} />
        </div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: '400', color: 'var(--text-primary)', marginBottom: '10px' }}>{title}</h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.7' }}>{description}</p>
        <div style={{ marginTop: '20px', display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'var(--green-pale)', color: 'var(--green)', padding: '8px 16px', borderRadius: 'var(--radius-full)', fontSize: '12px', fontWeight: '500' }}>
          <i className="ti ti-clock" style={{ fontSize: '14px' }} /> Coming in the next phase
        </div>
      </div>
    </div>
  )
}
