import { useState, useEffect } from 'react'
import { useAccounts } from '../hooks/useAccounts'
import Modal from '../components/common/Modal'
import { fmt } from '../utils/format'

const TYPE_LABEL = { asset:'أصول', liability:'خصوم', equity:'حقوق ملكية', revenue:'إيرادات', expense:'مصاريف' }
const TYPE_BADGE = { asset:'badge-info', liability:'badge-danger', equity:'badge-secondary', revenue:'badge-success', expense:'badge-warning' }

export default function AccountsPage() {
  const { accounts, loading, loadAccounts, saveAccount, deleteAccount } = useAccounts()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ code:'', name:'', type:'asset', balance:0 })
  const [editId, setEditId] = useState(null)

  useEffect(() => { loadAccounts() }, [loadAccounts])

  const filtered = accounts.filter(a =>
    (!search || (a.name||'').toLowerCase().includes(search.toLowerCase()) || (a.code||'').includes(search)) &&
    (!typeFilter || a.type === typeFilter)
  )

  function openNew() {
    setForm({ code:'', name:'', type:'asset', balance:0 })
    setEditId(null)
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.code || !form.name) { return }
    await saveAccount(form, editId)
    setModalOpen(false)
  }

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <div className="page-view">
      <div className="flex-between mb-4 no-print">
        <h1 style={{ fontSize:'20px', fontWeight:900, color:'var(--primary)' }}>📒 دليل الحسابات</h1>
        <button className="btn btn-primary" onClick={openNew}>➕ حساب جديد</button>
      </div>

      <div className="card">
        <div className="search-bar no-print">
          <input className="form-control" placeholder="🔍 بحث..." value={search} onChange={e => setSearch(e.target.value)} />
          <select className="form-control" style={{ width:'160px' }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="">كل الأنواع</option>
            {Object.entries(TYPE_LABEL).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>الكود</th><th>الاسم</th><th>النوع</th><th>مدين</th><th>دائن</th><th>الرصيد</th><th className="no-print">إجراء</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ textAlign:'center', padding:'20px' }}>جاري التحميل...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="7"><div className="empty-state"><div className="icon">📒</div><p>لا توجد حسابات</p></div></td></tr>
              ) : filtered.map(a => {
                const bal = (a.debit||0) - (a.credit||0)
                return (
                  <tr key={a.id}>
                    <td><code>{a.code}</code></td>
                    <td style={{ fontWeight:600 }}>{a.name}</td>
                    <td><span className={`badge ${TYPE_BADGE[a.type]||'badge-secondary'}`}>{TYPE_LABEL[a.type]||a.type}</span></td>
                    <td style={{ direction:'ltr' }}>{fmt(a.debit||0)}</td>
                    <td style={{ direction:'ltr' }}>{fmt(a.credit||0)}</td>
                    <td style={{ fontWeight:700, color:bal>=0?'var(--success)':'var(--danger)', direction:'ltr' }}>{fmt(Math.abs(bal))} {bal>=0?'Dr':'Cr'}</td>
                    <td className="no-print">
                      <button className="btn btn-sm btn-danger" onClick={() => deleteAccount(a.id)}>🗑</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="➕ حساب جديد"
        footer={<><button className="btn btn-primary" onClick={handleSave}>💾 حفظ</button><button className="btn btn-outline" onClick={() => setModalOpen(false)}>إلغاء</button></>}
      >
        <div className="grid-2">
          <div className="form-group"><label className="form-label">كود الحساب *</label><input className="form-control" value={form.code} onChange={f('code')} /></div>
          <div className="form-group"><label className="form-label">اسم الحساب *</label><input className="form-control" value={form.name} onChange={f('name')} /></div>
          <div className="form-group">
            <label className="form-label">نوع الحساب</label>
            <select className="form-control" value={form.type} onChange={f('type')}>
              {Object.entries(TYPE_LABEL).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label">الرصيد الابتدائي</label><input type="number" className="form-control" value={form.balance} onChange={f('balance')} /></div>
        </div>
      </Modal>
    </div>
  )
}
