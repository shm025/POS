import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useCustomers } from '../hooks/useCustomers'
import Modal from '../components/common/Modal'
import { fmt, fmtInt } from '../utils/format'

const TIER_BADGE = { bronze:'badge-secondary', silver:'badge-info', gold:'badge-warning', platinum:'badge-success' }
const TIER_LABEL = { bronze:'برونزي', silver:'فضي', gold:'ذهبي', platinum:'بلاتيني' }

const EMPTY_FORM = {
  name: '', phone: '', email: '', dob: '', notes: '',
  whatsapp_opted_in: false,
}

export default function CustomersPage() {
  const { company } = useAuth()
  const { customers, loading, loadCustomers, saveCustomer, deleteCustomer } = useCustomers(company?.id)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editId, setEditId] = useState(null)

  useEffect(() => { loadCustomers() }, [company?.id])

  const filtered = search
    ? customers.filter(c =>
        (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (c.phone || '').includes(search)
      )
    : customers

  function openNew() {
    setForm(EMPTY_FORM)
    setEditId(null)
    setModal(true)
  }

  function openEdit(c) {
    setForm({
      name: c.name || '',
      phone: c.phone || '',
      email: c.email || '',
      dob: c.dob || '',
      notes: c.notes || '',
      whatsapp_opted_in: c.whatsapp_opted_in || false,
    })
    setEditId(c.id)
    setModal(true)
  }

  async function handleSave() {
    if (!form.name.trim()) { return }
    await saveCustomer(form, editId)
    setModal(false)
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const totalPoints = customers.reduce((s, c) => s + (c.loyalty_points || 0), 0)
  const totalSpend = customers.reduce((s, c) => s + parseFloat(c.lifetime_spend || 0), 0)

  return (
    <div className="page-view">
      <div className="flex-between mb-4">
        <h1 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--primary)' }}>👥 العملاء</h1>
        <button className="btn btn-primary" onClick={openNew}>➕ عميل جديد</button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">إجمالي العملاء</div>
          <div className="stat-value">{fmtInt(customers.length)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">إجمالي النقاط الموزعة</div>
          <div className="stat-value">{fmtInt(totalPoints)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">إجمالي الإنفاق</div>
          <div className="stat-value" style={{ direction: 'ltr' }}>${fmt(totalSpend)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">مشتركون واتساب</div>
          <div className="stat-value">{fmtInt(customers.filter(c => c.whatsapp_opted_in).length)}</div>
        </div>
      </div>

      <div className="card mt-4">
        <div className="search-bar no-print">
          <input
            className="form-control"
            placeholder="🔍 بحث بالاسم أو الهاتف..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>الاسم</th>
                <th>الهاتف</th>
                <th>البريد</th>
                <th>النقاط</th>
                <th>الفئة</th>
                <th>إجمالي الزيارات</th>
                <th>إجمالي الإنفاق</th>
                <th>واتساب</th>
                <th className="no-print">إجراء</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="9" style={{ textAlign: 'center', padding: '20px' }}><div className="loading-spinner"></div></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="9"><div className="empty-state"><div className="icon">👥</div><p>لا يوجد عملاء</p></div></td></tr>
              ) : filtered.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600 }}>{c.name}</td>
                  <td style={{ direction: 'ltr' }}>{c.phone || '-'}</td>
                  <td>{c.email || '-'}</td>
                  <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{fmtInt(c.loyalty_points || 0)}</td>
                  <td><span className={`badge ${TIER_BADGE[c.loyalty_tier] || 'badge-secondary'}`}>{TIER_LABEL[c.loyalty_tier] || c.loyalty_tier}</span></td>
                  <td>{fmtInt(c.total_visits || 0)}</td>
                  <td style={{ direction: 'ltr' }}>${fmt(c.lifetime_spend || 0)}</td>
                  <td>{c.whatsapp_opted_in ? '✅' : '—'}</td>
                  <td className="no-print">
                    <button className="btn btn-sm btn-outline" onClick={() => openEdit(c)}>✏️</button>
                    <button className="btn btn-sm btn-danger" style={{ marginRight: '4px' }} onClick={() => deleteCustomer(c.id)}>🗑</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={modal}
        onClose={() => setModal(false)}
        title={editId ? '✏️ تعديل العميل' : '➕ عميل جديد'}
        footer={
          <>
            <button className="btn btn-primary" onClick={handleSave}>💾 حفظ</button>
            <button className="btn btn-outline" onClick={() => setModal(false)}>إلغاء</button>
          </>
        }
      >
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">الاسم *</label>
            <input className="form-control" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">الهاتف</label>
            <input className="form-control" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="e.g. 03123456" />
          </div>
          <div className="form-group">
            <label className="form-label">البريد الإلكتروني</label>
            <input className="form-control" value={form.email} onChange={e => set('email', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">تاريخ الميلاد</label>
            <input type="date" className="form-control" value={form.dob} onChange={e => set('dob', e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">ملاحظات</label>
          <textarea className="form-control" rows="2" value={form.notes} onChange={e => set('notes', e.target.value)} />
        </div>
        <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="checkbox"
            id="whatsapp_opted_in"
            checked={form.whatsapp_opted_in}
            onChange={e => set('whatsapp_opted_in', e.target.checked)}
          />
          <label htmlFor="whatsapp_opted_in" className="form-label" style={{ margin: 0 }}>موافق على استقبال رسائل واتساب</label>
        </div>
      </Modal>
    </div>
  )
}
