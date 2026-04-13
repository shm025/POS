import { useState, useEffect } from 'react'
import { useJournalEntries } from '../hooks/useJournalEntries'
import { useAccounts } from '../hooks/useAccounts'
import Modal from '../components/common/Modal'
import { fmt } from '../utils/format'

export default function JournalEntriesPage() {
  const { entries, loading, loadEntries, saveEntry, deleteEntry } = useJournalEntries()
  const { accounts, loadAccounts } = useAccounts()
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], desc:'', debitAccId:'', creditAccId:'', amount:0 })

  useEffect(() => { loadEntries(); loadAccounts() }, [loadEntries, loadAccounts])

  async function handleSave() {
    const dA = parseInt(form.debitAccId)
    const cA = parseInt(form.creditAccId)
    const amt = parseFloat(form.amount) || 0
    if (!dA || !cA || !amt) { return }
    await saveEntry({ date:form.date, desc:form.desc, debitAccId:dA, creditAccId:cA, amount:amt })
    setModalOpen(false)
    setForm({ date: new Date().toISOString().split('T')[0], desc:'', debitAccId:'', creditAccId:'', amount:0 })
  }

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }))
  const accOptions = accounts.map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)

  return (
    <div className="page-view">
      <div className="flex-between mb-4 no-print">
        <h1 style={{ fontSize:'20px', fontWeight:900, color:'var(--primary)' }}>✏️ القيود المحاسبية</h1>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>➕ قيد جديد</button>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>#</th><th>التاريخ</th><th>البيان</th><th>مدين</th><th>دائن</th><th className="no-print">إجراء</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ textAlign:'center', padding:'20px' }}>جاري التحميل...</td></tr>
              ) : entries.length === 0 ? (
                <tr><td colSpan="6"><div className="empty-state"><div className="icon">✏️</div><p>لا توجد قيود</p></div></td></tr>
              ) : [...entries].reverse().map(e => (
                <tr key={e.id}>
                  <td>{e.id}</td>
                  <td>{e.date}</td>
                  <td>{e.desc}</td>
                  <td style={{ color:'var(--success)', direction:'ltr' }}>${fmt(e.amount)}</td>
                  <td style={{ color:'var(--danger)', direction:'ltr' }}>${fmt(e.amount)}</td>
                  <td className="no-print">
                    <button className="btn btn-sm btn-danger" onClick={() => deleteEntry(e.id)}>🗑</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="✏️ قيد محاسبي جديد"
        footer={<><button className="btn btn-primary" onClick={handleSave}>💾 حفظ</button><button className="btn btn-outline" onClick={() => setModalOpen(false)}>إلغاء</button></>}
      >
        <div className="grid-2">
          <div className="form-group"><label className="form-label">التاريخ</label><input type="date" className="form-control" value={form.date} onChange={f('date')} /></div>
          <div className="form-group"><label className="form-label">المبلغ</label><input type="number" className="form-control" value={form.amount} onChange={f('amount')} /></div>
          <div className="form-group">
            <label className="form-label">حساب المدين</label>
            <select className="form-control" value={form.debitAccId} onChange={f('debitAccId')}>
              <option value="">-- اختر --</option>{accOptions}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">حساب الدائن</label>
            <select className="form-control" value={form.creditAccId} onChange={f('creditAccId')}>
              <option value="">-- اختر --</option>{accOptions}
            </select>
          </div>
        </div>
        <div className="form-group"><label className="form-label">البيان</label><input className="form-control" value={form.desc} onChange={f('desc')} /></div>
      </Modal>
    </div>
  )
}
