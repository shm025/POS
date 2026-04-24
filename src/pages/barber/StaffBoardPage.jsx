import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useLang } from '../../contexts/LangContext'
import { useReservations } from '../../hooks/useReservations'
import { useEmployees } from '../../hooks/useEmployees'
import { supabase } from '../../lib/supabase'
import Modal from '../../components/common/Modal'
import { fmt } from '../../utils/format'

const today = () => new Date().toISOString().split('T')[0]

const STATUS_COLOR = {
  pending:   '#F59E0B',
  confirmed: '#3B82F6',
  done:      '#22C55E',
  cancelled: '#EF4444',
  no_show:   '#EF4444',
}

const SOURCE_KEY = {
  walk_in: 'src_walk_in', phone: 'src_phone',
  whatsapp: 'src_whatsapp', online: 'src_online',
}

const EMPTY_FORM = {
  customer_name: '', customer_phone: '', service_id: '', service_name: '',
  employee_id: '', employee_name: '', price: 0,
  date: today(), time: '', end_time: '',
  status: 'pending', source: 'walk_in',
  deposit_amount: 0, deposit_paid: false, no_show: false, notes: '',
}

const colStyle = {
  minWidth: '270px',
  maxWidth: '270px',
  display: 'flex',
  flexDirection: 'column',
  background: 'var(--bg-card)',
  borderRadius: '12px',
  border: '1px solid var(--border-light)',
  padding: '12px',
  height: '100%',
  boxSizing: 'border-box',
}

const rowBetween = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}

export default function StaffBoardPage() {
  const { company } = useAuth()
  const { t } = useLang()
  const { reservations, loading, loadReservations, saveReservation, markDone, deleteReservation } = useReservations(company?.id)
  const { employees, loadEmployees } = useEmployees(company?.id)
  const [services, setServices] = useState([])
  const [date, setDate]         = useState(today())
  const [modal, setModal]       = useState(false)
  const [form, setForm]         = useState(EMPTY_FORM)
  const [editId, setEditId]     = useState(null)

  const STATUS_LABEL = {
    pending: t('res_pending'), confirmed: t('res_confirmed'),
    done: t('res_done'), cancelled: t('res_cancelled'), no_show: t('res_no_show'),
  }

  useEffect(() => {
    loadEmployees()
    if (company?.id)
      supabase.from('services').select('*').eq('company_id', company.id).eq('is_active', true)
        .then(({ data }) => setServices(data || []))
  }, [company?.id])

  useEffect(() => {
    loadReservations({ dateFilter: date })
  }, [date, company?.id, loadReservations])

  function updatePrice(svcId, empId) {
    const svc = services.find(s => s.id === svcId)
    const emp = employees.find(e => e.id === empId)
    if (!svc || !emp) return
    let price = svc.base_price || 0
    if (emp.level === 'junior' && svc.junior_price) price = svc.junior_price
    else if (emp.level === 'senior' && svc.senior_price) price = svc.senior_price
    else if (emp.level === 'master' && svc.master_price) price = svc.master_price
    setForm(f => ({ ...f, price }))
  }

  function openNew(emp = null) {
    setForm({ ...EMPTY_FORM, date, employee_id: emp?.id || '', employee_name: emp?.name || '' })
    setEditId(null)
    setModal(true)
  }

  function openEdit(r) {
    setForm({
      customer_name: r.customer_name || '', customer_phone: r.customer_phone || '',
      service_id: r.service_id || '', service_name: r.service_name || '',
      employee_id: r.employee_id || '', employee_name: r.employee_name || '',
      price: r.price || 0, date: r.date || today(),
      time: r.time || '', end_time: r.end_time || '',
      status: r.status || 'pending', source: r.source || 'walk_in',
      deposit_amount: r.deposit_amount || 0, deposit_paid: r.deposit_paid || false,
      no_show: r.no_show || false, notes: r.notes || '',
    })
    setEditId(r.id)
    setModal(true)
  }

  async function handleSave() {
    if (!form.customer_name.trim()) return
    const svc = services.find(s => s.id === form.service_id)
    const emp = employees.find(e => e.id === form.employee_id)
    const data = {
      ...form,
      service_name: svc ? svc.name : (form.service_name || null),
      employee_name: emp ? emp.name : (form.employee_name || null),
      price: parseFloat(form.price) || 0,
    }
    const ok = await saveReservation(data, editId, { dateFilter: date })
    if (ok) setModal(false)
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  function handleSvcChange(id) { set('service_id', id); updatePrice(id, form.employee_id) }
  function handleEmpChange(id) { set('employee_id', id); updatePrice(form.service_id, id) }

  // group & sort by employee
  const byEmployee = {}
  for (const r of reservations) {
    const key = r.employee_id || '__none__'
    if (!byEmployee[key]) byEmployee[key] = []
    byEmployee[key].push(r)
  }
  for (const key of Object.keys(byEmployee))
    byEmployee[key].sort((a, b) => (a.time || '').localeCompare(b.time || ''))

  function calcStats(emp, rList) {
    const revenue = rList.reduce((s, r) => s + parseFloat(r.price || 0), 0)
    const empCost = (emp.salary_type === 'commission' || emp.salary_type === 'salary_commission')
      ? revenue * ((emp.commission_rate || 0) / 100)
      : 0
    return { revenue, empCost, ownerProfit: revenue - empCost }
  }

  const totalRevenue     = reservations.reduce((s, r) => s + parseFloat(r.price || 0), 0)
  const countDone        = reservations.filter(r => r.status === 'done').length
  const countActive      = reservations.filter(r => r.status === 'pending' || r.status === 'confirmed').length
  const totalOwnerProfit = employees.reduce((sum, emp) => {
    const { ownerProfit } = calcStats(emp, byEmployee[emp.id] || [])
    return sum + ownerProfit
  }, 0)

  function shiftDay(delta) {
    const d = new Date(date)
    d.setDate(d.getDate() + delta)
    setDate(d.toISOString().split('T')[0])
  }

  return (
    <div className="page-view" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', gap: 0 }}>

      {/* ── Top bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--primary)', margin: 0, flexShrink: 0 }}>
          {t('reservations_title')}
        </h1>

        {/* Day navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          <button
            className="btn btn-outline btn-sm"
            style={{ padding: '4px 10px', cursor: 'pointer', fontSize: '15px', lineHeight: 1 }}
            onClick={() => shiftDay(-1)}
            title="Previous day"
          >‹</button>
          <input
            type="date"
            className="form-control"
            value={date}
            onChange={e => setDate(e.target.value)}
            style={{ width: '145px' }}
          />
          <button
            className="btn btn-outline btn-sm"
            style={{ padding: '4px 10px', cursor: 'pointer', fontSize: '15px', lineHeight: 1 }}
            onClick={() => shiftDay(1)}
            title="Next day"
          >›</button>
          {date !== today() && (
            <button
              className="btn btn-outline btn-sm"
              style={{ padding: '4px 8px', cursor: 'pointer', fontSize: '11px' }}
              onClick={() => setDate(today())}
            >Today</button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px', flex: 1, flexWrap: 'wrap' }}>
          <span style={chip('#22C55E')}>{t('board_revenue')}: ${fmt(totalRevenue)}</span>
          <span style={{ ...chip('var(--primary)'), fontWeight: 800 }}>{t('board_owner_profit')}: ${fmt(totalOwnerProfit)}</span>
          <span style={chip('#3B82F6')}>{countActive} {t('res_pending').toLowerCase()}</span>
          <span style={chip('#10B981')}>{countDone} {t('res_done').toLowerCase()}</span>
        </div>

        <button className="btn btn-primary" style={{ flexShrink: 0 }} onClick={() => openNew()}>
          + {t('new_reservation_title')}
        </button>
      </div>

      {/* ── Board ── */}
      <div style={{
        display: 'flex', gap: '12px',
        overflowX: 'auto', overflowY: 'hidden',
        flex: 1, paddingBottom: '8px',
        alignItems: 'stretch',
      }}>

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
            <div className="loading-spinner" />
          </div>
        )}

        {!loading && employees.map(emp => {
          const empRes = byEmployee[emp.id] || []
          const { revenue, empCost, ownerProfit } = calcStats(emp, empRes)
          const color = emp.calendar_color || '#3B82F6'

          return (
            <div key={emp.id} style={colStyle}>

              {/* Employee header */}
              <div style={{ borderBottom: `3px solid ${color}`, paddingBottom: '10px', marginBottom: '10px', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '34px', height: '34px', borderRadius: '50%',
                    background: color, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', color: '#fff',
                    fontWeight: 800, fontSize: '15px', flexShrink: 0,
                  }}>
                    {emp.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {emp.name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                      {emp.level} · {emp.commission_rate}%
                    </div>
                  </div>
                  <div style={{
                    minWidth: '22px', height: '22px', borderRadius: '50%',
                    background: `${color}22`, color, fontWeight: 800, fontSize: '12px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {empRes.length}
                  </div>
                </div>
              </div>

              {/* Reservation cards */}
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '2px' }}>
                {empRes.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--text-muted)', fontSize: '12px' }}>
                    {t('no_reservations')}
                  </div>
                ) : empRes.map(r => {
                  const sc = STATUS_COLOR[r.status] || '#94A3B8'
                  return (
                    <div key={r.id} style={{
                      borderRadius: '8px',
                      border: '1px solid var(--border-light)',
                      borderLeft: `4px solid ${sc}`,
                      padding: '9px 10px',
                      background: 'var(--bg-page)',
                    }}>
                      {/* Time + badge */}
                      <div style={{ ...rowBetween, marginBottom: '4px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, direction: 'ltr', color: 'var(--text-muted)' }}>
                          {r.time || '--:--'}{r.end_time ? ` – ${r.end_time}` : ''}
                        </span>
                        <span style={{
                          fontSize: '10px', fontWeight: 600, padding: '2px 7px',
                          borderRadius: '999px', background: `${sc}18`, color: sc,
                        }}>
                          {STATUS_LABEL[r.status] || r.status}
                        </span>
                      </div>

                      {/* Customer */}
                      <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '3px' }}>
                        {r.customer_name}
                      </div>

                      {/* Service + price */}
                      <div style={rowBetween}>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {r.service_name || '—'}
                        </span>
                        <span style={{ fontWeight: 800, fontSize: '13px', direction: 'ltr', color: 'var(--primary)', marginRight: '4px' }}>
                          ${fmt(r.price)}
                        </span>
                      </div>

                      {r.notes && (
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {r.notes}
                        </div>
                      )}

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
                        {r.status !== 'done' && r.status !== 'cancelled' && (
                          <button
                            className="btn btn-success btn-sm"
                            style={{ flex: 1, fontSize: '11px', padding: '3px 0', cursor: 'pointer' }}
                            onClick={() => markDone(r.id, { dateFilter: date })}
                          >
                            ✓ {t('res_done')}
                          </button>
                        )}
                        <button
                          className="btn btn-outline btn-sm"
                          style={{ padding: '3px 8px', fontSize: '11px', cursor: 'pointer' }}
                          onClick={() => openEdit(r)}
                          title={t('th_action')}
                        >
                          ✏️
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          style={{ padding: '3px 8px', fontSize: '11px', cursor: 'pointer' }}
                          onClick={() => deleteReservation(r.id, { dateFilter: date })}
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Add reservation for this employee */}
              <button
                className="btn btn-outline"
                style={{
                  width: '100%', marginTop: '10px', fontSize: '12px',
                  borderStyle: 'dashed', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  padding: '7px 0',
                }}
                onClick={() => openNew(emp)}
              >
                + {t('new_reservation_title')}
              </button>

              {/* Daily stats */}
              <div style={{
                marginTop: '10px', padding: '10px 12px', borderRadius: '8px',
                background: 'var(--bg-page)', border: '1px solid var(--border-light)', flexShrink: 0,
              }}>
                <div style={{ ...rowBetween, marginBottom: '5px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t('board_revenue')}</span>
                  <span style={{ fontWeight: 700, fontSize: '13px', direction: 'ltr', color: '#22C55E' }}>${fmt(revenue)}</span>
                </div>
                <div style={{ ...rowBetween, marginBottom: '5px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t('board_commission')} ({emp.commission_rate}%)</span>
                  <span style={{ fontWeight: 600, fontSize: '12px', direction: 'ltr', color: '#F59E0B' }}>${fmt(empCost)}</span>
                </div>
                <div style={{ ...rowBetween, borderTop: '1px solid var(--border-light)', paddingTop: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700 }}>{t('board_owner_profit')}</span>
                  <span style={{ fontWeight: 800, fontSize: '14px', direction: 'ltr', color: 'var(--primary)' }}>${fmt(ownerProfit)}</span>
                </div>
              </div>

            </div>
          )
        })}

        {/* Unassigned reservations */}
        {!loading && byEmployee['__none__'] && (
          <div style={colStyle}>
            <div style={{ borderBottom: '3px solid #94A3B8', paddingBottom: '10px', marginBottom: '10px', flexShrink: 0 }}>
              <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-muted)' }}>
                {t('board_unassigned')}
              </span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {byEmployee['__none__'].map(r => {
                const sc = STATUS_COLOR[r.status] || '#94A3B8'
                return (
                  <div key={r.id} style={{
                    borderRadius: '8px', border: '1px solid var(--border-light)',
                    borderLeft: `4px solid ${sc}`, padding: '9px 10px', background: 'var(--bg-page)',
                  }}>
                    <div style={{ ...rowBetween, marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, direction: 'ltr', color: 'var(--text-muted)' }}>
                        {r.time || '--:--'}
                      </span>
                      <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 7px', borderRadius: '999px', background: `${sc}18`, color: sc }}>
                        {STATUS_LABEL[r.status] || r.status}
                      </span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '3px' }}>{r.customer_name}</div>
                    <div style={rowBetween}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{r.service_name || '—'}</span>
                      <span style={{ fontWeight: 800, fontSize: '13px', direction: 'ltr', color: 'var(--primary)' }}>${fmt(r.price)}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
                      <button className="btn btn-outline btn-sm" style={{ padding: '3px 8px', fontSize: '11px', cursor: 'pointer' }} onClick={() => openEdit(r)}>✏️</button>
                      <button className="btn btn-danger btn-sm" style={{ padding: '3px 8px', fontSize: '11px', cursor: 'pointer' }} onClick={() => deleteReservation(r.id, { dateFilter: date })}>🗑</button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {!loading && employees.length === 0 && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            {t('no_employees')}
          </div>
        )}
      </div>

      {/* ── Modal ── */}
      <Modal
        isOpen={modal}
        onClose={() => setModal(false)}
        title={editId ? `✏️ ${t('edit_reservation_title')}` : `📅 ${t('new_reservation_title')}`}
        footer={
          <>
            <button className="btn btn-primary" onClick={handleSave}>💾 {t('save_btn')}</button>
            <button className="btn btn-outline" onClick={() => setModal(false)}>{t('cancel_btn')}</button>
          </>
        }
      >
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">{t('lbl_customer_name')}</label>
            <input className="form-control" value={form.customer_name} onChange={e => set('customer_name', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">{t('lbl_phone')}</label>
            <input className="form-control" value={form.customer_phone} onChange={e => set('customer_phone', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">{t('lbl_service')}</label>
            <select className="form-control" value={form.service_id} onChange={e => handleSvcChange(e.target.value)}>
              <option value="">{t('select_service')}</option>
              {services.map(s => <option key={s.id} value={s.id}>{s.name} — ${fmt(s.base_price)}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">{t('lbl_employee')}</label>
            <select className="form-control" value={form.employee_id} onChange={e => handleEmpChange(e.target.value)}>
              <option value="">{t('select_employee')}</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.level})</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">{t('lbl_date')}</label>
            <input type="date" className="form-control" value={form.date} onChange={e => set('date', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">{t('lbl_start_time')}</label>
            <input type="time" className="form-control" value={form.time} onChange={e => set('time', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">{t('lbl_end_time')}</label>
            <input type="time" className="form-control" value={form.end_time} onChange={e => set('end_time', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">{t('lbl_price')}</label>
            <input type="number" className="form-control" value={form.price} onChange={e => set('price', e.target.value)} step="0.01" />
          </div>
          <div className="form-group">
            <label className="form-label">{t('lbl_booking_source')}</label>
            <select className="form-control" value={form.source} onChange={e => set('source', e.target.value)}>
              {Object.entries(SOURCE_KEY).map(([k, v]) => <option key={k} value={k}>{t(v)}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">{t('lbl_deposit')}</label>
            <input type="number" className="form-control" value={form.deposit_amount} onChange={e => set('deposit_amount', e.target.value)} step="0.01" />
          </div>
          <div className="form-group">
            <label className="form-label">{t('lbl_status')}</label>
            <select className="form-control" value={form.status} onChange={e => set('status', e.target.value)}>
              <option value="pending">{t('res_pending')}</option>
              <option value="confirmed">{t('res_confirmed')}</option>
              <option value="done">{t('res_done')}</option>
              <option value="cancelled">{t('res_cancelled')}</option>
              <option value="no_show">{t('res_no_show')}</option>
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '8px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.deposit_paid} onChange={e => set('deposit_paid', e.target.checked)} />
            {t('lbl_deposit_paid')}
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.no_show} onChange={e => set('no_show', e.target.checked)} />
            {t('lbl_no_show_check')}
          </label>
        </div>
        <div className="form-group">
          <label className="form-label">{t('lbl_notes')}</label>
          <textarea className="form-control" rows="2" value={form.notes} onChange={e => set('notes', e.target.value)} />
        </div>
      </Modal>
    </div>
  )
}

function chip(color) {
  return {
    padding: '4px 10px', borderRadius: '999px', fontSize: '12px',
    fontWeight: 700, background: `${color}18`, color, direction: 'ltr',
    whiteSpace: 'nowrap',
  }
}
