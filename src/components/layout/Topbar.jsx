import { useAuth } from '../../contexts/AuthContext'
import { useLang } from '../../contexts/LangContext'

export default function Topbar({ onMenuOpen }) {
  const { company, profile, logout } = useAuth()
  const { lang, setLang } = useLang()

  const displayName = lang === 'AR' ? (company?.name || company?.name_en) : (company?.name_en || company?.name)
  const initials = (profile?.full_name || displayName || 'U')
    .split(' ')
    .map(w => w[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()

  return (
    <div className="topbar no-print">
      <button className="hamburger-btn" onClick={onMenuOpen}>☰</button>
      <div>
        <div className="topbar-company">{displayName || 'CATALAN POS'}</div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{company?.address || ''}</div>
      </div>
      <div className="topbar-right">
        <div className="lang-btns">
          {['FR', 'AR', 'EN'].map(l => (
            <button
              key={l}
              className={`lang-btn${lang === l ? ' active' : ''}`}
              onClick={() => setLang(l)}
            >
              {l === 'FR' ? 'FRN' : l === 'AR' ? 'ARB' : 'ENG'}
            </button>
          ))}
        </div>
        <div className="topbar-user">
          <div className="user-avatar">{initials}</div>
          <span style={{ fontSize: '13px', fontWeight: 600 }}>
            {profile?.full_name || displayName || ''}
          </span>
        </div>
        <button
          onClick={logout}
          className="mobile-logout"
          style={{ display: 'none', padding: '6px 10px', background: 'rgba(10,102,194,0.1)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', color: 'var(--primary)' }}
        >
          🚪
        </button>
      </div>
    </div>
  )
}
