import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../contexts/LangContext'
import { supabase } from '../lib/supabase'
import { fmt, fmtInt } from '../utils/format'

const LOCALE_MAP = { AR: 'ar-LB', EN: 'en-GB', FR: 'fr-FR' }

export default function TradingDashboard() {
  const { company } = useAuth()
  const { t, lang } = useLang()
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)

  const today = new Date().toISOString().split('T')[0]
  const thisMonth = new Date().toISOString().slice(0, 7)

  useEffect(() => {
    if (!company?.id) return
    setLoading(true)
    Promise.all([
      supabase.from('items').select('id,name,stock,reorder_point,code').eq('company_id', company.id),
      supabase.from('invoices')
        .select('id,number,total,status,customer_name,created_at,doc_type')
        .eq('company_id', company.id)
        .eq('doc_type', 'sale')
        .order('created_at', { ascending: false })
        .limit(200),
    ]).then(([{ data: it }, { data: inv }]) => {
      setItems(it || [])
      setInvoices(inv || [])
      setLoading(false)
    })
  }, [company?.id])

  // KPIs
  const totalRevenue = invoices.reduce((s, i) => s + parseFloat(i.total || 0), 0)
  const todayRevenue = invoices
    .filter(i => i.created_at?.startsWith(today))
    .reduce((s, i) => s + parseFloat(i.total || 0), 0)
  const monthRevenue = invoices
    .filter(i => i.created_at?.startsWith(thisMonth))
    .reduce((s, i) => s + parseFloat(i.total || 0), 0)
  const paidCount = invoices.filter(i => i.status === 'paid').length
  const unpaidCount = invoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled').length
  const lowStock = items.filter(i => (i.stock || 0) <= (i.reorder_point || 0))
  const totalUnits = items.reduce((s, i) => s + (i.stock || 0), 0)

  // Top customers
  const custMap = {}
  invoices.forEach(i => {
    if (i.customer_name) {
      custMap[i.customer_name] = (custMap[i.customer_name] || 0) + parseFloat(i.total || 0)
    }
  })
  const topCustomers = Object.entries(custMap).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const maxCust = topCustomers[0]?.[1] || 1

  const recentInvoices = invoices.slice(0, 6)

  // Mini chart — last 6 months revenue
  const monthLabels = []
  const monthRevenues = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const key = d.toISOString().slice(0, 7)
    const label = d.toLocaleString(LOCALE_MAP[lang] || 'ar-LB', { month: 'short' })
    monthLabels.push(label)
    monthRevenues.push(invoices.filter(inv => inv.created_at?.startsWith(key)).reduce((s, inv) => s + parseFloat(inv.total || 0), 0))
  }
  const chartMax = Math.max(...monthRevenues, 1)

  const dateStr = new Date().toLocaleDateString(LOCALE_MAP[lang] || 'ar-LB', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })

  return (
    <div className="page-view">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <div className="dashboard-title">{t('dashboard_title') || 'لوحة التحكم'}</div>
          <div className="dashboard-date">{dateStr}</div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-outline" onClick={() => navigate('/invoices-list')}>
            📋 {t('nav_inv_list') || 'قائمة الفواتير'}
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/invoices')}>
            ➕ {t('new_invoice_btn') || 'فاتورة جديدة'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="stats-grid">
        <div className="stat-card stat-card-accent">
          <div className="stat-icon stat-icon-blue">💰</div>
          <div className="stat-label">{t('total_revenue') || 'إجمالي الإيرادات'}</div>
          <div className="stat-value" style={{ direction: 'ltr' }}>${fmt(totalRevenue)}</div>
          <div className="kpi-trend positive">↑ اليوم: ${fmt(todayRevenue)}</div>
        </div>

        <div className="stat-card stat-card-success">
          <div className="stat-icon stat-icon-green">📈</div>
          <div className="stat-label">إيرادات الشهر</div>
          <div className="stat-value" style={{ direction: 'ltr' }}>${fmt(monthRevenue)}</div>
          <div className="stat-sub">{fmtInt(invoices.filter(i => i.created_at?.startsWith(thisMonth)).length)} فاتورة هذا الشهر</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon-blue">🧾</div>
          <div className="stat-label">{t('paid_invoices') || 'فواتير مدفوعة'}</div>
          <div className="stat-value">{fmtInt(paidCount)}</div>
          <div className="stat-sub" style={{ color: unpaidCount > 0 ? 'var(--warning)' : 'var(--text-muted)' }}>
            {fmtInt(unpaidCount)} معلقة
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon-blue">📦</div>
          <div className="stat-label">{t('inventory_items') || 'المخزون'}</div>
          <div className="stat-value">{fmtInt(items.length)}</div>
          <div className="stat-sub">{fmtInt(totalUnits)} وحدة إجمالية</div>
        </div>

        <div className="stat-card stat-card-danger">
          <div className="stat-icon stat-icon-red">⚠️</div>
          <div className="stat-label">{t('low_stock_count') || 'مخزون منخفض'}</div>
          <div className="stat-value" style={{ color: lowStock.length > 0 ? 'var(--danger)' : 'var(--success)' }}>
            {fmtInt(lowStock.length)}
          </div>
          <div className="stat-sub">{t('needs_reorder') || 'تحتاج إعادة طلب'}</div>
        </div>
      </div>

      <div className="grid-2 mt-4">
        {/* Sales Chart */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">📊 المبيعات — آخر 6 أشهر</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="mini-chart" style={{ height: '80px' }}>
              {monthRevenues.map((v, i) => (
                <div
                  key={i}
                  className="mini-bar"
                  style={{ height: `${Math.max((v / chartMax) * 100, 3)}%` }}
                  title={`${monthLabels[i]}: $${fmt(v)}`}
                />
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', paddingLeft: '2px', paddingRight: '2px' }}>
              {monthLabels.map((m, i) => <span key={i}>{m}</span>)}
            </div>
          </div>
        </div>

        {/* Low Stock */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">⚠️ {t('low_stock_title') || 'مخزون منخفض'}</div>
            <button className="btn btn-sm btn-outline" onClick={() => navigate('/stock-report')}>
              {t('view_all') || 'عرض الكل'}
            </button>
          </div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>جاري التحميل...</div>
          ) : lowStock.length === 0 ? (
            <div className="empty-state" style={{ padding: '24px' }}>
              <div className="icon">✅</div>
              <p>{t('stock_ok') || 'المخزون بخير'}</p>
            </div>
          ) : lowStock.slice(0, 6).map(i => (
            <div key={i.id} className="flex-between" style={{ padding: '9px 0', borderBottom: '1px solid var(--border-light)', fontSize: '13px' }}>
              <div>
                <div style={{ fontWeight: 600 }}>{i.name}</div>
                {i.code && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{i.code}</div>}
              </div>
              <span className="badge badge-danger">{fmtInt(i.stock)} {t('th_stock') || 'وحدة'}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid-2 mt-4">
        {/* Recent Invoices */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">🧾 {t('recent_invoices_title') || 'آخر الفواتير'}</div>
            <button className="btn btn-sm btn-outline" onClick={() => navigate('/invoices-list')}>
              {t('view_all') || 'عرض الكل'}
            </button>
          </div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>جاري التحميل...</div>
          ) : recentInvoices.length === 0 ? (
            <div className="empty-state" style={{ padding: '24px' }}>
              <div className="icon">🧾</div>
              <p>{t('no_invoices') || 'لا توجد فواتير'}</p>
            </div>
          ) : recentInvoices.map(inv => (
            <div key={inv.id} className="flex-between" style={{ padding: '9px 0', borderBottom: '1px solid var(--border-light)', fontSize: '13px' }}>
              <div>
                <div style={{ fontWeight: 700, direction: 'ltr' }}>{inv.number}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                  {inv.customer_name || '—'} • {inv.created_at ? new Date(inv.created_at).toLocaleDateString('ar-LB') : ''}
                </div>
              </div>
              <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                <div style={{ fontWeight: 700, direction: 'ltr' }}>${fmt(inv.total)}</div>
                <span className={`badge ${inv.status === 'paid' ? 'badge-success' : 'badge-warning'}`}>
                  {inv.status === 'paid' ? (t('status_paid') || 'مدفوع') : (t('status_unpaid') || 'معلق')}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Top Customers */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">🏆 {t('top_customers_title') || 'أفضل العملاء'}</div>
            <button className="btn btn-sm btn-outline" onClick={() => navigate('/customers')}>
              {t('view_all') || 'عرض الكل'}
            </button>
          </div>
          {topCustomers.length === 0 ? (
            <div className="empty-state" style={{ padding: '24px' }}>
              <div className="icon">🏆</div>
              <p>{t('no_data') || 'لا توجد بيانات'}</p>
            </div>
          ) : topCustomers.map(([name, val]) => (
            <div key={name} style={{ marginBottom: '14px' }}>
              <div className="flex-between" style={{ fontSize: '13px', marginBottom: '5px' }}>
                <span style={{ fontWeight: 600 }}>{name}</span>
                <span style={{ direction: 'ltr', fontWeight: 700, color: 'var(--primary)' }}>${fmt(val)}</span>
              </div>
              <div className="progress-bar-wrap">
                <div className="progress-bar-fill" style={{ width: `${((val / maxCust) * 100).toFixed(0)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
