import { useAuth } from '../../contexts/AuthContext'
import { useLang } from '../../contexts/LangContext'

export default function Topbar() {
  const { company, profile, logout } = useAuth()
  const { lang, setLang } = useLang()

  const initials = (profile?.full_name || company?.name || 'U')
    .split(' ')
    .map(w => w[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()

  return (
    <div className="topbar no-print">
      <div className="topbar-left">
        <div className="topbar-company">{company?.name || 'CATALAN POS'}</div>
        {company?.address && (
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>📍</span>
            <span>{company.address}</span>
          </div>
        )}
      </div>

      <div className="topbar-right">
        <div className="lang-btns">
          {['FR', 'AR', 'EN'].map(l => (
            <button
              key={l}
              className={`lang-btn${lang === l ? ' active' : ''}`}
              onClick={() => setLang(l)}
            >
              {l === 'FR' ? 'FR' : l === 'AR' ? 'ع' : 'EN'}
            </button>
          ))}
        </div>

        <div className="topbar-user">
          <div className="user-avatar">{initials}</div>
          <span className="topbar-username">
            {profile?.full_name || company?.name || ''}
          </span>
        </div>

        <button
          onClick={logout}
          className="mobile-logout"
          style={{
            display: 'none', padding: '7px 10px',
            background: 'rgba(229,62,62,0.08)',
            border: '1px solid rgba(229,62,62,0.2)',
            borderRadius: '8px', cursor: 'pointer',
            fontSize: '14px', color: 'var(--danger)',
          }}
          title="تسجيل الخروج"
        >
          🚪
        </button>
      </div>
    </div>
  )
}
