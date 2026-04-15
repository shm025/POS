import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useCommissions } from '../hooks/useCommissions'
import { fmt, fmtInt } from '../utils/format'
import { notify } from '../utils/notify'

function getMonthRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
  return { start, end }
}

export default function CommissionsPage() {
  const { company } = useAuth()
  const { commissions, loading, loadCommissions, markPaid, getSummary } = useCommissions(company?.id)
  const [period, setPeriod] = useState(getMonthRange())
  const [selected, setSelected] = useState([])
  const [view, setView] = useState('summary') // 'summary' | 'detail'

  useEffect(() => {
    loadCommissions({ periodStart: period.start, periodEnd: period.end })
  }, [company?.id, period.start, period.end])

  const summary = getSummary()
  const totalCommission = summary.reduce((s, e) => s + e.commission_amount, 0)
  const totalPending = summary.reduce((s, e) => s + e.pending, 0)
  const totalPaid = summary.reduce((s, e) => s + e.paid_out, 0)

  function toggleSelect(id) {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  async function handleMarkPaid() {
    const ids = view === 'summary'
      ? commissions.filter(c => selected.includes(c.employee_id) && !c.paid_out).map(c => c.id)
      : selected
    if (ids.length === 0) { notify('لم يتم اختيار عمولات', 'error'); return }
    await markPaid(ids)
    setSelected([])
  }

  return (
    <div className="page-view">
      <div className="flex-between mb-4">
        <h1 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--primary)' }}>💰 العمولات</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className={`btn ${view === 'summary' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setView('summary')}>ملخص</button>
          <button className={`btn ${view === 'detail' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setView('detail')}>تفصيلي</button>
        </div>
      </div>

      {/* Period selector */}
      <div className="card mb-4" style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">من</label>
          <input type="date" className="form-control" value={period.start} onChange={e => setPeriod(p => ({ ...p, start: e.target.value }))} />
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">إلى</label>
          <input type="date" className="form-control" value={period.end} onChange={e => setPeriod(p => ({ ...p, end: e.target.value }))} />
        </div>
      </div>

      {/* KPI cards */}
      <div className="stats-grid mb-4">
        <div className="stat-card">
          <div className="stat-label">إجمالي العمولات</div>
          <div className="stat-value" style={{ direction: 'ltr' }}>${fmt(totalCommission)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">مصروفة</div>
          <div className="stat-value" style={{ color: 'var(--success)', direction: 'ltr' }}>${fmt(totalPaid)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">معلقة</div>
          <div className="stat-value" style={{ color: 'var(--warning)', direction: 'ltr' }}>${fmt(totalPending)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">عدد العمليات</div>
          <div className="stat-value">{fmtInt(commissions.length)}</div>
        </div>
      </div>

      {selected.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <button className="btn btn-success" onClick={handleMarkPaid}>
            ✅ تأكيد صرف العمولات المحددة ({selected.length})
          </button>
        </div>
      )}

      {/* Summary view */}
      {view === 'summary' && (
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th></th><th>الموظف</th><th>عدد الخدمات</th><th>إيرادات الخدمات</th>
                  <th>إجمالي العمولة</th><th>مصروف</th><th>معلق</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}><div className="loading-spinner"></div></td></tr>
                ) : summary.length === 0 ? (
                  <tr><td colSpan="7"><div className="empty-state"><div className="icon">💰</div><p>لا توجد عمولات في هذه الفترة</p></div></td></tr>
                ) : summary.map(emp => (
                  <tr key={emp.employee_id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selected.includes(emp.employee_id)}
                        onChange={() => toggleSelect(emp.employee_id)}
                      />
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: emp.color }}></div>
                        <div>
                          <div style={{ fontWeight: 700 }}>{emp.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{emp.level}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontWeight: 600 }}>{fmtInt(emp.services)}</td>
                    <td style={{ direction: 'ltr' }}>${fmt(emp.service_amount)}</td>
                    <td style={{ fontWeight: 700, direction: 'ltr' }}>${fmt(emp.commission_amount)}</td>
                    <td style={{ color: 'var(--success)', direction: 'ltr' }}>${fmt(emp.paid_out)}</td>
                    <td style={{ color: 'var(--warning)', fontWeight: 700, direction: 'ltr' }}>${fmt(emp.pending)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail view */}
      {view === 'detail' && (
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th></th><th>الموظف</th><th>مبلغ الخدمة</th><th>نسبة العمولة</th>
                  <th>العمولة</th><th>التاريخ</th><th>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}><div className="loading-spinner"></div></td></tr>
                ) : commissions.length === 0 ? (
                  <tr><td colSpan="7"><div className="empty-state"><div className="icon">💰</div><p>لا توجد عمولات</p></div></td></tr>
                ) : commissions.map(c => (
                  <tr key={c.id}>
                    <td>
                      {!c.paid_out && (
                        <input
                          type="checkbox"
                          checked={selected.includes(c.id)}
                          onChange={() => toggleSelect(c.id)}
                        />
                      )}
                    </td>
                    <td style={{ fontWeight: 600 }}>{c.employees?.name || '—'}</td>
                    <td style={{ direction: 'ltr' }}>${fmt(c.service_amount)}</td>
                    <td>{c.commission_rate}%</td>
                    <td style={{ fontWeight: 700, color: 'var(--success)', direction: 'ltr' }}>${fmt(c.commission_amount)}</td>
                    <td>{c.period_start}</td>
                    <td>
                      <span className={`badge ${c.paid_out ? 'badge-success' : 'badge-warning'}`}>
                        {c.paid_out ? 'مصروفة' : 'معلقة'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
