import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useLang } from '../../contexts/LangContext'
import { supabase } from '../../lib/supabase'
import { fmt, fmtInt } from '../../utils/format'

const STATUS_BADGE = { pending:'badge-warning', confirmed:'badge-info', done:'badge-success', cancelled:'badge-danger' }

export default function BarberDashboard() {
  const { company } = useAuth()
  const { t, lang } = useLang()
  const navigate = useNavigate()
  const [data, setData] = useState({ reservations:[], employees:[], supplies:[], bills:[] })

  useEffect(() => {
    if (!company?.id) return
    Promise.all([
      supabase.from('reservations').select('*').eq('company_id', company.id),
      supabase.from('employees').select('*').eq('company_id', company.id).eq('active', true),
      supabase.from('supplies').select('*').eq('company_id', company.id),
      supabase.from('bills').select('*').eq('company_id', company.id),
    ]).then(([res, emp, sup, bil]) => {
      setData({
        reservations: res.data || [],
        employees: emp.data || [],
        supplies: sup.data || [],
        bills: bil.data || [],
      })
    })
  }, [company?.id])

  const today = new Date().toISOString().split('T')[0]
  const thisMonth = new Date().toISOString().slice(0, 7)

  const { reservations, employees, supplies, bills } = data

  const todayRes = reservations.filter(r => r.date === today)
  const monthDone = reservations.filter(r => r.date?.startsWith(thisMonth) && r.status === 'done')
  const monthRevenue = monthDone.reduce((s, r) => s + parseFloat(r.price || 0), 0)
  const monthSupplies = supplies.filter(s => s.date?.startsWith(thisMonth)).reduce((s, r) => s + parseFloat(r.amount || 0), 0)
  const monthBills = bills.filter(b => b.month === thisMonth).reduce((s, b) => s + parseFloat(b.amount || 0), 0)
  const totalExpenses = monthSupplies + monthBills
  const netProfit = monthRevenue - totalExpenses
  const todayCuts = todayRes.filter(r => r.status === 'done').length

  // Barber performance
  const maxCuts = Math.max(...employees.map(emp => monthDone.filter(r => r.employee_id === emp.id).length), 1)

  // Popular services
  const serviceCount = {}
  const serviceRevenue = {}
  monthDone.forEach(r => {
    if (r.service_name) {
      serviceCount[r.service_name] = (serviceCount[r.service_name] || 0) + 1
      serviceRevenue[r.service_name] = (serviceRevenue[r.service_name] || 0) + parseFloat(r.price || 0)
    }
  })
  const topServices = Object.entries(serviceCount).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const maxSvc = topServices[0]?.[1] || 1

  const STATUS_LABEL = { pending: t('res_pending'), confirmed: t('res_confirmed'), done: t('res_done'), cancelled: t('res_cancelled') }
  const todaySorted = [...todayRes].sort((a, b) => (a.time || '').localeCompare(b.time || ''))

  return (
    <div className="page-view">
      <div className="flex-between mb-4 no-print">
        <div>
          <h1 style={{ fontSize:'22px', fontWeight:900, color:'var(--primary)' }}>{t('dashboard_title')}</h1>
          <p className="text-muted">{new Date().toLocaleDateString(
            lang === 'EN' ? 'en-US' : lang === 'FR' ? 'fr-FR' : 'ar-LB',
            { weekday:'long', year:'numeric', month:'long', day:'numeric' }
          )}</p>
        </div>
        <div style={{ display:'flex', gap:'8px' }}>
          <button className="btn btn-primary" onClick={() => navigate('/reservations')}>📅 {t('new_reservation_btn')}</button>
          <button className="btn btn-outline" onClick={() => navigate('/supplies')}>🧴 {t('supplies_btn')}</button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">{t('month_revenue')}</div>
          <div className="stat-value" style={{ fontSize:'20px', direction:'ltr' }}>${fmt(monthRevenue)}</div>
          <div className="stat-sub">{fmtInt(monthDone.length)} {t('done_services')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t('month_expenses')}</div>
          <div className="stat-value" style={{ fontSize:'20px', color:'var(--danger)', direction:'ltr' }}>${fmt(totalExpenses)}</div>
          <div className="stat-sub">{t('supplies_bills_sub')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t('net_profit')}</div>
          <div className="stat-value" style={{ fontSize:'20px', color: netProfit >= 0 ? 'var(--success)' : 'var(--danger)', direction:'ltr' }}>${fmt(netProfit)}</div>
          <div className="stat-sub">{netProfit >= 0 ? `✅ ${t('profit_label')}` : `⚠️ ${t('loss_label')}`}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t('today_cuts')}</div>
          <div className="stat-value">{fmtInt(todayCuts)}</div>
          <div className="stat-sub">{t('out_of')} {fmtInt(todayRes.length)}</div>
        </div>
      </div>

      <div className="grid-2 mt-4">
        <div className="card">
          <div className="card-header">
            <div className="card-title">📅 {t('today_reservations')}</div>
            <button className="btn btn-sm btn-outline" onClick={() => navigate('/reservations')}>{t('view_all')}</button>
          </div>
          {todaySorted.length === 0 ? (
            <div className="empty-state" style={{ padding:'24px' }}><p style={{ fontSize:'13px' }}>{t('no_today_reservations')}</p></div>
          ) : todaySorted.map(r => (
            <div key={r.id} className="flex-between" style={{ padding:'10px 0', borderBottom:'1px solid var(--border-light)', fontSize:'13px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                <div style={{ fontSize:'18px' }}>💈</div>
                <div>
                  <div style={{ fontWeight:700 }}>{r.customer_name}</div>
                  <div style={{ color:'var(--text-muted)', fontSize:'12px' }}>{r.service_name||'-'} • {r.employee_name||'-'}</div>
                </div>
              </div>
              <div style={{ textAlign:'left' }}>
                <div style={{ fontWeight:700, direction:'ltr' }}>{r.time||'-'}</div>
                <span className={`badge ${STATUS_BADGE[r.status]||'badge-secondary'}`}>{STATUS_LABEL[r.status]||r.status}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">👥 {t('barber_performance')}</div>
          </div>
          {employees.length === 0 ? (
            <div style={{ padding:'16px', textAlign:'center', color:'var(--text-muted)' }}>{t('no_employees')}</div>
          ) : employees.map(emp => {
            const empRes = monthDone.filter(r => r.employee_id === emp.id)
            const empRevenue = empRes.reduce((s, r) => s + parseFloat(r.price || 0), 0)
            let due = 0
            if (emp.salary_type === 'commission') due = empRevenue * (emp.commission_rate / 100)
            else if (emp.salary_type === 'salary_commission') due = parseFloat(emp.base_salary || 0) + empRevenue * (emp.commission_rate / 100)
            else due = parseFloat(emp.base_salary || 0)
            const pct = ((empRes.length / maxCuts) * 100).toFixed(0)
            return (
              <div key={emp.id} style={{ marginBottom:'14px' }}>
                <div className="flex-between" style={{ fontSize:'13px', marginBottom:'6px' }}>
                  <div>
                    <span style={{ fontWeight:700 }}>{emp.name}</span>
                    <span style={{ color:'var(--text-muted)', fontSize:'11px', marginRight:'8px', marginLeft:'6px' }}>{emp.level}</span>
                  </div>
                  <div style={{ textAlign:'left' }}>
                    <span style={{ fontWeight:700, direction:'ltr' }}>${fmt(empRevenue)}</span>
                    <span style={{ color:'var(--text-muted)', fontSize:'11px' }}> • {fmtInt(empRes.length)} {t('cuts_unit')}</span>
                  </div>
                </div>
                <div className="progress-bar-wrap">
                  <div className="progress-bar-fill" style={{ width:`${pct}%` }}></div>
                </div>
                <div style={{ fontSize:'11px', color:'var(--text-muted)', marginTop:'4px' }}>
                  {t('due_commission')}: <span style={{ color:'var(--success)', fontWeight:700, direction:'ltr' }}>${fmt(due)}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid-2 mt-4">
        <div className="card">
          <div className="card-header">
            <div className="card-title">✂️ {t('popular_services')}</div>
          </div>
          {topServices.length === 0 ? (
            <div style={{ padding:'16px', textAlign:'center', color:'var(--text-muted)' }}>{t('no_data_yet')}</div>
          ) : topServices.map(([name, count]) => (
            <div key={name} style={{ marginBottom:'12px' }}>
              <div className="flex-between" style={{ fontSize:'13px', marginBottom:'4px' }}>
                <span style={{ fontWeight:600 }}>{name}</span>
                <span style={{ direction:'ltr', color:'var(--text-muted)' }}>{fmtInt(count)} {t('times_unit')} • ${fmt(serviceRevenue[name])}</span>
              </div>
              <div className="progress-bar-wrap">
                <div className="progress-bar-fill" style={{ width:`${((count / maxSvc) * 100).toFixed(0)}%`, background:'var(--accent)' }}></div>
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">💰 {t('financial_summary')}</div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'12px', padding:'8px 0' }}>
            <div className="flex-between" style={{ fontSize:'14px', padding:'10px', background:'var(--bg-panel)', borderRadius:'8px' }}>
              <span>{t('month_revenue_summary')}</span>
              <span style={{ fontWeight:700, color:'var(--success)', direction:'ltr' }}>+${fmt(monthRevenue)}</span>
            </div>
            <div className="flex-between" style={{ fontSize:'14px', padding:'10px', background:'var(--bg-panel)', borderRadius:'8px' }}>
              <span>{t('supplies_cost')}</span>
              <span style={{ fontWeight:700, color:'var(--danger)', direction:'ltr' }}>-${fmt(monthSupplies)}</span>
            </div>
            <div className="flex-between" style={{ fontSize:'14px', padding:'10px', background:'var(--bg-panel)', borderRadius:'8px' }}>
              <span>{t('fixed_bills_label')}</span>
              <span style={{ fontWeight:700, color:'var(--danger)', direction:'ltr' }}>-${fmt(monthBills)}</span>
            </div>
            <div className="flex-between" style={{ fontSize:'15px', fontWeight:700, padding:'12px', background: netProfit >= 0 ? '#D4EDDA' : '#F8D7DA', borderRadius:'8px', border:`1px solid ${netProfit >= 0 ? '#C3E6CB' : '#F5C6CB'}` }}>
              <span style={{ color: netProfit >= 0 ? '#155724' : '#721C24' }}>{t('net_profit')}</span>
              <span style={{ direction:'ltr', color: netProfit >= 0 ? '#155724' : '#721C24' }}>${fmt(netProfit)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
