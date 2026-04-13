import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useLang } from '../../contexts/LangContext'
import { SIDEBAR_MENUS } from '../../lib/constants'

const PAGE_KEY = {
  dashboard: 'nav_dashboard', services: 'nav_services', employees: 'nav_employees',
  reservations: 'nav_reservations', invoices: 'nav_invoices', 'invoices-list': 'nav_inv_list',
  'sales-return': 'nav_sales_return', orders: 'nav_orders', purchases: 'nav_purchases_inv',
  'purchases-list': 'nav_pur_list', 'purchases-return': 'nav_purchases_return',
  items: 'nav_items', 'stock-report': 'nav_stock_report', warehouse: 'nav_warehouse',
  accounts: 'nav_accounts', 'account-ledger': 'nav_ledger', 'trial-balance': 'nav_trial_balance',
  'journal-entries': 'nav_journal_entries', supplies: 'nav_supplies', bills: 'nav_bills',
  'receipt-voucher': 'nav_receipt', 'payment-voucher': 'nav_payment',
  'company-settings': 'nav_company_settings',
}

export default function Sidebar() {
  const { company, logout } = useAuth()
  const { t } = useLang()
  const navigate = useNavigate()
  const location = useLocation()

  const businessType = company?.business_type || 'auto_parts'
  const items = SIDEBAR_MENUS[businessType] || SIDEBAR_MENUS.auto_parts
  const year = new Date().getFullYear()

  const bizLabel = { barber: t('biz_barber'), auto_parts: t('biz_auto_parts'), building_materials: t('biz_building') }

  function isActive(page) {
    const path = location.pathname.replace('/', '')
    if (page === 'dashboard' && (path === '' || path === 'dashboard')) return true
    return path === page || path.startsWith(page + '/')
  }

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <h2>{company?.name || 'CATALAN POS'}</h2>
        <p>{bizLabel[businessType] || ''}</p>
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
          <span>{t(PAGE_KEY[item.page] || item.page)}</span>
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
          🚪 {t('logout')}
        </button>
      </div>
    </div>
  )
}
