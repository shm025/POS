import { useState, useEffect } from 'react'
import { useItems } from '../hooks/useItems'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../contexts/LangContext'
import Modal from '../components/common/Modal'
import { fmt, fmtInt } from '../utils/format'
import { exportItemsCSV } from '../utils/csv'

export default function ItemsPage() {
  const { company } = useAuth()
  const { t } = useLang()
  const { items, loading, loadItems, saveItem, deleteItem } = useItems(company?.id)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({
    code:'', name:'', category:'', unit:'قطعة',
    cost_price:0, selling_price:0, stock:0,
    reorder_point:5, reorder_qty:10,
    barcode:'', brand:'', tax_rate:0, sell_by_weight:false,
  })
  const [editId, setEditId] = useState(null)

  useEffect(() => { loadItems() }, [loadItems])

  const categories = [...new Set(items.map(i => i.category).filter(Boolean))]

  const filtered = items.filter(i => {
    const ms = !search || (i.name||'').toLowerCase().includes(search.toLowerCase()) || (i.code||'').toLowerCase().includes(search.toLowerCase())
    return ms && (!catFilter || i.category === catFilter)
  })

  function openNew() {
    setForm({ code:'', name:'', category:'', unit:'قطعة', cost_price:0, selling_price:0, stock:0, reorder_point:5, reorder_qty:10, barcode:'', brand:'', tax_rate:0, sell_by_weight:false })
    setEditId(null)
    setModalOpen(true)
  }

  function openEdit(item) {
    setForm({
      code: item.code||'', name: item.name||'', category: item.category||'', unit: item.unit||'قطعة',
      cost_price: item.cost_price||0, selling_price: item.selling_price||0, stock: item.stock||0,
      reorder_point: item.reorder_point||5, reorder_qty: item.reorder_qty||10,
      barcode: item.barcode||'', brand: item.brand||'', tax_rate: item.tax_rate||0,
      sell_by_weight: item.sell_by_weight||false,
    })
    setEditId(item.id)
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.name) return
    await saveItem(form, editId)
    setModalOpen(false)
  }

  async function handleDelete(id) {
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
          <input className="form-control" placeholder={`🔍 ${t('search_items')} / باركود / ماركة`} value={search} onChange={e => setSearch(e.target.value)} />
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
                <th>{t('th_code')}</th><th>{t('th_name')}</th><th>باركود</th><th>{t('th_category')}</th>
                <th>{t('th_cost')}</th><th>{t('th_price')}</th><th>ضريبة%</th>
                <th>{t('th_stock')}</th><th>نقطة الطلب</th><th>{t('th_status')}</th>
                <th className="no-print">{t('th_action')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="9" style={{ textAlign:'center', padding:'20px' }}>{t('loading')}</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="9"><div className="empty-state"><div className="icon">📦</div><p>{t('no_items')}</p></div></td></tr>
              ) : filtered.map(item => {
                const low = item.stock <= (item.reorder_point || 0)
                return (
                  <tr key={item.id}>
                    <td><code>{item.code||''}</code></td>
                    <td>
                      <div style={{ fontWeight:600 }}>{item.name}</div>
                      {item.brand && <div style={{ fontSize:'11px', color:'var(--text-muted)' }}>{item.brand}</div>}
                    </td>
                    <td style={{ direction:'ltr', fontSize:'12px' }}>{item.barcode||'—'}</td>
                    <td>{item.category||''}</td>
                    <td style={{ direction:'ltr' }}>${fmt(item.cost_price)}</td>
                    <td style={{ color:'var(--success)', fontWeight:700, direction:'ltr' }}>${fmt(item.selling_price)}</td>
                    <td>{item.tax_rate||0}%</td>
                    <td style={{ fontWeight:700, color:low?'var(--danger)':'inherit' }}>{fmtInt(item.stock)} {item.unit||''}</td>
                    <td style={{ fontSize:'12px', color:'var(--text-muted)' }}>{fmtInt(item.reorder_point)}</td>
                    <td><span className={`badge ${low?'badge-danger':'badge-success'}`}>{low ? t('status_low') : t('status_ok')}</span></td>
                    <td className="no-print">
                      <button className="btn btn-sm btn-outline" onClick={() => openEdit(item)}>✏️</button>
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
          <div className="form-group"><label className="form-label">باركود</label><input className="form-control" value={form.barcode} onChange={f('barcode')} placeholder="scan or type" /></div>
          <div className="form-group"><label className="form-label">الماركة / العلامة</label><input className="form-control" value={form.brand} onChange={f('brand')} /></div>
          <div className="form-group"><label className="form-label">{t('lbl_item_category')}</label><input className="form-control" value={form.category} onChange={f('category')} /></div>
          <div className="form-group"><label className="form-label">{t('lbl_item_unit')}</label><input className="form-control" value={form.unit} onChange={f('unit')} /></div>
          <div className="form-group"><label className="form-label">{t('lbl_item_cost')}</label><input type="number" className="form-control" value={form.cost_price} onChange={f('cost_price')} /></div>
          <div className="form-group"><label className="form-label">{t('lbl_item_price')}</label><input type="number" className="form-control" value={form.selling_price} onChange={f('selling_price')} /></div>
          <div className="form-group"><label className="form-label">نسبة الضريبة (%)</label><input type="number" className="form-control" value={form.tax_rate} onChange={f('tax_rate')} /></div>
          <div className="form-group"><label className="form-label">{t('lbl_item_stock')}</label><input type="number" className="form-control" value={form.stock} onChange={f('stock')} /></div>
          <div className="form-group"><label className="form-label">نقطة إعادة الطلب</label><input type="number" className="form-control" value={form.reorder_point} onChange={f('reorder_point')} /></div>
          <div className="form-group"><label className="form-label">كمية إعادة الطلب</label><input type="number" className="form-control" value={form.reorder_qty} onChange={f('reorder_qty')} /></div>
        </div>
        <div className="form-group" style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <input type="checkbox" id="sell_by_weight" checked={form.sell_by_weight} onChange={e => setForm(p => ({...p, sell_by_weight: e.target.checked}))} />
          <label htmlFor="sell_by_weight" className="form-label" style={{ margin:0 }}>يُباع بالوزن</label>
        </div>
      </Modal>
    </div>
  )
}
