import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useBills } from '../hooks/useBills'
import Modal from '../components/common/Modal'
import { fmt, fmtInt } from '../utils/format'

const thisMonth = () => new Date().toISOString().slice(0, 7)
const EMPTY_FORM = { name:'', amount:0, due_day:1, month:thisMonth() }

export default function BillsPage() {
  const { company } = useAuth()
  const { bills, loading, loadBills, saveBill, togglePaid, deleteBill } = useBills(company?.id)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => { loadBills() }, [company?.id])

  const unpaid = bills.filter(b => !b.paid)
  const totalUnpaid = unpaid.reduce((s, b) => s + parseFloat(b.amount || 0), 0)
  const totalPaid = bills.filter(b => b.paid).reduce((s, b) => s + parseFloat(b.amount || 0), 0)

  async function handleSave() {
    if (!form.name.trim()) return
    await saveBill({ ...form, amount: parseFloat(form.amount)||0, due_day: parseInt(form.due_day)||1 })
    setModal(false)
    setForm(EMPTY_FORM)
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="page-view">
      <div className="flex-between mb-4">
        <h1 style={{ fontSize:'20px', fontWeight:900, color:'var(--primary)' }}>💡 الفواتير الثابتة</h1>
        <button className="btn btn-primary" onClick={() => { setForm({ ...EMPTY_FORM, month: thisMonth() }); setModal(true) }}>➕ فاتورة جديدة</button>
      </div>

      <div className="stats-grid mb-4" id="bills-stats">
        <div className="stat-card"><div className="stat-label">غير مدفوعة</div><div className="stat-value" style={{ color:'var(--danger)', direction:'ltr' }}>${fmt(totalUnpaid)}</div></div>
        <div className="stat-card"><div className="stat-label">مدفوعة</div><div className="stat-value" style={{ color:'var(--success)', direction:'ltr' }}>${fmt(totalPaid)}</div></div>
        <div className="stat-card"><div className="stat-label">إجمالي الفواتير</div><div className="stat-value">{fmtInt(bills.length)}</div></div>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>الفاتورة</th><th>المبلغ</th><th>يوم الاستحقاق</th><th>الشهر</th><th>الحالة</th><th className="no-print">إجراء</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ textAlign:'center', padding:'20px' }}><div className="loading-spinner"></div></td></tr>
              ) : bills.length === 0 ? (
                <tr><td colSpan="6"><div className="empty-state"><div className="icon">💡</div><p>لا توجد فواتير</p></div></td></tr>
              ) : bills.map(b => (
                <tr key={b.id}>
                  <td style={{ fontWeight:600 }}>{b.name}</td>
                  <td style={{ fontWeight:700, direction:'ltr' }}>${fmt(b.amount)}</td>
                  <td>{b.due_day||'-'}</td>
                  <td>{b.month||'-'}</td>
                  <td><span className={`badge ${b.paid ? 'badge-success' : 'badge-danger'}`}>{b.paid ? 'مدفوعة' : 'غير مدفوعة'}</span></td>
                  <td className="no-print">
                    <button className="btn btn-sm btn-success" onClick={() => togglePaid(b.id, b.paid)}>{b.paid ? 'إلغاء الدفع' : '✅ دفع'}</button>
                    <button className="btn btn-sm btn-danger" style={{ marginRight:'4px' }} onClick={() => deleteBill(b.id)}>🗑</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title="💡 فاتورة جديدة" footer={
        <>
          <button className="btn btn-primary" onClick={handleSave}>💾 حفظ</button>
          <button className="btn btn-outline" onClick={() => setModal(false)}>إلغاء</button>
        </>
      }>
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">اسم الفاتورة</label>
            <input className="form-control" value={form.name} onChange={e => set('name', e.target.value)} placeholder="مثال: كهرباء، إيجار" />
          </div>
          <div className="form-group">
            <label className="form-label">المبلغ ($)</label>
            <input type="number" className="form-control" value={form.amount} onChange={e => set('amount', e.target.value)} step="0.01" />
          </div>
          <div className="form-group">
            <label className="form-label">يوم الاستحقاق</label>
            <input type="number" className="form-control" min="1" max="31" value={form.due_day} onChange={e => set('due_day', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">الشهر</label>
            <input type="month" className="form-control" value={form.month} onChange={e => set('month', e.target.value)} />
          </div>
        </div>
      </Modal>
    </div>
  )
}
