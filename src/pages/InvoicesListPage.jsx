import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { dbGetAll, dbDelete } from '../lib/db'
import { notify } from '../utils/notify'
import { fmt } from '../utils/format'

const STATUS_LABEL = { paid:'مدفوعة', unpaid:'غير مدفوعة', partial:'جزئي', cancelled:'ملغاة' }
const STATUS_BADGE = { paid:'badge-success', unpaid:'badge-warning', partial:'badge-info', cancelled:'badge-danger' }

export default function InvoicesListPage() {
  const [invoices, setInvoices] = useState([])
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  const load = () => dbGetAll('invoices').then(data => setInvoices([...data].reverse()))
  useEffect(() => { load() }, [])

  const filtered = invoices.filter(i =>
    !search || (i.number||'').toLowerCase().includes(search.toLowerCase()) || (i.party||'').toLowerCase().includes(search.toLowerCase())
  )

  async function handleDelete(id) {
    if (!confirm('هل تريد حذف هذه الفاتورة؟')) return
    await dbDelete('invoices', id)
    notify('تم الحذف')
    load()
  }

  async function handlePrint(id) {
    navigate('/invoices/edit/' + id)
    setTimeout(() => window.print(), 800)
  }

  return (
    <div className="page-view">
      <div className="flex-between mb-4 no-print">
        <h1 style={{ fontSize:'20px', fontWeight:900, color:'var(--primary)' }}>📋 سجل فواتير المبيع</h1>
        <button className="btn btn-primary" onClick={() => navigate('/invoices')}>➕ فاتورة جديدة</button>
      </div>
      <div className="card">
        <div className="search-bar no-print">
          <input className="form-control" placeholder="🔍 بحث بالرقم أو العميل..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>الرقم</th><th>العميل</th><th>التاريخ</th><th>الاستحقاق</th><th>الإجمالي</th><th>الحالة</th><th className="no-print">إجراء</th></tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="7"><div className="empty-state"><div className="icon">🧾</div><p>لا توجد فواتير</p></div></td></tr>
              ) : filtered.map(inv => (
                <tr key={inv.id}>
                  <td><code>{inv.number}</code></td>
                  <td style={{ fontWeight:600 }}>{inv.party||'-'}</td>
                  <td>{inv.date||'-'}</td>
                  <td>{inv.dueDate||'-'}</td>
                  <td style={{ fontWeight:700, color:'var(--primary)', direction:'ltr' }}>${fmt(inv.total)}</td>
                  <td><span className={`badge ${STATUS_BADGE[inv.status]||'badge-secondary'}`}>{STATUS_LABEL[inv.status]||inv.status}</span></td>
                  <td className="no-print">
                    <button className="btn btn-sm btn-outline" onClick={() => navigate('/invoices/edit/' + inv.id)}>✏️ تعديل</button>
                    <button className="btn btn-sm btn-outline" style={{ marginRight:'4px' }} onClick={() => handlePrint(inv.id)}>🖨 طباعة</button>
                    <button className="btn btn-sm btn-danger" style={{ marginRight:'4px' }} onClick={() => handleDelete(inv.id)}>🗑</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
