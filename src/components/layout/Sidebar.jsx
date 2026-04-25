import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useLang } from '../../contexts/LangContext'
import { SIDEBAR_MENUS, BUSINESS_EMAILS } from '../../lib/constants'

const PAGE_KEY = {
  dashboard: 'nav_dashboard', services: 'nav_services', employees: 'nav_employees',
  reservations: 'nav_reservations', invoices: 'nav_invoices', 'invoices-list': 'nav_inv_list',
  'sales-return': 'nav_sales_return', orders: 'nav_orders', purchases: 'nav_purchases_inv',
  'purchases-list': 'nav_pur_list', 'purchases-return': 'nav_purchases_return',
  items: 'nav_items', 'stock-report': 'nav_stock_report', warehouse: 'nav_warehouse',
  accounts: 'nav_accounts', 'account-ledger': 'nav_ledger', 'trial-balance': 'nav_trial_balance',
  'journal-entries': 'nav_journal_entries', supplies: 'nav_supplies', bills: 'nav_bills',
  'receipt-voucher': 'nav_receipt', 'payment-voucher': 'nav_payment',
  'company-settings': 'nav_company_settings', customers: 'nav_customers',
  commissions: 'nav_commissions', pos: 'nav_pos',
  'staff-board': 'nav_staff_board',
  'monthly-report': 'nav_monthly_report',
}

export default function Sidebar({ isOpen, onClose }) {
  const { user, company, logout } = useAuth()
  const { t, lang } = useLang()
  const navigate = useNavigate()
  const location = useLocation()

  const email = user?.email
  const businessType = email === BUSINESS_EMAILS.barber ? 'barber'
    : email === BUSINESS_EMAILS.retail ? 'retail'
    : company?.business_type || 'retail'
  const items = SIDEBAR_MENUS[businessType] || SIDEBAR_MENUS.retail
  const year = new Date().getFullYear()

  const bizLabel = { barber: t('biz_barber'), retail: t('biz_retail') }

  function isActive(page) {
    const path = location.pathname.replace('/', '')
    if (page === 'dashboard' && (path === '' || path === 'dashboard')) return true
    return path === page || path.startsWith(page + '/')
  }

  function handleNav(page) {
    navigate('/' + page)
    onClose?.()
  }

  return (
    <div className={`sidebar${isOpen ? ' open' : ''}`}>
      <div className="sidebar-logo">
        <h2>{lang === 'AR' ? (company?.name || company?.name_en) : (company?.name_en || company?.name) || 'CATALAN POS'}</h2>
        <p>{bizLabel[businessType] || ''}</p>
      </div>

      <div className="period-badge">
        01/01/{year} — 31/12/{year}
      </div>

      {items.map(item => (
        <div
          key={item.page}
          className={`nav-item${isActive(item.page) ? ' active' : ''}`}
          onClick={() => handleNav(item.page)}
        >
          <span className="nav-icon">{item.icon}</span>
          <span>{t(PAGE_KEY[item.page] || item.page)}</span>
        </div>
      ))}

      <div className="sidebar-logout" style={{ marginTop: 'auto', padding: '16px' }}>
        <button
          onClick={logout}
          className="sidebar-logout-btn"
        >
          🚪 {t('logout')}
        </button>
      </div>
    </div>
  )
}
