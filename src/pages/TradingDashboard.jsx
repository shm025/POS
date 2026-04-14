import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../contexts/LangContext'
import { supabase } from '../lib/supabase'
import { fmt, fmtInt } from '../utils/format'

export default function TradingDashboard() {
  const { company } = useAuth()
  const { t } = useLang()
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [invoices, setInvoices] = useState([])

  useEffect(() => {
    if (!company?.id) return
    Promise.all([
      supabase.from('items').select('*').eq('company_id', company.id),
      supabase.from('invoices').select('*').eq('company_id', company.id).eq('doc_type', 'invoices').order('created_at', { ascending: false }),
    ]).then(([{ data: it }, { data: inv }]) => {
      setItems((it || []).map(r => ({ ...r, minStock: r.min_stock })))
      setInvoices(inv || [])
    })
  }, [company?.id])

  const totalRevenue = invoices.reduce((s, i) => s + parseFloat(i.total || 0), 0)
  const paidCount = invoices.filter(i => i.status === 'paid').length
  const lowStock = items.filter(i => i.stock <= i.minStock)
  const totalUnits = items.reduce((s, i) => s + (i.stock || 0), 0)

  // customer_name is the party field in cloud schema
  const custMap = {}
  invoices.forEach(i => { custMap[i.customer_name] = (custMap[i.customer_name] || 0) + parseFloat(i.total || 0) })
  const topCustomers = Object.entries(custMap).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const maxCust = topCustomers[0]?.[1] || 1

  const recentInvoices = invoices.slice(0, 5)

  const chartVals = [65, 80, 72, 90, 85, 95]
  const chartMax = Math.max(...chartVals)
  const chartMonths = ['نوفمبر', 'ديسمبر', 'يناير', 'فبراير', 'مارس', 'أبريل']

  return (
    <div className="page-view">
      <div className="flex-between mb-4 no-print">
        <div>
          <h1 style={{ fontSize:'22px', fontWeight:900, color:'var(--primary)' }}>{t('dashboard_title')}</h1>
          <p className="text-muted">{new Date().toLocaleDateString('ar-LB', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/invoices')}>🧾 {t('new_invoice_btn')}</button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">{t('total_revenue')}</div>
          <div className="stat-value" style={{ direction:'ltr' }}>${fmt(totalRevenue)}</div>
          <div className="stat-sub">{t('stat_rev_sub')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t('paid_invoices')}</div>
          <div className="stat-value">{fmtInt(paidCount)}</div>
          <div className="stat-sub">{t('out_of')} {fmtInt(invoices.length)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t('inventory_items')}</div>
          <div className="stat-value">{fmtInt(items.length)}</div>
          <div className="stat-sub">{fmtInt(totalUnits)} {t('total_units_sub')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t('low_stock_count')}</div>
          <div className="stat-value" style={{ color:'var(--danger)' }}>{fmtInt(lowStock.length)}</div>
          <div className="stat-sub">{t('needs_reorder')}</div>
        </div>
      </div>

      <div className="grid-2 mt-4">
        <div className="card">
          <div className="card-header">
            <div className="card-title">📈 {t('sales_chart_title')}</div>
          </div>
          <div className="mini-chart">
            <div className="mini-bars" id="sales-chart">
              {chartVals.map((v, i) => (
                <div key={i} className="mini-bar" style={{ height: `${(v / chartMax * 100)}%` }}></div>
              ))}
            </div>
            <div className="chart-months">
              {chartMonths.map((m, i) => <span key={i}>{m}</span>)}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">⚠️ {t('low_stock_title')}</div>
            <button className="btn btn-sm btn-outline" onClick={() => navigate('/items')}>{t('view_all')}</button>
          </div>
          <div id="low-stock-list">
            {lowStock.length === 0 ? (
              <div className="empty-state" style={{ padding:'20px' }}><p style={{ fontSize:'13px' }}>{t('stock_ok')}</p></div>
            ) : lowStock.slice(0, 5).map(i => (
              <div key={i.id} className="flex-between" style={{ padding:'8px 0', borderBottom:'1px solid var(--border-light)', fontSize:'13px' }}>
                <span>{i.name}</span>
                <span className="badge badge-danger">{t('th_stock')}: {fmtInt(i.stock)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid-2 mt-4">
        <div className="card">
          <div className="card-header">
            <div className="card-title">🧾 {t('recent_invoices_title')}</div>
            <button className="btn btn-sm btn-outline" onClick={() => navigate('/invoices-list')}>{t('view_all')}</button>
          </div>
          <div id="recent-invoices-list">
            {recentInvoices.length === 0 ? (
              <div className="empty-state" style={{ padding:'20px' }}><p style={{ fontSize:'13px' }}>{t('no_invoices')}</p></div>
            ) : recentInvoices.map(inv => (
              <div key={inv.id} className="flex-between" style={{ padding:'8px 0', borderBottom:'1px solid var(--border-light)', fontSize:'13px' }}>
                <div>
                  <div style={{ fontWeight:600 }}>{inv.number}</div>
                  <div style={{ color:'var(--text-muted)' }}>{inv.customer_name}</div>
                </div>
                <div style={{ textAlign:'left' }}>
                  <div style={{ fontWeight:700, direction:'ltr' }}>${fmt(inv.total)}</div>
                  <span className={`badge ${inv.status === 'paid' ? 'badge-success' : 'badge-warning'}`}>{inv.status === 'paid' ? t('status_paid') : t('status_unpaid')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">🏆 {t('top_customers_title')}</div>
          </div>
          <div id="top-customers-list">
            {topCustomers.length === 0 ? (
              <div className="empty-state" style={{ padding:'20px' }}><p style={{ fontSize:'13px' }}>{t('no_data')}</p></div>
            ) : topCustomers.map(([name, val]) => (
              <div key={name} style={{ marginBottom:'12px' }}>
                <div className="flex-between" style={{ fontSize:'13px', marginBottom:'4px' }}>
                  <span style={{ fontWeight:600 }}>{name}</span>
                  <span style={{ direction:'ltr' }}>${fmt(val)}</span>
                </div>
                <div className="progress-bar-wrap">
                  <div className="progress-bar-fill" style={{ width: `${(val / maxCust * 100).toFixed(0)}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
