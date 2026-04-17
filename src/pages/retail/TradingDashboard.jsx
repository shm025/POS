import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useLang } from '../../contexts/LangContext'
import { supabase } from '../../lib/supabase'
import { fmt, fmtInt } from '../../utils/format'

const LOCALE_MAP = { AR: 'ar-LB', EN: 'en-GB', FR: 'fr-FR' }

export default function TradingDashboard() {
  const { company } = useAuth()
  const { t, lang } = useLang()
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [invoices, setInvoices] = useState([])
  const [topItem, setTopItem] = useState(null)
  const [topSuppliers, setTopSuppliers] = useState([])
  const [monthlySales, setMonthlySales] = useState([])

  useEffect(() => {
    if (!company?.id) return

    const now = new Date()
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0]
    const lastMonthEnd   = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const sixMonthsAgo   = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString().split('T')[0]

    Promise.all([
      supabase.from('items').select('*').eq('company_id', company.id),
      supabase.from('invoices').select('*').eq('company_id', company.id).eq('doc_type', 'invoices').order('created_at', { ascending: false }),
      // Last month sales invoice IDs (for top item lookup)
      supabase.from('invoices').select('id').eq('company_id', company.id).in('doc_type', ['invoices', 'sale']).gte('date', lastMonthStart).lte('date', lastMonthEnd),
      // This month purchases (for top supplier)
      supabase.from('invoices').select('customer_name, total').eq('company_id', company.id).eq('doc_type', 'purchases').gte('date', thisMonthStart),
      // Last 6 months sales (for bar chart)
      supabase.from('invoices').select('date, total').eq('company_id', company.id).in('doc_type', ['invoices', 'sale']).gte('date', sixMonthsAgo),
    ]).then(async ([{ data: it }, { data: inv }, { data: lastMonthInvs }, { data: purchasesThisMonth }, { data: salesData }]) => {
      setItems((it || []).map(r => ({ ...r, minStock: r.min_stock })))
      setInvoices(inv || [])

      // --- Most sold item last month ---
      const lastMonthIds = (lastMonthInvs || []).map(i => i.id)
      if (lastMonthIds.length > 0) {
        const { data: lineItems } = await supabase
          .from('invoice_items')
          .select('item_name, quantity')
          .in('invoice_id', lastMonthIds)
        const itemTotals = {}
        ;(lineItems || []).forEach(li => {
          itemTotals[li.item_name] = (itemTotals[li.item_name] || 0) + (li.quantity || 0)
        })
        const sorted = Object.entries(itemTotals).sort((a, b) => b[1] - a[1])
        setTopItem(sorted[0] ? { name: sorted[0][0], qty: sorted[0][1] } : null)
      } else {
        setTopItem(null)
      }

      // --- Top supplier this month ---
      const supplierMap = {}
      ;(purchasesThisMonth || []).forEach(p => {
        if (!p.customer_name) return
        supplierMap[p.customer_name] = (supplierMap[p.customer_name] || 0) + parseFloat(p.total || 0)
      })
      setTopSuppliers(Object.entries(supplierMap).sort((a, b) => b[1] - a[1]).slice(0, 5))

      // --- Last 6 months sales bar chart ---
      const buckets = []
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        buckets.push({
          key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
          label: d.toLocaleDateString(LOCALE_MAP[lang] || 'en-GB', { month: 'short' }),
          total: 0,
        })
      }
      ;(salesData || []).forEach(inv => {
        const monthKey = inv.date?.substring(0, 7)
        const bucket = buckets.find(b => b.key === monthKey)
        if (bucket) bucket.total += parseFloat(inv.total || 0)
      })
      setMonthlySales(buckets)
    })
  }, [company?.id, lang])

  const totalRevenue = invoices.reduce((s, i) => s + parseFloat(i.total || 0), 0)
  const lowStock = items.filter(i => i.stock <= i.minStock)
  const totalUnits = items.reduce((s, i) => s + (i.stock || 0), 0)

  const custMap = {}
  invoices.forEach(i => { custMap[i.customer_name] = (custMap[i.customer_name] || 0) + parseFloat(i.total || 0) })
  const topCustomers = Object.entries(custMap).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const maxCust = topCustomers[0]?.[1] || 1

  const chartMax = Math.max(...monthlySales.map(b => b.total), 1)
  const maxSupplier = topSuppliers[0]?.[1] || 1

  return (
    <div className="page-view">
      <div className="flex-between mb-4 no-print">
        <div>
          <h1 style={{ fontSize:'22px', fontWeight:900, color:'var(--primary)' }}>{t('dashboard_title')}</h1>
          <p className="text-muted">{new Date().toLocaleDateString(LOCALE_MAP[lang] || 'en-GB', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</p>
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
          <div className="stat-label">📦 {t('stat_top_item')}</div>
          <div className="stat-value" style={{ fontSize:'16px', lineHeight:'1.3' }}>
            {topItem ? topItem.name : '—'}
          </div>
          <div className="stat-sub">{topItem ? `${fmtInt(topItem.qty)} ${t('units_sold')}` : t('no_data_yet')}</div>
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
            <div className="card-title">📈 {t('sales_chart_6m')}</div>
          </div>
          <div style={{ padding: '0 12px 12px' }}>
            <div style={{ display:'flex', alignItems:'flex-end', gap:'6px', height:'120px' }}>
              {(monthlySales.length === 0 ? Array(6).fill({ total: 0 }) : monthlySales).map((b, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: chartMax > 0 ? `${Math.max((b.total / chartMax * 100), b.total > 0 ? 3 : 0).toFixed(1)}%` : '0%',
                    background: 'var(--primary)',
                    borderRadius: '3px 3px 0 0',
                    opacity: 0.75,
                    transition: 'height 0.4s ease',
                  }}
                />
              ))}
            </div>
            <div style={{ display:'flex', gap:'6px', marginTop:'6px' }}>
              {(monthlySales.length === 0 ? Array(6).fill('—') : monthlySales.map(b => b.label)).map((m, i) => (
                <span key={i} style={{ flex:1, textAlign:'center', fontSize:'10px', color:'var(--text-muted)' }}>{m}</span>
              ))}
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
            <div className="card-title">🏭 {t('stat_top_supplier')}</div>
            <button className="btn btn-sm btn-outline" onClick={() => navigate('/purchases-list')}>{t('view_all')}</button>
          </div>
          <div id="top-suppliers-list">
            {topSuppliers.length === 0 ? (
              <div className="empty-state" style={{ padding:'20px' }}><p style={{ fontSize:'13px' }}>{t('no_data')}</p></div>
            ) : topSuppliers.map(([name, val]) => (
              <div key={name} style={{ marginBottom:'12px' }}>
                <div className="flex-between" style={{ fontSize:'13px', marginBottom:'4px' }}>
                  <span style={{ fontWeight:600 }}>{name}</span>
                  <span style={{ direction:'ltr' }}>${fmt(val)}</span>
                </div>
                <div className="progress-bar-wrap">
                  <div className="progress-bar-fill" style={{ width: `${(val / maxSupplier * 100).toFixed(0)}%` }}></div>
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
