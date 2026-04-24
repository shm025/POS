import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useLang } from '../../contexts/LangContext'
import { supabase } from '../../lib/supabase'
import { fmt, fmtInt } from '../../utils/format'

const thisMonth = () => new Date().toISOString().slice(0, 7)

export default function MonthlyReportPage() {
  const { company } = useAuth()
  const { t, lang } = useLang()
  const [month, setMonth]   = useState(thisMonth())
  const [data, setData]     = useState({ reservations:[], employees:[], supplies:[], bills:[] })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!company?.id) return
    setLoading(true)
    Promise.all([
      supabase.from('reservations').select('*').eq('company_id', company.id).ilike('date', `${month}%`),
      supabase.from('employees').select('*').eq('company_id', company.id).eq('active', true),
      supabase.from('supplies').select('*').eq('company_id', company.id).ilike('date', `${month}%`),
      supabase.from('bills').select('*').eq('company_id', company.id).eq('month', month),
    ]).then(([res, emp, sup, bil]) => {
      setData({
        reservations: res.data || [],
        employees:    emp.data || [],
        supplies:     sup.data || [],
        bills:        bil.data || [],
      })
      setLoading(false)
    })
  }, [company?.id, month])

  const { reservations, employees, supplies, bills } = data

  const done        = reservations.filter(r => r.status === 'done')
  const revenue     = done.reduce((s, r) => s + parseFloat(r.price || 0), 0)
  const suppCost    = supplies.reduce((s, r) => s + parseFloat(r.amount || 0), 0)
  const billsCost   = bills.reduce((s, b) => s + parseFloat(b.amount || 0), 0)
  const totalCost   = suppCost + billsCost
  const netProfit   = revenue - totalCost

  // Per-employee stats
  const empStats = employees.map(emp => {
    const empDone  = done.filter(r => r.employee_id === emp.id)
    const empRev   = empDone.reduce((s, r) => s + parseFloat(r.price || 0), 0)
    let due = 0
    if (emp.salary_type === 'commission')         due = empRev * (emp.commission_rate / 100)
    else if (emp.salary_type === 'salary_commission') due = parseFloat(emp.base_salary || 0) + empRev * (emp.commission_rate / 100)
    else                                          due = parseFloat(emp.base_salary || 0)
    return { emp, cuts: empDone.length, revenue: empRev, due, ownerProfit: empRev - due }
  }).sort((a, b) => b.revenue - a.revenue)

  // Top services
  const svcMap = {}
  done.forEach(r => {
    if (!r.service_name) return
    if (!svcMap[r.service_name]) svcMap[r.service_name] = { count: 0, revenue: 0 }
    svcMap[r.service_name].count++
    svcMap[r.service_name].revenue += parseFloat(r.price || 0)
  })
  const topServices = Object.entries(svcMap).sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 8)
  const maxSvcRev   = topServices[0]?.[1].revenue || 1

  // Month label
  const monthLabel = new Date(month + '-01').toLocaleDateString(
    lang === 'EN' ? 'en-US' : lang === 'FR' ? 'fr-FR' : 'ar-LB',
    { month: 'long', year: 'numeric' }
  )

  function shiftMonth(delta) {
    const [y, m] = month.split('-').map(Number)
    const d = new Date(y, m - 1 + delta, 1)
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  const totalCommissions = empStats.reduce((s, e) => s + e.due, 0)

  return (
    <div className="page-view">

      {/* Header */}
      <div className="flex-between mb-4">
        <h1 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--primary)' }}>
          {t('monthly_report_title')}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button className="btn btn-outline btn-sm" style={{ padding: '4px 10px', fontSize: '15px', cursor: 'pointer' }} onClick={() => shiftMonth(-1)}>‹</button>
          <input
            type="month"
            className="form-control"
            value={month}
            onChange={e => setMonth(e.target.value)}
            style={{ width: '160px' }}
          />
          <button className="btn btn-outline btn-sm" style={{ padding: '4px 10px', fontSize: '15px', cursor: 'pointer' }} onClick={() => shiftMonth(1)}>›</button>
        </div>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: '40px' }}><div className="loading-spinner" /></div>}

      {!loading && <>

        {/* Month label */}
        <div style={{ textAlign: 'center', fontSize: '16px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '20px' }}>
          {monthLabel}
        </div>

        {/* KPI cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">{t('month_revenue_summary')}</div>
            <div className="stat-value" style={{ direction: 'ltr', color: 'var(--success)' }}>${fmt(revenue)}</div>
            <div className="stat-sub">{fmtInt(done.length)} {t('done_services')}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">{t('supplies_cost')}</div>
            <div className="stat-value" style={{ direction: 'ltr', color: 'var(--danger)' }}>${fmt(suppCost)}</div>
            <div className="stat-sub">{fmtInt(supplies.length)} {t('rpt_items')}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">{t('fixed_bills_label')}</div>
            <div className="stat-value" style={{ direction: 'ltr', color: 'var(--danger)' }}>${fmt(billsCost)}</div>
            <div className="stat-sub">{fmtInt(bills.length)} {t('rpt_bills')}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">{t('rpt_commissions_due')}</div>
            <div className="stat-value" style={{ direction: 'ltr', color: '#F59E0B' }}>${fmt(totalCommissions)}</div>
            <div className="stat-sub">{fmtInt(employees.length)} {t('rpt_employees')}</div>
          </div>
          <div className="stat-card" style={{ gridColumn: 'span 2' }}>
            <div className="stat-label">{t('net_profit')}</div>
            <div className="stat-value" style={{ direction: 'ltr', fontSize: '26px', color: netProfit >= 0 ? 'var(--success)' : 'var(--danger)' }}>
              {netProfit >= 0 ? '+' : ''}{fmt(netProfit)} $
            </div>
            <div className="stat-sub">{netProfit >= 0 ? `✅ ${t('profit_label')}` : `⚠️ ${t('loss_label')}`}</div>
          </div>
        </div>

        <div className="grid-2 mt-4">

          {/* Per-employee breakdown */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">👥 {t('barber_performance')}</div>
            </div>
            {empStats.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>{t('no_data_yet')}</div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>{t('lbl_employee')}</th>
                      <th>{t('cuts_unit')}</th>
                      <th>{t('month_revenue_summary')}</th>
                      <th>{t('due_commission')}</th>
                      <th>{t('board_owner_profit')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {empStats.map(({ emp, cuts, revenue: rev, due, ownerProfit }) => (
                      <tr key={emp.id}>
                        <td>
                          <span style={{ fontWeight: 700 }}>{emp.name}</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '11px', marginLeft: '6px' }}>{emp.level}</span>
                        </td>
                        <td style={{ fontWeight: 600 }}>{fmtInt(cuts)}</td>
                        <td style={{ direction: 'ltr', fontWeight: 700, color: 'var(--success)' }}>${fmt(rev)}</td>
                        <td style={{ direction: 'ltr', color: '#F59E0B', fontWeight: 600 }}>${fmt(due)}</td>
                        <td style={{ direction: 'ltr', fontWeight: 800, color: 'var(--primary)' }}>${fmt(ownerProfit)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ fontWeight: 800, borderTop: '2px solid var(--border-light)' }}>
                      <td>{t('rpt_total')}</td>
                      <td>{fmtInt(done.length)}</td>
                      <td style={{ direction: 'ltr', color: 'var(--success)' }}>${fmt(revenue)}</td>
                      <td style={{ direction: 'ltr', color: '#F59E0B' }}>${fmt(totalCommissions)}</td>
                      <td style={{ direction: 'ltr', color: 'var(--primary)' }}>${fmt(revenue - totalCommissions)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Top services */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">✂️ {t('popular_services')}</div>
            </div>
            {topServices.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>{t('no_data_yet')}</div>
            ) : topServices.map(([name, { count, revenue: sRev }]) => (
              <div key={name} style={{ marginBottom: '14px' }}>
                <div className="flex-between" style={{ fontSize: '13px', marginBottom: '5px' }}>
                  <span style={{ fontWeight: 600 }}>{name}</span>
                  <span style={{ direction: 'ltr', color: 'var(--text-muted)', fontSize: '12px' }}>
                    {fmtInt(count)} {t('times_unit')} · ${fmt(sRev)}
                  </span>
                </div>
                <div className="progress-bar-wrap">
                  <div className="progress-bar-fill" style={{ width: `${((sRev / maxSvcRev) * 100).toFixed(0)}%`, background: 'var(--accent)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Financial breakdown */}
        <div className="card mt-4">
          <div className="card-header">
            <div className="card-title">💰 {t('financial_summary')}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '8px 0' }}>
            {[
              { label: t('month_revenue_summary'),  val: revenue,          color: 'var(--success)', sign: '+' },
              { label: t('supplies_cost'),           val: suppCost,         color: 'var(--danger)',  sign: '-' },
              { label: t('fixed_bills_label'),       val: billsCost,        color: 'var(--danger)',  sign: '-' },
              { label: t('rpt_commissions_due'),     val: totalCommissions, color: '#F59E0B',        sign: '-' },
            ].map(({ label, val, color, sign }) => (
              <div key={label} className="flex-between" style={{ fontSize: '14px', padding: '10px', background: 'var(--bg-panel)', borderRadius: '8px' }}>
                <span>{label}</span>
                <span style={{ fontWeight: 700, direction: 'ltr', color }}>{sign}${fmt(val)}</span>
              </div>
            ))}
            <div className="flex-between" style={{
              fontSize: '15px', fontWeight: 800, padding: '12px', borderRadius: '8px',
              background: netProfit >= 0 ? '#D4EDDA' : '#F8D7DA',
              border: `1px solid ${netProfit >= 0 ? '#C3E6CB' : '#F5C6CB'}`,
            }}>
              <span style={{ color: netProfit >= 0 ? '#155724' : '#721C24' }}>{t('net_profit')}</span>
              <span style={{ direction: 'ltr', color: netProfit >= 0 ? '#155724' : '#721C24' }}>
                {netProfit >= 0 ? '+' : ''}{fmt(netProfit)} $
              </span>
            </div>
          </div>
        </div>

      </>}
    </div>
  )
}
