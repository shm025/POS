import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../contexts/LangContext'
import { supabase } from '../lib/supabase'
import { fmt, fmtInt } from '../utils/format'

const STATUS_COLOR = {
  pending: '#D97706', confirmed: '#1D4ED8', done: '#15803D', cancelled: '#DC2626',
}
const STATUS_BG = {
  pending: '#FEF3C7', confirmed: '#DBEAFE', done: '#DCFCE7', cancelled: '#FEE2E2',
}

export default function BarberDashboard() {
  const { company } = useAuth()
  const { t } = useLang()
  const navigate = useNavigate()
  const [data, setData] = useState({ reservations: [], employees: [], supplies: [], bills: [] })
  const [loading, setLoading] = useState(true)

  const today = new Date().toISOString().split('T')[0]
  const thisMonth = new Date().toISOString().slice(0, 7)

  useEffect(() => {
    if (!company?.id) return
    setLoading(true)
    Promise.all([
      supabase.from('reservations').select('*').eq('company_id', company.id).order('date', { ascending: false }).limit(500),
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
      setLoading(false)
    })
  }, [company?.id])

  const { reservations, employees, supplies, bills } = data

  const todayRes = reservations.filter(r => r.date === today)
  const monthDone = reservations.filter(r => r.date?.startsWith(thisMonth) && r.status === 'done')
  const monthRevenue = monthDone.reduce((s, r) => s + parseFloat(r.price || 0), 0)
  const todayRevenue = reservations
    .filter(r => r.date === today && r.status === 'done')
    .reduce((s, r) => s + parseFloat(r.price || 0), 0)
  const monthSupplies = supplies.filter(s => s.date?.startsWith(thisMonth)).reduce((s, r) => s + parseFloat(r.amount || 0), 0)
  const monthBills = bills.filter(b => b.month === thisMonth).reduce((s, b) => s + parseFloat(b.amount || 0), 0)
  const totalExpenses = monthSupplies + monthBills
  const netProfit = monthRevenue - totalExpenses
  const todayCuts = todayRes.filter(r => r.status === 'done').length
  const todayPending = todayRes.filter(r => r.status === 'pending' || r.status === 'confirmed').length

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

  const STATUS_LABEL = {
    pending: t('res_pending') || 'معلق',
    confirmed: t('res_confirmed') || 'مؤكد',
    done: t('res_done') || 'منجز',
    cancelled: t('res_cancelled') || 'ملغى',
  }

  const todaySorted = [...todayRes].sort((a, b) => (a.time || '').localeCompare(b.time || ''))

  const dateStr = new Date().toLocaleDateString('ar-LB', {
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
          <button className="btn btn-outline" onClick={() => navigate('/supplies')}>
            🧴 {t('supplies_btn') || 'المستلزمات'}
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/reservations')}>
            ➕ {t('new_reservation_btn') || 'حجز جديد'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="stats-grid">
        <div className="stat-card stat-card-success">
          <div className="stat-icon stat-icon-green">💰</div>
          <div className="stat-label">{t('month_revenue') || 'إيرادات الشهر'}</div>
          <div className="stat-value" style={{ direction: 'ltr' }}>${fmt(monthRevenue)}</div>
          <div className="kpi-trend positive">اليوم: ${fmt(todayRevenue)}</div>
        </div>

        <div className="stat-card stat-card-danger">
          <div className="stat-icon stat-icon-red">📉</div>
          <div className="stat-label">{t('month_expenses') || 'مصاريف الشهر'}</div>
          <div className="stat-value" style={{ direction: 'ltr', color: 'var(--danger)' }}>${fmt(totalExpenses)}</div>
          <div className="stat-sub">{t('supplies_bills_sub') || 'مستلزمات + فواتير'}</div>
        </div>

        <div className="stat-card" style={{ borderTop: `3px solid ${netProfit >= 0 ? 'var(--success)' : 'var(--danger)'}` }}>
          <div className="stat-icon" style={{ background: netProfit >= 0 ? 'rgba(14,164,114,0.1)' : 'rgba(229,62,62,0.1)' }}>
            {netProfit >= 0 ? '📈' : '📉'}
          </div>
          <div className="stat-label">{t('net_profit') || 'صافي الربح'}</div>
          <div className="stat-value" style={{ direction: 'ltr', color: netProfit >= 0 ? 'var(--success)' : 'var(--danger)' }}>
            ${fmt(Math.abs(netProfit))}
          </div>
          <div className="kpi-trend" style={{ color: netProfit >= 0 ? 'var(--success)' : 'var(--danger)' }}>
            {netProfit >= 0 ? `✅ ${t('profit_label') || 'ربح'}` : `⚠️ ${t('loss_label') || 'خسارة'}`}
          </div>
        </div>

        <div className="stat-card stat-card-accent">
          <div className="stat-icon stat-icon-blue">✂️</div>
          <div className="stat-label">{t('today_cuts') || 'قطعات اليوم'}</div>
          <div className="stat-value">{fmtInt(todayCuts)}</div>
          <div className="stat-sub">
            {fmtInt(todayPending)} قيد الانتظار • {fmtInt(todayRes.length)} إجمالي
          </div>
        </div>
      </div>

      <div className="grid-2 mt-4">
        {/* Today's Reservations */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">📅 {t('today_reservations') || 'مواعيد اليوم'}</div>
            <button className="btn btn-sm btn-outline" onClick={() => navigate('/reservations')}>
              {t('view_all') || 'عرض الكل'}
            </button>
          </div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>جاري التحميل...</div>
          ) : todaySorted.length === 0 ? (
            <div className="empty-state" style={{ padding: '24px' }}>
              <div className="icon">📅</div>
              <p>{t('no_today_reservations') || 'لا توجد مواعيد اليوم'}</p>
            </div>
          ) : todaySorted.slice(0, 8).map(r => (
            <div key={r.id} className="timeline-item">
              <div className="timeline-time">{r.time || '--:--'}</div>
              <div
                className="timeline-dot"
                style={{ background: STATUS_COLOR[r.status] || '#A0AEC0' }}
              />
              <div className="timeline-content">
                <div className="timeline-name">{r.customer_name}</div>
                <div className="timeline-sub">
                  {r.service_name || '—'} {r.employee_name ? `• ${r.employee_name}` : ''}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                <span style={{
                  fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '12px',
                  background: STATUS_BG[r.status] || '#F5F5F5',
                  color: STATUS_COLOR[r.status] || '#666',
                }}>
                  {STATUS_LABEL[r.status] || r.status}
                </span>
                {r.price > 0 && (
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)', direction: 'ltr' }}>
                    ${fmt(r.price)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Barber Performance */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">👥 {t('barber_performance') || 'أداء الموظفين'}</div>
          </div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>جاري التحميل...</div>
          ) : employees.length === 0 ? (
            <div className="empty-state" style={{ padding: '24px' }}>
              <div className="icon">👥</div>
              <p>{t('no_employees') || 'لا يوجد موظفون'}</p>
            </div>
          ) : employees.map(emp => {
            const empRes = monthDone.filter(r => r.employee_id === emp.id)
            const empRevenue = empRes.reduce((s, r) => s + parseFloat(r.price || 0), 0)
            let due = 0
            if (emp.salary_type === 'commission') due = empRevenue * ((emp.commission_rate || 0) / 100)
            else if (emp.salary_type === 'salary_commission') due = parseFloat(emp.base_salary || 0) + empRevenue * ((emp.commission_rate || 0) / 100)
            else due = parseFloat(emp.base_salary || 0)
            const pct = ((empRes.length / maxCuts) * 100).toFixed(0)
            return (
              <div key={emp.id} style={{ marginBottom: '16px' }}>
                <div className="flex-between" style={{ fontSize: '13px', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {emp.calendar_color && (
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: emp.calendar_color }} />
                    )}
                    <div>
                      <span style={{ fontWeight: 700 }}>{emp.name}</span>
                      {emp.level && <span style={{ color: 'var(--text-muted)', fontSize: '11px', marginRight: '6px' }}>{emp.level}</span>}
                    </div>
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <span style={{ fontWeight: 700, direction: 'ltr' }}>${fmt(empRevenue)}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}> • {fmtInt(empRes.length)} {t('cuts_unit') || 'قطعة'}</span>
                  </div>
                </div>
                <div className="progress-bar-wrap">
                  <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {t('due_commission') || 'العمولة المستحقة'}:{' '}
                  <span style={{ color: 'var(--success)', fontWeight: 700, direction: 'ltr' }}>${fmt(due)}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid-2 mt-4">
        {/* Popular Services */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">✂️ {t('popular_services') || 'الخدمات الأكثر طلباً'}</div>
          </div>
          {topServices.length === 0 ? (
            <div className="empty-state" style={{ padding: '24px' }}>
              <div className="icon">✂️</div>
              <p>{t('no_data_yet') || 'لا توجد بيانات بعد'}</p>
            </div>
          ) : topServices.map(([name, count]) => (
            <div key={name} style={{ marginBottom: '14px' }}>
              <div className="flex-between" style={{ fontSize: '13px', marginBottom: '5px' }}>
                <span style={{ fontWeight: 600 }}>{name}</span>
                <span style={{ direction: 'ltr', color: 'var(--text-muted)' }}>
                  {fmtInt(count)} {t('times_unit') || 'مرة'} • <span style={{ color: 'var(--success)' }}>${fmt(serviceRevenue[name])}</span>
                </span>
              </div>
              <div className="progress-bar-wrap">
                <div className="progress-bar-fill" style={{ width: `${((count / maxSvc) * 100).toFixed(0)}%`, background: 'linear-gradient(to right, var(--accent), var(--accent-light))' }} />
              </div>
            </div>
          ))}
        </div>

        {/* Financial Summary */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">💰 {t('financial_summary') || 'الملخص المالي'}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '4px 0' }}>
            <div className="flex-between" style={{
              fontSize: '14px', padding: '12px 14px',
              background: 'rgba(14,164,114,0.06)', borderRadius: '10px',
              border: '1px solid rgba(14,164,114,0.15)',
            }}>
              <span style={{ color: 'var(--text-secondary)' }}>{t('month_revenue_summary') || 'إيرادات الشهر'}</span>
              <span style={{ fontWeight: 700, color: 'var(--success)', direction: 'ltr' }}>+${fmt(monthRevenue)}</span>
            </div>
            <div className="flex-between" style={{
              fontSize: '14px', padding: '12px 14px',
              background: 'rgba(229,62,62,0.04)', borderRadius: '10px',
              border: '1px solid rgba(229,62,62,0.12)',
            }}>
              <span style={{ color: 'var(--text-secondary)' }}>{t('supplies_cost') || 'تكلفة المستلزمات'}</span>
              <span style={{ fontWeight: 700, color: 'var(--danger)', direction: 'ltr' }}>-${fmt(monthSupplies)}</span>
            </div>
            <div className="flex-between" style={{
              fontSize: '14px', padding: '12px 14px',
              background: 'rgba(229,62,62,0.04)', borderRadius: '10px',
              border: '1px solid rgba(229,62,62,0.12)',
            }}>
              <span style={{ color: 'var(--text-secondary)' }}>{t('fixed_bills_label') || 'الفواتير الثابتة'}</span>
              <span style={{ fontWeight: 700, color: 'var(--danger)', direction: 'ltr' }}>-${fmt(monthBills)}</span>
            </div>
            <div className="flex-between" style={{
              fontSize: '15px', fontWeight: 700, padding: '14px 16px',
              background: netProfit >= 0 ? 'rgba(14,164,114,0.1)' : 'rgba(229,62,62,0.1)',
              borderRadius: '10px',
              border: `1.5px solid ${netProfit >= 0 ? 'rgba(14,164,114,0.3)' : 'rgba(229,62,62,0.3)'}`,
            }}>
              <span style={{ color: netProfit >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                {t('net_profit') || 'صافي الربح'}
              </span>
              <span style={{ direction: 'ltr', color: netProfit >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                {netProfit >= 0 ? '+' : '-'}${fmt(Math.abs(netProfit))}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
