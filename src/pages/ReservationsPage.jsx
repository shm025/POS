import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useReservations } from '../hooks/useReservations'
import { supabase } from '../lib/supabase'
import Modal from '../components/common/Modal'
import { fmt } from '../utils/format'

const STATUS_LABEL = { pending:'قيد الانتظار', confirmed:'مؤكد', done:'منجز', cancelled:'ملغى' }
const STATUS_BADGE = { pending:'badge-warning', confirmed:'badge-info', done:'badge-success', cancelled:'badge-danger' }
const today = () => new Date().toISOString().split('T')[0]
const EMPTY_FORM = { customer_name:'', customer_phone:'', service_id:'', service_name:'', employee_id:'', employee_name:'', price:0, date:today(), time:'', status:'pending', notes:'' }

export default function ReservationsPage() {
  const { company } = useAuth()
  const { reservations, loading, loadReservations, saveReservation, markDone, deleteReservation } = useReservations(company?.id)
  const [services, setServices] = useState([])
  const [employees, setEmployees] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editId, setEditId] = useState(null)

  useEffect(() => {
    loadReservations({ statusFilter, dateFilter })
  }, [company?.id, statusFilter, dateFilter])

  useEffect(() => {
    if (!company?.id) return
    supabase.from('services').select('*').eq('company_id', company.id).eq('active', true).then(({ data }) => setServices(data || []))
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
    setForm({ customer_name:r.customer_name, customer_phone:r.customer_phone||'', service_id:r.service_id||'', service_name:r.service_name||'', employee_id:r.employee_id||'', employee_name:r.employee_name||'', price:r.price||0, date:r.date||today(), time:r.time||'', status:r.status, notes:r.notes||'' })
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
    await saveReservation(data, editId)
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
        <h1 style={{ fontSize:'20px', fontWeight:900, color:'var(--primary)' }}>📅 الحجوزات</h1>
        <button className="btn btn-primary" onClick={openNew}>📅 حجز جديد</button>
      </div>
      <div className="card">
        <div className="search-bar no-print" style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
          <input className="form-control" placeholder="🔍 بحث باسم العميل..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex:1, minWidth:'160px' }} />
          <select className="form-control" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width:'160px' }}>
            <option value="">كل الحالات</option>
            <option value="pending">قيد الانتظار</option>
            <option value="confirmed">مؤكد</option>
            <option value="done">منجز</option>
            <option value="cancelled">ملغى</option>
          </select>
          <input type="date" className="form-control" value={dateFilter} onChange={e => setDateFilter(e.target.value)} style={{ width:'160px' }} />
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>العميل</th><th>الهاتف</th><th>الخدمة</th><th>الحلاق</th><th>التاريخ</th><th>الوقت</th><th>السعر</th><th>الحالة</th><th className="no-print">إجراء</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="9" style={{ textAlign:'center', padding:'20px' }}><div className="loading-spinner"></div></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="9"><div className="empty-state"><div className="icon">📅</div><p>لا توجد حجوزات</p></div></td></tr>
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
                    <button className="btn btn-sm btn-success btn-sm" style={{ marginRight:'4px' }} onClick={() => markDone(r.id)}>✅</button>
                    <button className="btn btn-sm btn-danger" style={{ marginRight:'4px' }} onClick={() => deleteReservation(r.id)}>🗑</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editId ? '✏️ تعديل الحجز' : '📅 حجز جديد'} footer={
        <>
          <button className="btn btn-primary" onClick={handleSave}>💾 حفظ</button>
          <button className="btn btn-outline" onClick={() => setModal(false)}>إلغاء</button>
        </>
      }>
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">اسم العميل</label>
            <input className="form-control" value={form.customer_name} onChange={e => set('customer_name', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">الهاتف</label>
            <input className="form-control" value={form.customer_phone} onChange={e => set('customer_phone', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">الخدمة</label>
            <select className="form-control" value={form.service_id} onChange={e => handleSvcChange(e.target.value)}>
              <option value="">-- اختر خدمة --</option>
              {services.map(s => <option key={s.id} value={s.id}>{s.name} - ${fmt(s.base_price)}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">الحلاق</label>
            <select className="form-control" value={form.employee_id} onChange={e => handleEmpChange(e.target.value)}>
              <option value="">-- اختر حلاق --</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.level})</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">التاريخ</label>
            <input type="date" className="form-control" value={form.date} onChange={e => set('date', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">الوقت</label>
            <input type="time" className="form-control" value={form.time} onChange={e => set('time', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">السعر ($)</label>
            <input type="number" className="form-control" value={form.price} onChange={e => set('price', e.target.value)} step="0.01" />
          </div>
          <div className="form-group">
            <label className="form-label">الحالة</label>
            <select className="form-control" value={form.status} onChange={e => set('status', e.target.value)}>
              <option value="pending">قيد الانتظار</option>
              <option value="confirmed">مؤكد</option>
              <option value="done">منجز</option>
              <option value="cancelled">ملغى</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">ملاحظات</label>
          <textarea className="form-control" rows="2" value={form.notes} onChange={e => set('notes', e.target.value)} />
        </div>
      </Modal>
    </div>
  )
}
