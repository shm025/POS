import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { useLang } from '../contexts/LangContext'
import { fmt, fmtInt } from '../utils/format'
import { exportStockCSV } from '../utils/csv'

export default function StockReportPage() {
  const { company } = useAuth()
  const { t } = useLang()
  const [items, setItems] = useState([])

  useEffect(() => {
    if (!company?.id) return
    supabase
      .from('items')
      .select('*')
      .eq('company_id', company.id)
      .then(({ data }) => {
        setItems((data || []).map(r => ({ ...r, cost: r.cost_price, price: r.selling_price, minStock: r.min_stock, desc: r.description })))
      })
  }, [company?.id])

  const totalValue = items.reduce((s, i) => s + (i.stock * i.cost), 0)
  const lowCount = items.filter(i => i.stock <= i.minStock).length

  return (
    <div className="page-view">
      <div className="flex-between mb-4 no-print">
        <h1 style={{ fontSize:'20px', fontWeight:900, color:'var(--primary)' }}>📈 {t('stock_report_title')}</h1>
        <button className="btn btn-outline" onClick={() => exportStockCSV(items)}>⬇ {t('export_btn')}</button>
      </div>

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-label">{t('total_items_label')}</div><div className="stat-value">{fmtInt(items.length)}</div></div>
        <div className="stat-card"><div className="stat-label">{t('total_units_label')}</div><div className="stat-value">{fmtInt(items.reduce((s,i)=>s+i.stock,0))}</div></div>
        <div className="stat-card"><div className="stat-label">{t('stock_value_label')}</div><div className="stat-value" style={{ fontSize:'18px', direction:'ltr' }}>${fmt(totalValue)}</div></div>
        <div className="stat-card"><div className="stat-label">{t('low_stock_label')}</div><div className="stat-value" style={{ color:'var(--danger)' }}>{fmtInt(lowCount)}</div></div>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>{t('th_code')}</th><th>{t('th_name')}</th><th>{t('th_opening_stock')}</th><th>{t('th_incoming')}</th><th>{t('th_outgoing')}</th><th>{t('th_current_stock')}</th><th>{t('th_value')}</th><th>{t('th_status')}</th></tr>
            </thead>
            <tbody>
              {items.map(i => {
                const low = i.stock <= i.minStock
                return (
                  <tr key={i.id}>
                    <td><code>{i.code}</code></td>
                    <td style={{ fontWeight:600 }}>{i.name}</td>
                    <td>{fmtInt(i.stock)}</td>
                    <td style={{ color:'var(--success)' }}>0</td>
                    <td style={{ color:'var(--danger)' }}>0</td>
                    <td style={{ fontWeight:700, color:low?'var(--danger)':'var(--primary)' }}>{fmtInt(i.stock)} {i.unit}</td>
                    <td style={{ direction:'ltr' }}>${fmt(i.stock * i.cost)}</td>
                    <td><span className={`badge ${low?'badge-danger':'badge-success'}`}>{low ? t('status_low') : t('status_ok')}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
