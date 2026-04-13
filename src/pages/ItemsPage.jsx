import { useState, useEffect } from 'react'
import { useItems } from '../hooks/useItems'
import { useLang } from '../contexts/LangContext'
import Modal from '../components/common/Modal'
import { fmt, fmtInt } from '../utils/format'
import { exportItemsCSV } from '../utils/csv'

export default function ItemsPage() {
  const { t } = useLang()
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
    if (!confirm(t('confirm_delete_item'))) return
    await deleteItem(id)
  }

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <div className="page-view">
      <div className="flex-between mb-4 no-print">
        <h1 style={{ fontSize:'20px', fontWeight:900, color:'var(--primary)' }}>📦 {t('items_title')}</h1>
        <button className="btn btn-primary" onClick={openNew}>➕ {t('new_item_btn')}</button>
      </div>

      <div className="card">
        <div className="search-bar no-print">
          <input className="form-control" placeholder={`🔍 ${t('search_items')}`} value={search} onChange={e => setSearch(e.target.value)} />
          <select className="form-control" style={{ width:'180px' }} value={catFilter} onChange={e => setCatFilter(e.target.value)}>
            <option value="">{t('all_categories')}</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button className="btn btn-outline" onClick={() => exportItemsCSV(items)}>⬇ {t('export_btn')}</button>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>{t('th_code')}</th><th>{t('th_name')}</th><th>{t('th_category')}</th><th>{t('th_cost')}</th><th>{t('th_price')}</th>
                <th>{t('th_stock')}</th><th>{t('th_min_stock')}</th><th>{t('th_status')}</th><th className="no-print">{t('th_action')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="9" style={{ textAlign:'center', padding:'20px' }}>{t('loading')}</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="9"><div className="empty-state"><div className="icon">📦</div><p>{t('no_items')}</p></div></td></tr>
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
                    <td><span className={`badge ${low?'badge-danger':'badge-success'}`}>{low ? t('status_low') : t('status_ok')}</span></td>
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
        title={editId ? `✏️ ${t('edit_item_title')}` : `➕ ${t('add_item_title')}`}
        footer={<><button className="btn btn-primary" onClick={handleSave}>💾 {t('save_btn')}</button><button className="btn btn-outline" onClick={() => setModalOpen(false)}>{t('cancel_btn')}</button></>}
      >
        <div className="grid-2">
          <div className="form-group"><label className="form-label">{t('lbl_item_code')}</label><input className="form-control" value={form.code} onChange={f('code')} /></div>
          <div className="form-group"><label className="form-label">{t('lbl_item_name')} *</label><input className="form-control" value={form.name} onChange={f('name')} /></div>
          <div className="form-group"><label className="form-label">{t('lbl_item_category')}</label><input className="form-control" value={form.category} onChange={f('category')} /></div>
          <div className="form-group"><label className="form-label">{t('lbl_item_unit')}</label><input className="form-control" value={form.unit} onChange={f('unit')} /></div>
          <div className="form-group"><label className="form-label">{t('lbl_item_cost')}</label><input type="number" className="form-control" value={form.cost} onChange={f('cost')} /></div>
          <div className="form-group"><label className="form-label">{t('lbl_item_price')}</label><input type="number" className="form-control" value={form.price} onChange={f('price')} /></div>
          <div className="form-group"><label className="form-label">{t('lbl_item_stock')}</label><input type="number" className="form-control" value={form.stock} onChange={f('stock')} /></div>
          <div className="form-group"><label className="form-label">{t('lbl_item_min')}</label><input type="number" className="form-control" value={form.minStock} onChange={f('minStock')} /></div>
        </div>
        <div className="form-group"><label className="form-label">{t('lbl_item_desc')}</label><input className="form-control" value={form.desc} onChange={f('desc')} /></div>
      </Modal>
    </div>
  )
}
