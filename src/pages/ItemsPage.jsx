import { useState, useEffect } from 'react'
import { useItems } from '../hooks/useItems'
import Modal from '../components/common/Modal'
import { fmt, fmtInt } from '../utils/format'
import { exportItemsCSV } from '../utils/csv'

export default function ItemsPage() {
  const { items, loading, loadItems, saveItem, deleteItem } = useItems()
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ code:'', name:'', category:'', unit:'قطعة', cost:0, price:0, stock:0, minStock:5, desc:'' })
  const [editId, setEditId] = useState(null)

  useEffect(() => { loadItems() }, [loadItems])

  const categories = [...new Set(items.map(i => i.category).filter(Boolean))]

  const filtered = items.filter(i => {
    const ms = !search || (i.name||'').toLowerCase().includes(search.toLowerCase()) || (i.code||'').toLowerCase().includes(search.toLowerCase())
    return ms && (!catFilter || i.category === catFilter)
  })

  function openNew() {
    setForm({ code:'', name:'', category:'', unit:'قطعة', cost:0, price:0, stock:0, minStock:5, desc:'' })
    setEditId(null)
    setModalOpen(true)
  }

  async function openEdit(id) {
    const item = items.find(i => i.id === id)
    if (!item) return
    setForm({ code:item.code||'', name:item.name||'', category:item.category||'', unit:item.unit||'قطعة', cost:item.cost||0, price:item.price||0, stock:item.stock||0, minStock:item.minStock||0, desc:item.desc||'' })
    setEditId(id)
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.name) { return }
    await saveItem({ ...form, cost:parseFloat(form.cost)||0, price:parseFloat(form.price)||0, stock:parseInt(form.stock)||0, minStock:parseInt(form.minStock)||0 }, editId)
    setModalOpen(false)
  }

  async function handleDelete(id) {
    if (!confirm('هل تريد حذف هذا الصنف؟')) return
    await deleteItem(id)
  }

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <div className="page-view">
      <div className="flex-between mb-4 no-print">
        <h1 style={{ fontSize:'20px', fontWeight:900, color:'var(--primary)' }}>📦 أصناف المخزون</h1>
        <button className="btn btn-primary" onClick={openNew}>➕ صنف جديد</button>
      </div>

      <div className="card">
        <div className="search-bar no-print">
          <input className="form-control" placeholder="🔍 بحث باسم الصنف أو الكود..." value={search} onChange={e => setSearch(e.target.value)} />
          <select className="form-control" style={{ width:'180px' }} value={catFilter} onChange={e => setCatFilter(e.target.value)}>
            <option value="">كل الفئات</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button className="btn btn-outline" onClick={() => exportItemsCSV(items)}>⬇ تصدير</button>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>كود</th><th>اسم الصنف</th><th>الفئة</th><th>سعر الشراء</th><th>سعر البيع</th>
                <th>المخزون</th><th>الحد الأدنى</th><th>الحالة</th><th className="no-print">إجراء</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="9" style={{ textAlign:'center', padding:'20px' }}>جاري التحميل...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="9"><div className="empty-state"><div className="icon">📦</div><p>لا توجد أصناف</p></div></td></tr>
              ) : filtered.map(item => {
                const low = item.stock <= item.minStock
                return (
                  <tr key={item.id}>
                    <td><code>{item.code||''}</code></td>
                    <td><div style={{ fontWeight:600 }}>{item.name}</div><div style={{ fontSize:'11px', color:'var(--text-muted)' }}>{item.desc||''}</div></td>
                    <td>{item.category||''}</td>
                    <td style={{ direction:'ltr' }}>${fmt(item.cost)}</td>
                    <td style={{ color:'var(--success)', fontWeight:700, direction:'ltr' }}>${fmt(item.price)}</td>
                    <td style={{ fontWeight:700, color:low?'var(--danger)':'inherit' }}>{fmtInt(item.stock)} {item.unit||''}</td>
                    <td>{fmtInt(item.minStock)}</td>
                    <td><span className={`badge ${low?'badge-danger':'badge-success'}`}>{low?'منخفض':'متوفر'}</span></td>
                    <td className="no-print">
                      <button className="btn btn-sm btn-outline" onClick={() => openEdit(item.id)}>✏️</button>
                      <button className="btn btn-sm btn-danger" style={{ marginRight:'4px' }} onClick={() => handleDelete(item.id)}>🗑</button>
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
        title={editId ? '✏️ تعديل الصنف' : '➕ إضافة صنف جديد'}
        footer={<><button className="btn btn-primary" onClick={handleSave}>💾 حفظ</button><button className="btn btn-outline" onClick={() => setModalOpen(false)}>إلغاء</button></>}
      >
        <div className="grid-2">
          <div className="form-group"><label className="form-label">الكود</label><input className="form-control" value={form.code} onChange={f('code')} /></div>
          <div className="form-group"><label className="form-label">اسم الصنف *</label><input className="form-control" value={form.name} onChange={f('name')} /></div>
          <div className="form-group"><label className="form-label">الفئة</label><input className="form-control" value={form.category} onChange={f('category')} /></div>
          <div className="form-group"><label className="form-label">الوحدة</label><input className="form-control" value={form.unit} onChange={f('unit')} /></div>
          <div className="form-group"><label className="form-label">سعر الشراء</label><input type="number" className="form-control" value={form.cost} onChange={f('cost')} /></div>
          <div className="form-group"><label className="form-label">سعر البيع</label><input type="number" className="form-control" value={form.price} onChange={f('price')} /></div>
          <div className="form-group"><label className="form-label">المخزون الحالي</label><input type="number" className="form-control" value={form.stock} onChange={f('stock')} /></div>
          <div className="form-group"><label className="form-label">الحد الأدنى</label><input type="number" className="form-control" value={form.minStock} onChange={f('minStock')} /></div>
        </div>
        <div className="form-group"><label className="form-label">الوصف</label><input className="form-control" value={form.desc} onChange={f('desc')} /></div>
      </Modal>
    </div>
  )
}
