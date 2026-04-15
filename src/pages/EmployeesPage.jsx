import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../contexts/LangContext'
import { useEmployees } from '../hooks/useEmployees'
import { supabase } from '../lib/supabase'
import Modal from '../components/common/Modal'
import { fmt, fmtInt } from '../utils/format'

const DEFAULT_WORKING_HOURS = {
  mon:{start:'09:00',end:'18:00'}, tue:{start:'09:00',end:'18:00'},
  wed:{start:'09:00',end:'18:00'}, thu:{start:'09:00',end:'18:00'},
  fri:{start:'09:00',end:'18:00'}, sat:{start:'09:00',end:'14:00'}, sun:null
}
const DAYS_AR = { mon:'الإثنين', tue:'الثلاثاء', wed:'الأربعاء', thu:'الخميس', fri:'الجمعة', sat:'السبت', sun:'الأحد' }

const EMPTY_FORM = {
  name:'', phone:'', level:'junior', salary_type:'commission',
  base_salary:0, commission_rate:0,
  calendar_color:'#3B82F6',
  working_hours: DEFAULT_WORKING_HOURS,
}

export default function EmployeesPage() {
  const { company } = useAuth()
  const { t } = useLang()
  const { employees, loading, loadEmployees, saveEmployee, deleteEmployee } = useEmployees(company?.id)
  const [monthRes, setMonthRes] = useState([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editId, setEditId] = useState(null)

  const SALARY_LABEL = { commission: t('salary_commission'), salary_commission: t('salary_salary_commission'), salary: t('salary_salary') }

  useEffect(() => {
    loadEmployees()
    loadMonthRes()
  }, [loadEmployees])

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
    setForm({
      name: emp.name, phone: emp.phone||'', level: emp.level,
      salary_type: emp.salary_type, base_salary: emp.base_salary,
      commission_rate: emp.commission_rate,
      calendar_color: emp.calendar_color || '#3B82F6',
      working_hours: emp.working_hours || DEFAULT_WORKING_HOURS,
    })
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
        <h1 style={{ fontSize:'20px', fontWeight:900, color:'var(--primary)' }}>👥 {t('employees_title')}</h1>
        <button className="btn btn-primary" onClick={openNew}>➕ {t('new_employee_btn')}</button>
      </div>

      <div className="stats-grid mb-4">
        <div className="stat-card"><div className="stat-label">{t('emp_count')}</div><div className="stat-value">{fmtInt(employees.length)}</div></div>
        <div className="stat-card"><div className="stat-label">{t('month_cuts')}</div><div className="stat-value">{fmtInt(monthRes.length)}</div></div>
        <div className="stat-card"><div className="stat-label">{t('month_rev_label')}</div><div className="stat-value" style={{ fontSize:'18px', direction:'ltr' }}>${fmt(totalRevenue)}</div></div>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>{t('th_name')}</th><th>{t('th_phone')}</th><th>{t('th_emp_level')}</th><th>{t('th_salary_type')}</th><th>{t('th_base_salary')}</th><th>{t('th_commission_pct')}</th><th>{t('th_month_cuts')}</th><th>{t('th_due')}</th><th>{t('th_status')}</th><th className="no-print">{t('th_action')}</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="10" style={{ textAlign:'center', padding:'20px' }}><div className="loading-spinner"></div></td></tr>
              ) : employees.length === 0 ? (
                <tr><td colSpan="10"><div className="empty-state"><div className="icon">👥</div><p>{t('no_employees_data')}</p></div></td></tr>
              ) : employees.map(emp => {
                const empRes = monthRes.filter(r => r.employee_id === emp.id)
                const due = calcDue(emp)
                return (
                  <tr key={emp.id}>
                    <td style={{ fontWeight:600 }}>{emp.name}</td>
                    <td style={{ direction:'ltr' }}>{emp.phone||'-'}</td>
                    <td><span className="badge badge-info">{emp.level}</span></td>
                    <td>{SALARY_LABEL[emp.salary_type]||emp.salary_type}</td>
                    <td style={{ direction:'ltr' }}>${fmt(emp.base_salary)}</td>
                    <td>{fmtInt(emp.commission_rate)}%</td>
                    <td style={{ fontWeight:700 }}>{fmtInt(empRes.length)}</td>
                    <td style={{ fontWeight:700, color:'var(--success)', direction:'ltr' }}>${fmt(due)}</td>
                    <td><span className="badge badge-success">{t('status_active')}</span></td>
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

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editId ? `✏️ ${t('edit_employee_title')}` : `➕ ${t('new_employee_title')}`} footer={
        <>
          <button className="btn btn-primary" onClick={handleSave}>💾 {t('save_btn')}</button>
          <button className="btn btn-outline" onClick={() => setModal(false)}>{t('cancel_btn')}</button>
        </>
      }>
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">{t('lbl_emp_name')}</label>
            <input className="form-control" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">{t('lbl_phone')}</label>
            <input className="form-control" value={form.phone} onChange={e => set('phone', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">{t('lbl_emp_level')}</label>
            <select className="form-control" value={form.level} onChange={e => set('level', e.target.value)}>
              <option value="junior">Junior</option>
              <option value="senior">Senior</option>
              <option value="master">Master</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">{t('lbl_salary_type')}</label>
            <select className="form-control" value={form.salary_type} onChange={e => set('salary_type', e.target.value)}>
              <option value="commission">{t('salary_commission')}</option>
              <option value="salary_commission">{t('salary_salary_commission')}</option>
              <option value="salary">{t('salary_salary')}</option>
            </select>
          </div>
          {showBase && (
            <div className="form-group">
              <label className="form-label">{t('lbl_base_salary')}</label>
              <input type="number" className="form-control" value={form.base_salary} onChange={e => set('base_salary', e.target.value)} />
            </div>
          )}
          {showComm && (
            <div className="form-group">
              <label className="form-label">{t('lbl_commission_rate')}</label>
              <input type="number" className="form-control" value={form.commission_rate} onChange={e => set('commission_rate', e.target.value)} />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">لون التقويم</label>
            <input type="color" className="form-control" value={form.calendar_color} onChange={e => set('calendar_color', e.target.value)} style={{ height:'42px', padding:'4px' }} />
          </div>
        </div>

        {/* Working Hours */}
        <div style={{ marginTop:'12px' }}>
          <label className="form-label" style={{ fontWeight:700 }}>ساعات العمل</label>
          <div style={{ display:'flex', flexDirection:'column', gap:'6px', marginTop:'6px' }}>
            {Object.keys(DAYS_AR).map(day => {
              const val = form.working_hours?.[day]
              return (
                <div key={day} style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                  <span style={{ width:'70px', fontSize:'13px' }}>{DAYS_AR[day]}</span>
                  <input
                    type="checkbox"
                    checked={!!val}
                    onChange={e => set('working_hours', { ...form.working_hours, [day]: e.target.checked ? {start:'09:00',end:'18:00'} : null })}
                  />
                  {val && <>
                    <input type="time" value={val.start} onChange={e => set('working_hours', { ...form.working_hours, [day]: {...val, start:e.target.value} })}
                      style={{ padding:'4px', border:'1px solid var(--border)', borderRadius:'6px', fontSize:'13px' }} />
                    <span style={{ fontSize:'12px' }}>—</span>
                    <input type="time" value={val.end} onChange={e => set('working_hours', { ...form.working_hours, [day]: {...val, end:e.target.value} })}
                      style={{ padding:'4px', border:'1px solid var(--border)', borderRadius:'6px', fontSize:'13px' }} />
                  </>}
                  {!val && <span style={{ fontSize:'12px', color:'var(--text-muted)' }}>إجازة</span>}
                </div>
              )
            })}
          </div>
        </div>
      </Modal>
    </div>
  )
}
