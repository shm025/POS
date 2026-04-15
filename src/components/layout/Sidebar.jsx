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
  customers: 'nav_customers', pos: 'nav_pos', commissions: 'nav_commissions',
}

const BIZ_ICON = { barber: '💈', retail: '🛒', restaurant: '🍽️', building_materials: '🏗️', auto_parts: '🔧' }

export default function Sidebar() {
  const { company, logout } = useAuth()
  const { t } = useLang()
  const navigate = useNavigate()
  const location = useLocation()

  const businessType = company?.business_type || 'retail'
  const menuItems = SIDEBAR_MENUS[businessType] || SIDEBAR_MENUS.retail
  const year = new Date().getFullYear()

  const bizLabel = {
    barber: t('biz_barber') || 'صالون حلاقة',
    retail: t('biz_retail') || 'تجارة تجزئة',
    restaurant: 'مطعم',
    building_materials: 'مواد بناء',
    auto_parts: 'قطع سيارات',
  }

  function isActive(page) {
    const path = location.pathname.replace('/', '')
    if (page === 'dashboard' && (path === '' || path === 'dashboard')) return true
    return path === page || path.startsWith(page + '/')
  }

  return (
    <div className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          {BIZ_ICON[businessType] || '🏪'}
        </div>
        <div>
          <h2>{company?.name || 'CATALAN POS'}</h2>
          <p>{bizLabel[businessType] || ''}</p>
        </div>
      </div>

      {/* Period badge */}
      <div className="period-badge">
        01/01/{year} — 31/12/{year}
      </div>

      {/* Nav items */}
      <div style={{ flex: 1, paddingBottom: '8px' }}>
        {menuItems.map(item => (
          <div
            key={item.page}
            className={`nav-item${isActive(item.page) ? ' active' : ''}`}
            onClick={() => navigate('/' + item.page)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{t(PAGE_KEY[item.page] || item.page)}</span>
          </div>
        ))}
      </div>

      {/* Footer / Logout */}
      <div className="sidebar-footer">
        <button className="sidebar-logout-btn" onClick={logout}>
          <span>🚪</span>
          <span>{t('logout') || 'تسجيل الخروج'}</span>
        </button>
      </div>
    </div>
  )
}
