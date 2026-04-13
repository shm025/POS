import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { SIDEBAR_MENUS } from '../../lib/constants'

export default function Sidebar() {
  const { company, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const businessType = company?.business_type || 'auto_parts'
  const items = SIDEBAR_MENUS[businessType] || SIDEBAR_MENUS.auto_parts
  const year = new Date().getFullYear()

  const businessLabel = {
    barber: 'صالون حلاقة',
    auto_parts: 'قطع غيار سيارات',
    building_materials: 'مواد بناء',
  }

  function isActive(page) {
    const path = location.pathname.replace('/', '')
    if (page === 'dashboard' && (path === '' || path === 'dashboard')) return true
    return path === page || path.startsWith(page + '/')
  }

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <h2>{company?.name || 'CATALAN POS'}</h2>
        <p>{businessLabel[businessType] || ''}</p>
      </div>

      <div className="period-badge">
        01/01/{year} — 31/12/{year}
      </div>

      {items.map(item => (
        <div
          key={item.page}
          className={`nav-item${isActive(item.page) ? ' active' : ''}`}
          onClick={() => navigate('/' + item.page)}
        >
          <span className="nav-icon">{item.icon}</span>
          <span>{item.label}</span>
        </div>
      ))}

      <div className="sidebar-logout" style={{ marginTop: 'auto', padding: '16px' }}>
        <button
          onClick={logout}
          style={{
            width: '100%', padding: '10px',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px', color: 'rgba(255,255,255,0.6)',
            cursor: 'pointer', fontFamily: "'Cairo',sans-serif",
            fontSize: '13px', fontWeight: 600,
          }}
        >
          🚪 تسجيل الخروج
        </button>
      </div>
    </div>
  )
}
