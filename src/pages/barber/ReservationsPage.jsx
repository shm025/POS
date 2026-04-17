import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useLang } from '../../contexts/LangContext'
import { useReservations } from '../../hooks/useReservations'
import { supabase } from '../../lib/supabase'
import Modal from '../../components/common/Modal'
import { fmt } from '../../utils/format'

const STATUS_BADGE = { pending:'badge-warning', confirmed:'badge-info', done:'badge-success', cancelled:'badge-danger', no_show:'badge-danger' }
const SOURCE_KEY = { walk_in:'src_walk_in', phone:'src_phone', whatsapp:'src_whatsapp', online:'src_online' }
const today = () => new Date().toISOString().split('T')[0]
const EMPTY_FORM = {
  customer_name:'', customer_phone:'', service_id:'', service_name:'',
  employee_id:'', employee_name:'', price:0, date:today(), time:'', end_time:'',
  status:'pending', source:'walk_in', deposit_amount:0, deposit_paid:false,
  no_show:false, notes:'',
}

export default function ReservationsPage() {
  const { company } = useAuth()
  const { t } = useLang()
  const { reservations, loading, loadReservations, saveReservation, markDone, deleteReservation } = useReservations(company?.id)
  const [services, setServices] = useState([])
  const [employees, setEmployees] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editId, setEditId] = useState(null)

  const STATUS_LABEL = { pending: t('res_pending'), confirmed: t('res_confirmed'), done: t('res_done'), cancelled: t('res_cancelled') }

  useEffect(() => {
    loadReservations({ statusFilter, dateFilter })
  }, [company?.id, statusFilter, dateFilter, loadReservations])

  useEffect(() => {
    if (!company?.id) return
    supabase.from('services').select('*').eq('company_id', company.id).eq('is_active', true).then(({ data }) => setServices(data || []))
    supabase.from('employees').select('*').eq('company_id', company.id).eq('active', true).then(({ data }) => setEmployees(data || []))
  }, [company?.id])

  const filtered = search ? reservations.filter(r => r.customer_name?.toLowerCase().includes(search.toLowerCase())) : reservations

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

  function openNew() {
    setForm({ ...EMPTY_FORM, date: today() })
    setEditId(null)
    setModal(true)
  }

  function openEdit(r) {
    setForm({
      customer_name: r.customer_name, customer_phone: r.customer_phone||'',
      service_id: r.service_id||'', service_name: r.service_name||'',
      employee_id: r.employee_id||'', employee_name: r.employee_name||'',
      price: r.price||0, date: r.date||today(), time: r.time||'', end_time: r.end_time||'',
      status: r.status, source: r.source||'walk_in',
      deposit_amount: r.deposit_amount||0, deposit_paid: r.deposit_paid||false,
      no_show: r.no_show||false, notes: r.notes||'',
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
    await saveReservation(data, editId, { statusFilter, dateFilter })
    setModal(false)
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  function handleSvcChange(id) {
    set('service_id', id)
    updatePrice(id, form.employee_id)
  }

  function handleEmpChange(id) {
    set('employee_id', id)
    updatePrice(form.service_id, id)
  }

  return (
    <div className="page-view">
      <div className="flex-between mb-4">
        <h1 style={{ fontSize:'20px', fontWeight:900, color:'var(--primary)' }}>📅 {t('reservations_title')}</h1>
        <button className="btn btn-primary" onClick={openNew}>📅 {t('new_reservation_title')}</button>
      </div>
      <div className="card">
        <div className="search-bar no-print" style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
          <input className="form-control" placeholder={`🔍 ${t('search_customer')}`} value={search} onChange={e => setSearch(e.target.value)} style={{ flex:1, minWidth:'160px' }} />
          <select className="form-control" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width:'160px' }}>
            <option value="">{t('all_statuses')}</option>
            <option value="pending">{t('res_pending')}</option>
            <option value="confirmed">{t('res_confirmed')}</option>
            <option value="done">{t('res_done')}</option>
            <option value="cancelled">{t('res_cancelled')}</option>
          </select>
          <input type="date" className="form-control" value={dateFilter} onChange={e => setDateFilter(e.target.value)} style={{ width:'160px' }} />
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>{t('th_res_customer')}</th><th>{t('th_phone')}</th><th>{t('th_res_service')}</th><th>{t('th_res_employee')}</th><th>{t('th_date')}</th><th>{t('th_res_time')}</th><th>{t('th_res_price')}</th><th>{t('th_status')}</th><th className="no-print">{t('th_action')}</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="9" style={{ textAlign:'center', padding:'20px' }}><div className="loading-spinner"></div></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="9"><div className="empty-state"><div className="icon">📅</div><p>{t('no_reservations')}</p></div></td></tr>
              ) : filtered.map(r => (
                <tr key={r.id}>
                  <td style={{ fontWeight:600 }}>{r.customer_name}</td>
                  <td style={{ direction:'ltr' }}>{r.customer_phone||'-'}</td>
                  <td>{r.service_name||'-'}</td>
                  <td>{r.employee_name||'-'}</td>
                  <td>{r.date||'-'}</td>
                  <td style={{ direction:'ltr' }}>{r.time||'-'}</td>
                  <td style={{ fontWeight:700, direction:'ltr' }}>${fmt(r.price)}</td>
                  <td><span className={`badge ${STATUS_BADGE[r.status]||'badge-secondary'}`}>{STATUS_LABEL[r.status]||r.status}</span></td>
                  <td className="no-print">
                    <button className="btn btn-sm btn-outline" onClick={() => openEdit(r)}>✏️</button>
                    <button className="btn btn-sm btn-success btn-sm" style={{ marginRight:'4px' }} onClick={() => markDone(r.id, { statusFilter, dateFilter })}>✅</button>
                    <button className="btn btn-sm btn-danger" style={{ marginRight:'4px' }} onClick={() => deleteReservation(r.id, { statusFilter, dateFilter })}>🗑</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editId ? `✏️ ${t('edit_reservation_title')}` : `📅 ${t('new_reservation_title')}`} footer={
        <>
          <button className="btn btn-primary" onClick={handleSave}>💾 {t('save_btn')}</button>
          <button className="btn btn-outline" onClick={() => setModal(false)}>{t('cancel_btn')}</button>
        </>
      }>
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
              {services.map(s => <option key={s.id} value={s.id}>{s.name} - ${fmt(s.base_price)}</option>)}
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
              {Object.entries(SOURCE_KEY).map(([k,v]) => <option key={k} value={k}>{t(v)}</option>)}
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
        <div style={{ display:'flex', gap:'16px', marginBottom:'8px' }}>
          <label style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'13px' }}>
            <input type="checkbox" checked={form.deposit_paid} onChange={e => set('deposit_paid', e.target.checked)} />
            {t('lbl_deposit_paid')}
          </label>
          <label style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'13px' }}>
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
