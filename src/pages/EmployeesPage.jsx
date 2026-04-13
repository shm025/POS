import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useEmployees } from '../hooks/useEmployees'
import { supabase } from '../lib/supabase'
import Modal from '../components/common/Modal'
import { fmt, fmtInt } from '../utils/format'

const LEVEL_LABEL = { junior:'Junior', senior:'Senior', master:'Master' }
const SALARY_LABEL = { commission:'عمولة فقط', salary_commission:'راتب + عمولة', salary:'راتب ثابت' }
const EMPTY_FORM = { name:'', phone:'', level:'junior', salary_type:'commission', base_salary:0, commission_rate:0 }

export default function EmployeesPage() {
  const { company } = useAuth()
  const { employees, loading, loadEmployees, saveEmployee, deleteEmployee } = useEmployees(company?.id)
  const [monthRes, setMonthRes] = useState([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editId, setEditId] = useState(null)

  useEffect(() => {
    loadEmployees()
    loadMonthRes()
  }, [company?.id])

  async function loadMonthRes() {
    if (!company?.id) return
    const thisMonth = new Date().toISOString().slice(0, 7)
    const { data } = await supabase.from('reservations').select('*').eq('company_id', company.id).eq('status', 'done')
    setMonthRes((data || []).filter(r => r.date && r.date.startsWith(thisMonth)))
  }

  const totalRevenue = monthRes.reduce((s, r) => s + parseFloat(r.price || 0), 0)

  function calcDue(emp) {
    const empRes = monthRes.filter(r => r.employee_id === emp.id)
    const rev = empRes.reduce((s, r) => s + parseFloat(r.price || 0), 0)
    if (emp.salary_type === 'commission') return rev * (emp.commission_rate / 100)
    if (emp.salary_type === 'salary_commission') return parseFloat(emp.base_salary || 0) + rev * (emp.commission_rate / 100)
    return parseFloat(emp.base_salary || 0)
  }

  function openNew() { setForm(EMPTY_FORM); setEditId(null); setModal(true) }
  function openEdit(emp) {
    setForm({ name:emp.name, phone:emp.phone||'', level:emp.level, salary_type:emp.salary_type, base_salary:emp.base_salary, commission_rate:emp.commission_rate })
    setEditId(emp.id)
    setModal(true)
  }

  async function handleSave() {
    if (!form.name.trim()) return
    await saveEmployee({ ...form, base_salary: parseFloat(form.base_salary)||0, commission_rate: parseFloat(form.commission_rate)||0 }, editId)
    setModal(false)
    loadMonthRes()
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const showBase = form.salary_type !== 'commission'
  const showComm = form.salary_type !== 'salary'

  return (
    <div className="page-view">
      <div className="flex-between mb-4">
        <h1 style={{ fontSize:'20px', fontWeight:900, color:'var(--primary)' }}>👥 الموظفون</h1>
        <button className="btn btn-primary" onClick={openNew}>➕ موظف جديد</button>
      </div>

      <div className="stats-grid mb-4">
        <div className="stat-card"><div className="stat-label">عدد الموظفين</div><div className="stat-value">{fmtInt(employees.length)}</div></div>
        <div className="stat-card"><div className="stat-label">قطعات هذا الشهر</div><div className="stat-value">{fmtInt(monthRes.length)}</div></div>
        <div className="stat-card"><div className="stat-label">إيرادات هذا الشهر</div><div className="stat-value" style={{ fontSize:'18px', direction:'ltr' }}>${fmt(totalRevenue)}</div></div>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>الاسم</th><th>الهاتف</th><th>المستوى</th><th>نوع الراتب</th><th>الراتب</th><th>العمولة%</th><th>قطعات الشهر</th><th>المستحق</th><th>الحالة</th><th className="no-print">إجراء</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="10" style={{ textAlign:'center', padding:'20px' }}><div className="loading-spinner"></div></td></tr>
              ) : employees.length === 0 ? (
                <tr><td colSpan="10"><div className="empty-state"><div className="icon">👥</div><p>لا يوجد موظفون</p><span>أضف موظفاً جديداً</span></div></td></tr>
              ) : employees.map(emp => {
                const empRes = monthRes.filter(r => r.employee_id === emp.id)
                const due = calcDue(emp)
                return (
                  <tr key={emp.id}>
                    <td style={{ fontWeight:600 }}>{emp.name}</td>
                    <td style={{ direction:'ltr' }}>{emp.phone||'-'}</td>
                    <td><span className="badge badge-info">{LEVEL_LABEL[emp.level]||emp.level}</span></td>
                    <td>{SALARY_LABEL[emp.salary_type]||emp.salary_type}</td>
                    <td style={{ direction:'ltr' }}>${fmt(emp.base_salary)}</td>
                    <td>{fmtInt(emp.commission_rate)}%</td>
                    <td style={{ fontWeight:700 }}>{fmtInt(empRes.length)}</td>
                    <td style={{ fontWeight:700, color:'var(--success)', direction:'ltr' }}>${fmt(due)}</td>
                    <td><span className="badge badge-success">نشط</span></td>
                    <td className="no-print">
                      <button className="btn btn-sm btn-outline" onClick={() => openEdit(emp)}>✏️</button>
                      <button className="btn btn-sm btn-danger" style={{ marginRight:'4px' }} onClick={() => deleteEmployee(emp.id)}>🗑</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editId ? '✏️ تعديل الموظف' : '➕ موظف جديد'} footer={
        <>
          <button className="btn btn-primary" onClick={handleSave}>💾 حفظ</button>
          <button className="btn btn-outline" onClick={() => setModal(false)}>إلغاء</button>
        </>
      }>
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">الاسم</label>
            <input className="form-control" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">الهاتف</label>
            <input className="form-control" value={form.phone} onChange={e => set('phone', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">المستوى</label>
            <select className="form-control" value={form.level} onChange={e => set('level', e.target.value)}>
              <option value="junior">Junior</option>
              <option value="senior">Senior</option>
              <option value="master">Master</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">نوع الراتب</label>
            <select className="form-control" value={form.salary_type} onChange={e => set('salary_type', e.target.value)}>
              <option value="commission">عمولة فقط</option>
              <option value="salary_commission">راتب + عمولة</option>
              <option value="salary">راتب ثابت</option>
            </select>
          </div>
          {showBase && (
            <div className="form-group">
              <label className="form-label">الراتب الأساسي ($)</label>
              <input type="number" className="form-control" value={form.base_salary} onChange={e => set('base_salary', e.target.value)} />
            </div>
          )}
          {showComm && (
            <div className="form-group">
              <label className="form-label">نسبة العمولة (%)</label>
              <input type="number" className="form-control" value={form.commission_rate} onChange={e => set('commission_rate', e.target.value)} />
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
